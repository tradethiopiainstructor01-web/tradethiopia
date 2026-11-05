const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    packageNumber: { type: Number, required: true },
    name: { type: String, trim: true, default: "" },
    services: [{ type: String, required: true }],
    price: { type: Number, required: true, default: 0 },
    description: { type: String, default: "" },
    market: {
      type: String,
      enum: ["Local", "International", "Enisra", "enisra", "ENSRA"],
      default: "Local",
    },
  },
  { timestamps: true }
);

packageSchema.index({ market: 1, packageNumber: 1 }, { unique: true });

module.exports = mongoose.model("Package", packageSchema);
