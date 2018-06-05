const mongoose = require('mongoose');
 var Schema = mongoose.Schema;

 var userSchema = new Schema({
     fullname: { type: String, required: true, max: 50 },
     img: [{ type: String }],
     email: { type: String, required: true },
     tel: { type: String, required: true },
     address: { type: String, required: true }
 });

 userSchema
.virtual('urlDelete')
.get(function() {
    return '/admin/user/' + this._id + '/delete';
});

userSchema
.virtual('urlEdit')
.get(function() {
    return '/admin/user/' + this._id + '/edit';
});

userSchema
.virtual('url')
.get(function() {
    return '/admin/user/' + this._id;
})

 module.exports = mongoose.model('User', userSchema);