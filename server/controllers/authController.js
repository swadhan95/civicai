const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const rankingService = require('../services/rankingService');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user (Citizen by default)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, city, departmentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const assignedRole = role === 'OFFICER' || role === 'ADMIN' ? role : 'CITIZEN';

    const ranks = await rankingService.getRanks();
    const initialRank = ranks[0];

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: assignedRole,
      department: assignedRole === 'OFFICER' && departmentId ? departmentId : null,
      city: city ? city.trim() : 'Metropolis',
      rank: {
        name: initialRank.name,
        code: initialRank.code,
        badge: initialRank.badge
      }
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        points: user.points,
        rank: user.rank,
        city: user.city
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password').populate('department', 'name code');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email and password.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        department: user.department,
        points: user.points,
        rank: user.rank,
        reportsCount: user.reportsCount,
        validReportsCount: user.validReportsCount,
        resolvedReportsCount: user.resolvedReportsCount,
        city: user.city
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user details + rank progress
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('department', 'name code');
    const ranks = await rankingService.getRanks();
    const rankInfo = rankingService.determineRank(user.points, ranks);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        department: user.department,
        points: user.points,
        rank: user.rank,
        reportsCount: user.reportsCount,
        validReportsCount: user.validReportsCount,
        resolvedReportsCount: user.resolvedReportsCount,
        city: user.city
      },
      rankProgression: rankInfo
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, displayName, city } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (displayName) user.displayName = displayName;
    if (city) user.city = city;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        points: user.points,
        rank: user.rank,
        city: user.city
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change / Update Password with validation & integrity check
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your current password and new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match.'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect. Please verify your current credentials.'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully! Your new password has been safely encrypted and saved.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's personal point audit history
// @route   GET /api/auth/point-history
// @access  Private
exports.getPointHistory = async (req, res, next) => {
  try {
    const PointTransaction = require('../models/PointTransaction');
    const logs = await PointTransaction.find({ citizen: req.user._id })
      .populate('complaint', 'complaintId categoryName status')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
};
