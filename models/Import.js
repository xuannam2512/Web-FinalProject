const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var importSchema = new Schema({
    mobileImported: [{ type: Schema.ObjectId, ref: 'Mobile', required: true }],
    mobileAmount: [{ type: String, required: true }],
    mobilePrice: [{ type: String, required: true }],
    date: { type: Date, required: true },
    totalPrice: { type: String, required: true }
});

importSchema
.virtual('url')
.get(function() {
    return '/admin/importMobile/' + this._id;
});

importSchema
.virtual('urlEdit')
.get(function() {
    return '/admin/importMobile/' + this._id + '/edit';
});

importSchema
.virtual('urlDelete')
.get(function() {
    return '/admin/importMobile/' + this._id + '/delete';
});


module.exports = mongoose.model('Import', importSchema);