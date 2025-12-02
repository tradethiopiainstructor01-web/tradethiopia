const Payment = require('../models/Payment');

const createPayment = async (req, res) => {
  try {
    const { followup, order, method, amount, note } = req.body;
    const createdBy = req.user && req.user._id;
    const p = new Payment({ followup, order, method, amount, note, createdBy });
    const saved = await p.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Failed to create payment', err);
    res.status(500).json({ message: 'Failed to create payment', error: err.message });
  }
};

const listPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).populate('followup').populate('order').populate('createdBy');
    res.json(payments);
  } catch (err) {
    console.error('Failed to list payments', err);
    res.status(500).json({ message: 'Failed to list payments', error: err.message });
  }
};

module.exports = { createPayment, listPayments };
