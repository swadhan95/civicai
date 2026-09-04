const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    contactEmail: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true
    },
    headOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedAreas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area'
      }
    ],
    categoriesHandled: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IssueCategory'
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
