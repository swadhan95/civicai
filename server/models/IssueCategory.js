const mongoose = require('mongoose');
const { PRIORITY_LEVELS } = require('../config/constants');

const issueCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    defaultDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    defaultPriority: {
      type: String,
      enum: Object.values(PRIORITY_LEVELS),
      default: PRIORITY_LEVELS.MEDIUM
    },
    keywords: [
      {
        type: String,
        lowercase: true,
        trim: true
      }
    ],
    icon: {
      type: String,
      default: 'AlertCircle'
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('IssueCategory', issueCategorySchema);
