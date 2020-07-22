const getDb = require("../util/database").getDb;
const mongodb = require("mongodb");
const ObjectId = mongodb.ObjectId;

class User {
    constructor(name, email, cart, _id) {
        this.name = name;
        this.email = email;
        this.cart = cart; // {items: [], totalPrice: 0}
        this._id = _id;
    }
    save() {
        const db = getDb();
        return db.collection("users").insertOne(this);
    }
    addToCart(product) {
        if (this.cart) {
            const cartProductIndex = this.cart.items.findIndex((cp) => {
                return String(cp.productId) === String(product._id);
            });
            if (cartProductIndex != -1) {
                this.cart.items[cartProductIndex].quantity++;
            } else {
                this.cart.items.push({
                    productId: new ObjectId(product._id),
                    quantity: 1,
                });
            }
            this.cart.totalPrice += +product.price;
        } else {
            this.cart = {
                items: [{ productId: new ObjectId(product._id), quantity: 1 }],
                totalPrice: +product.price,
            };
        }
        return this.updateDatabaseCart();
    }
    async updateDatabaseCart() {
        const db = getDb();
        return db
            .collection("users")
            .updateOne({ _id: this._id }, { $set: { cart: this.cart } });
    }
    deleteFromCart(product) {
        const cartProductIndex = this.cart.items.findIndex((cp) => {
            return String(cp.productId) === String(product._id);
        });
        const qty = this.cart.items[cartProductIndex].quantity;
        this.cart.totalPrice -= +product.price * qty;
        this.cart.items.splice(cartProductIndex, 1);
        return this.updateDatabaseCart();
    }
    static findById(userId) {
        const db = getDb();
        return db.collection("users").findOne({ _id: new ObjectId(userId) });
    }
    async getCart() {
        if (!this.cart)
            return new Promise((resolve, reject) => {
                resolve([[], 0]); // empty products array and 0 total price
            });

        const prodsWithQty = await this.populateProductsInCart();
        let onlyInStockProds = prodsWithQty;
        if (prodsWithQty.length != this.cart.items.length) {
            onlyInStockProds = [];
            const newCartItems = [];
            for (let prod of this.cart.items) {
                const inStockProd = prodsWithQty.find(
                    (p) => p._id.toString() === prod.productId.toString()
                );
                if (inStockProd) {
                    onlyInStockProds.push(inStockProd);
                    newCartItems.push(prod);
                }
            }
            this.cart.totalPrice = onlyInStockProds.reduce((total, prod) => {
                total +=
                    +prod.price *
                    newCartItems.find(
                        (p) => p.productId.toString() === prod._id.toString()
                    ).quantity;
                return total;
            }, 0);
            this.cart.items = newCartItems;
            await this.updateDatabaseCart();
        }
        return new Promise((resolve, reject) => {
            resolve([onlyInStockProds, this.cart.totalPrice]);
        });
    }
    async populateProductsInCart() {
        const db = getDb();
        const productIds = this.cart.items.map((product) => product.productId);
        return db
            .collection("products")
            .find({ _id: { $in: productIds } })
            .toArray()
            .then((products) => {
                const prodWithQty = products.map((product) => {
                    return {
                        ...product,
                        quantity: this.cart.items.find(
                            (item) =>
                                item.productId.toString() ===
                                product._id.toString()
                        ).quantity,
                    };
                });
                return prodWithQty;
            });
    }
    async addOrder() {
        const db = getDb();
        const order = {
            products: await this.populateProductsInCart(),
            user: {
                _id: new ObjectId(this._id),
                name: this.name,
                email: this.email,
            },
            totalPrice: this.cart.totalPrice,
        };

        return db
            .collection("orders")
            .insertOne(order)
            .then((result) => {
                this.cart = { items: [], totalPrice: 0 };
                return this.updateDatabaseCart();
            });
    }
    getOrders() {
        const db = getDb();
        return db
            .collection("orders")
            .find({ "user._id": new ObjectId(this._id) })
            .toArray();
    }
}
module.exports = User;
