const mongoose = require('mongoose');

const StudentRegistrationSchema = new mongoose.Schema(
  {
    clientLocalId: {
      type: String,
      index: true,
      sparse: true,
    },
    studentId: {
      type: String,
      trim: true,
      required: true,
      immutable: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['', 'Female', 'Male'],
      default: '',
      trim: true,
    },
    nationalIdImage: {
      type: String,
      default: '',
      select: false,
    },
    nationalIdFrontImage: {
      type: String,
      default: '',
      select: false,
    },
    nationalIdBackImage: {
      type: String,
      default: '',
      select: false,
    },
    passportPhoto: {
      type: String,
      default: '',
      select: false,
    },
    paymentScreenshot: {
      type: String,
      default: '',
      select: false,
    },
    learningDepartment: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    program: {
      type: String,
      trim: true,
    },
    enrollmentDate: {
      type: Date,
    },
    trainingEndDate: {
      type: Date,
    },
    examDate: {
      type: Date,
    },
    preferredTimeSlot: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Night', 'Weekend', 'VIP'],
      default: 'Morning',
      index: true,
    },
    readinessStatus: {
      type: String,
      enum: ['Not assessed', 'In preparation', 'Ready', 'Needs support', 'Not ready'],
      default: 'Not assessed',
    },
    paymentOption: {
      type: String,
      enum: ['Full Payment', 'Half Payment'],
      default: 'Full Payment',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Waiting'],
      default: 'Waiting',
      index: true,
    },
    paymentBank: {
      type: String,
      default: '',
      trim: true,
    },
    fsNumber: {
      type: String,
      default: '',
      trim: true,
    },
    classCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    classCompletionStatus: {
      type: String,
      enum: ['Completed', 'Not Completed', 'Stopped'],
      default: 'Not Completed',
      index: true,
    },
    cocPaymentStatus: {
      type: String,
      enum: ['Paid', 'Unpaid'],
      default: 'Unpaid',
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Completed', 'Paused'],
      default: 'Active',
    },
    salesCallStatus: {
      type: String,
      enum: ['Called', 'Not Called', 'Busy', 'No Answer', 'Callback', '2x Called'],
      default: 'Not Called',
    },
    salesFollowupStatus: {
      type: String,
      enum: ['Prospect', 'Pending', 'Completed', 'Scheduled', 'Cancelled', 'Imported'],
      default: 'Pending',
    },
    salesSchedulePreference: {
      type: String,
      enum: ['Regular', 'Morning', 'Afternoon', 'Night', 'Weekend', 'Online', 'VIP', ''],
      default: 'Regular',
    },
    salesPackageScope: {
      type: String,
      enum: ['Local', 'International', ''],
      default: 'Local',
    },
    salesFollowupDate: {
      type: Date,
    },
    salesFollowupNote: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
    registeredBy: {
      type: String,
      default: 'Unknown CS member',
      trim: true,
    },
    registeredByEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    updatedBy: {
      type: String,
      default: '',
      trim: true,
    },
    updatedByEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    agentId: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentRegistration', StudentRegistrationSchema);
