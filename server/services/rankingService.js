const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const Notification = require('../models/Notification');
const SystemSetting = require('../models/SystemSetting');
const { DEFAULT_RANKS, DEFAULT_POINT_RULES } = require('../config/constants');

class RankingService {
  /**
   * Fetch dynamic point rules from database or fallback to defaults
   */
  async getPointRules() {
    try {
      const setting = await SystemSetting.findOne({ key: 'POINT_RULES' });
      if (setting && setting.value) {
        return { ...DEFAULT_POINT_RULES, ...setting.value };
      }
    } catch (err) {
      console.warn('Error fetching custom point rules, using defaults:', err.message);
    }
    return DEFAULT_POINT_RULES;
  }

  /**
   * Fetch dynamic rank definitions from database or fallback to defaults
   */
  async getRanks() {
    try {
      const setting = await SystemSetting.findOne({ key: 'RANK_TIERS' });
      if (setting && Array.isArray(setting.value)) {
        return setting.value;
      }
    } catch (err) {
      console.warn('Error fetching custom ranks, using defaults:', err.message);
    }
    return DEFAULT_RANKS;
  }

  /**
   * Compute rank metadata and next rank target for given points
   */
  determineRank(points, ranks) {
    const sortedRanks = [...ranks].sort((a, b) => a.minPoints - b.minPoints);
    let currentRank = sortedRanks[0];
    let nextRank = null;

    for (let i = 0; i < sortedRanks.length; i++) {
      if (points >= sortedRanks[i].minPoints) {
        currentRank = sortedRanks[i];
        nextRank = sortedRanks[i + 1] || null;
      }
    }

    let progressPercent = 100;
    let pointsNeeded = 0;

    if (nextRank) {
      const span = nextRank.minPoints - currentRank.minPoints;
      const progressInSpan = points - currentRank.minPoints;
      progressPercent = Math.min(100, Math.max(0, Math.round((progressInSpan / span) * 100)));
      pointsNeeded = nextRank.minPoints - points;
    }

    return {
      currentRank: {
        name: currentRank.name,
        code: currentRank.code,
        badge: currentRank.badge
      },
      nextRank: nextRank
        ? {
            name: nextRank.name,
            code: nextRank.code,
            badge: nextRank.badge,
            targetPoints: nextRank.minPoints,
            pointsNeeded
          }
        : null,
      progressPercent
    };
  }

  /**
   * Award or deduct points for a citizen action
   */
  async awardPoints({ userId, complaintId = null, actionType, customDescription = null, pointOverride = null }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const rules = await this.getPointRules();
    let pointChange = pointOverride !== null ? pointOverride : (rules[actionType] ?? 0);

    // Ensure balance doesn't drop below 0
    const newBalance = Math.max(0, user.points + pointChange);
    const actualDiff = newBalance - user.points;

    // Check rank progression
    const ranks = await this.getRanks();
    const rankInfo = this.determineRank(newBalance, ranks);
    const prevRankCode = user.rank ? user.rank.code : null;
    const isRankUp = prevRankCode && rankInfo.currentRank.code !== prevRankCode && pointChange > 0;

    user.points = newBalance;
    user.rank = rankInfo.currentRank;

    // Update report counters
    if (actionType === 'VALID_ISSUE_ACCEPTED') {
      user.validReportsCount += 1;
    } else if (actionType === 'RESOLVED') {
      user.resolvedReportsCount += 1;
    }

    await user.save();

    // Default descriptions
    const actionDescriptions = {
      VALID_ISSUE_ACCEPTED: 'Report verified and accepted by community moderation (+20 pts)',
      OFFICER_CONFIRMED: 'Complaint verified and acknowledged by municipal officer (+30 pts)',
      RESOLVED: 'Civic issue successfully repaired and closed (+40 pts)',
      UNIQUE_BONUS: 'First citizen to report a new unique civic defect (+20 pts)',
      COMMUNITY_CONFIRMED: 'Multiple fellow citizens corroborated your report (+10 pts)',
      DUPLICATE_REPORT: 'Corroborating duplicate report registered (0 pts)',
      REJECTED_SPAM: 'Complaint marked as false, invalid or spam (-20 pts)'
    };

    const description = customDescription || actionDescriptions[actionType] || `Civic point adjustment (${pointChange >= 0 ? '+' : ''}${pointChange} pts)`;

    const transaction = new PointTransaction({
      citizen: user._id,
      complaint: complaintId,
      actionType,
      points: actualDiff,
      balanceAfter: newBalance,
      description
    });
    await transaction.save();

    // Create In-App Notification for points
    if (actualDiff !== 0) {
      const sign = actualDiff > 0 ? '+' : '';
      await Notification.create({
        recipient: user._id,
        title: actualDiff > 0 ? 'Civic Points Earned!' : 'Point Deduction',
        message: `${description}. Current Total: ${newBalance} points.`,
        type: 'POINTS_EARNED',
        complaint: complaintId
      });
    }

    // Rank Promotion Notification
    if (isRankUp) {
      await Notification.create({
        recipient: user._id,
        title: 'Rank Promotion Achieved! 🏆',
        message: `Congratulations! Your verified civic contributions promoted you to ${rankInfo.currentRank.badge} ${rankInfo.currentRank.name}!`,
        type: 'RANK_UP'
      });
    }

    return {
      user,
      transaction,
      rankInfo,
      pointsAwarded: actualDiff
    };
  }
}

module.exports = new RankingService();
