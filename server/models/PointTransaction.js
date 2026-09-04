const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema(
  {
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'VALID_ISSUE_ACCEPTED',
        'OFFICER_CONFIRMED',
        'RESOLVED',
        'UNIQUE_BONUS',
        'COMMUNITY_CONFIRMED',
        'DUPLICATE_REPORT',
        'REJECTED_SPAM',
        'ADMIN_ADJUSTMENT'
      ]
    },
    points: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
