const SystemSetting = require('../models/SystemSetting');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { PRIORITY_LEVELS, COMPLAINT_STATUS } = require('../config/constants');

// Default SLA Rules (in hours) if not configured in DB
const DEFAULT_SLA_CONFIG = {
  defaultSlaHours: {
    CRITICAL: 12,
    HIGH: 24,
    MEDIUM: 48,
    LOW: 72
  },
  categoryOverrides: {
    'pothole': { CRITICAL: 24, HIGH: 72, MEDIUM: 120, LOW: 168 },
    'garbage': { CRITICAL: 12, HIGH: 24, MEDIUM: 48, LOW: 72 },
    'street-light': { CRITICAL: 24, HIGH: 48, MEDIUM: 72, LOW: 120 },
    'water-leak': { CRITICAL: 6, HIGH: 12, MEDIUM: 24, LOW: 48 },
    'drainage': { CRITICAL: 12, HIGH: 24, MEDIUM: 48, LOW: 72 },
    'traffic-signal': { CRITICAL: 6, HIGH: 12, MEDIUM: 24, LOW: 48 }
  },
  escalationLevels: [
    { level: 1, name: 'Department Supervisor', responseDeadlineHours: 12 },
    { level: 2, name: 'Municipal Administrator', responseDeadlineHours: 24 },
    { level: 3, name: 'Central Command Admin', responseDeadlineHours: 48 }
  ]
};

/**
 * Fetch or initialize SLA configuration from SystemSetting
 */
async function getSlaConfig() {
  try {
    let setting = await SystemSetting.findOne({ key: 'SLA_CONFIG' });
    if (!setting) {
      setting = await SystemSetting.create({
        key: 'SLA_CONFIG',
        value: DEFAULT_SLA_CONFIG,
        description: 'Municipal SLA deadlines and escalation level hierarchy',
        category: 'SLA'
      });
    }
    return setting.value || DEFAULT_SLA_CONFIG;
  } catch (err) {
    console.error('Error fetching SLA config, fallback to default:', err);
    return DEFAULT_SLA_CONFIG;
  }
}

/**
 * Calculate SLA duration and expected resolution timestamp for a complaint
 */
async function calculateSlaDeadline(categorySlug, priority) {
  const config = await getSlaConfig();
  const slug = (categorySlug || '').toLowerCase().trim();
  const normalizedPriority = priority || PRIORITY_LEVELS.MEDIUM;

  let slaHours = config.defaultSlaHours?.[normalizedPriority] || 24;

  if (config.categoryOverrides?.[slug] && config.categoryOverrides[slug][normalizedPriority]) {
    slaHours = config.categoryOverrides[slug][normalizedPriority];
  }

  const expectedResolutionAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  return {
    slaDuration: slaHours,
    expectedResolutionAt
  };
}

/**
 * Compute the real-time dynamic SLA status for any complaint
 */
function computeSlaStatus(complaint) {
  if (!complaint) return 'ON_TRACK';

  const isResolved = complaint.status === COMPLAINT_STATUS.RESOLVED || complaint.status === COMPLAINT_STATUS.CLOSED;

  if (isResolved) {
    if (complaint.resolvedAt && complaint.expectedResolutionAt) {
      return complaint.resolvedAt <= complaint.expectedResolutionAt ? 'RESOLVED_ON_TIME' : 'RESOLVED_LATE';
    }
    return 'RESOLVED_ON_TIME';
  }

  if (complaint.status === COMPLAINT_STATUS.REJECTED) {
    return 'RESOLVED_ON_TIME';
  }

  const deadline = complaint.expectedResolutionAt || complaint.slaDeadline;
  if (!deadline) return 'ON_TRACK';

  const now = new Date();
  const diffMs = new Date(deadline).getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'OVERDUE';
  }

  // If 6 hours or less remaining -> DUE_SOON
  if (diffMs <= 6 * 60 * 60 * 1000) {
    return 'DUE_SOON';
  }

  return 'ON_TRACK';
}

/**
 * Periodic automated worker: Detects overdue complaints and triggers breach events + notifications
 */
async function checkAndFlagOverdueComplaints() {
  try {
    const now = new Date();
    const activeOverdue = await Complaint.find({
      status: { $nin: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED, COMPLAINT_STATUS.REJECTED] },
      expectedResolutionAt: { $lt: now },
      slaStatus: { $ne: 'OVERDUE' }
    });

    if (activeOverdue.length === 0) return { updatedCount: 0 };

    for (const complaint of activeOverdue) {
      complaint.slaStatus = 'OVERDUE';
      complaint.slaBreachedAt = complaint.slaBreachedAt || now;

      // Add audit history event
      complaint.timeline.push({
        status: complaint.status,
        message: `🚨 SLA deadline exceeded. Expected resolution was ${new Date(complaint.expectedResolutionAt).toLocaleString()}. Issue is now eligible for citizen escalation.`,
        actorName: 'SLA Engine',
        actorRole: 'SYSTEM',
        actionType: 'SLA_BREACH',
        timestamp: now
      });

      await complaint.save();

      // Dispatch notification to Citizen
      if (complaint.citizen) {
        await Notification.create({
          user: complaint.citizen,
          type: 'STATUS_UPDATE',
          title: '🚨 SLA Overdue: Escalation Available',
          message: `Your complaint #${complaint.complaintId} (${complaint.categoryName}) has exceeded its resolution deadline. You can now raise an escalation to municipal authorities.`,
          complaint: complaint._id
        });
      }

      // Dispatch notification to Assigned Officer
      if (complaint.assignedOfficer) {
        await Notification.create({
          user: complaint.assignedOfficer,
          type: 'STATUS_UPDATE',
          title: '🚨 SLA Deadline Exceeded',
          message: `URGENT: Complaint #${complaint.complaintId} (${complaint.priority} Priority) is now OVERDUE. Please take immediate action or record a delay reason.`,
          complaint: complaint._id
        });
      }
    }

    console.log(`[SLA Worker] Checked & flagged ${activeOverdue.length} overdue complaints.`);
    return { updatedCount: activeOverdue.length };
  } catch (err) {
    console.error('[SLA Worker Error]:', err);
    return { error: err.message };
  }
}

module.exports = {
  DEFAULT_SLA_CONFIG,
  getSlaConfig,
  calculateSlaDeadline,
  computeSlaStatus,
  checkAndFlagOverdueComplaints
};
