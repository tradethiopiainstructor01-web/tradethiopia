const awardEngine = require('../services/awardEngine');
const Award = require('../models/Award');
const MonthlyPerformance = require('../models/MonthlyPerformance');

// POST /api/awards/calculate
exports.calculate = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(400).json({ success: false, message: 'month (YYYY-MM) is required' });

    const saved = await awardEngine.calculateForMonth(month);
    res.json({ success: true, data: saved, message: 'Awards calculated and published' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Calculation failed' });
  }
};

// GET /api/awards/month/:month
exports.getByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    const awards = await Award.find({ month }).populate('employeeId');
    res.json({ success: true, data: awards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/awards/department/:department
exports.getByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const awards = await Award.find({ department }).populate('employeeId');
    res.json({ success: true, data: awards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/awards/details/:month/:employeeId
exports.getPerformanceDetail = async (req, res) => {
  try {
    const { month, employeeId } = req.params;
    if (!month || !employeeId) return res.status(400).json({ success: false, message: 'month and employeeId required' });
    const perf = await MonthlyPerformance.findOne({ month, employeeId }).populate('employeeId');
    if (!perf) return res.status(404).json({ success: false, message: 'MonthlyPerformance not found' });
    res.json({ success: true, data: perf });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
