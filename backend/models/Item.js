const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  pdf: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;