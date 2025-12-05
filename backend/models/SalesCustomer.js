const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  grossCommission: { type: Number },
  commissionTax: { type: Number },
  netCommission: { type: Number }
}, { _id: false });

const salesCustomerSchema = new mongoose.Schema({
  agentId: {
    type: String,
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  contactTitle: {
    type: String
  },
  phone: {
    type: String
  },
  callStatus: {
    type: String,
    enum: ['Called', 'Not Called', 'Busy', 'No Answer', 'Callback'],
    default: 'Not Called'
  },
  followupStatus: {
    type: String,
    enum: ['Prospect', 'Pending', 'Completed', 'Scheduled', 'Cancelled'],
    default: 'Pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  schedulePreference: {
    type: String,
    enum: ['Regular', 'Weekend', 'Night', 'Online'],
    default: 'Regular'
  },
  email: {
    type: String
  },
  note: {
    type: String
  },
  supervisorComment: {
    type: String
  },
  courseName: {
    type: String
  },
  courseId: {
    type: String
  },
  // Commission fields
  coursePrice: {
    type: Number
  },
  commission: commissionSchema
}, {
  timestamps: true
});

module.exports = mongoose.model('SalesCustomer', salesCustomerSchema);
