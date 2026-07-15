const express = require('express');
const mongoose = require('mongoose');
const CandidatePool = require('../models/CandidatePool');

const router = express.Router();

const allowedFields = [
  'department',
  'candidateType',
  'fullName',
  'positionAppliedFor',
  'availabilityToStart',
  'totalExperience',
  'currentAddress',
  'source',
  'applicationDate',
  'currentStage',
  'interviewer',
  'phone',
  'accountEmail',
  'accountRole',
  'hiredStatus',
  'position',
  'backupCandidate',
  'internalExternal',
  'readiness',
  'keyStrengths',
  'developmentNeeded',
  'contact',
  'notes',
];

const normalizePayload = (payload = {}) => {
  const normalized = {};
  allowedFields.forEach((field) => {
    if (payload[field] !== undefined && payload[field] !== null) {
      normalized[field] = String(payload[field]).trim();
    }
  });
  normalized.candidateType = normalized.candidateType === 'backup' ? 'backup' : 'active';
  normalized.hiredStatus = ['hired', 'rejected'].includes(normalized.hiredStatus) ? normalized.hiredStatus : 'pending';
  return normalized;
};

const hasCandidateIdentity = (record) => Boolean(
  record.fullName || record.backupCandidate || record.positionAppliedFor || record.position
);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.candidateType) filter.candidateType = req.query.candidateType;

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { fullName: regex },
        { backupCandidate: regex },
        { positionAppliedFor: regex },
        { position: regex },
        { phone: regex },
        { contact: regex },
        { currentStage: regex },
      ];
    }

    const records = await CandidatePool.find(filter).sort({ department: 1, candidateType: 1, fullName: 1, backupCandidate: 1 }).lean();
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidate pool', error: error.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const summary = await CandidatePool.aggregate([
      {
        $group: {
          _id: { department: '$department', candidateType: '$candidateType' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.department': 1 } },
    ]);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidate summary', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    if (!payload.department || !hasCandidateIdentity(payload)) {
      return res.status(400).json({ success: false, message: 'Department and candidate information are required' });
    }

    const record = await CandidatePool.create(payload);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create candidate', error: error.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    const records = Array.isArray(req.body.records) ? req.body.records : [];
    const replaceExisting = Boolean(req.body.replaceExisting);
    const normalizedRecords = records
      .map(normalizePayload)
      .filter((record) => record.department && hasCandidateIdentity(record));

    if (!normalizedRecords.length) {
      return res.status(400).json({ success: false, message: 'No valid candidate records found' });
    }

    if (replaceExisting) {
      const departments = [...new Set(normalizedRecords.map((record) => record.department))];
      await CandidatePool.deleteMany({ department: { $in: departments } });
    }

    const created = await CandidatePool.insertMany(normalizedRecords, { ordered: false });
    res.status(201).json({ success: true, data: created, importedCount: created.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to import candidates', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }

    const payload = normalizePayload(req.body);
    const record = await CandidatePool.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update candidate', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }

    const record = await CandidatePool.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    res.json({ success: true, message: 'Candidate deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete candidate', error: error.message });
  }
});

module.exports = router;


