const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

class Product {
    constructor(title, price, description, imageUrl, userId, _id){
        this.title = title;
        this.price = price;
        this.description = description;
        this.imageUrl = imageUrl;
        this.userId = userId;
        this._id = _id ? new mongodb.ObjectID(_id) : null;
    }
    save() {
        const db = getDb();
        if (this._id){
            return db.collection('products')
            .updateOne({_id: this._id}, {$set: this});
        } else {
            return db.collection('products').insertOne(this); // promise
        }
        
    }
    static fetchAll() {
        const db = getDb();
        return db.collection('products').find().toArray(); // cursor/handle => to array
    }
    static findById(prodId){
        const db = getDb();
        return db.collection('products').find({_id: new mongodb.ObjectID(prodId)}).next(); 
        // next() returns next element in the cursor
    }
    static deleteById(prodId){
        const db = getDb();
        return db.collection('products').deleteOne({_id: new mongodb.ObjectID(prodId)});
    }
}
module.exports = Product;