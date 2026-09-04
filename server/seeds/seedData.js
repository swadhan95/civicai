const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const IssueCategory = require('../models/IssueCategory');
const Complaint = require('../models/Complaint');
const MasterIssue = require('../models/MasterIssue');
const Notification = require('../models/Notification');
const PointTransaction = require('../models/PointTransaction');
const SystemSetting = require('../models/SystemSetting');
const {
  ROLES,
  COMPLAINT_STATUS,
  PRIORITY_LEVELS,
  DEFAULT_RANKS,
  DEFAULT_POINT_RULES,
  DEFAULT_DEPARTMENTS,
  DEFAULT_CATEGORIES
} = require('../config/constants');

const seedAll = async () => {
  console.log('Seeding CivicAI Database with realistic demonstration data...');

  // 1. Seed System Settings (Point Rules & Rank Tiers)
  await SystemSetting.findOneAndUpdate(
    { key: 'POINT_RULES' },
    { key: 'POINT_RULES', value: DEFAULT_POINT_RULES, category: 'POINTS', description: 'Points earned/deducted for civic actions' },
    { upsert: true }
  );

  await SystemSetting.findOneAndUpdate(
    { key: 'RANK_TIERS' },
    { key: 'RANK_TIERS', value: DEFAULT_RANKS, category: 'RANKS', description: 'Contributor impact rank thresholds' },
    { upsert: true }
  );

  // 2. Seed Departments
  const departmentMap = {};
  for (const deptData of DEFAULT_DEPARTMENTS) {
    let dept = await Department.findOne({ code: deptData.code });
    if (!dept) {
      dept = await Department.create(deptData);
    }
    departmentMap[deptData.code] = dept;
  }

  // 3. Seed Categories
  const categoryMap = {};
  for (const catData of DEFAULT_CATEGORIES) {
    let cat = await IssueCategory.findOne({ slug: catData.slug });
    const targetDept = departmentMap[catData.defaultDepartmentCode] || departmentMap['GENERAL'];
    if (!cat) {
      cat = await IssueCategory.create({
        name: catData.name,
        slug: catData.slug,
        defaultDepartment: targetDept._id,
        defaultPriority: catData.defaultPriority,
        icon: catData.icon,
        keywords: [catData.slug, catData.name.toLowerCase()]
      });
    }
    categoryMap[catData.slug] = cat;
  }

  // 3.5 Seed Municipal Wards / Areas
  const Area = require('../models/Area');
  const DEFAULT_AREAS = [
    { name: 'Ward 1 - Central CBD', code: 'WARD-01', zone: 'Central Zone', coordinates: { lat: 12.9716, lng: 77.5946 }, description: 'High-density commercial and municipal administrative core' },
    { name: 'Ward 4 - Indiranagar East', code: 'WARD-04', zone: 'East Zone', coordinates: { lat: 12.9784, lng: 77.6408 }, description: 'Mixed commercial retail and residential grid' },
    { name: 'Ward 7 - Koramangala South', code: 'WARD-07', zone: 'South Zone', coordinates: { lat: 12.9352, lng: 77.6245 }, description: 'Tech startup and residential sectors' },
    { name: 'Ward 9 - Whitefield Tech Zone', code: 'WARD-09', zone: 'East Zone', coordinates: { lat: 12.9698, lng: 77.7499 }, description: 'High-traffic IT parks and major transport corridor' },
    { name: 'Ward 12 - Malleshwaram North', code: 'WARD-12', zone: 'North Zone', coordinates: { lat: 13.0031, lng: 77.5643 }, description: 'Heritage residential sector and marketplace' },
    { name: 'Ward 15 - Jayanagar West', code: 'WARD-15', zone: 'West Zone', coordinates: { lat: 12.9250, lng: 77.5838 }, description: 'Planned residential blocks with extensive parkland' }
  ];

  const areaMap = {};
  for (const aData of DEFAULT_AREAS) {
    let area = await Area.findOne({ code: aData.code });
    if (!area) {
      area = await Area.create({
        ...aData,
        assignedDepartment: departmentMap['ROAD_MAINT']?._id || null
      });
    }
    areaMap[aData.code] = area;
  }

  // 4. Seed Users (Demo Citizens, Officers, Admin)
  const defaultPassword = 'Password123!';

  // Admin
  let admin = await User.findOne({ email: 'admin@civicai.org' });
  if (!admin) {
    admin = await User.create({
      name: 'Rajesh Kumar',
      displayName: 'Rajesh K. (Admin)',
      email: 'admin@civicai.org',
      password: 'Admin123!',
      role: ROLES.ADMIN,
      city: 'Metropolis',
      points: 2500,
      rank: DEFAULT_RANKS[5] // Civic Champion
    });
  }

  // Officers
  let roadOfficer = await User.findOne({ email: 'officer@civicai.org' });
  if (!roadOfficer) {
    roadOfficer = await User.create({
      name: 'Inspector Vikram Rao',
      displayName: 'Vikram R. (Roads)',
      email: 'officer@civicai.org',
      password: 'Officer123!',
      role: ROLES.OFFICER,
      department: departmentMap['ROAD_MAINT']._id,
      city: 'Metropolis',
      points: 1200,
      rank: DEFAULT_RANKS[4]
    });
  }

  let sanitationOfficer = await User.findOne({ email: 'sanitation@civicai.org' });
  if (!sanitationOfficer) {
    sanitationOfficer = await User.create({
      name: 'Officer Meera Sen',
      displayName: 'Meera S. (Sanitation)',
      email: 'sanitation@civicai.org',
      password: 'Officer123!',
      role: ROLES.OFFICER,
      department: departmentMap['SANITATION']._id,
      city: 'Metropolis',
      points: 850,
      rank: DEFAULT_RANKS[3]
    });
  }

  // Citizens with diverse impact points
  const demoCitizensData = [
    {
      name: 'Rahul Sharma',
      displayName: 'Rahul S.',
      email: 'citizen@civicai.org',
      password: 'Citizen123!',
      points: 420,
      rank: DEFAULT_RANKS[2], // Silver
      reportsCount: 18,
      validReportsCount: 15,
      resolvedReportsCount: 11
    },
    {
      name: 'Ananya Patel',
      displayName: 'Ananya P.',
      email: 'ananya@civicai.org',
      password: defaultPassword,
      points: 1540,
      rank: DEFAULT_RANKS[4], // Platinum
      reportsCount: 42,
      validReportsCount: 40,
      resolvedReportsCount: 36
    },
    {
      name: 'Priya Nair',
      displayName: 'Priya N.',
      email: 'priya@civicai.org',
      password: defaultPassword,
      points: 2340,
      rank: DEFAULT_RANKS[5], // Civic Champion
      reportsCount: 65,
      validReportsCount: 62,
      resolvedReportsCount: 58
    },
    {
      name: 'Arjun Verma',
      displayName: 'Arjun V.',
      email: 'arjun@civicai.org',
      password: defaultPassword,
      points: 870,
      rank: DEFAULT_RANKS[3], // Gold
      reportsCount: 28,
      validReportsCount: 25,
      resolvedReportsCount: 21
    },
    {
      name: 'Devika Krishnan',
      displayName: 'Devika K.',
      email: 'devika@civicai.org',
      password: defaultPassword,
      points: 190,
      rank: DEFAULT_RANKS[1], // Bronze
      reportsCount: 8,
      validReportsCount: 7,
      resolvedReportsCount: 5
    }
  ];

  const citizenUsers = [];
  for (const cData of demoCitizensData) {
    let citizen = await User.findOne({ email: cData.email });
    if (!citizen) {
      citizen = await User.create({
        ...cData,
        role: ROLES.CITIZEN,
        city: 'Metropolis'
      });
    }
    citizenUsers.push(citizen);
  }

  // 5. Seed Demo Complaints (Disabled: Clean 0 Problems Inbuilt State)
  const existingComplaintCount = await Complaint.countDocuments();
  if (false && existingComplaintCount === 0) {
    const sampleImages = {
      pothole: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80',
      potholeResolved: 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=800&q=80',
      garbage: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&q=80',
      waterLeak: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&q=80',
      streetlight: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&q=80',
      drain: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&q=80',
      tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80'
    };

    // Resolved Pothole complaint with Before/After
    const c1 = await Complaint.create({
      complaintId: 'CIV-2026-001102',
      citizen: citizenUsers[0]._id,
      image: sampleImages.pothole,
      category: categoryMap['pothole']._id,
      categoryName: 'Pothole',
      aiAnalysis: {
        detectedCategory: 'Pothole',
        confidence: 94,
        severityTag: 'High Confidence Detection',
        isConfirmedByUser: true
      },
      priority: PRIORITY_LEVELS.HIGH,
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: 'Near Metro Gate 2, Mahatma Gandhi Road, Metropolis',
      description: 'Deep hazardous crater pothole in the center lane of the road causing traffic slowdowns and bike skids.',
      suggestedDepartment: departmentMap['ROAD_MAINT']._id,
      assignedDepartment: departmentMap['ROAD_MAINT']._id,
      assignedOfficer: roadOfficer._id,
      status: COMPLAINT_STATUS.RESOLVED,
      pointsAwarded: 40,
      resolution: {
        imageUrl: sampleImages.potholeResolved,
        notes: 'Cold mix asphalt patching and steam roller compaction executed successfully.',
        resolvedAt: new Date(Date.now() - 3600000 * 24),
        resolvedBy: roadOfficer._id,
        verifiedByAI: true,
        aiConfidence: 96
      },
      timeline: [
        { status: 'SUBMITTED', message: 'Complaint registered by citizen.', timestamp: new Date(Date.now() - 3600000 * 72) },
        { status: 'REVIEWED', message: 'Reviewed by Inspector Vikram Rao.', timestamp: new Date(Date.now() - 3600000 * 48) },
        { status: 'IN_PROGRESS', message: 'Patching crew dispatched with hot-mix tanker.', timestamp: new Date(Date.now() - 3600000 * 36) },
        { status: 'RESOLVED', message: 'Pothole asphalted and inspected. Completed.', timestamp: new Date(Date.now() - 3600000 * 24) }
      ]
    });

    // In-Progress Garbage accumulation
    const c2 = await Complaint.create({
      complaintId: 'CIV-2026-001189',
      citizen: citizenUsers[1]._id,
      image: sampleImages.garbage,
      category: categoryMap['garbage']._id,
      categoryName: 'Garbage Accumulation',
      aiAnalysis: {
        detectedCategory: 'Garbage Accumulation',
        confidence: 96,
        severityTag: 'High Confidence Detection',
        isConfirmedByUser: true
      },
      priority: PRIORITY_LEVELS.MEDIUM,
      location: { type: 'Point', coordinates: [77.6012, 12.9765] },
      address: 'Opposite Central Market Complex, 4th Cross, Metropolis',
      description: 'Overflowing municipal dump bin spilling organic waste onto pedestrian walkway.',
      suggestedDepartment: departmentMap['SANITATION']._id,
      assignedDepartment: departmentMap['SANITATION']._id,
      assignedOfficer: sanitationOfficer._id,
      status: COMPLAINT_STATUS.IN_PROGRESS,
      pointsAwarded: 20,
      timeline: [
        { status: 'SUBMITTED', message: 'Complaint registered by citizen.', timestamp: new Date(Date.now() - 3600000 * 18) },
        { status: 'ASSIGNED', message: 'Assigned to Ward 14 Sanitation Compactor Unit.', timestamp: new Date(Date.now() - 3600000 * 10) },
        { status: 'IN_PROGRESS', message: 'Sanitation truck en route for clearance.', timestamp: new Date(Date.now() - 3600000 * 2) }
      ]
    });

    // Critical Water Leakage (Assigned)
    const c3 = await Complaint.create({
      complaintId: 'CIV-2026-001245',
      citizen: citizenUsers[0]._id,
      image: sampleImages.waterLeak,
      category: categoryMap['water-leakage']._id,
      categoryName: 'Water Leakage',
      aiAnalysis: {
        detectedCategory: 'Water Leakage',
        confidence: 93,
        severityTag: 'High Severity Disruption',
        isConfirmedByUser: true
      },
      priority: PRIORITY_LEVELS.CRITICAL,
      location: { type: 'Point', coordinates: [77.5855, 12.9645] },
      address: 'Main Pipeline Junction, Lalbagh West Gate, Metropolis',
      description: 'Major underground pipeline burst with pressurized clean water flooding roadway and threatening basements.',
      suggestedDepartment: departmentMap['WATER_SUPPLY']._id,
      assignedDepartment: departmentMap['WATER_SUPPLY']._id,
      status: COMPLAINT_STATUS.ASSIGNED,
      pointsAwarded: 20,
      timeline: [
        { status: 'SUBMITTED', message: 'Complaint registered by citizen.', timestamp: new Date(Date.now() - 3600000 * 5) },
        { status: 'ASSIGNED', message: 'Emergency response pipeline crew assigned.', timestamp: new Date(Date.now() - 3600000 * 2) }
      ]
    });

    // Broken streetlight (Submitted)
    const c4 = await Complaint.create({
      complaintId: 'CIV-2026-001290',
      citizen: citizenUsers[3]._id,
      image: sampleImages.streetlight,
      category: categoryMap['broken-streetlight']._id,
      categoryName: 'Broken Streetlight',
      aiAnalysis: {
        detectedCategory: 'Broken Streetlight',
        confidence: 89,
        severityTag: 'Standard Civic Issue',
        isConfirmedByUser: true
      },
      priority: PRIORITY_LEVELS.LOW,
      location: { type: 'Point', coordinates: [77.612, 12.981] },
      address: 'Lamp Post #42, 8th Main, Indiranagar, Metropolis',
      description: 'LED street fixture flickering violently and going completely dark after 9 PM, causing pedestrian blind spots.',
      suggestedDepartment: departmentMap['ELECTRICAL']._id,
      assignedDepartment: departmentMap['ELECTRICAL']._id,
      status: COMPLAINT_STATUS.SUBMITTED,
      pointsAwarded: 20,
      timeline: [
        { status: 'SUBMITTED', message: 'Complaint submitted by citizen.', timestamp: new Date(Date.now() - 3600000 * 3) }
      ]
    });

    // Blocked drain (High priority, In Progress)
    const c5 = await Complaint.create({
      complaintId: 'CIV-2026-001305',
      citizen: citizenUsers[2]._id,
      image: sampleImages.drain,
      category: categoryMap['blocked-drain']._id,
      categoryName: 'Blocked Drain',
      aiAnalysis: {
        detectedCategory: 'Blocked Drain',
        confidence: 91,
        severityTag: 'High Disruption',
        isConfirmedByUser: true
      },
      priority: PRIORITY_LEVELS.HIGH,
      location: { type: 'Point', coordinates: [77.579, 12.955] },
      address: 'Stormwater Culvert, KR Market Circle, Metropolis',
      description: 'Plastic silt and construction rubble completely obstructing runoff grate causing knee-deep water-logging.',
      suggestedDepartment: departmentMap['DRAINAGE']._id,
      assignedDepartment: departmentMap['DRAINAGE']._id,
      status: COMPLAINT_STATUS.IN_PROGRESS,
      pointsAwarded: 20,
      timeline: [
        { status: 'SUBMITTED', message: 'Complaint registered by citizen.', timestamp: new Date(Date.now() - 3600000 * 12) },
        { status: 'IN_PROGRESS', message: 'Suction jetting machine mobilized to site.', timestamp: new Date(Date.now() - 3600000 * 4) }
      ]
    });

    // Seed sample notifications for Rahul
    await Notification.create([
      {
        recipient: citizenUsers[0]._id,
        title: 'Issue Resolved! 🎉',
        message: 'Your complaint CIV-2026-001102 has been resolved! You earned +40 Civic Points.',
        type: 'STATUS_UPDATE',
        complaint: c1._id,
        complaintIdStr: 'CIV-2026-001102',
        isRead: false
      },
      {
        recipient: citizenUsers[0]._id,
        title: 'Rank Promotion Achieved! 🥈',
        message: 'Congratulations! Your verified civic contributions promoted you to 🥈 Silver Contributor!',
        type: 'RANK_UP',
        isRead: true
      },
      {
        recipient: citizenUsers[0]._id,
        title: 'Complaint Submitted Successfully',
        message: 'Your complaint CIV-2026-001245 was received and routed to Water Supply Department.',
        type: 'STATUS_UPDATE',
        complaint: c3._id,
        complaintIdStr: 'CIV-2026-001245',
        isRead: true
      }
    ]);

    // Seed Point Transactions for audit history
    await PointTransaction.create([
      {
        citizen: citizenUsers[0]._id,
        complaint: c1._id,
        actionType: 'VALID_ISSUE_ACCEPTED',
        points: 20,
        balanceAfter: 380,
        description: 'New verified civic issue reported (CIV-2026-001102)'
      },
      {
        citizen: citizenUsers[0]._id,
        complaint: c1._id,
        actionType: 'RESOLVED',
        points: 40,
        balanceAfter: 420,
        description: 'Issue successfully resolved and verified (CIV-2026-001102)'
      }
    ]);
  }

  // Seed Administrative Geographic Hierarchy
  const { seedGeographyHierarchy } = require('./seedGeography');
  await seedGeographyHierarchy();
  // seedDemonstrationComplaints disabled to ensure 0 complaints inbuiltly

  console.log('CivicAI Database Seeding completed successfully (0 Problems State)!');
};

const seedIfEmpty = async () => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('No users found in database. Running initial seed...');
    await seedAll();
  }
};

if (require.main === module) {
  const { connectDB } = require('../config/db');
  require('dotenv').config();
  connectDB().then(async () => {
    await seedAll();
    console.log('Exiting seed process.');
    process.exit(0);
  });
}

module.exports = { seedAll, seedIfEmpty };
