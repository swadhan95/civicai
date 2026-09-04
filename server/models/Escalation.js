const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema(
  {
    escalationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    originalDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    escalationLevel: {
      type: Number,
      enum: [1, 2, 3], // 1: Dept Supervisor, 2: Municipal Administrator, 3: Central Command
      default: 1
    },
    levelName: {
      type: String,
      default: 'Department Supervisor'
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for escalation'],
      trim: true
    },
    evidence: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'UNDER_REVIEW', 'ACKNOWLEDGED', 'ACTION_REQUIRED', 'RESOLVED', 'REJECTED'],
      default: 'REQUESTED',
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    adminNotes: {
      type: String,
      default: ''
    },
    actionTaken: {
      type: String,
      default: ''
    },
    slaDeadlineSnapshot: {
      type: Date,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    history: [
      {
        action: { type: String, required: true },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        actorRole: { type: String, default: 'ADMIN' },
        notes: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

escalationSchema.index({ status: 1, escalationLevel: 1 });
escalationSchema.index({ complaint: 1, status: 1 });

module.exports = mongoose.model('Escalation', escalationSchema);
