const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const { COMPLAINT_STATUS, PRIORITY_LEVELS } = require('../config/constants');

// @desc    Get Officer Dashboard stats and chart breakdown
// @route   GET /api/officer/stats
// @access  Private (Officer / Admin)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const filter = {};
    // If officer belongs to a specific department, optionally filter or show departmental view
    if (req.user.role === 'OFFICER' && req.user.department) {
      filter.assignedDepartment = req.user.department;
    }

    const totalIssues = await Complaint.countDocuments(filter);
    const pending = await Complaint.countDocuments({
      ...filter,
      status: { $in: [COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.REVIEWED, COMPLAINT_STATUS.ASSIGNED] }
    });
    const inProgress = await Complaint.countDocuments({
      ...filter,
      status: COMPLAINT_STATUS.IN_PROGRESS
    });
    const resolved = await Complaint.countDocuments({
      ...filter,
      status: COMPLAINT_STATUS.RESOLVED
    });
    const critical = await Complaint.countDocuments({
      ...filter,
      priority: PRIORITY_LEVELS.CRITICAL,
      status: { $ne: COMPLAINT_STATUS.RESOLVED }
    });
    const high = await Complaint.countDocuments({
      ...filter,
      priority: PRIORITY_LEVELS.HIGH,
      status: { $ne: COMPLAINT_STATUS.RESOLVED }
    });

    // Breakdown by Category
    const categoryAgg = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$categoryName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Breakdown by Priority
    const priorityAgg = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Breakdown by Status
    const statusAgg = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalIssues,
          pending,
          inProgress,
          resolved,
          critical,
          high,
          resolutionRate: totalIssues > 0 ? Math.round((resolved / totalIssues) * 100) : 0
        },
        charts: {
          byCategory: categoryAgg.map((c) => ({ name: c._id || 'Unspecified', count: c.count })),
          byPriority: priorityAgg.map((p) => ({ priority: p._id, count: p.count })),
          byStatus: statusAgg.map((s) => ({ status: s._id, count: s.count }))
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
