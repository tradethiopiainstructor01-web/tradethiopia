const { Schema, model } = require("mongoose");

const followupSchema = new Schema(
  {
    clientName: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      default: "none",
      required: true,
    },
    email: {
      type: String,
      email: true,
      default: "none",
    },
    packageType: {
      type: String,
      required: true,
    },
    serviceProvided: {
      type: String,
      required: true,
    },
    serviceNotProvided: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      required: false,
    },
    deadline: {
      type: Date,
      required: true,
    },
    notes: [
      {
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    followupStatus: {
      type: String,
      enum: ['Prospect','Pending','Completed','Scheduled','Cancelled'],
      default: 'Pending'
    },
    schedulePreference: {
      type: String,
      enum: ['Regular','Weekend','Night','Online'],
      default: 'Regular'
    },
    supervisorComment: {
      type: String,
      default: ''
    },
    lastCalled: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  }
);

// Middleware to automatically update `lastCalled` to the current time
followupSchema.pre("findOneAndUpdate", function (next) {
  if (this.getUpdate().$set?.lastCalled !== undefined) {
    this.getUpdate().$set.lastCalled = new Date(); // Set `lastCalled` to the current time
  }
  next();
});

module.exports = model("Followup", followupSchema);