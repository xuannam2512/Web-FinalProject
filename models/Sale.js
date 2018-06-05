const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var saleSchema = new Schema({
    mobileSole: [{ type: Schema.ObjectId, ref: 'Mobile', required: true }],
    mobileAmount: [{ type: String, required: true }],
    mobilePrice: [{ type: String, required: true }],
    date: { type: Date, required: true },
    totalPrice: { type: String, required: true }
});

module.exports = mongoose.model('Sale', saleSchema);