const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderSchema = new Schema({
    products: [
        {
            type: Object, // product with all its subfields including quantity
            required: true
        }
    ], 
    user: {
        _id: {
            type: Schema.Types.ObjectId, 
            required: true,
            ref: 'User'
        },
        name: {
            type: String,
            required: true,
        }, 
        email: {
            type: String,
            required: true
        }
    },
    totalPrice: {type: Number, required: true}
});

module.exports = mongoose.model('Order', orderSchema);