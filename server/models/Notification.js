const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['STATUS_UPDATE', 'POINTS_EARNED', 'RANK_UP', 'SYSTEM_ALERT', 'SLA_BREACH', 'ESCALATION'],
      default: 'STATUS_UPDATE'
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint'
    },
    complaintIdStr: {
      type: String
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
