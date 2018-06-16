var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var specificationSchema = new Schema({
    mobileID: { type: Schema.ObjectId, ref: 'Mobile', required: true },
    imgDisplay: [{ type: String }],
    imgDelete: [{ type: String }],
    screen: { type: String, required: true },
    operationsystem: { type: String, required: true },
    camerafont: { type: String, required: true },
    camerabehind: { type: String, required: true },
    cpu: { type: String, required: true },
    ram: { type: String, required: true },
    memories: { type: String, required: true },
    memorycard: { type: String, required: true },
    sim: { type: String, required: true }
});

module.exports = mongoose.model('Specification', specificationSchema);