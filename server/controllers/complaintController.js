const Complaint = require('../models/Complaint');
const User = require('../models/User');
const IssueCategory = require('../models/IssueCategory');
const Department = require('../models/Department');
const MasterIssue = require('../models/MasterIssue');
const Notification = require('../models/Notification');
const Escalation = require('../models/Escalation');
const duplicateService = require('../services/duplicateDetectionService');
const priorityService = require('../services/priorityService');
const rankingService = require('../services/rankingService');
const storageService = require('../services/storageService');
const { calculateSlaDeadline, computeSlaStatus } = require('../services/slaService');
const { COMPLAINT_STATUS, PRIORITY_LEVELS } = require('../config/constants');

// Generate unique formatted Complaint ID (e.g., CIV-2026-001245)
async function generateComplaintId() {
  const year = new Date().getFullYear();
  const count = await Complaint.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CIV-${year}-${String(count + 1).padStart(4, '0')}${randomSuffix.toString().slice(-2)}`;
}

// @desc    Submit a new complaint
// @route   POST /api/complaints
// @access  Private (Citizen / Officer / Admin)
exports.createComplaint = async (req, res, next) => {
  try {
    const {
      categoryId,
      latitude,
      longitude,
      address,
      description,
      aiAnalysis,
      imageUrl: directImageUrl
    } = req.body;

    let imageUrl = directImageUrl;
    if (req.file) {
      imageUrl = storageService.getUrl(req, req.file.filename);
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'An issue image is required to submit a complaint.' });
    }

    if (!categoryId || !latitude || !longitude || !address || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category, location coordinates, address, and description.'
      });
    }

    const category = await IssueCategory.findById(categoryId).populate('defaultDepartment');
    if (!category) {
      return res.status(404).json({ success: false, message: 'Invalid category selected.' });
    }

    const complaintId = await generateComplaintId();

    // Priority computation
    const parsedAi = typeof aiAnalysis === 'string' ? JSON.parse(aiAnalysis) : (aiAnalysis || {});
    const calculatedPriority = priorityService.calculatePriority({
      categoryDefaultPriority: category.defaultPriority,
      aiSeverityTag: parsedAi.severityTag,
      description
    });

    // Dynamic SLA computation based on category slug & priority
    const { slaDuration, expectedResolutionAt } = await calculateSlaDeadline(category.slug, calculatedPriority);
    const now = new Date();

    const complaint = new Complaint({
      complaintId,
      citizen: req.user._id,
      image: imageUrl,
      category: category._id,
      categoryName: category.name,
      aiAnalysis: {
        detectedCategory: parsedAi.detectedCategory || category.name,
        confidence: parsedAi.confidence || 90,
        severityTag: parsedAi.severityTag || 'Standard Issue',
        isConfirmedByUser: true,
        rawOutput: parsedAi
      },
      priority: calculatedPriority,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address,
      description,
      suggestedDepartment: category.defaultDepartment._id,
      assignedDepartment: category.defaultDepartment._id,
      status: COMPLAINT_STATUS.SUBMITTED,

      // SLA Timestamps
      reportedAt: now,
      expectedResolutionAt,
      slaDeadline: expectedResolutionAt,
      slaDuration,
      slaStatus: 'ON_TRACK',

      timeline: [
        {
          status: COMPLAINT_STATUS.SUBMITTED,
          message: `Complaint submitted by citizen. Assigned SLA: ${slaDuration}h (Resolution expected by ${expectedResolutionAt.toLocaleDateString()} ${expectedResolutionAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`,
          updatedBy: req.user._id,
          actorName: req.user.name || 'Citizen',
          actorRole: req.user.role,
          actionType: 'SUBMISSION',
          timestamp: now
        }
      ]
    });

    await complaint.save();

    // Duplicate Detection & Clustering
    const duplicateResult = await duplicateService.processDuplicate(complaint);

    // Initial Quality Check & Base Points
    let pointsResult = null;
    if (!duplicateResult.isDuplicate) {
      pointsResult = await rankingService.awardPoints({
        userId: req.user._id,
        complaintId: complaint._id,
        actionType: 'VALID_ISSUE_ACCEPTED',
        customDescription: `New verified civic issue reported (${complaint.complaintId})`
      });
      complaint.pointsAwarded = pointsResult.pointsAwarded;
      await complaint.save();
    } else {
      await rankingService.awardPoints({
        userId: req.user._id,
        complaintId: complaint._id,
        actionType: 'DUPLICATE_REPORT',
        customDescription: `Corroborating report linked to Master Issue (${complaint.complaintId})`
      });
    }

    // Update user's report counter
    await User.findByIdAndUpdate(req.user._id, { $inc: { reportsCount: 1 } });

    // Send confirmation notification to citizen
    await Notification.create({
      recipient: req.user._id,
      user: req.user._id,
      title: 'Complaint Submitted Successfully',
      message: `Your complaint #${complaintId} (${category.name}) was registered. SLA Target: ${slaDuration} hours.`,
      type: 'STATUS_UPDATE',
      complaint: complaint._id
    });

    res.status(201).json({
      success: true,
      message: 'Complaint successfully registered with assigned SLA deadline',
      complaint,
      duplicateInfo: duplicateResult,
      pointsAwarded: pointsResult ? pointsResult.pointsAwarded : 0
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get nearby complaints for pre-submission duplicate detection
// @route   GET /api/complaints/nearby
// @access  Public
exports.getNearbyComplaints = async (req, res, next) => {
  try {
    const { lat, lon, categoryId, radius } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
    }

    const nearby = await duplicateService.findNearbyIssues(
      parseFloat(lat),
      parseFloat(lon),
      categoryId || null,
      radius ? parseInt(radius) : 75
    );

    res.json({ success: true, count: nearby.length, data: nearby });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all complaints with filters, search, and pagination
// @route   GET /api/complaints
// @access  Public / Private
exports.getComplaints = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      category,
      department,
      citizen,
      slaStatus,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (department) filter.assignedDepartment = department;
    if (citizen) filter.citizen = citizen;
    if (slaStatus) filter.slaStatus = slaStatus;

    if (search) {
      filter.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { categoryName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name displayName avatar points rank')
      .populate('category', 'name slug icon')
      .populate('suggestedDepartment', 'name code')
      .populate('assignedDepartment', 'name code')
      .populate('assignedOfficer', 'name displayName email')
      .populate('masterIssue', 'masterId citizenReportCount')
      .populate('activeEscalation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Refresh dynamic SLA status on each returned item
    const refreshed = complaints.map((c) => {
      const obj = c.toObject();
      obj.slaStatus = computeSlaStatus(c);
      return obj;
    });

    const total = await Complaint.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: refreshed
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single complaint by ID or complaintId string
// @route   GET /api/complaints/:id
// @access  Public / Private
exports.getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let complaint;

    if (id.startsWith('CIV-')) {
      complaint = await Complaint.findOne({ complaintId: id });
    } else {
      complaint = await Complaint.findById(id);
    }

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    await complaint.populate([
      { path: 'citizen', select: 'name displayName avatar points rank email' },
      { path: 'category', select: 'name slug icon defaultPriority' },
      { path: 'suggestedDepartment', select: 'name code contactEmail' },
      { path: 'assignedDepartment', select: 'name code contactEmail' },
      { path: 'assignedOfficer', select: 'name displayName email' },
      { path: 'masterIssue', select: 'masterId citizenReportCount relatedComplaints' },
      { path: 'activeEscalation' },
      { path: 'timeline.updatedBy', select: 'name displayName role' },
      { path: 'officerNotes.author', select: 'name displayName role' },
      { path: 'slaExtensions.approvedBy', select: 'name displayName role' },
      { path: 'delayReasons.recordedBy', select: 'name displayName role' }
    ]);

    const compObj = complaint.toObject();
    compObj.slaStatus = computeSlaStatus(complaint);

    res.json({ success: true, data: compObj });
  } catch (err) {
    next(err);
  }
};

// @desc    Update complaint status (Officer / Admin workflow)
// @route   PATCH /api/complaints/:id/status
// @access  Private (Officer / Admin)
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, message, departmentId, officerId, priority } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const prevStatus = complaint.status;
    const now = new Date();

    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (departmentId) complaint.assignedDepartment = departmentId;
    if (officerId) {
      complaint.assignedOfficer = officerId;
      if (!complaint.assignedAt) complaint.assignedAt = now;
    }

    if (status === COMPLAINT_STATUS.REVIEWED && !complaint.reviewedAt) {
      complaint.reviewedAt = now;
    }
    if (status === COMPLAINT_STATUS.ASSIGNED && !complaint.assignedAt) {
      complaint.assignedAt = now;
    }
    if (status === COMPLAINT_STATUS.IN_PROGRESS && !complaint.inProgressAt) {
      complaint.inProgressAt = now;
    }

    complaint.slaStatus = computeSlaStatus(complaint);

    const timelineMsg = message || `Status updated from ${prevStatus} to ${status} by ${req.user.name}.`;

    complaint.timeline.push({
      status: complaint.status,
      message: timelineMsg,
      updatedBy: req.user._id,
      actorName: req.user.name || 'Officer',
      actorRole: req.user.role,
      actionType: 'STATUS_CHANGE',
      timestamp: now
    });

    await complaint.save();

    // Reward points upon Officer Confirmation
    if (prevStatus === COMPLAINT_STATUS.SUBMITTED && (status === COMPLAINT_STATUS.REVIEWED || status === COMPLAINT_STATUS.ASSIGNED || status === COMPLAINT_STATUS.IN_PROGRESS)) {
      if (!complaint.isDuplicate) {
        await rankingService.awardPoints({
          userId: complaint.citizen,
          complaintId: complaint._id,
          actionType: 'OFFICER_CONFIRMED',
          customDescription: `Issue verified & confirmed by municipal officer (${complaint.complaintId})`
        });
      }
    }

    // Penalty if rejected as spam
    if (status === COMPLAINT_STATUS.REJECTED && prevStatus !== COMPLAINT_STATUS.REJECTED) {
      await rankingService.awardPoints({
        userId: complaint.citizen,
        complaintId: complaint._id,
        actionType: 'REJECTED_SPAM',
        customDescription: `Complaint rejected as invalid or spam (${complaint.complaintId})`
      });
    }

    // Notify citizen
    await Notification.create({
      recipient: complaint.citizen,
      user: complaint.citizen,
      title: `Complaint Status: ${status.replace('_', ' ')}`,
      message: `Your complaint #${complaint.complaintId} is now ${status.replace('_', ' ')}. ${timelineMsg}`,
      type: 'STATUS_UPDATE',
      complaint: complaint._id
    });

    res.json({
      success: true,
      message: 'Complaint status updated successfully',
      data: complaint
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Resolve complaint with resolution AFTER photo & AI verification
// @route   POST /api/complaints/:id/resolve
// @access  Private (Officer / Admin)
exports.resolveComplaint = async (req, res, next) => {
  try {
    const { notes, verifiedByAI, aiConfidence, afterImageUrl: directAfterUrl } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    let afterImageUrl = directAfterUrl;
    if (req.file) {
      afterImageUrl = storageService.getUrl(req, req.file.filename);
    }

    if (!afterImageUrl) {
      return res.status(400).json({ success: false, message: 'A resolution (AFTER) image is required to resolve this complaint.' });
    }

    const now = new Date();
    complaint.status = COMPLAINT_STATUS.RESOLVED;
    complaint.resolvedAt = now;
    complaint.closedAt = now;

    // Check SLA performance: on time or late
    const isLate = complaint.expectedResolutionAt && now > new Date(complaint.expectedResolutionAt);
    complaint.slaStatus = isLate ? 'RESOLVED_LATE' : 'RESOLVED_ON_TIME';

    complaint.resolution = {
      imageUrl: afterImageUrl,
      afterImage: afterImageUrl,
      notes: notes || 'Repairs completed by departmental crew.',
      resolvedAt: now,
      resolvedBy: req.user._id,
      verifiedByAI: verifiedByAI === 'true' || verifiedByAI === true,
      aiConfidence: aiConfidence ? parseFloat(aiConfidence) : 95
    };

    complaint.timeline.push({
      status: COMPLAINT_STATUS.RESOLVED,
      message: `Issue resolved and inspected by ${req.user.name}. Resolution photo attached. (Resolution: ${complaint.slaStatus.replace(/_/g, ' ')})`,
      updatedBy: req.user._id,
      actorName: req.user.name || 'Officer',
      actorRole: req.user.role,
      actionType: 'RESOLVED',
      timestamp: now
    });

    // If there is an active escalation, resolve it
    if (complaint.activeEscalation) {
      await Escalation.findByIdAndUpdate(complaint.activeEscalation, {
        status: 'RESOLVED',
        resolvedAt: now,
        actionTaken: `Resolved by ${req.user.name}. Remarks: ${notes || 'Issue repaired'}`
      });
      complaint.isEscalated = false;
      complaint.activeEscalation = null;
    }

    await complaint.save();

    // If linked to MasterIssue, also update MasterIssue status
    if (complaint.masterIssue) {
      await MasterIssue.findByIdAndUpdate(complaint.masterIssue, {
        status: COMPLAINT_STATUS.RESOLVED
      });
    }

    // Award +40 points to citizen for successfully resolved issue
    const pointResult = await rankingService.awardPoints({
      userId: complaint.citizen,
      complaintId: complaint._id,
      actionType: 'RESOLVED',
      customDescription: `Issue successfully resolved and verified (${complaint.complaintId})`
    });

    // Notify citizen
    await Notification.create({
      recipient: complaint.citizen,
      user: complaint.citizen,
      title: 'Issue Resolved! 🎉',
      message: `Your complaint #${complaint.complaintId} has been resolved! You earned +40 Civic Points.`,
      type: 'STATUS_UPDATE',
      complaint: complaint._id
    });

    res.json({
      success: true,
      message: 'Complaint marked as resolved',
      data: complaint,
      pointsAwarded: pointResult ? pointResult.pointsAwarded : 0
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add internal officer note
// @route   POST /api/complaints/:id/notes
// @access  Private (Officer / Admin)
exports.addOfficerNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note) {
      return res.status(400).json({ success: false, message: 'Note text is required.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.officerNotes.push({
      note,
      author: req.user._id,
      createdAt: new Date()
    });

    await complaint.save();

    res.json({ success: true, message: 'Note added', notes: complaint.officerNotes });
  } catch (err) {
    next(err);
  }
};
