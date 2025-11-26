const { Schema, model } = require("mongoose");

const ensraFollowupSchema = new Schema(
  {
    type: { type: String, enum: ["company", "jobSeeker"], required: true, index: true },
    packageType: { type: String },
    companyName: { type: String, index: true },
    positionsOffered: { type: [String], default: [] },
    salaryRange: { type: String },
    jobRequirements: { type: String },
    jobSeekerName: { type: String, index: true },
    jobSeekerSkills: { type: [String], default: [] },
    jobSeekerExperience: { type: String },
    jobSeekerEducation: { type: String },
    jobSeekerExpectedSalary: { type: String },
  },
  {
    timestamps: true,
  }
);

ensraFollowupSchema.index({ companyName: 1 });
ensraFollowupSchema.index({ jobSeekerName: 1 });

module.exports = model("EnsraFollowup", ensraFollowupSchema);
