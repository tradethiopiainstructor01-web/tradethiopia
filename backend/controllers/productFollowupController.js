const ProductFollowup = require('../models/ProductFollowup');
const asyncHandler = require('express-async-handler');

// Get all product followups
const getProductFollowups = asyncHandler(async (req, res) => {
  const items = await ProductFollowup.find();
  res.json(items);
});

// Create product followup
const createProductFollowup = asyncHandler(async (req, res) => {
  const { productName, buyerName, contactPhone, email, status, schedulePreference, note, supervisorComment } = req.body;
  const pf = new ProductFollowup({ productName, buyerName, contactPhone, email, status, schedulePreference, note, supervisorComment });
  const saved = await pf.save();
  res.status(201).json(saved);
});

// Update product followup
const updateProductFollowup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const updated = await ProductFollowup.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ message: 'Product followup not found' });
  res.json(updated);
});

// Delete product followup
const deleteProductFollowup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const removed = await ProductFollowup.findByIdAndDelete(id);
  if (!removed) return res.status(404).json({ message: 'Product followup not found' });
  res.json({ message: 'Deleted' });
});

module.exports = {
  getProductFollowups,
  createProductFollowup,
  updateProductFollowup,
  deleteProductFollowup
};
