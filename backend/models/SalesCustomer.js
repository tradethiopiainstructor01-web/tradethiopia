const mongoose = require('mongoose');
const { attachListEvents } = require('../utils/listCache');

const commissionSchema = new mongoose.Schema({
  grossCommission: { type: Number, default: 0 },
  commissionTax: { type: Number, default: 0 },
  netCommission: { type: Number, default: 0 }
}, { _id: false });

const WORKFLOW_STATUSES = ['New', 'Pending Assignment', 'Assigned', 'In Progress', 'Closed'];

const salesCustomerSchema = new mongoose.Schema({
  studentRegistrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentRegistration',
    unique: true,
    sparse: true,
    index: true
  },
  agentId: {
    type: String,
    default: null,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  source: {
    type: String,
    enum: ['Reception', 'Sales', 'Followup', 'Other'],
    default: 'Sales',
    index: true
  },
  productInterest: {
    type: String,
    default: ''
  },
  pipelineStatus: {
    type: String,
    enum: WORKFLOW_STATUSES,
    default: 'New',
    index: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
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
    enum: ['Called', 'Not Called', 'Busy', 'No Answer', 'Callback', '2x Called'],
    default: 'Not Called'
  },
  followupStatus: {
    type: String,
    enum: ['Prospect', 'Pending', 'Completed', 'Scheduled', 'Cancelled', 'Imported'],
    default: 'Pending'
  },
  packageScope: {
    type: String,
    enum: ['Local', 'International', ''],
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  schedulePreference: {
    type: String,
    enum: ['Regular', 'Morning', 'Afternoon', 'Night', 'Weekend', 'Online', 'VIP', ''],
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
  // Verification and payment proof fields for Completed sales
  passportPhoto: {
    type: String,
    default: ''
  },
  nationalIdFrontImage: {
    type: String,
    default: ''
  },
  nationalIdBackImage: {
    type: String,
    default: ''
  },
  paymentScreenshot: {
    type: String,
    default: ''
  },
  paymentOption: {
    type: String,
    default: 'Full Payment'
  },
  paymentBank: {
    type: String,
    default: ''
  },
  fsNumber: {
    type: String,
    default: ''
  },
  // Commission fields
  coursePrice: {
    type: Number,
    default: 0
  },
  commission: {
    type: commissionSchema,
    default: undefined
  },
  
  // Commission approval tracking
  commissionApproved: {
    type: Boolean,
    default: false
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // When the follow-up was marked Completed (set by the hooks below; empty for
  // sales completed before this field existed).
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const isCompletedStatus = (status) => String(status || '').trim().toLowerCase() === 'completed';

// Stamp completedAt when a follow-up becomes Completed and clear it if it is
// reopened. Only a status change stamps it, so editing an old completed sale
// never gives it a made-up completion time.
salesCustomerSchema.pre('save', function stampCompletedAt() {
  if (!this.isNew && !this.isModified('followupStatus')) return;
  if (isCompletedStatus(this.followupStatus)) {
    if (!this.completedAt) this.completedAt = new Date();
  } else if (this.completedAt) {
    this.completedAt = null;
  }
});

salesCustomerSchema.pre('findOneAndUpdate', async function stampCompletedAtOnUpdate() {
  const update = this.getUpdate() || {};
  const status = update.$set?.followupStatus !== undefined ? update.$set.followupStatus : update.followupStatus;
  if (status === undefined) return;
  const before = await this.model.findOne(this.getFilter()).select('followupStatus completedAt').lean();
  if (isCompletedStatus(status)) {
    if (!before || !isCompletedStatus(before.followupStatus)) this.set('completedAt', new Date());
  } else if (before?.completedAt) {
    this.set('completedAt', null);
  }
});

// Support high-speed querying and sorting without collection scans
salesCustomerSchema.index({ createdAt: -1, _id: -1 });
salesCustomerSchema.index({ agentId: 1, createdAt: -1 });
salesCustomerSchema.index({ agentId: 1, followupStatus: 1, createdAt: -1 });
salesCustomerSchema.index({ followupStatus: 1, packageScope: 1, createdAt: -1 });
salesCustomerSchema.index({ customerName: 1 });
salesCustomerSchema.index({ phone: 1 });
salesCustomerSchema.index({ email: 1 });

// Change notifications keep the in-memory sales follow-up list current.
const listEvents = attachListEvents(salesCustomerSchema);

const SalesCustomer = mongoose.model('SalesCustomer', salesCustomerSchema);
SalesCustomer.listEvents = listEvents;

module.exports = SalesCustomer;
