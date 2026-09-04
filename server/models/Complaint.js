const mongoose = require('mongoose');
const { COMPLAINT_STATUS, PRIORITY_LEVELS } = require('../config/constants');

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    image: {
      type: String,
      required: [true, 'Issue image is required']
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
    aiAnalysis: {
      detectedCategory: { type: String },
      confidence: { type: Number, min: 0, max: 100 },
      severityTag: { type: String },
      isConfirmedByUser: { type: Boolean, default: true },
      rawOutput: { type: Object }
    },
    priority: {
      type: String,
      enum: Object.values(PRIORITY_LEVELS),
      default: PRIORITY_LEVELS.MEDIUM
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
      required: [true, 'Location address is required']
    },
    geographicRegion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      default: null,
      index: true
    },
    ancestorRegions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area',
        index: true
      }
    ],
    regionName: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    suggestedDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    assignedDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.SUBMITTED
    },
    isDuplicate: {
      type: Boolean,
      default: false
    },
    masterIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MasterIssue',
      default: null
    },
    duplicateCount: {
      type: Number,
      default: 0
    },
    resolution: {
      imageUrl: { type: String, default: null },
      afterImage: { type: String, default: null },
      notes: { type: String, default: '' },
      resolvedAt: { type: Date, default: null },
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedByAI: { type: Boolean, default: false },
      aiConfidence: { type: Number, default: 0 }
    },
    pointsAwarded: {
      type: Number,
      default: 0
    },
    officerNotes: [
      {
        note: String,
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      default: null
    },
    areaName: {
      type: String,
      default: 'Central Municipal Ward'
    },

    // SLA & Accountability Fields
    reportedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    assignedAt: {
      type: Date,
      default: null
    },
    inspectionAt: {
      type: Date,
      default: null
    },
    inProgressAt: {
      type: Date,
      default: null
    },
    expectedResolutionAt: {
      type: Date,
      default: null,
      index: true
    },
    slaDeadline: {
      type: Date,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    },
    slaDuration: {
      type: Number, // in hours
      default: 24
    },
    slaStatus: {
      type: String,
      enum: ['ON_TRACK', 'DUE_SOON', 'OVERDUE', 'RESOLVED_ON_TIME', 'RESOLVED_LATE'],
      default: 'ON_TRACK',
      index: true
    },
    slaBreachedAt: {
      type: Date,
      default: null
    },
    slaExtensions: [
      {
        originalDeadline: Date,
        newDeadline: Date,
        reason: String,
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    delayReasons: [
      {
        reason: String,
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
      }
    ],

    // Escalation State
    isEscalated: {
      type: Boolean,
      default: false
    },
    escalationReason: {
      type: String,
      default: ''
    },
    escalatedAt: {
      type: Date,
      default: null
    },
    activeEscalation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escalation',
      default: null
    },

    inspection: {
      scheduledAt: { type: Date, default: null },
      inspectedAt: { type: Date, default: null },
      inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      notes: { type: String, default: '' },
      status: {
        type: String,
        enum: ['NOT_SCHEDULED', 'SCHEDULED', 'INSPECTED', 'WAIVED'],
        default: 'NOT_SCHEDULED'
      }
    },
    timeline: [
      {
        status: { type: String, required: true },
        message: { type: String, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        actorName: { type: String, default: 'System' },
        actorRole: { type: String, default: 'SYSTEM' },
        actionType: { type: String, default: 'STATUS_CHANGE' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ slaStatus: 1, expectedResolutionAt: 1 });
complaintSchema.index({ isEscalated: 1 });
complaintSchema.index({ citizen: 1 });
complaintSchema.index({ geographicRegion: 1, status: 1 });
complaintSchema.index({ ancestorRegions: 1, status: 1, priority: 1 });
complaintSchema.index({ ancestorRegions: 1, category: 1, assignedDepartment: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
