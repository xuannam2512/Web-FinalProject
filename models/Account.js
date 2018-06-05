var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var accountSchema = new Schema({
    username: String,
    password: String,
    authorization: { type: String, required: true, enum: ['Customer', 'Admin']},
    user: { type: Schema.ObjectId, ref: 'User', required: true },
    status: { type: String, required: true, enum: ['lock in 30 days', 'lock in 1 year', 'lock forerver', 'Active'], default: 'Active'}
});

accountSchema
.virtual('url')
.get(function() {
    return '/admin/account/' + this.user;
});

accountSchema
.virtual('urlEdit')
.get(function() {
    return '/admin/account/' + this._id + '/edit';
});

accountSchema
.virtual('urlDelete')
.get(function() {
    return '/admin/account/' + this._id + '/delete';
});

accountSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', accountSchema);