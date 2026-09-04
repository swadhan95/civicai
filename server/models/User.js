const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, DEFAULT_RANKS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    displayName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CITIZEN
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    points: {
      type: Number,
      default: 0
    },
    rank: {
      name: { type: String, default: DEFAULT_RANKS[0].name },
      code: { type: String, default: DEFAULT_RANKS[0].code },
      badge: { type: String, default: DEFAULT_RANKS[0].badge }
    },
    reportsCount: {
      type: Number,
      default: 0
    },
    validReportsCount: {
      type: Number,
      default: 0
    },
    resolvedReportsCount: {
      type: Number,
      default: 0
    },
    city: {
      type: String,
      default: 'Metropolis'
    },
    assignedArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    avatar: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Auto-generate displayName if not provided and hash password
userSchema.pre('save', async function () {
  if (!this.displayName && this.name) {
    const parts = this.name.split(' ');
    this.displayName = parts[0] + (parts[1] ? ` ${parts[1][0]}.` : '');
  }

  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Auto-backup to persistent disk
userSchema.post('save', async function (doc) {
  try {
    const { backupUser } = require('../services/persistenceService');
    const passwordHash = this.password || doc.password;
    if (passwordHash) {
      await backupUser({
        name: doc.name,
        displayName: doc.displayName,
        email: doc.email,
        password: passwordHash,
        role: doc.role,
        points: doc.points,
        rank: doc.rank,
        city: doc.city
      });
    }
  } catch (err) {
    // Silent fail on backup hook
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
