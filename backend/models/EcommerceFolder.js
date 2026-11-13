const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: String, enum: ['cold-call', 'bulk-sms'], required: true },
  name: { type: String, required: true, maxlength: 120 },
  nameKey: { type: String, required: true },
}, { timestamps: true });

schema.index({ owner: 1, channel: 1, nameKey: 1 }, { unique: true });
module.exports = mongoose.model('EcommerceFolder', schema);
