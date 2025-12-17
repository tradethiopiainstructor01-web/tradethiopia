const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  grossCommission: { type: Number, default: 0 },
  commissionTax: { type: Number, default: 0 },
  netCommission: { type: Number, default: 0 }
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
    enum: ['Prospect', 'Pending', 'Completed', 'Scheduled', 'Cancelled', 'Imported'],
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
    type: Number,
    default: 0
  },
  commission: {
    type: commissionSchema,
    default: undefined
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SalesCustomer', salesCustomerSchema);
