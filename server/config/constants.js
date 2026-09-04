const ROLES = {
  CITIZEN: 'CITIZEN',
  OFFICER: 'OFFICER',
  ADMIN: 'ADMIN'
};

const COMPLAINT_STATUS = {
  SUBMITTED: 'SUBMITTED',
  REVIEWED: 'REVIEWED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  DUPLICATE: 'DUPLICATE'
};

const PRIORITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const DEFAULT_RANKS = [
  { name: 'Beginner', code: 'BEGINNER', minPoints: 0, maxPoints: 99, badge: '🌱', description: 'Just started reporting community issues' },
  { name: 'Bronze Contributor', code: 'BRONZE', minPoints: 100, maxPoints: 249, badge: '🥉', description: 'Active community watcher' },
  { name: 'Silver Contributor', code: 'SILVER', minPoints: 250, maxPoints: 499, badge: '🥈', description: 'Reliable neighborhood inspector' },
  { name: 'Gold Contributor', code: 'GOLD', minPoints: 500, maxPoints: 999, badge: '🥇', description: 'Trusted civic collaborator' },
  { name: 'Platinum Contributor', code: 'PLATINUM', minPoints: 1000, maxPoints: 1999, badge: '💎', description: 'Distinguished civic guardian' },
  { name: 'Civic Champion', code: 'CIVIC_CHAMPION', minPoints: 2000, maxPoints: 999999, badge: '🏆', description: 'City-wide impactful leader' }
];

const DEFAULT_POINT_RULES = {
  VALID_ISSUE_ACCEPTED: 20,
  OFFICER_CONFIRMED: 30,
  RESOLVED: 40,
  UNIQUE_BONUS: 20,
  COMMUNITY_CONFIRMED: 10,
  DUPLICATE_REPORT: 0,
  REJECTED_SPAM: -20
};

const DEFAULT_DEPARTMENTS = [
  { name: 'Road Maintenance', code: 'ROAD_MAINT', description: 'Handles potholes, cracked roads, asphalt paving and speed breaker issues', contactEmail: 'roads@civicai.gov' },
  { name: 'Sanitation & Waste', code: 'SANITATION', description: 'Handles garbage collection, illegal dumping, and public cleanliness', contactEmail: 'clean@civicai.gov' },
  { name: 'Electrical & Lighting', code: 'ELECTRICAL', description: 'Handles broken streetlights, exposed wiring, and power poles', contactEmail: 'power@civicai.gov' },
  { name: 'Water Supply', code: 'WATER_SUPPLY', description: 'Handles main pipeline leaks, contaminated supply, and burst pipes', contactEmail: 'water@civicai.gov' },
  { name: 'Drainage & Sewage', code: 'DRAINAGE', description: 'Handles blocked storm drains, overflowing sewers, and open manholes', contactEmail: 'drainage@civicai.gov' },
  { name: 'Traffic & Signals', code: 'TRAFFIC', description: 'Handles broken signals, missing signs, and intersection hazards', contactEmail: 'traffic@civicai.gov' },
  { name: 'Parks & Forestry', code: 'FORESTRY', description: 'Handles fallen trees, dangerous branches, and park hazards', contactEmail: 'parks@civicai.gov' },
  { name: 'General Civic Administration', code: 'GENERAL', description: 'Handles uncategorized or cross-departmental civic issues', contactEmail: 'support@civicai.gov' }
];

const DEFAULT_CATEGORIES = [
  { name: 'Pothole', slug: 'pothole', defaultDepartmentCode: 'ROAD_MAINT', defaultPriority: 'HIGH', icon: 'Construction' },
  { name: 'Garbage Accumulation', slug: 'garbage', defaultDepartmentCode: 'SANITATION', defaultPriority: 'MEDIUM', icon: 'Trash2' },
  { name: 'Broken Streetlight', slug: 'broken-streetlight', defaultDepartmentCode: 'ELECTRICAL', defaultPriority: 'LOW', icon: 'LightbulbOff' },
  { name: 'Water Leakage', slug: 'water-leakage', defaultDepartmentCode: 'WATER_SUPPLY', defaultPriority: 'HIGH', icon: 'Droplets' },
  { name: 'Damaged Road', slug: 'damaged-road', defaultDepartmentCode: 'ROAD_MAINT', defaultPriority: 'HIGH', icon: 'AlertTriangle' },
  { name: 'Blocked Drain', slug: 'blocked-drain', defaultDepartmentCode: 'DRAINAGE', defaultPriority: 'HIGH', icon: 'Waves' },
  { name: 'Fallen Tree', slug: 'fallen-tree', defaultDepartmentCode: 'FORESTRY', defaultPriority: 'HIGH', icon: 'Trees' },
  { name: 'Damaged Traffic Signal', slug: 'damaged-traffic-signal', defaultDepartmentCode: 'TRAFFIC', defaultPriority: 'CRITICAL', icon: 'ShieldAlert' },
  { name: 'Other Civic Issue', slug: 'other-civic-issue', defaultDepartmentCode: 'GENERAL', defaultPriority: 'LOW', icon: 'HelpCircle' },
  { name: 'No Civic Issue', slug: 'no-civic-issue', defaultDepartmentCode: 'GENERAL', defaultPriority: 'LOW', icon: 'XCircle' }
];

module.exports = {
  ROLES,
  COMPLAINT_STATUS,
  PRIORITY_LEVELS,
  DEFAULT_RANKS,
  DEFAULT_POINT_RULES,
  DEFAULT_DEPARTMENTS,
  DEFAULT_CATEGORIES
};
