const RevenueActual = require('../models/RevenueActual');
const SocialActual = require('../models/SocialActual');
const SocialWeeklyKpi = require('../models/SocialWeeklyKpi');

const getMonthYear = (body) => {
  const now = new Date();
  return {
    month: body.month || now.toLocaleString('en-US', { month: 'short' }),
    year: Number(body.year || now.getFullYear()),
  };
};

const getWeekWindow = (source = {}) => {
  const base = source.weekStart || source.date || new Date().toISOString().split('T')[0];
  const current = new Date(base);
  if (Number.isNaN(current.getTime())) {
    throw new Error('Invalid week date');
  }

  const day = current.getDay();
  const mondayOffset = (day + 6) % 7;
  const weekStart = new Date(current);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(current.getDate() - mondayOffset);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    month: weekStart.toLocaleString('en-US', { month: 'short' }),
    year: weekStart.getFullYear(),
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

exports.upsertSocialWeeklyKpi = async (req, res) => {
  try {
    const platform = (req.body.platform || '').trim();
    if (!platform) return res.status(400).json({ message: 'Platform is required' });

    const { weekStart, weekEnd, month, year } = getWeekWindow(req.body);
    const payload = {
      platform,
      weekStart,
      weekEnd,
      month,
      year,
      videos: Number(req.body.videos || 0),
      graphics: Number(req.body.graphics || 0),
      views: Number(req.body.views || 0),
      likes: Number(req.body.likes || 0),
      shares: Number(req.body.shares || 0),
      active: true,
    };

    const doc = await SocialWeeklyKpi.findOneAndUpdate(
      { platform, weekStart },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save social weekly KPI', error: err.message });
  }
};

exports.listSocialWeeklyKpis = async (req, res) => {
  try {
    const query = { active: true };

    if (req.query.date || req.query.weekStart) {
      const { weekStart } = getWeekWindow(req.query);
      query.weekStart = weekStart;
    }

    const docs = await SocialWeeklyKpi.find(query).sort({ weekStart: -1, platform: 1 }).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch social weekly KPIs', error: err.message });
  }
};

