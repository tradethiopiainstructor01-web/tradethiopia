const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    packageNumber: { type: Number, required: true, unique: true, index: true },
    services: [{ type: String, required: true }],
    price: { type: Number, required: true, default: 0 },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
