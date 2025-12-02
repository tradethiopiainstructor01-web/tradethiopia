const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);