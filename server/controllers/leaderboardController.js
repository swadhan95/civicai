const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const { ROLES } = require('../config/constants');

// @desc    Get Civic Contributor Leaderboard (Weekly, Monthly, All-time)
// @route   GET /api/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { timeframe = 'all', city, limit = 50 } = req.query;

    if (timeframe === 'weekly' || timeframe === 'monthly') {
      const now = new Date();
      const startDate = new Date();

      if (timeframe === 'weekly') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeframe === 'monthly') {
        startDate.setDate(now.getDate() - 30);
      }

      // Aggregate points earned in this timeframe
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate },
            points: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$citizen',
            timeframePoints: { $sum: '$points' }
          }
        },
        { $sort: { timeframePoints: -1 } },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' }
      ];

      if (city) {
        pipeline.push({ $match: { 'user.city': { $regex: city, $options: 'i' } } });
      }

      const results = await PointTransaction.aggregate(pipeline);

      const leaderboard = results.map((item, index) => ({
        position: index + 1,
        id: item.user._id,
        displayName: item.user.displayName || item.user.name.split(' ')[0],
        points: item.timeframePoints,
        totalPoints: item.user.points,
        rank: item.user.rank,
        badge: item.user.rank?.badge || '🌱',
        validReportsCount: item.user.validReportsCount || 0,
        resolvedReportsCount: item.user.resolvedReportsCount || 0,
        city: item.user.city
      }));

      return res.json({
        success: true,
        timeframe,
        count: leaderboard.length,
        data: leaderboard
      });
    }

    // Default: All-Time Leaderboard
    const filter = { role: ROLES.CITIZEN };
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }

    const citizens = await User.find(filter)
      .select('name displayName points rank validReportsCount resolvedReportsCount city')
      .sort({ points: -1, resolvedReportsCount: -1 })
      .limit(parseInt(limit));

    const leaderboard = citizens.map((citizen, index) => ({
      position: index + 1,
      id: citizen._id,
      displayName: citizen.displayName || citizen.name.split(' ')[0],
      points: citizen.points,
      rank: citizen.rank,
      badge: citizen.rank?.badge || '🌱',
      validReportsCount: citizen.validReportsCount || 0,
      resolvedReportsCount: citizen.resolvedReportsCount || 0,
      city: citizen.city
    }));

    res.json({
      success: true,
      timeframe: 'all',
      count: leaderboard.length,
      data: leaderboard
    });
  } catch (err) {
    next(err);
  }
};
