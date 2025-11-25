const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['article', 'video', 'pdf', 'tutorial', 'book', 'url', 'docx', 'xlsx', 'audio', 'image'], // Extended to include more types
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    accessLevel: {
      type: String,
      required: true,
      enum: ['public', 'restricted', 'private'],
      default: 'public',
    },
    fileUrl: {
      type: String,
      trim: true, // URL or file path to the resource
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'xlsx', 'mp4', 'mp3', 'url', 'image'], // For file types (can be expanded based on your needs)
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;