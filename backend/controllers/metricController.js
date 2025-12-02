const RevenueActual = require('../models/RevenueActual');
const SocialActual = require('../models/SocialActual');

const getMonthYear = (body) => {
  const now = new Date();
  return {
    month: body.month || now.toLocaleString('en-US', { month: 'short' }),
    year: Number(body.year || now.getFullYear()),
  };
};

exports.upsertRevenue = async (req, res) => {
  try {
    const metric = (req.body.metric || '').trim();
    const actual = Number(req.body.actual || 0);
    const target = Number(req.body.target || 0);
    if (!metric) return res.status(400).json({ message: 'Metric is required' });
    const { month, year } = getMonthYear(req.body);
    const doc = await RevenueActual.findOneAndUpdate(
      { metric, month, year },
      { metric, actual, target, month, year, active: true },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save revenue actual', error: err.message });
  }
};

exports.listRevenue = async (_req, res) => {
  try {
    const docs = await RevenueActual.find({ active: true }).sort({ year: -1, month: -1 }).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch revenue actuals', error: err.message });
  }
};

exports.upsertSocial = async (req, res) => {
  try {
    const platform = (req.body.platform || '').trim();
    const actual = Number(req.body.actual || 0);
    const target = Number(req.body.target || 0);
    if (!platform) return res.status(400).json({ message: 'Platform is required' });
    const { month, year } = getMonthYear(req.body);
    const doc = await SocialActual.findOneAndUpdate(
      { platform, month, year },
      { platform, actual, target, month, year, active: true },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save social actual', error: err.message });
  }
};

exports.listSocial = async (_req, res) => {
  try {
    const docs = await SocialActual.find({ active: true }).sort({ year: -1, month: -1 }).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch social actuals', error: err.message });
  }
};

