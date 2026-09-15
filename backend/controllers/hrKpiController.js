const HrKpi = require('../models/HrKpi');
const CandidatePool = require('../models/CandidatePool');
const { notifyKpiSubmission } = require('../services/kpiSubmissionNotificationService');
const Attendance = require('../models/Attendance');
const User = require('../models/user.model');

// Helper to auto-calculate metric status based on target & actual
const calculateStatus = (actual, target) => {
  if (target === 0) return actual === 0 ? 'On Track' : 'Behind Target';
  const ratio = actual / target;
  if (ratio >= 1.0) return 'Completed';
  if (ratio >= 0.8) return 'On Track';
  return 'Behind Target';
};

// GET /api/hr-kpi?periodType=weekly&periodKey=2026-W34
exports.getHrKpis = async (req, res) => {
  try {
    const { periodType = 'monthly', periodKey } = req.query;

    let key = periodKey;
    const now = new Date();
    const currentYear = now.getFullYear();

    if (!key) {
      if (periodType === 'weekly') {
        // Calculate week number
        const startOfYear = new Date(currentYear, 0, 1);
        const pastDaysOfYear = (now - startOfYear) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        key = `${currentYear}-W${weekNum < 10 ? '0' + weekNum : weekNum}`;
      } else if (periodType === 'quarterly') {
        const q = Math.floor(now.getMonth() / 3) + 1;
        key = `${currentYear}-Q${q}`;
      } else {
        const monthNum = now.getMonth() + 1;
        key = `${currentYear}-${monthNum < 10 ? '0' + monthNum : monthNum}`;
      }
    }

    const keyYear = parseInt(key.split('-')[0]) || currentYear;

    let record = await HrKpi.findOne({ periodType, periodKey: key });

    // Fetch live system stats to provide auto-calculated baselines
    const candidateCount = await CandidatePool.countDocuments();
    const newHiresCount = await CandidatePool.countDocuments({ hiredStatus: 'hired' });

    if (!record) {
      // Create initial record for this period
      record = new HrKpi({
        periodType,
        periodKey: key,
        year: keyYear,
        periodLabel: key,
        postVacancies: { target: 0, actual: 0, status: 'Not Reported' },
        screenCvs: { target: 0, actual: 0, status: 'Not Reported' },
        conductInterviews: { target: 0, actual: 0, status: 'Not Reported' },
        facilitateInternalTrainings: { target: 0, actual: 0, status: 'Not Reported' },
        attendancePunctuality: { target: 0, actual: 0, status: 'Not Reported', notes: '' },
        checkingJobEnisra: { target: 0, actual: 0, status: 'Not Reported' },
        newHires: { target: 0, actual: newHiresCount, status: newHiresCount > 0 ? 'On Track' : 'Not Reported' },
        resignations: { target: 0, actual: 0, status: 'Not Reported' },
        candidatesPool: { target: 0, actual: candidateCount, status: candidateCount > 0 ? 'On Track' : 'Not Reported' },
        staffTrainingParticipants: { target: 0, actual: 0, status: 'Not Reported' },
      });
      await record.save();
    }

    res.json({ success: true, data: record, liveStats: { candidateCount, newHiresCount } });
  } catch (error) {
    console.error('Error fetching HR KPIs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/hr-kpi
exports.saveHrKpi = async (req, res) => {
  try {
    const { periodType, periodKey, year, metrics } = req.body;

    if (!periodType || !periodKey) {
      return res.status(400).json({ success: false, message: 'periodType and periodKey are required' });
    }

    let record = await HrKpi.findOne({ periodType, periodKey });

    if (!record) {
      record = new HrKpi({
        periodType,
        periodKey,
        year: year || new Date().getFullYear(),
        periodLabel: periodKey,
      });
    }

    if (metrics) {
      const metricKeys = [
        'postVacancies',
        'screenCvs',
        'conductInterviews',
        'facilitateInternalTrainings',
        'attendancePunctuality',
        'checkingJobEnisra',
        'newHires',
        'resignations',
        'candidatesPool',
        'staffTrainingParticipants',
      ];

      metricKeys.forEach((key) => {
        if (metrics[key]) {
          const target = Number(metrics[key].target ?? record[key]?.target ?? 0);
          const actual = Number(metrics[key].actual ?? record[key]?.actual ?? 0);
          const notes = metrics[key].notes ?? record[key]?.notes ?? '';
          const status = metrics[key].status || calculateStatus(actual, target);

          record[key] = { target, actual, status, notes };
        }
      });
    }

    if (req.user && req.user._id) {
      record.updatedBy = req.user._id;
    }

    await record.save();
    await notifyKpiSubmission(req, { departmentId: 'hr', periodType, periodKey, reportId: record._id });
    res.json({ success: true, message: 'HR KPI updated successfully', data: record });
  } catch (error) {
    console.error('Error saving HR KPI:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/hr-kpi/live-stats
exports.getLiveStats = async (req, res) => {
  try {
    const candidateCount = await CandidatePool.countDocuments();
    const newHiresCount = await CandidatePool.countDocuments({ hiredStatus: 'hired' });
    const totalUsers = await User.countDocuments();
    const recentAttendance = await Attendance.countDocuments();

    res.json({
      success: true,
      data: {
        candidateCount,
        newHiresCount,
        totalUsers,
        recentAttendance,
      },
    });
  } catch (error) {
    console.error('Error fetching live HR stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
