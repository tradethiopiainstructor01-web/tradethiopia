const { Schema, model } = require("mongoose");
const { attachListEvents } = require("../utils/listCache");

const trainingFollowupSchema = new Schema(
  {
    trainingType: { type: String, index: true },
    batch: { type: String },
    startDate: { type: Date, index: true },
    startTime: { type: String },
    endDate: { type: Date, index: true },
    endTime: { type: String },
    duration: { type: String },
    paymentOption: { type: String, enum: ["full", "partial"], default: "full" },
    paymentAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    specialRequirements: { type: String },
    previousTraining: { type: String },
    agentName: { type: String, index: true },
    salesAgent: { type: String, index: true },
    assignedInstructor: { type: String, index: true },
    customerName: { type: String, index: true },
    email: { type: String, index: true },
    phoneNumber: { type: String },
    fieldOfWork: { type: String },
    scheduleShift: { type: String },
    materialStatus: { type: String, default: "Not Delivered" },
    progress: { type: String, index: true },
    idInfo: { type: String },
    packageStatus: { type: String },
  },
  {
    timestamps: true,
  }
);

// Change notifications keep the in-memory training follow-up list current.
const listEvents = attachListEvents(trainingFollowupSchema);

const TrainingFollowup = model("TrainingFollowup", trainingFollowupSchema);
TrainingFollowup.listEvents = listEvents;

module.exports = TrainingFollowup;
