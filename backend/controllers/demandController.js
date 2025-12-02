const Demand = require('../models/Demand');

const listDemands = async (req, res) => {
  try {
    const demands = await Demand.find().populate('lines.item').populate('followup').populate('createdBy');
    res.json(demands);
  } catch (err) {
    console.error('Error listing demands', err);
    res.status(500).json({ message: 'Failed to list demands', error: err.message });
  }
};

const resolveDemand = async (req, res) => {
  const { id } = req.params;
  const userId = req.user && req.user._id;
  try {
    const demand = await Demand.findById(id);
    if (!demand) return res.status(404).json({ message: 'Demand not found' });
    demand.status = 'resolved';
    demand.resolvedAt = new Date();
    demand.resolvedBy = userId;
    await demand.save();
    res.json(demand);
  } catch (err) {
    console.error('Error resolving demand', err);
    res.status(500).json({ message: 'Failed to resolve demand', error: err.message });
  }
};

module.exports = { listDemands, resolveDemand };
