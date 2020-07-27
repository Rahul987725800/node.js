const Product = require("../models/product");
const Order = require("../models/order");
const { unsubscribe } = require("../routes/shop");
exports.getProducts = (req, res, next) => {
    Product.find() // .cursor().next() can be used
        .then((products) => {
            res.render("shop/product-list", {
                prods: products,
                pageTitle: "All Products",
                path: "/products"
            });
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            res.render("shop/product-detail", {
                product: product,
                pageTitle: product.title,
                path: "/products"
            });
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};

exports.getIndex = (req, res, next) => {
    const successMessage = req.flash('success').pop();
    const errorMessage = req.flash('error').pop();
    Product.find()
        .then((products) => {
            res.render("shop/index", {
                prods: products,
                pageTitle: "Shop",
                path: "/",
                successMessage,
                errorMessage
            });
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate("cart.items.productId")
        .execPopulate()
        .then( async (user) => {
            const products = [];
            for (let item of user.cart.items){
                if (item.productId){ // if we able to populate data then only
                    products.push({
                        ...item.productId._doc,
                        quantity: item.quantity,
                    })
                }
            }
        
            if (products.length < user.cart.items.length){
                await user.adjustCartForDeletedProducts(products);
            }
            return [products, user.cart.totalPrice];
        })
        .then(([products, totalPrice]) => {
            // console.log(products);
            res.render("shop/cart", {
                path: "/cart",
                pageTitle: "Your Cart",
                products: products,
                totalPrice: totalPrice
            });
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};
exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then((product) => {
            return req.user.addToCart(product);
        })
        .then((result) => {
            res.redirect("/cart");
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};
exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then((product) => {
            return req.user.removeFromCart(product);
        })
        .then((result) => {
            res.redirect("/cart");
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};
exports.getOrders = (req, res, next) => {
    Order.find({"user._id" : req.user._id })
        .then((orders) => {
            res.render("shop/orders", {
                path: "/orders",
                pageTitle: "Your Orders",
                orders: orders
            });
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};
exports.postOrder = (req, res, next) => {
    req.user
        .populate("cart.items.productId")
        .execPopulate()
        .then((user) => {
            const products = user.cart.items.map((item) => ({
                ...item.productId._doc,
                quantity: item.quantity,
            }));
            return [products, user.cart.totalPrice];
        })
        .then(([products, totalPrice]) => {
            const order = new Order ({
                user: {
                    _id: req.user._id, 
                    name: req.user.name,
                    email: req.user.email
                }, 
                products, 
                totalPrice
            })
            return order.save();
        })
        .then(res => {
            return req.user.clearCart();
        })
        .then((result) => {
            res.redirect("/orders");
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};
exports.getCheckout = (req, res, next) => {
    res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout"
    });
};
