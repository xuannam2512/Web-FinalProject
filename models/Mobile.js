const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var mobileSchema = new Schema({
    mobileName: { type: String, required: true },
    provider: { type: Schema.ObjectId, ref: 'Provider', required: true },
    sold: { type: String, required: true },
    imported: { type: String, required: true },
    status: { type: String, required: true, enum: ['Het hang', 'Con hang', 'Ngung ban'], default: 'Con hang' },
    salePrice: { type: String, required: true }
});

mobileSchema
.virtual('url')
.get(function() {
    return '/admin/mobile/' + this._id;
});

mobileSchema
.virtual('urlEdit')
.get(function() {
    return '/admin/mobile/' + this._id + '/edit';
});

mobileSchema
.virtual('urlStatus')
.get(function() {
    return '/admin/mobile/' + this._id + '/status';
});


module.exports = mongoose.model('Mobile', mobileSchema);