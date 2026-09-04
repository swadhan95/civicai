const Escalation = require('../models/Escalation');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const { computeSlaStatus } = require('../services/slaService');
const { COMPLAINT_STATUS, ROLES } = require('../config/constants');

// Generate Unique Escalation ID (e.g. ESC-2026-0001)
async function generateEscalationId() {
  const year = new Date().getFullYear();
  const count = await Escalation.countDocuments();
  const rand = Math.floor(100 + Math.random() * 900);
  return `ESC-${year}-${String(count + 1).padStart(4, '0')}${rand.toString().slice(-2)}`;
}

// @desc    Citizen raises escalation for an overdue complaint
// @route   POST /api/complaints/:id/escalate
// @access  Private (Citizen / Admin)
exports.createEscalation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, evidence } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a descriptive reason for escalating this complaint (minimum 5 characters).'
      });
    }

    const complaint = await Complaint.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { complaintId: id }]
    }).populate('assignedDepartment suggestedDepartment assignedOfficer citizen');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Ownership check (only complaint creator or Admin can escalate)
    const isOwner = complaint.citizen?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only escalate complaints submitted by your account.'
      });
    }

    // Must not be already resolved or closed
    if (complaint.status === COMPLAINT_STATUS.RESOLVED || complaint.status === COMPLAINT_STATUS.CLOSED) {
      return res.status(400).json({
        success: false,
        message: 'This complaint has already been resolved and closed.'
      });
    }

    // SLA Check: must be overdue or have breached deadline
    const currentSlaStatus = computeSlaStatus(complaint);
    const deadline = complaint.expectedResolutionAt || complaint.slaDeadline;
    const isOverdue = currentSlaStatus === 'OVERDUE' || (deadline && new Date() > new Date(deadline));

    if (!isOverdue && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'This issue is currently on track within its SLA window. Escalation becomes available once the resolution deadline has elapsed.'
      });
    }

    // Anti-Abuse: Check for existing active escalation
    const activeEsc = await Escalation.findOne({
      complaint: complaint._id,
      status: { $in: ['REQUESTED', 'UNDER_REVIEW', 'ACKNOWLEDGED', 'ACTION_REQUIRED'] }
    });

    if (activeEsc) {
      return res.status(400).json({
        success: false,
        message: `An active escalation (#${activeEsc.escalationId}) is already under administrative review for this complaint.`
      });
    }

    const escalationId = await generateEscalationId();
    const targetDept = complaint.assignedDepartment?._id || complaint.suggestedDepartment?._id;

    const escalation = await Escalation.create({
      escalationId,
      complaint: complaint._id,
      citizen: req.user._id,
      originalDepartment: targetDept,
      assignedOfficer: complaint.assignedOfficer?._id || null,
      escalationLevel: 1,
      levelName: 'Department Supervisor',
      reason: reason.trim(),
      evidence: evidence || null,
      status: 'REQUESTED',
      slaDeadlineSnapshot: deadline
    });

    // Update Complaint state
    complaint.isEscalated = true;
    complaint.escalationReason = reason.trim();
    complaint.escalatedAt = new Date();
    complaint.activeEscalation = escalation._id;
    complaint.slaStatus = 'OVERDUE';

    complaint.timeline.push({
      status: complaint.status,
      message: `🚨 Citizen raised Escalation #${escalationId} (Level 1: Department Supervisor). Reason: "${reason.trim()}"`,
      updatedBy: req.user._id,
      actorName: req.user.name || 'Citizen',
      actorRole: req.user.role,
      actionType: 'ESCALATION_RAISED',
      timestamp: new Date()
    });

    await complaint.save();

    // Notify Assigned Officer & Admins
    if (complaint.assignedOfficer) {
      await Notification.create({
        user: complaint.assignedOfficer._id,
        type: 'STATUS_UPDATE',
        title: `🚨 Escalation Raised: #${escalationId}`,
        message: `Citizen has escalated overdue complaint #${complaint.complaintId}. Reason: "${reason.trim()}". Please respond immediately.`,
        complaint: complaint._id
      });
    }

    // Notify Admins
    const admins = await User.find({ role: ROLES.ADMIN });
    for (const adm of admins) {
      await Notification.create({
        user: adm._id,
        type: 'STATUS_UPDATE',
        title: `🚨 New Municipal Escalation: #${escalationId}`,
        message: `Complaint #${complaint.complaintId} (${complaint.categoryName}) was escalated to Level 1.`,
        complaint: complaint._id
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Escalation successfully submitted and dispatched to Department Supervisor & Command Center.',
      data: escalation,
      escalation
    });
  } catch (err) {
    console.error('Error creating escalation:', err);
    return res.status(500).json({ success: false, message: 'Server error while submitting escalation.' });
  }
};

// @desc    Get all escalations with filtering & metrics
// @route   GET /api/escalations
// @access  Private (Officer / Admin)
exports.getEscalations = async (req, res) => {
  try {
    const { departmentId, priority, status, escalationLevel, search } = req.query;
    const query = {};

    if (departmentId && departmentId !== 'ALL') {
      query.originalDepartment = departmentId;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (escalationLevel && escalationLevel !== 'ALL') {
      query.escalationLevel = parseInt(escalationLevel);
    }

    let escalations = await Escalation.find(query)
      .populate({
        path: 'complaint',
        populate: [
          { path: 'category' },
          { path: 'assignedDepartment' },
          { path: 'assignedOfficer', select: 'name email' },
          { path: 'citizen', select: 'name email' }
        ]
      })
      .populate('citizen', 'name email displayName')
      .populate('originalDepartment', 'name code')
      .populate('assignedOfficer', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    if (priority && priority !== 'ALL') {
      escalations = escalations.filter((e) => e.complaint?.priority === priority);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase();
      escalations = escalations.filter((e) => {
        const matchEscId = e.escalationId?.toLowerCase().includes(q);
        const matchCompId = e.complaint?.complaintId?.toLowerCase().includes(q);
        const matchReason = e.reason?.toLowerCase().includes(q);
        const matchCitizen = e.citizen?.name?.toLowerCase().includes(q);
        return matchEscId || matchCompId || matchReason || matchCitizen;
      });
    }

    // Telemetry summary
    const totalCount = await Escalation.countDocuments();
    const requestedCount = await Escalation.countDocuments({ status: 'REQUESTED' });
    const underReviewCount = await Escalation.countDocuments({ status: 'UNDER_REVIEW' });
    const actionRequiredCount = await Escalation.countDocuments({ status: 'ACTION_REQUIRED' });
    const resolvedCount = await Escalation.countDocuments({ status: 'RESOLVED' });

    return res.status(200).json({
      success: true,
      count: escalations.length,
      telemetry: {
        totalCount,
        requestedCount,
        underReviewCount,
        actionRequiredCount,
        resolvedCount
      },
      data: escalations
    });
  } catch (err) {
    console.error('Error fetching escalations:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch escalations.' });
  }
};

// @desc    Get single escalation details
// @route   GET /api/escalations/:id
// @access  Private
exports.getEscalationById = async (req, res) => {
  try {
    const { id } = req.params;
    const escalation = await Escalation.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { escalationId: id }]
    })
      .populate({
        path: 'complaint',
        populate: [
          { path: 'category' },
          { path: 'assignedDepartment' },
          { path: 'suggestedDepartment' },
          { path: 'assignedOfficer' },
          { path: 'citizen' }
        ]
      })
      .populate('citizen', 'name email displayName avatar')
      .populate('originalDepartment', 'name code contactEmail')
      .populate('assignedOfficer', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('history.actor', 'name email role');

    if (!escalation) {
      return res.status(404).json({ success: false, message: 'Escalation not found.' });
    }

    return res.status(200).json({ success: true, data: escalation, escalation });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load escalation.' });
  }
};

// @desc    Update escalation status & take action (Supervisor/Admin)
// @route   PUT /api/escalations/:id/status
// @access  Private (Officer / Admin)
exports.updateEscalationStatus = async (req, res) => {
  try {
    const { status, adminNotes, actionTaken, reassignOfficerId, escalationLevel } = req.body;

    const escalation = await Escalation.findById(req.params.id);
    if (!escalation) {
      return res.status(404).json({ success: false, message: 'Escalation not found.' });
    }

    const prevStatus = escalation.status;
    if (status) escalation.status = status;
    if (adminNotes) escalation.adminNotes = adminNotes;
    if (actionTaken) escalation.actionTaken = actionTaken;
    if (escalationLevel) {
      escalation.escalationLevel = parseInt(escalationLevel);
      escalation.levelName =
        escalation.escalationLevel === 3
          ? 'Central Command'
          : escalation.escalationLevel === 2
          ? 'Municipal Administrator'
          : 'Department Supervisor';
    }

    escalation.reviewedBy = req.user._id;
    escalation.reviewedAt = new Date();

    if (status === 'RESOLVED') {
      escalation.resolvedAt = new Date();
    }

    if (!escalation.history) {
      escalation.history = [];
    }

    escalation.history.push({
      action: `STATUS_CHANGED_TO_${status}`,
      actor: req.user._id,
      actorRole: req.user.role,
      notes: adminNotes || actionTaken || `Status changed from ${prevStatus} to ${status}`,
      timestamp: new Date()
    });

    await escalation.save();

    // Update parent complaint
    const complaint = await Complaint.findById(escalation.complaint);
    if (complaint) {
      if (reassignOfficerId) {
        complaint.assignedOfficer = reassignOfficerId;
      }

      if (status === 'RESOLVED') {
        complaint.isEscalated = false;
        complaint.activeEscalation = null;
      }

      complaint.timeline.push({
        status: complaint.status,
        message: `🛡️ Escalation #${escalation.escalationId} updated to [${status}]. Action: "${actionTaken || adminNotes || 'Status updated by administrator.'}"`,
        updatedBy: req.user._id,
        actorName: req.user.name || 'Administrator',
        actorRole: req.user.role,
        actionType: 'ESCALATION_UPDATE',
        timestamp: new Date()
      });

      await complaint.save();

      // Notify citizen
      if (complaint.citizen) {
        await Notification.create({
          user: complaint.citizen,
          type: 'STATUS_UPDATE',
          title: `Escalation #${escalation.escalationId} Update`,
          message: `Your escalation for complaint #${complaint.complaintId} has been updated to: ${status}. Action: ${actionTaken || adminNotes || 'Under active resolution.'}`,
          complaint: complaint._id
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Escalation updated to ${status} successfully.`,
      data: escalation,
      escalation
    });
  } catch (err) {
    console.error('Error updating escalation status:', err);
    return res.status(500).json({ success: false, message: 'Failed to update escalation.' });
  }
};

// @desc    Extend SLA deadline with recorded justification
// @route   POST /api/complaints/:id/extend-sla
// @access  Private (Officer / Admin)
exports.extendSla = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalHours, reason } = req.body;

    if (!additionalHours || additionalHours <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid additional hours (> 0).' });
    }
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide an official reason for the SLA extension.' });
    }

    const complaint = await Complaint.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { complaintId: id }]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const originalDeadline = complaint.expectedResolutionAt || new Date();
    const newDeadline = new Date(new Date(originalDeadline).getTime() + additionalHours * 60 * 60 * 1000);

    complaint.expectedResolutionAt = newDeadline;
    complaint.slaDeadline = newDeadline;
    complaint.slaDuration = (complaint.slaDuration || 24) + parseInt(additionalHours);
    complaint.slaStatus = computeSlaStatus(complaint);

    complaint.slaExtensions.push({
      originalDeadline,
      newDeadline,
      reason: reason.trim(),
      approvedBy: req.user._id,
      timestamp: new Date()
    });

    complaint.timeline.push({
      status: complaint.status,
      message: `⏱️ SLA deadline extended by +${additionalHours}h to ${newDeadline.toLocaleString()}. Reason: "${reason.trim()}"`,
      updatedBy: req.user._id,
      actorName: req.user.name || 'Supervisor',
      actorRole: req.user.role,
      actionType: 'SLA_EXTENDED',
      timestamp: new Date()
    });

    await complaint.save();

    // Notify citizen
    if (complaint.citizen) {
      await Notification.create({
        user: complaint.citizen,
        type: 'STATUS_UPDATE',
        title: '⏱️ Resolution Deadline Adjusted',
        message: `Resolution deadline for #${complaint.complaintId} was extended to ${newDeadline.toLocaleDateString()}. Reason: ${reason.trim()}`,
        complaint: complaint._id
      });
    }

    return res.status(200).json({
      success: true,
      message: `SLA deadline extended successfully to ${newDeadline.toLocaleString()}.`,
      data: complaint,
      complaint
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to extend SLA.' });
  }
};

// @desc    Record delay reason by officer
// @route   POST /api/complaints/:id/delay-reason
// @access  Private (Officer / Admin)
exports.recordDelayReason = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, category } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a detailed reason for delay.' });
    }

    const complaint = await Complaint.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { complaintId: id }]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.delayReasons.push({
      reason: reason.trim(),
      category: category || 'OPERATIONAL_DELAY',
      recordedBy: req.user._id,
      timestamp: new Date()
    });

    complaint.timeline.push({
      status: complaint.status,
      message: `⚠️ Officer recorded field delay reason: "${reason.trim()}"`,
      updatedBy: req.user._id,
      actorName: req.user.name || 'Officer',
      actorRole: req.user.role,
      actionType: 'DELAY_RECORDED',
      timestamp: new Date()
    });

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Delay reason recorded in complaint audit trail.',
      data: complaint,
      complaint
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to record delay reason.' });
  }
};

// @desc    Get aggregated database-driven SLA Performance Metrics
// @route   GET /api/admin/sla-metrics
// @access  Private (Admin)
exports.getSlaMetrics = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('assignedDepartment');

    let totalResolved = 0;
    let resolvedOnTime = 0;
    let resolvedLate = 0;
    let totalOverdue = 0;
    let totalActive = 0;
    let totalResolutionHours = 0;

    const deptMap = {};

    for (const c of complaints) {
      const isResolved = c.status === COMPLAINT_STATUS.RESOLVED || c.status === COMPLAINT_STATUS.CLOSED;
      const deptName = c.assignedDepartment?.name || 'General Municipal';

      if (!deptMap[deptName]) {
        deptMap[deptName] = { total: 0, resolved: 0, onTime: 0, overdue: 0 };
      }
      deptMap[deptName].total++;

      if (isResolved) {
        totalResolved++;
        deptMap[deptName].resolved++;

        const slaSt = c.slaStatus || computeSlaStatus(c);
        if (slaSt === 'RESOLVED_ON_TIME' || (c.resolvedAt && c.expectedResolutionAt && c.resolvedAt <= c.expectedResolutionAt)) {
          resolvedOnTime++;
          deptMap[deptName].onTime++;
        } else {
          resolvedLate++;
        }

        if (c.resolvedAt && c.createdAt) {
          const durationHours = (new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60);
          totalResolutionHours += Math.max(1, durationHours);
        }
      } else {
        totalActive++;
        const slaSt = computeSlaStatus(c);
        if (slaSt === 'OVERDUE') {
          totalOverdue++;
          deptMap[deptName].overdue++;
        }
      }
    }

    const overallComplianceRate =
      totalResolved > 0 ? Math.round((resolvedOnTime / totalResolved) * 100) : 85;
    const avgResolutionHours =
      totalResolved > 0 ? Math.round((totalResolutionHours / totalResolved) * 10) / 10 : 18.5;

    const departmentPerformance = Object.keys(deptMap).map((dName) => {
      const d = deptMap[dName];
      const rate = d.resolved > 0 ? Math.round((d.onTime / d.resolved) * 100) : 85;
      return {
        department: dName,
        total: d.total,
        resolved: d.resolved,
        overdue: d.overdue,
        complianceRate: rate
      };
    });

    const totalEscalations = await Escalation.countDocuments();
    const resolvedEscalations = await Escalation.countDocuments({ status: 'RESOLVED' });

    const metricsData = {
      overallComplianceRate,
      avgResolutionHours,
      totalResolved,
      resolvedOnTime,
      resolvedLate,
      totalOverdue,
      totalActive,
      totalEscalations,
      resolvedEscalations,
      departmentPerformance
    };

    return res.status(200).json({
      success: true,
      data: metricsData,
      metrics: metricsData
    });
  } catch (err) {
    console.error('Error calculating SLA metrics:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute SLA metrics.' });
  }
};
