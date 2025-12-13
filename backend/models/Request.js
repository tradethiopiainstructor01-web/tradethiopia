const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, trim: true },
    originalName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const RequestSchema = new mongoose.Schema(
  {
    department: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
      trim: true,
    },
    date: { type: Date, required: true },
    createdBy: { type: String, required: true, trim: true },
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Completed"],
      default: "Pending",
      trim: true,
    },
    attachment: attachmentSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", RequestSchema);
