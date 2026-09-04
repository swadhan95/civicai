const mongoose = require('mongoose');
const { COMPLAINT_STATUS, PRIORITY_LEVELS } = require('../config/constants');

const masterIssueSchema = new mongoose.Schema(
  {
    masterId: {
      type: String,
      required: true,
      unique: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IssueCategory',
      required: true
    },
    categoryName: {
      type: String,
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    address: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: Object.values(PRIORITY_LEVELS),
      default: PRIORITY_LEVELS.MEDIUM
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.SUBMITTED
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    citizenReportCount: {
      type: Number,
      default: 1
    },
    masterComplaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint'
    },
    relatedComplaints: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint'
      }
    ],
    affectedCitizens: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);

masterIssueSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('MasterIssue', masterIssueSchema);
