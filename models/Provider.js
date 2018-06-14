const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var providerSchema = new Schema({
    name: { type: String, required: true },
    imgDisplay: { type: String },
    imgDelete: { type: String },
    amountOfModel: { type: String, required: true },
    info: { type: String, required: true }
});

providerSchema
.virtual('url')
.get(function() {
    return '/admin/provider/' + this._id;
});

providerSchema
.virtual('urlEdit')
.get(function() {
    return '/admin/provider/' + this._id + '/edit';
});

providerSchema
.virtual('urlDelete')
.get(function() {
    return '/admin/provider/' + this._id + '/delete';
});

module.exports = mongoose.model('Provider', providerSchema);