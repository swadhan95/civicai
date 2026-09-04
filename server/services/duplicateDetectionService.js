const MasterIssue = require('../models/MasterIssue');
const Complaint = require('../models/Complaint');
const { PRIORITY_LEVELS, COMPLAINT_STATUS } = require('../config/constants');

// Calculate distance between two lat/lon points in meters using Haversine formula
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

class DuplicateDetectionService {
  constructor() {
    this.DEFAULT_RADIUS_METERS = 75; // 75 meters radius for civic issues
  }

  /**
   * Find existing active issues nearby to inform citizen before submission
   */
  async findNearbyIssues(latitude, longitude, categoryId = null, radiusMeters = 75) {
    const query = {
      status: { $nin: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED] }
    };
    if (categoryId) {
      query.category = categoryId;
    }

    const activeComplaints = await Complaint.find(query)
      .populate('category', 'name slug')
      .populate('suggestedDepartment', 'name code')
      .lean();

    const nearby = [];

    for (const comp of activeComplaints) {
      if (comp.location && comp.location.coordinates && comp.location.coordinates.length === 2) {
        const [compLon, compLat] = comp.location.coordinates;
        const dist = calculateDistanceMeters(latitude, longitude, compLat, compLon);

        if (dist <= radiusMeters) {
          nearby.push({
            complaintId: comp.complaintId,
            id: comp._id,
            distanceMeters: Math.round(dist),
            categoryName: comp.categoryName,
            address: comp.address,
            priority: comp.priority,
            status: comp.status,
            createdAt: comp.createdAt,
            duplicateCount: comp.duplicateCount || 1,
            image: comp.image
          });
        }
      }
    }

    return nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * Process a newly submitted complaint, automatically linking to or creating a MasterIssue
   */
  async processDuplicate(complaint) {
    const [longitude, latitude] = complaint.location.coordinates;

    // 1. Check if there is already an existing active MasterIssue within radius
    const existingMasters = await MasterIssue.find({
      category: complaint.category,
      status: { $nin: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED] }
    });

    for (const master of existingMasters) {
      const [mLong, mLat] = master.location.coordinates;
      const distance = calculateDistanceMeters(latitude, longitude, mLat, mLong);

      if (distance <= this.DEFAULT_RADIUS_METERS) {
        // Match found! Link to this master issue
        master.relatedComplaints.push(complaint._id);
        master.citizenReportCount += 1;
        if (!master.affectedCitizens.includes(complaint.citizen)) {
          master.affectedCitizens.push(complaint.citizen);
        }

        // Escalate priority based on volume of reports
        if (master.citizenReportCount >= 8) {
          master.priority = PRIORITY_LEVELS.CRITICAL;
        } else if (master.citizenReportCount >= 3 && master.priority === PRIORITY_LEVELS.LOW) {
          master.priority = PRIORITY_LEVELS.MEDIUM;
        } else if (master.citizenReportCount >= 5) {
          master.priority = PRIORITY_LEVELS.HIGH;
        }

        await master.save();

        complaint.masterIssue = master._id;
        complaint.isDuplicate = true;
        complaint.duplicateCount = master.citizenReportCount;
        complaint.priority = master.priority;
        await complaint.save();

        return {
          isDuplicate: true,
          masterIssue: master,
          distanceMeters: Math.round(distance)
        };
      }
    }

    // 2. Check if there is another single complaint nearby that can spawn a new MasterIssue
    const otherComplaints = await Complaint.find({
      _id: { $ne: complaint._id },
      category: complaint.category,
      masterIssue: null,
      status: { $nin: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED] }
    });

    for (const other of otherComplaints) {
      const [oLong, oLat] = other.location.coordinates;
      const distance = calculateDistanceMeters(latitude, longitude, oLat, oLong);

      if (distance <= this.DEFAULT_RADIUS_METERS) {
        // Spawn a new MasterIssue
        const masterCount = await MasterIssue.countDocuments();
        const year = new Date().getFullYear();
        const masterId = `MST-${year}-${String(masterCount + 1).padStart(4, '0')}`;

        const newMaster = new MasterIssue({
          masterId,
          category: complaint.category,
          categoryName: complaint.categoryName,
          location: other.location,
          address: other.address,
          priority: PRIORITY_LEVELS.HIGH, // Escalated because 2 citizens reported it
          status: other.status,
          department: other.suggestedDepartment,
          citizenReportCount: 2,
          masterComplaint: other._id,
          relatedComplaints: [other._id, complaint._id],
          affectedCitizens: [other.citizen, complaint.citizen]
        });

        await newMaster.save();

        // Update other complaint
        other.masterIssue = newMaster._id;
        other.duplicateCount = 2;
        await other.save();

        // Update current complaint
        complaint.masterIssue = newMaster._id;
        complaint.isDuplicate = true;
        complaint.duplicateCount = 2;
        complaint.priority = PRIORITY_LEVELS.HIGH;
        await complaint.save();

        return {
          isDuplicate: true,
          masterIssue: newMaster,
          distanceMeters: Math.round(distance)
        };
      }
    }

    return {
      isDuplicate: false,
      masterIssue: null,
      distanceMeters: null
    };
  }
}

module.exports = new DuplicateDetectionService();
