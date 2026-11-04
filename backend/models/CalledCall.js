const mongoose = require('mongoose');

const calledCallSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      trim: true,
      default: '',
      required: [
        function () {
          return !this.clientName;
        },
        'Customer name is required',
      ],
    },
    clientName: {
      type: String,
      trim: true,
      default: '',
      required: [
        function () {
          return !this.customerName;
        },
        'Prospect / Client name is required',
      ],
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    purpose: {
      type: String,
      enum: [
        'Cold Outreach',
        'Sales Pitch',
        'Course / Training Inquiry',
        'Package Offer',
        'Partnership',
        'Consultancy',
        'Follow-up Call',
        'Other',
      ],
      default: 'Cold Outreach',
    },
    customPurpose: {
      type: String,
      trim: true,
      default: '',
    },
    productInterest: {
      type: String,
      trim: true,
      default: '',
    },
    callResult: {
      type: String,
      trim: true,
      default: 'Interested',
    },
    callStatus: {
      type: String,
      trim: true,
      default: 'Interested',
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    salesAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    priority: {
      type: String,
      enum: ['Hot', 'Warm', 'Cold'],
      default: 'Warm',
    },
    callDuration: {
      type: String,
      trim: true,
      default: '',
    },
    callDate: {
      type: Date,
      default: Date.now,
    },
    nextActionDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    salesAgentName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

calledCallSchema.pre('validate', function (next) {
  // Sync customerName and clientName
  if (!this.customerName && this.clientName) {
    this.customerName = this.clientName;
  } else if (!this.clientName && this.customerName) {
    this.clientName = this.customerName;
  }
  if (!this.customerName && !this.clientName) {
    this.invalidate('customerName', 'Customer Name is required');
    this.invalidate('clientName', 'Prospect / Client name is required');
  }

  // Sync callResult and callStatus
  if (!this.callResult && this.callStatus) {
    this.callResult = this.callStatus;
  } else if (!this.callStatus && this.callResult) {
    this.callStatus = this.callResult;
  }

  // Sync followUpDate and nextActionDate
  if (!this.followUpDate && this.nextActionDate) {
    this.followUpDate = this.nextActionDate;
  } else if (!this.nextActionDate && this.followUpDate) {
    this.nextActionDate = this.followUpDate;
  }

  if (typeof this.salesAmount === 'string') {
    const parsed = parseFloat(this.salesAmount.replace(/[^0-9.-]+/g, ''));
    this.salesAmount = Number.isNaN(parsed) ? 0 : parsed;
  }

  next();
});

calledCallSchema.index({ customerName: 'text', clientName: 'text', companyName: 'text', phoneNumber: 'text', notes: 'text' });
calledCallSchema.index({ callResult: 1 });
calledCallSchema.index({ callStatus: 1 });
calledCallSchema.index({ callDate: -1 });

module.exports = mongoose.model('CalledCall', calledCallSchema);
