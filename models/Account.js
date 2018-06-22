var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var accountSchema = new Schema({
    username: String,
    password: String,
    authorization: { type: String, required: true, enum: ['Customer', 'Admin']},
    user: { type: Schema.ObjectId, ref: 'User', required: true },
    secretToken: { type: String },
    status: { type: String, required: true, enum: ['lock in 30 days', 'lock in 1 year', 'lock forerver', 'Active', 'Not Active'], default: 'Active'}
});

accountSchema
.virtual('url')
.get(function() {
    return '/admin/account/' + this._id;
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

accountSchema.methods.changePassword = function(oldPassword, newPassword, cb) {
    if (!oldPassword || !newPassword) {
      return cb(new errors.MissingPasswordError(options.errorMessages.MissingPasswordError));
    }

    var self = this;

    this.authenticate(oldPassword, function(err, authenticated) {
      if (err) { return cb(err); }

      if (!authenticated) {
        return cb(new errors.IncorrectPasswordError(options.errorMessages.IncorrectPasswordError));
      }

      self.setPassword(newPassword, function(setPasswordErr, user) {
        if (setPasswordErr) { return cb(setPasswordErr); }

        self.save(function(saveErr) {
          if (saveErr) { return cb(saveErr); }

          cb(null, user);
        });
      });
    });
  };

accountSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', accountSchema);