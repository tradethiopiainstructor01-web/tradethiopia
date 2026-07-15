const mongoose = require('mongoose');

const candidatePoolSchema = new mongoose.Schema({
  department: { type: String, trim: true, required: true, index: true },
  candidateType: { type: String, enum: ['active', 'backup'], default: 'active', index: true },
  fullName: { type: String, trim: true, default: '' },
  positionAppliedFor: { type: String, trim: true, default: '' },
  availabilityToStart: { type: String, trim: true, default: '' },
  totalExperience: { type: String, trim: true, default: '' },
  currentAddress: { type: String, trim: true, default: '' },
  source: { type: String, trim: true, default: '' },
  applicationDate: { type: String, trim: true, default: '' },
  currentStage: { type: String, trim: true, default: '' },
  interviewer: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  accountEmail: { type: String, trim: true, lowercase: true, default: '' },
  accountRole: { type: String, trim: true, default: '' },
  hiredStatus: { type: String, enum: ['pending', 'hired', 'rejected'], default: 'pending', index: true },
  hiredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  hiredAt: { type: Date, default: null },
  position: { type: String, trim: true, default: '' },
  backupCandidate: { type: String, trim: true, default: '' },
  internalExternal: { type: String, trim: true, default: '' },
  readiness: { type: String, trim: true, default: '' },
  keyStrengths: { type: String, trim: true, default: '' },
  developmentNeeded: { type: String, trim: true, default: '' },
  contact: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
}, {
  timestamps: true,
});

candidatePoolSchema.index({ department: 1, candidateType: 1, fullName: 1, backupCandidate: 1 });

module.exports = mongoose.model('CandidatePool', candidatePoolSchema);


