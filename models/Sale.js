const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var saleSchema = new Schema({
    mobileSole: [{ type: Schema.ObjectId, ref: 'Mobile', required: true }],
    mobileAmount: [{ type: String, required: true }],
    user: { type: Schema.ObjectId, ref: 'Account', required: true },
    status: { type: String, required: true, enum: ['Đã giao', 'Đang giao', 'Chưa giao'], default: 'Chưa giao' },
    date: { type: Date, required: true },
    nameReciever: {type: String, required: true },
    telReciever: { type: String, required: true },
    addressReciever: { type: String, required: true },
    totalPrice: { type: String, required: true }
});

module.exports = mongoose.model('Sale', saleSchema);