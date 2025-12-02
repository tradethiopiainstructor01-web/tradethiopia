const { Schema, model } = require('mongoose');

const productFollowupSchema = new Schema(
  {
    productName: { type: String, required: true },
    buyerName: { type: String, required: true },
    contactPhone: { type: String },
    email: { type: String },
    status: { type: String, enum: ['Prospect','Pending','Completed','Scheduled','Cancelled'], default: 'Pending' },
    schedulePreference: { type: String, enum: ['Regular','Weekend','Night','Online'], default: 'Regular' },
    note: { type: String },
    supervisorComment: { type: String, default: '' },
    lastCalled: { type: Date }
  },
  { timestamps: true }
);

module.exports = model('ProductFollowup', productFollowupSchema);
