const mongoose = require('mongoose');
const { Schema, model } = mongoose;

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
    customerType: {
      type: String,
      enum: ["buyer", "seller", ""],
      default: "",
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
    country: {
      type: String,
      required: false,
      default: "",
    },
    packageScope: {
      type: String,
      enum: ["Local", "International", ""],
      default: "",
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
      enum: ['Prospect','Pending','Completed','Scheduled','Cancelled','Imported'],
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
    call_count: { type: Number, default: 0 },
    message_count: { type: Number, default: 0 },
    email_count: { type: Number, default: 0 },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    communications: [
      {
        channel: {
          type: String,
          enum: ["Phone call", "WhatsApp", "Telegram", "Email", "In-person visit"],
          required: true,
        },
        note: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    messages: [
      {
        sender: { type: String, default: "System" }, // e.g., agent name/email
        body: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: false,
      default: null,
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
