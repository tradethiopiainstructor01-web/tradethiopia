const { Schema, model } = require("mongoose");

const consultancySchema = new Schema(
  {
    companyName: { type: String, index: true, required: true },
    contactPerson: { type: String, index: true, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, index: true, required: true },
    website: { type: String },
    businessLocation: { type: String, required: true },
    businessType: { type: String, required: true },
    isOperational: { type: Boolean, default: true },
    employeeCount: { type: Number, default: 0 },
    targetMarket: { type: String },
    challenges: { type: String },
    packageType: {
      type: String,
      enum: [
        "businessIdea",
        "hourlyConsultation",
        "smeSetup",
        "investmentReady",
        "fullProject",
      ],
      required: true,
    },
    goals: { type: String },
    startDate: { type: Date },
    additionalDetails: { type: String },
    documents: {
      businessPlan: { type: Boolean, default: false },
      financialStatements: { type: Boolean, default: false },
      companyProfile: { type: Boolean, default: false },
      licenses: { type: Boolean, default: false },
      productCatalog: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Consultancy", consultancySchema);
