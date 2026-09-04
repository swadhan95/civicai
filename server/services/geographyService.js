/**
 * CivicAI Geographic Intelligence & Aggregation Service
 * Provides recursive administrative hierarchy aggregation, dynamic problem statistics,
 * cross-tabulation matrices, and spatial alert level computation.
 */
const mongoose = require('mongoose');
const Area = require('../models/Area');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const IssueCategory = require('../models/IssueCategory');
const { COMPLAINT_STATUS } = require('../config/constants');

// Non-active statuses according to municipal business rules
const INACTIVE_STATUSES = [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED, COMPLAINT_STATUS.REJECTED];

/**
 * Compute alert level based on active problem count and configurable thresholds
 */
function computeAlertLevel(activeCount, thresholds = {}) {
  const normalMax = thresholds.normalMax ?? 4;
  const watchMax = thresholds.watchMax ?? 9;
  const highAlertMax = thresholds.highAlertMax ?? 19;

  if (activeCount <= normalMax) {
    return { level: 'NORMAL', label: 'Normal', color: '#10b981', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (activeCount <= watchMax) {
    return { level: 'WATCH', label: 'Watch', color: '#f59e0b', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (activeCount <= highAlertMax) {
    return { level: 'HIGH_ALERT', label: 'High Alert', color: '#f97316', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' };
  }
  return { level: 'CRITICAL', label: 'Critical', color: '#ef4444', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' };
}

/**
 * Build match filter from query parameters
 */
function buildComplaintFilter(regionId, filters = {}) {
  const match = {};

  if (regionId) {
    const objId = new mongoose.Types.ObjectId(regionId);
    match.$or = [
      { geographicRegion: objId },
      { ancestorRegions: objId }
    ];
  }

  if (filters.departmentId && filters.departmentId !== 'ALL') {
    match.assignedDepartment = new mongoose.Types.ObjectId(filters.departmentId);
  }

  if (filters.categoryId && filters.categoryId !== 'ALL') {
    match.category = new mongoose.Types.ObjectId(filters.categoryId);
  }

  if (filters.priority && filters.priority !== 'ALL') {
    match.priority = filters.priority;
  }

  if (filters.status && filters.status !== 'ALL') {
    match.status = filters.status;
  }

  if (filters.slaStatus && filters.slaStatus !== 'ALL') {
    match.slaStatus = filters.slaStatus;
  }

  if (filters.startDate || filters.endDate) {
    match.createdAt = {};
    if (filters.startDate) match.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) match.createdAt.$lte = new Date(filters.endDate);
  }

  return match;
}

/**
 * Get Root Geographic Regions (Top of hierarchy, e.g. State or Parliaments for initial demo view)
 */
async function getRootRegions() {
  // Find top-level state entity (Andhra Pradesh)
  let rootState = await Area.findOne({ type: 'STATE', active: true });
  if (!rootState) {
    rootState = await Area.findOne({ code: 'AP-STATE' });
  }

  if (rootState) {
    // Primary administrative level under State is DISTRICTS (Konaseema, East Godavari, Kakinada, West Godavari, Eluru)
    const districts = await Area.find({ parentId: rootState._id, active: true }).sort({ name: 1 });
    return {
      rootState,
      primaryRegions: districts.length > 0 ? districts : [rootState]
    };
  }

  const roots = await Area.find({ type: { $in: ['DISTRICT', 'STATE'] }, active: true }).sort({ name: 1 });
  return { rootState: roots[0] || null, primaryRegions: roots };
}

/**
 * Get breadcrumb lineage for a region
 */
async function getRegionLineage(regionId) {
  const region = await Area.findById(regionId);
  if (!region) return { region: null, lineage: [] };

  const lineage = [];
  let current = region;

  while (current) {
    lineage.unshift({
      _id: current._id,
      name: current.name,
      displayName: current.displayName || current.name,
      code: current.code,
      type: current.type
    });

    if (!current.parentId) break;
    current = await Area.findById(current.parentId);
  }

  return { region, lineage };
}

/**
 * Get Child Regions with dynamically aggregated problem statistics
 */
async function getChildRegionsWithStatistics(parentId, filters = {}) {
  const parent = await Area.findById(parentId);
  if (!parent) return [];

  const children = await Area.find({ parentId: parent._id, active: true }).sort({ name: 1 });
  if (children.length === 0) return [];

  const childIds = children.map((c) => c._id);

  // Run aggregation to get problem counts grouped by child region ancestor/direct reference
  const baseFilter = buildComplaintFilter(null, filters);

  const stats = await Complaint.aggregate([
    {
      $match: {
        ...baseFilter,
        $or: [
          { geographicRegion: { $in: childIds } },
          { ancestorRegions: { $in: childIds } }
        ]
      }
    },
    {
      $project: {
        status: 1,
        priority: 1,
        slaStatus: 1,
        isEscalated: 1,
        geographicRegion: 1,
        ancestorRegions: 1,
        isActive: {
          $cond: [{ $in: ['$status', INACTIVE_STATUSES] }, 0, 1]
        },
        isCritical: {
          $cond: [{ $eq: ['$priority', 'CRITICAL'] }, 1, 0]
        },
        isOverdue: {
          $cond: [{ $eq: ['$slaStatus', 'OVERDUE'] }, 1, 0]
        },
        isEscalatedFlag: {
          $cond: [{ $or: [{ $eq: ['$isEscalated', true] }, { $eq: ['$status', 'ESCALATED'] }] }, 1, 0]
        }
      }
    }
  ]);

  // Map statistics back to each child
  const result = children.map((child) => {
    const childIdStr = child._id.toString();

    // Filter complaints belonging to this child or its descendants
    const childComplaints = stats.filter((c) => {
      const isDirect = c.geographicRegion?.toString() === childIdStr;
      const isAncestor = c.ancestorRegions?.some((a) => a.toString() === childIdStr);
      return isDirect || isAncestor;
    });

    const totalProblems = childComplaints.length;
    const activeProblems = childComplaints.reduce((sum, c) => sum + c.isActive, 0);
    const resolvedProblems = totalProblems - activeProblems;
    const criticalProblems = childComplaints.reduce((sum, c) => sum + c.isCritical, 0);
    const overdueProblems = childComplaints.reduce((sum, c) => sum + c.isOverdue, 0);
    const escalatedProblems = childComplaints.reduce((sum, c) => sum + c.isEscalatedFlag, 0);

    const alert = computeAlertLevel(activeProblems, child.alertThresholds);

    return {
      _id: child._id,
      name: child.name,
      displayName: child.displayName || child.name,
      code: child.code,
      type: child.type,
      parentId: child.parentId,
      coordinates: child.coordinates,
      boundary: child.boundary,
      totalProblems,
      activeProblems,
      resolvedProblems,
      criticalProblems,
      overdueProblems,
      escalatedProblems,
      alertLevel: alert.level,
      alertLabel: alert.label,
      alertColor: alert.color,
      badgeClass: alert.badgeClass
    };
  });

  return result;
}

/**
 * Get Comprehensive Geographic Intelligence Statistics for a Region
 */
async function getRegionStatistics(regionId, filters = {}) {
  const { region, lineage } = await getRegionLineage(regionId);
  if (!region) throw new Error('Geographic region not found');

  const matchStage = buildComplaintFilter(region._id, filters);

  // 1. Overall Status & Priority Aggregation
  const [overview] = await Complaint.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $in: ['$status', INACTIVE_STATUSES] }, 0, 1] }
        },
        resolved: {
          $sum: { $cond: [{ $in: ['$status', [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED]] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.REJECTED] }, 1, 0] }
        },
        submitted: {
          $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.SUBMITTED] }, 1, 0] }
        },
        reviewed: {
          $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.REVIEWED] }, 1, 0] }
        },
        assigned: {
          $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.ASSIGNED] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.IN_PROGRESS] }, 1, 0] }
        },
        overdue: {
          $sum: { $cond: [{ $eq: ['$slaStatus', 'OVERDUE'] }, 1, 0] }
        },
        escalated: {
          $sum: {
            $cond: [{ $or: [{ $eq: ['$isEscalated', true] }, { $eq: ['$status', 'ESCALATED'] }] }, 1, 0]
          }
        },
        critical: {
          $sum: { $cond: [{ $eq: ['$priority', 'CRITICAL'] }, 1, 0] }
        },
        high: {
          $sum: { $cond: [{ $eq: ['$priority', 'HIGH'] }, 1, 0] }
        },
        medium: {
          $sum: { $cond: [{ $eq: ['$priority', 'MEDIUM'] }, 1, 0] }
        },
        low: {
          $sum: { $cond: [{ $eq: ['$priority', 'LOW'] }, 1, 0] }
        },
        resolvedOnTime: {
          $sum: { $cond: [{ $eq: ['$slaStatus', 'RESOLVED_ON_TIME'] }, 1, 0] }
        },
        resolvedLate: {
          $sum: { $cond: [{ $eq: ['$slaStatus', 'RESOLVED_LATE'] }, 1, 0] }
        }
      }
    }
  ]) || [
    {
      total: 0,
      active: 0,
      resolved: 0,
      rejected: 0,
      submitted: 0,
      reviewed: 0,
      assigned: 0,
      inProgress: 0,
      overdue: 0,
      escalated: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      resolvedOnTime: 0,
      resolvedLate: 0
    }
  ];

  const statsOverview = overview || {
    total: 0,
    active: 0,
    resolved: 0,
    rejected: 0,
    submitted: 0,
    reviewed: 0,
    assigned: 0,
    inProgress: 0,
    overdue: 0,
    escalated: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    resolvedOnTime: 0,
    resolvedLate: 0
  };

  const alert = computeAlertLevel(statsOverview.active, region.alertThresholds);

  // 2. Category Breakdown Aggregation
  const categoryAggregation = await Complaint.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        categoryName: { $first: '$categoryName' },
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $in: ['$status', INACTIVE_STATUSES] }, 0, 1] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const categoriesWithIcons = await IssueCategory.find();
  const categoryMap = {};
  categoriesWithIcons.forEach((c) => {
    categoryMap[c._id.toString()] = { icon: c.icon, name: c.name };
  });

  const categories = categoryAggregation.map((cat) => {
    const catIdStr = cat._id ? cat._id.toString() : '';
    const meta = categoryMap[catIdStr] || {};
    const percentage = statsOverview.total > 0 ? Math.round((cat.count / statsOverview.total) * 100) : 0;
    return {
      categoryId: cat._id,
      name: cat.categoryName || meta.name || 'Other Civic Issue',
      icon: meta.icon || '📌',
      count: cat.count,
      activeCount: cat.activeCount,
      percentage
    };
  });

  // 3. Department Breakdown Aggregation
  const departmentAggregation = await Complaint.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$assignedDepartment',
        departmentName: { $first: '$departmentName' },
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $in: ['$status', INACTIVE_STATUSES] }, 0, 1] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const allDepts = await Department.find();
  const deptMap = {};
  allDepts.forEach((d) => {
    deptMap[d._id.toString()] = { name: d.name, code: d.code };
  });

  const departments = departmentAggregation.map((dept) => {
    const deptIdStr = dept._id ? dept._id.toString() : '';
    const meta = deptMap[deptIdStr] || {};
    const percentage = statsOverview.total > 0 ? Math.round((dept.count / statsOverview.total) * 100) : 0;
    return {
      departmentId: dept._id,
      name: dept.departmentName || meta.name || 'General Municipal',
      code: meta.code || 'GEN',
      count: dept.count,
      activeCount: dept.activeCount,
      percentage
    };
  });

  // 4. SLA Compliance Calculation
  const totalResolved = statsOverview.resolvedOnTime + statsOverview.resolvedLate;
  const complianceRate = totalResolved > 0 ? Math.round((statsOverview.resolvedOnTime / totalResolved) * 100) : 100;

  // 5. Direct Child Regions List with Stats
  const childRegions = await getChildRegionsWithStatistics(region._id, filters);

  return {
    region: {
      _id: region._id,
      name: region.name,
      displayName: region.displayName || region.name,
      code: region.code,
      type: region.type,
      state: region.state,
      district: region.district,
      parliament: region.parliament,
      assemblyConstituency: region.assemblyConstituency,
      mandal: region.mandal,
      coordinates: region.coordinates,
      boundary: region.boundary
    },
    lineage,
    overview: {
      total: statsOverview.total,
      active: statsOverview.active,
      resolved: statsOverview.resolved,
      rejected: statsOverview.rejected,
      overdue: statsOverview.overdue,
      escalated: statsOverview.escalated,
      critical: statsOverview.critical,
      high: statsOverview.high,
      medium: statsOverview.medium,
      low: statsOverview.low,
      submitted: statsOverview.submitted,
      reviewed: statsOverview.reviewed,
      assigned: statsOverview.assigned,
      inProgress: statsOverview.inProgress,
      slaComplianceRate: complianceRate
    },
    alert: {
      level: alert.level,
      label: alert.label,
      color: alert.color,
      badgeClass: alert.badgeClass
    },
    categories,
    departments,
    childRegions,
    topDepartment: departments[0]?.name || 'Roads Department',
    topCategory: categories[0]?.name || 'Pothole & Surface Issues'
  };
}

/**
 * Get Cross-Tabulation Matrix (Department vs Area OR Category vs Area)
 */
async function getRegionMatrix(regionId, matrixType = 'DEPARTMENT', filters = {}) {
  const parent = await Area.findById(regionId);
  if (!parent) throw new Error('Geographic region not found');

  const children = await Area.find({ parentId: parent._id, active: true }).sort({ name: 1 });
  if (children.length === 0) return { columns: [], rows: [] };

  const childIds = children.map((c) => c._id);
  const baseFilter = buildComplaintFilter(null, filters);

  if (matrixType === 'CATEGORY') {
    const categories = await IssueCategory.find().sort({ name: 1 });

    const matrixData = await Complaint.aggregate([
      {
        $match: {
          ...baseFilter,
          $or: [
            { geographicRegion: { $in: childIds } },
            { ancestorRegions: { $in: childIds } }
          ]
        }
      },
      {
        $project: {
          category: 1,
          geographicRegion: 1,
          ancestorRegions: 1
        }
      }
    ]);

    const columns = categories.map((c) => ({ id: c._id.toString(), name: c.name, icon: c.icon }));

    const rows = children.map((child) => {
      const childIdStr = child._id.toString();
      const areaComplaints = matrixData.filter((c) => {
        const isDirect = c.geographicRegion?.toString() === childIdStr;
        const isAncestor = c.ancestorRegions?.some((a) => a.toString() === childIdStr);
        return isDirect || isAncestor;
      });

      const cellCounts = {};
      let rowTotal = 0;

      columns.forEach((col) => {
        const count = areaComplaints.filter((c) => c.category?.toString() === col.id).length;
        cellCounts[col.id] = count;
        rowTotal += count;
      });

      return {
        areaId: child._id,
        areaName: child.name,
        areaType: child.type,
        total: rowTotal,
        counts: cellCounts
      };
    });

    return { matrixType: 'CATEGORY', columns, rows };
  } else {
    // Default: DEPARTMENT vs Area Matrix
    const departments = await Department.find().sort({ name: 1 });

    const matrixData = await Complaint.aggregate([
      {
        $match: {
          ...baseFilter,
          $or: [
            { geographicRegion: { $in: childIds } },
            { ancestorRegions: { $in: childIds } }
          ]
        }
      },
      {
        $project: {
          assignedDepartment: 1,
          suggestedDepartment: 1,
          geographicRegion: 1,
          ancestorRegions: 1
        }
      }
    ]);

    const columns = departments.map((d) => ({ id: d._id.toString(), name: d.name, code: d.code }));

    const rows = children.map((child) => {
      const childIdStr = child._id.toString();
      const areaComplaints = matrixData.filter((c) => {
        const isDirect = c.geographicRegion?.toString() === childIdStr;
        const isAncestor = c.ancestorRegions?.some((a) => a.toString() === childIdStr);
        return isDirect || isAncestor;
      });

      const cellCounts = {};
      let rowTotal = 0;

      columns.forEach((col) => {
        const count = areaComplaints.filter(
          (c) =>
            c.assignedDepartment?.toString() === col.id ||
            (!c.assignedDepartment && c.suggestedDepartment?.toString() === col.id)
        ).length;
        cellCounts[col.id] = count;
        rowTotal += count;
      });

      return {
        areaId: child._id,
        areaName: child.name,
        areaType: child.type,
        total: rowTotal,
        counts: cellCounts
      };
    });

    return { matrixType: 'DEPARTMENT', columns, rows };
  }
}

/**
 * Get Filtered Paginated Problems for a Geographic Region & its Descendants
 */
async function getRegionProblems(regionId, options = {}, filters = {}) {
  const matchFilter = buildComplaintFilter(regionId, filters);

  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 15;
  const skip = (page - 1) * limit;

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    matchFilter.$or = [
      { complaintId: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { categoryName: { $regex: q, $options: 'i' } }
    ];
  }

  const [complaints, total] = await Promise.all([
    Complaint.find(matchFilter)
      .populate('category', 'name slug icon')
      .populate('assignedDepartment', 'name code')
      .populate('assignedOfficer', 'name displayName email')
      .populate('citizen', 'name displayName')
      .populate('geographicRegion', 'name type displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments(matchFilter)
  ]);

  return {
    complaints,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * Search Geographic Entities
 */
async function searchRegions(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim();

  const regions = await Area.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { displayName: { $regex: q, $options: 'i' } },
      { code: { $regex: q, $options: 'i' } },
      { mandal: { $regex: q, $options: 'i' } },
      { assemblyConstituency: { $regex: q, $options: 'i' } },
      { parliament: { $regex: q, $options: 'i' } },
      { district: { $regex: q, $options: 'i' } }
    ],
    active: true
  })
    .limit(10)
    .sort({ type: 1, name: 1 });

  return regions;
}

module.exports = {
  computeAlertLevel,
  getRootRegions,
  getRegionLineage,
  getChildRegionsWithStatistics,
  getRegionStatistics,
  getRegionMatrix,
  getRegionProblems,
  searchRegions
};
