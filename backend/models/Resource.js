const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'pdf', 'video', 'text'
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String }, // URL to the uploaded file
});

const Resource = mongoose.model("Resource", ResourceSchema);

module.exports = Resource;