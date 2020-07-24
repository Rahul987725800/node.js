const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        required: true
    }, 
    cart: {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: { type: Number, required: true },
            },
        ],
        totalPrice: { type: Number, required: true }
    },
   
});
// function only
userSchema.methods.addToCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex((cp) => {
        return String(cp.productId) === String(product._id);
    });
    if (cartProductIndex != -1) {
        this.cart.items[cartProductIndex].quantity++;
    } else {
        this.cart.items.push({
            productId: product._id,
            quantity: 1,
        });
    }
    this.cart.totalPrice += +product.price;
    return this.save();
};
userSchema.methods.removeFromCart = function(product) {
    const cartProductIndex = this.cart.items.findIndex((cp) => {
        return String(cp.productId) === String(product._id);
    });
    const qty = this.cart.items[cartProductIndex].quantity;
    this.cart.totalPrice -= +product.price * qty;
    this.cart.items.splice(cartProductIndex, 1);
    return this.save();
}
userSchema.methods.clearCart = function() {
    this.cart = { items: [], totalPrice: 0 };
    return this.save();
}
userSchema.methods.adjustCartForDeletedProducts = function(products) {
    const updatedCartItems = [];
    let updatedTotalPrice = 0;
    for (let product of products){
        updatedCartItems.push({productId: product._id, quantity: product.quantity});
        updatedTotalPrice += +product.price * product.quantity;
    }
    this.cart = {items: updatedCartItems, totalPrice: updatedTotalPrice};
    return this.save();
}
module.exports = mongoose.model("User", userSchema);
