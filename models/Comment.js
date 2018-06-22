var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var commentSchema = new Schema({
    mobileID: { type: Schema.ObjectId, ref: 'Mobile', required: true },
    info: { type: Schema.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true }, 
    date: { type: Date, required: true}
});

module.exports = mongoose.model('Comment', commentSchema);