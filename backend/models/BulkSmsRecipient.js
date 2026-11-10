const mongoose = require('mongoose');

const bulkSmsRecipientSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
      default: 'manual',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// A salesperson should only have one saved row for a given phone number.
bulkSmsRecipientSchema.index({ createdBy: 1, phoneNumber: 1 }, { unique: true });
bulkSmsRecipientSchema.index({ createdBy: 1, updatedAt: -1 });

module.exports = mongoose.model('BulkSmsRecipient', bulkSmsRecipientSchema);
