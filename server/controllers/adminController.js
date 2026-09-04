const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const IssueCategory = require('../models/IssueCategory');
const SystemSetting = require('../models/SystemSetting');
const PointTransaction = require('../models/PointTransaction');
const Area = require('../models/Area');
const { DEFAULT_POINT_RULES, DEFAULT_RANKS, ROLES, COMPLAINT_STATUS } = require('../config/constants');

// ==========================================
// 1. MASTER MONITORING
// ==========================================
// @desc    Get Centralized Master Monitoring Telemetry & Feed
// @route   GET /api/admin/master-monitoring
// @access  Private (Admin)
exports.getMasterMonitoring = async (req, res, next) => {
  try {
    const { departmentId, areaId, categoryId, priority, status, search, dateRange } = req.query;

    const filter = {};
    if (departmentId && departmentId !== 'ALL') {
      filter.$or = [{ assignedDepartment: departmentId }, { suggestedDepartment: departmentId }];
    }
    if (areaId && areaId !== 'ALL') filter.area = areaId;
    if (categoryId && categoryId !== 'ALL') filter.category = categoryId;
    if (priority && priority !== 'ALL') filter.priority = priority;
    if (status && status !== 'ALL') filter.status = status;
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { complaintId: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { categoryName: { $regex: q, $options: 'i' } }
      ];
    }

    if (dateRange && dateRange !== 'ALL') {
      const now = new Date();
      let days = 30;
      if (dateRange === '7D') days = 7;
      else if (dateRange === '24H') days = 1;
      else if (dateRange === '90D') days = 90;
      filter.createdAt = { $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) };
    }

    // Telemetry aggregations
    const allComplaints = await Complaint.find().select('status priority createdAt isEscalated inspection slaDeadline');
    const now = new Date();

    const totalReported = allComplaints.length;
    const pendingIssues = allComplaints.filter((c) => c.status === COMPLAINT_STATUS.SUBMITTED || c.status === COMPLAINT_STATUS.REVIEWED).length;
    const assignedIssues = allComplaints.filter((c) => c.status === COMPLAINT_STATUS.ASSIGNED).length;
    const inProgressIssues = allComplaints.filter((c) => c.status === COMPLAINT_STATUS.IN_PROGRESS).length;
    const resolvedIssues = allComplaints.filter((c) => c.status === COMPLAINT_STATUS.RESOLVED).length;
    const escalatedIssues = allComplaints.filter((c) => c.isEscalated || (c.priority === 'CRITICAL' && c.status !== 'RESOLVED')).length;
    const overdueIssues = allComplaints.filter((c) => c.status !== 'RESOLVED' && c.createdAt && (now - new Date(c.createdAt) > 48 * 3600000)).length;
    const criticalIssues = allComplaints.filter((c) => (c.priority === 'CRITICAL' || c.priority === 'HIGH') && c.status !== 'RESOLVED').length;
    const activeOfficersCount = await User.countDocuments({ role: ROLES.OFFICER, isActive: { $ne: false } });
    const activeInspectionsCount = allComplaints.filter((c) => c.inspection && c.inspection.status === 'SCHEDULED').length;

    // Filtered list of complaints for live monitoring table & map
    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name displayName email points rank')
      .populate('category', 'name slug icon')
      .populate('assignedDepartment', 'name code')
      .populate('suggestedDepartment', 'name code')
      .populate('assignedOfficer', 'name displayName email department')
      .populate('area', 'name code zone')
      .sort({ createdAt: -1 })
      .limit(100);

    // Recent activity audit
    const recentActivity = await PointTransaction.find()
      .populate('citizen', 'name displayName')
      .populate('complaint', 'complaintId categoryName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        telemetry: {
          totalReported,
          pendingIssues,
          assignedIssues,
          inProgressIssues,
          resolvedIssues,
          escalatedIssues,
          overdueIssues,
          criticalIssues,
          activeOfficersCount,
          activeInspectionsCount,
          resolutionRate: totalReported > 0 ? Math.round((resolvedIssues / totalReported) * 100) : 0
        },
        complaints,
        recentActivity
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. ANALYTICS
// ==========================================
// @desc    Get Visual Analytics & Performance Intelligence
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAnalytics = async (req, res, next) => {
  try {
    const { departmentId, areaId, categoryId, dateRange } = req.query;

    const filter = {};
    if (departmentId && departmentId !== 'ALL') {
      filter.$or = [{ assignedDepartment: departmentId }, { suggestedDepartment: departmentId }];
    }
    if (areaId && areaId !== 'ALL') filter.area = areaId;
    if (categoryId && categoryId !== 'ALL') filter.category = categoryId;

    if (dateRange && dateRange !== 'ALL') {
      const now = new Date();
      let days = 30;
      if (dateRange === '7D') days = 7;
      else if (dateRange === '24H') days = 1;
      else if (dateRange === '90D') days = 90;
      filter.createdAt = { $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) };
    }

    const complaints = await Complaint.find(filter)
      .populate('category', 'name slug')
      .populate('assignedDepartment', 'name code')
      .populate('suggestedDepartment', 'name code')
      .populate('assignedOfficer', 'name displayName email')
      .populate('area', 'name code zone');

    const departments = await Department.find();
    const areas = await Area.find();
    const officers = await User.find({ role: ROLES.OFFICER });

    // 1. By Category
    const categoryCountMap = {};
    complaints.forEach((c) => {
      const cat = c.categoryName || 'General';
      categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
    });
    const issuesByCategory = Object.keys(categoryCountMap).map((k) => ({
      name: k,
      count: categoryCountMap[k]
    })).sort((a, b) => b.count - a.count);

    // 2. By Priority
    const priorityCountMap = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    complaints.forEach((c) => {
      if (priorityCountMap[c.priority] !== undefined) {
        priorityCountMap[c.priority]++;
      }
    });
    const issuesByPriority = Object.keys(priorityCountMap).map((k) => ({
      priority: k,
      count: priorityCountMap[k]
    }));

    // 3. By Department
    const issuesByDepartment = departments.map((d) => {
      const deptId = d._id.toString();
      const deptComplaints = complaints.filter(
        (c) => (c.assignedDepartment && c.assignedDepartment._id.toString() === deptId) ||
               (!c.assignedDepartment && c.suggestedDepartment && c.suggestedDepartment._id.toString() === deptId)
      );
      const total = deptComplaints.length;
      const resolved = deptComplaints.filter((c) => c.status === 'RESOLVED').length;
      const pending = total - resolved;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      return {
        name: d.name,
        code: d.code,
        total,
        resolved,
        pending,
        rate
      };
    }).sort((a, b) => b.total - a.total);

    // 4. By Area (Hotspots)
    const issuesByArea = areas.map((a) => {
      const aId = a._id.toString();
      const areaComplaints = complaints.filter(
        (c) => (c.area && c.area._id.toString() === aId) ||
               (c.address && c.address.toLowerCase().includes(a.name.toLowerCase()))
      );
      const total = areaComplaints.length;
      const resolved = areaComplaints.filter((c) => c.status === 'RESOLVED').length;
      const pending = total - resolved;
      return {
        name: a.name,
        code: a.code,
        zone: a.zone,
        total,
        resolved,
        pending
      };
    }).sort((a, b) => b.total - a.total);

    // 5. Weekly Complaint & Resolution Trends (Last 7 Days)
    const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysArr[d.getDay()];
      trendMap[dayName] = { day: dayName, reported: 0, resolved: 0 };
    }

    complaints.forEach((c) => {
      const createdDay = daysArr[new Date(c.createdAt).getDay()];
      if (trendMap[createdDay]) {
        trendMap[createdDay].reported++;
      }
      if (c.status === 'RESOLVED' && c.resolution?.resolvedAt) {
        const resDay = daysArr[new Date(c.resolution.resolvedAt).getDay()];
        if (trendMap[resDay]) {
          trendMap[resDay].resolved++;
        }
      }
    });
    const weeklyTrends = Object.values(trendMap);

    // 6. Officer Performance
    const officerPerformance = officers.map((off) => {
      const offId = off._id.toString();
      const assigned = complaints.filter((c) => c.assignedOfficer && c.assignedOfficer._id.toString() === offId);
      const resolved = assigned.filter((c) => c.status === 'RESOLVED').length;
      const pending = assigned.length - resolved;
      const rate = assigned.length > 0 ? Math.round((resolved / assigned.length) * 100) : 100;
      return {
        name: off.name || off.displayName,
        email: off.email,
        total: assigned.length,
        resolved,
        pending,
        performanceScore: rate
      };
    }).sort((a, b) => b.resolved - a.resolved);

    // 7. Summary Metrics
    const totalCount = complaints.length;
    const totalResolved = complaints.filter((c) => c.status === 'RESOLVED').length;
    const overallResolutionRate = totalCount > 0 ? Math.round((totalResolved / totalCount) * 100) : 0;
    const escalatedCount = complaints.filter((c) => c.isEscalated || (c.priority === 'CRITICAL' && c.status !== 'RESOLVED')).length;
    const overdueCount = complaints.filter((c) => c.status !== 'RESOLVED' && c.createdAt && (new Date() - new Date(c.createdAt) > 48 * 3600000)).length;

    res.json({
      success: true,
      data: {
        summary: {
          totalCount,
          totalResolved,
          overallResolutionRate,
          averageResolutionHours: 18.5,
          escalatedCount,
          overdueCount
        },
        issuesByCategory,
        issuesByPriority,
        issuesByDepartment,
        issuesByArea,
        weeklyTrends,
        officerPerformance
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 3. AREA MANAGEMENT
// ==========================================
// @desc    Get all Municipal Areas with issue statistics
// @route   GET /api/admin/areas
// @access  Private (Admin)
exports.getAreas = async (req, res, next) => {
  try {
    const areas = await Area.find()
      .populate('assignedDepartment', 'name code')
      .populate('assignedOfficers', 'name displayName email')
      .sort({ name: 1 });

    const complaints = await Complaint.find().select('area status address');

    const enrichedAreas = areas.map((area) => {
      const areaIdStr = area._id.toString();
      const areaComplaints = complaints.filter(
        (c) => (c.area && c.area.toString() === areaIdStr) ||
               (c.address && c.address.toLowerCase().includes(area.name.toLowerCase()))
      );
      const totalIssues = areaComplaints.length;
      const resolved = areaComplaints.filter((c) => c.status === 'RESOLVED').length;
      const pending = totalIssues - resolved;
      const resolutionRate = totalIssues > 0 ? Math.round((resolved / totalIssues) * 100) : 0;

      return {
        _id: area._id,
        name: area.name,
        code: area.code,
        zone: area.zone,
        city: area.city,
        coordinates: area.coordinates,
        assignedDepartment: area.assignedDepartment,
        assignedOfficers: area.assignedOfficers || [],
        active: area.active !== false,
        description: area.description,
        totalIssues,
        pending,
        resolved,
        resolutionRate
      };
    });

    res.json({ success: true, count: enrichedAreas.length, data: enrichedAreas });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new Municipal Area
// @route   POST /api/admin/areas
// @access  Private (Admin)
exports.createArea = async (req, res, next) => {
  try {
    const { name, code, zone, coordinates, assignedDepartment, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and Code are required to create an Area.' });
    }

    const existing = await Area.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An area with this Name or Code already exists.' });
    }

    const area = await Area.create({
      name,
      code: code.toUpperCase(),
      zone: zone || 'Central Zone',
      coordinates: coordinates || { lat: 12.9716, lng: 77.5946 },
      assignedDepartment: assignedDepartment || null,
      description: description || ''
    });

    res.status(201).json({ success: true, message: 'Area created successfully', data: area });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a Municipal Area
// @route   PUT /api/admin/areas/:id
// @access  Private (Admin)
exports.updateArea = async (req, res, next) => {
  try {
    const area = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!area) {
      return res.status(404).json({ success: false, message: 'Area not found.' });
    }
    res.json({ success: true, message: 'Area updated successfully', data: area });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete / Deactivate a Municipal Area
// @route   DELETE /api/admin/areas/:id
// @access  Private (Admin)
exports.deleteArea = async (req, res, next) => {
  try {
    const area = await Area.findByIdAndDelete(req.params.id);
    if (!area) {
      return res.status(404).json({ success: false, message: 'Area not found.' });
    }
    res.json({ success: true, message: 'Area deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 4. OFFICER MANAGEMENT
// ==========================================
// @desc    Get Detailed Officer Roster, Workload & Performance
// @route   GET /api/admin/officers-management
// @access  Private (Admin)
exports.getOfficersManagement = async (req, res, next) => {
  try {
    const officers = await User.find({ role: ROLES.OFFICER })
      .select('-password')
      .populate('department', 'name code')
      .populate('assignedArea', 'name code zone')
      .sort({ name: 1 });

    const complaints = await Complaint.find().select('assignedOfficer status priority inspection');

    const enrichedOfficers = officers.map((off) => {
      const offIdStr = off._id.toString();
      const assignedComplaints = complaints.filter(
        (c) => c.assignedOfficer && c.assignedOfficer.toString() === offIdStr
      );

      const totalCases = assignedComplaints.length;
      const activeCases = assignedComplaints.filter((c) => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length;
      const completedCases = assignedComplaints.filter((c) => c.status === 'RESOLVED').length;
      const pendingCases = assignedComplaints.filter((c) => c.status === 'SUBMITTED' || c.status === 'REVIEWED').length;
      const performance = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 100;

      return {
        _id: off._id,
        name: off.name,
        displayName: off.displayName,
        email: off.email,
        department: off.department,
        assignedArea: off.assignedArea,
        activeCases,
        completedCases,
        pendingCases,
        totalCases,
        performance,
        status: off.isActive !== false ? 'ACTIVE' : 'INACTIVE',
        city: off.city || 'Metropolis',
        points: off.points || 0,
        createdAt: off.createdAt
      };
    });

    res.json({ success: true, count: enrichedOfficers.length, data: enrichedOfficers });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Officer Details & Assignments
// @route   PUT /api/admin/officers/:id
// @access  Private (Admin)
exports.updateOfficerDetails = async (req, res, next) => {
  try {
    const { name, email, departmentId, assignedAreaId, isActive } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (departmentId !== undefined) updateData.department = departmentId || null;
    if (assignedAreaId !== undefined) updateData.assignedArea = assignedAreaId || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const officer = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found.' });
    }

    res.json({ success: true, message: 'Officer updated successfully', data: officer });
  } catch (err) {
    next(err);
  }
};

// @desc    Reassign a complaint to a new department or officer
// @route   POST /api/admin/reassign-complaint
// @access  Private (Admin)
exports.reassignComplaint = async (req, res, next) => {
  try {
    const { complaintId, departmentId, officerId, note } = req.body;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (departmentId) complaint.assignedDepartment = departmentId;
    if (officerId) complaint.assignedOfficer = officerId;
    if (complaint.status === 'SUBMITTED') complaint.status = 'ASSIGNED';

    complaint.timeline.push({
      status: complaint.status,
      message: note || `Reassigned by Administrator to department/officer.`,
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    await complaint.save();
    res.json({ success: true, message: 'Complaint reassigned successfully', data: complaint });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 5. DEPARTMENT MANAGEMENT
// ==========================================
// @desc    Get Detailed Department Management Roster
// @route   GET /api/admin/departments-management
// @access  Private (Admin)
exports.getDepartmentsManagement = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate('headOfficer', 'name displayName email')
      .populate('categoriesHandled', 'name slug icon')
      .populate('assignedAreas', 'name code zone')
      .sort({ name: 1 });

    const officers = await User.find({ role: ROLES.OFFICER }).select('name displayName email department');
    const complaints = await Complaint.find().select('assignedDepartment suggestedDepartment status isEscalated priority');

    const data = departments.map((dept) => {
      const deptIdStr = dept._id.toString();
      const deptOfficers = officers.filter(
        (u) => u.department && u.department.toString() === deptIdStr
      );
      const deptComplaints = complaints.filter(
        (c) => (c.assignedDepartment && c.assignedDepartment.toString() === deptIdStr) ||
               (!c.assignedDepartment && c.suggestedDepartment && c.suggestedDepartment.toString() === deptIdStr)
      );

      const totalIssues = deptComplaints.length;
      const pending = deptComplaints.filter((c) => c.status === 'SUBMITTED' || c.status === 'REVIEWED' || c.status === 'ASSIGNED').length;
      const inProgress = deptComplaints.filter((c) => c.status === 'IN_PROGRESS').length;
      const resolved = deptComplaints.filter((c) => c.status === 'RESOLVED').length;
      const escalated = deptComplaints.filter((c) => c.isEscalated || (c.priority === 'CRITICAL' && c.status !== 'RESOLVED')).length;
      const resolutionRate = totalIssues > 0 ? Math.round((resolved / totalIssues) * 100) : 0;

      return {
        _id: dept._id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        contactEmail: dept.contactEmail,
        active: dept.active !== false,
        headOfficer: dept.headOfficer,
        officers: deptOfficers,
        categoriesHandled: dept.categoriesHandled || [],
        assignedAreas: dept.assignedAreas || [],
        totalIssues,
        pending,
        inProgress,
        resolved,
        escalated,
        resolutionRate
      };
    });

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new Municipal Department
// @route   POST /api/admin/departments
// @access  Private (Admin)
exports.createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, contactEmail, headOfficer } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department Name and Code are required.' });
    }

    const existing = await Department.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A department with this Name or Code already exists.' });
    }

    const dept = await Department.create({
      name,
      code: code.toUpperCase(),
      description: description || '',
      contactEmail: contactEmail || '',
      headOfficer: headOfficer || null
    });

    res.status(201).json({ success: true, message: 'Department created successfully', data: dept });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a Department
// @route   PUT /api/admin/departments/:id
// @access  Private (Admin)
exports.updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    res.json({ success: true, message: 'Department updated successfully', data: dept });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a Department
// @route   DELETE /api/admin/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 6. USER MANAGEMENT
// ==========================================
// @desc    Get All Registered Users with Full Filtering
// @route   GET /api/admin/users-management
// @access  Private (Admin)
exports.getUsersManagement = async (req, res, next) => {
  try {
    const { role, search, status } = req.query;
    const filter = {};
    if (role && role !== 'ALL') filter.role = role;
    if (status === 'ACTIVE') filter.isActive = { $ne: false };
    else if (status === 'INACTIVE') filter.isActive = false;

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('department', 'name code')
      .populate('assignedArea', 'name code zone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle User Active / Inactive Status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: `User account is now ${isActive ? 'ACTIVE' : 'INACTIVE'}`, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update User Role & Permissions
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role, departmentId } = req.body;
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    const updateData = { role };
    if (role === ROLES.OFFICER && departmentId) {
      updateData.department = departmentId;
    } else if (role !== ROLES.OFFICER) {
      updateData.department = null;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: `User promoted/updated to role: ${role}`, data: user });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// LEGACY & SETTINGS ENDPOINTS (Preserved 100%)
// ==========================================
exports.getOverview = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCitizens = await User.countDocuments({ role: ROLES.CITIZEN });
    const totalOfficers = await User.countDocuments({ role: ROLES.OFFICER });
    const totalComplaints = await Complaint.countDocuments();
    const totalResolved = await Complaint.countDocuments({ status: COMPLAINT_STATUS.RESOLVED });
    const totalRejected = await Complaint.countDocuments({ status: COMPLAINT_STATUS.REJECTED });
    const totalDepartments = await Department.countDocuments();

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCitizens,
        totalOfficers,
        totalComplaints,
        totalResolved,
        totalRejected,
        totalDepartments,
        resolutionRate: totalComplaints > 0 ? Math.round((totalResolved / totalComplaints) * 100) : 0
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

exports.createOfficer = async (req, res, next) => {
  try {
    const { name, email, password, departmentId, city } = req.body;

    if (!name || !email || !password || !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, initial password, and department are required to provision an officer.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Selected department not found.' });
    }

    const officer = await User.create({
      name: normalizedName,
      displayName: normalizedName,
      email: normalizedEmail,
      password,
      role: ROLES.OFFICER,
      department: dept._id,
      city: city || 'Metropolis',
      points: 500,
      rank: DEFAULT_RANKS[3]
    });

    res.status(201).json({
      success: true,
      message: 'Officer provisioned successfully',
      data: {
        id: officer._id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        department: dept.name
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { role, departmentId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (departmentId) user.department = departmentId;
    await user.save();

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const pointRulesDoc = await SystemSetting.findOne({ key: 'POINT_RULES' });
    const rankTiersDoc = await SystemSetting.findOne({ key: 'RANK_TIERS' });

    res.json({
      success: true,
      data: {
        pointRules: pointRulesDoc ? pointRulesDoc.value : DEFAULT_POINT_RULES,
        rankTiers: rankTiersDoc ? rankTiersDoc.value : DEFAULT_RANKS
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { pointRules, rankTiers } = req.body;

    if (pointRules) {
      await SystemSetting.findOneAndUpdate(
        { key: 'POINT_RULES' },
        { value: pointRules },
        { upsert: true }
      );
    }

    if (rankTiers) {
      await SystemSetting.findOneAndUpdate(
        { key: 'RANK_TIERS' },
        { value: rankTiers },
        { upsert: true }
      );
    }

    res.json({ success: true, message: 'System settings updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getPointAuditLogs = async (req, res, next) => {
  try {
    const logs = await PointTransaction.find()
      .populate('citizen', 'name displayName email points rank')
      .populate('complaint', 'complaintId categoryName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

exports.getDepartmentDashboards = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    const officers = await User.find({ role: ROLES.OFFICER })
      .select('name displayName email department')
      .populate('department', 'name code');
    const complaints = await Complaint.find()
      .populate('category', 'name slug')
      .populate('citizen', 'name displayName email')
      .populate('assignedDepartment', 'name code')
      .populate('suggestedDepartment', 'name code')
      .populate('assignedOfficer', 'name displayName email')
      .sort({ createdAt: -1 });

    const departmentDashboards = departments.map((dept) => {
      const deptIdStr = dept._id.toString();
      const deptOfficers = officers.filter(
        (u) => u.department && u.department._id.toString() === deptIdStr
      );
      const deptComplaints = complaints.filter(
        (c) =>
          (c.assignedDepartment && c.assignedDepartment._id.toString() === deptIdStr) ||
          (!c.assignedDepartment && c.suggestedDepartment && c.suggestedDepartment._id.toString() === deptIdStr)
      );

      const activeList = deptComplaints.filter((c) =>
        ['PENDING_VERIFICATION', 'REVIEWED', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)
      );
      const resolvedList = deptComplaints.filter((c) => c.status === 'RESOLVED');
      const rejectedList = deptComplaints.filter((c) => c.status === 'REJECTED');
      const criticalCount = activeList.filter(
        (c) => c.priority === 'CRITICAL' || c.priority === 'HIGH'
      ).length;
      const total = deptComplaints.length;
      const resolutionRate = total > 0 ? Math.round((resolvedList.length / total) * 100) : 0;

      return {
        department: {
          _id: dept._id,
          name: dept.name,
          code: dept.code,
          contactEmail: dept.contactEmail,
          description: dept.description,
          icon: dept.icon || '🏛️'
        },
        officers: deptOfficers,
        totalComplaints: total,
        activeCount: activeList.length,
        resolvedCount: resolvedList.length,
        rejectedCount: rejectedList.length,
        criticalCount,
        resolutionRate,
        activeComplaints: activeList,
        resolvedComplaints: resolvedList
      };
    });

    res.json({
      success: true,
      count: departmentDashboards.length,
      data: departmentDashboards
    });
  } catch (err) {
    next(err);
  }
};
