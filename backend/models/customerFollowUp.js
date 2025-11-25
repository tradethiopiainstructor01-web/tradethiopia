// backend/models/customerFollowUp.js

const mongoose = require('mongoose');

const CustomerFollowUpSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,  // Ensure unique email addresses
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    followUpDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Rejected'],
      default: 'Pending',
    },
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // createdAt and updatedAt will be automatically handled by mongoose
  }
);

module.exports = mongoose.model('CustomerFollowUp', CustomerFollowUpSchema);