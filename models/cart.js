const path = require('path');
const fs = require('fs');
const p = path.join(
    path.dirname(process.mainModule.filename),
    'data',
    'cart.json'
);
module.exports = class Cart {
    static addProduct(id, productPrice){
        // Fetch the previos cart
        fs.readFile(p, (err, content) => {
            let cart = {products: [], totalPrice: 0};
            if (!err){
                cart = JSON.parse(content);
            }
            // Analyze the cart => find the existing product
            const existingProductIndex = cart.products.findIndex(prod => prod.id === id);
            const existingProduct = cart.products[existingProductIndex];
            let updatedProduct;
            // add new or increase quantity
            if (existingProduct){
                updatedProduct = {...existingProduct};
                updatedProduct.qty = updatedProduct.qty + 1;
                cart.products = [...cart.products];
                cart.products[existingProductIndex] = updatedProduct;
            }
            else {
                updatedProduct = {id: id, qty: 1};
                cart.products = [...cart.products, updatedProduct];
            }
            cart.totalPrice += +productPrice;
            fs.writeFile(p, JSON.stringify(cart), err => {
                console.log(err);
            })
        })
        
    }
    static deleteProduct(id , productPrice) {
        fs.readFile(p, (err, content) => {
            if (err) return;
            const cart = JSON.parse(content);
            const product = cart.products.find(prod => prod.id === id);
            if (!product) return;
            const updatedCart = { ...cart };
            updatedCart.products = cart.products.filter(prod => prod.id !== id);
            updatedCart.totalPrice -= productPrice * product.qty;
            fs.writeFile(p, JSON.stringify(updatedCart), err => {
                console.log(err);
            })
        })
    }
    static getCart(cb) {
        fs.readFile(p, (err, content) => {
            if (err) cb(null);
            else cb(JSON.parse(content));
        })
    }
}