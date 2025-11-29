const { Schema, model } = require("mongoose");

const trainingFollowupSchema = new Schema(
  {
    trainingType: { type: String, index: true },
    batch: { type: String },
    startDate: { type: Date, index: true },
    endDate: { type: Date, index: true },
    duration: { type: String },
    paymentOption: { type: String, enum: ["full", "partial"], default: "full" },
    paymentAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    specialRequirements: { type: String },
    previousTraining: { type: String },
    agentName: { type: String, index: true },
    customerName: { type: String, index: true },
    email: { type: String, index: true },
    phoneNumber: { type: String },
    fieldOfWork: { type: String },
    scheduleShift: { type: String },
    materialStatus: { type: String },
    progress: { type: String, index: true },
    idInfo: { type: String },
    packageStatus: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = model("TrainingFollowup", trainingFollowupSchema);
