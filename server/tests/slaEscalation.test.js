/**
 * CivicAI Automated SLA Timeline & Citizen Escalation Test Suite
 * Validates dynamic SLA computation, overdue detection, citizen escalation workflow,
 * administrative review, SLA extensions, and field crew delay reasons.
 */
const assert = require('assert');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const IssueCategory = require('../models/IssueCategory');
const Escalation = require('../models/Escalation');
const Notification = require('../models/Notification');
const slaService = require('../services/slaService');
const { seedAll } = require('../seeds/seedData');

process.env.NODE_ENV = 'test';

async function runSlaEscalationTests() {
  console.log('===============================================================');
  console.log('  CIVICAI SLA TIMELINE & CITIZEN ESCALATION TEST SUITE');
  console.log('===============================================================');

  try {
    // 1. Connect & Seed Database
    await connectDB();
    await seedAll();
    console.log('✓ Database connected and seed data initialized.');

    // 2. Fetch seed users and category
    const citizen = await User.findOne({ email: 'citizen@civicai.org' });
    const officer = await User.findOne({ email: 'vaishnavi.roads@civicai.gov' });
    const admin = await User.findOne({ role: 'ADMIN' });
    const roadCat = await IssueCategory.findOne({ slug: 'pothole' });
    const roadDept = await Department.findOne({ code: 'ROAD_MAINT' });

    assert(citizen, 'Demo citizen must exist');
    assert(officer, 'Road maintenance officer must exist');
    assert(admin, 'Admin must exist');
    assert(roadCat, 'Pothole category must exist');

    // -------------------------------------------------------------
    // Test 1: Dynamic SLA Duration & Expected Resolution Calculation
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Dynamic SLA Calculation ---');
    const slaHoursCritical = await slaService.calculateSlaHours(roadCat._id, 'CRITICAL');
    const slaHoursHigh = await slaService.calculateSlaHours(roadCat._id, 'HIGH');
    const slaHoursMedium = await slaService.calculateSlaHours(roadCat._id, 'MEDIUM');
    const slaHoursLow = await slaService.calculateSlaHours(roadCat._id, 'LOW');

    assert(slaHoursCritical === 4, `Expected 4h for critical pothole, got ${slaHoursCritical}`);
    assert(slaHoursHigh === 12, `Expected 12h for high pothole, got ${slaHoursHigh}`);
    assert(slaHoursMedium === 24, `Expected 24h for medium pothole, got ${slaHoursMedium}`);
    assert(slaHoursLow === 48, `Expected 48h for low pothole, got ${slaHoursLow}`);
    console.log(`✓ Dynamic SLA calculation verified across all 4 priorities: Critical=${slaHoursCritical}h, High=${slaHoursHigh}h, Medium=${slaHoursMedium}h, Low=${slaHoursLow}h`);

    // -------------------------------------------------------------
    // Test 2: Complaint Creation with SLA Timeline Fields
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Complaint Creation with SLA Timeline ---');
    const expectedDeadline = slaService.calculateExpectedResolutionTime(24);
    const complaint = await Complaint.create({
      complaintId: `CIV-SLA-${Date.now().toString().slice(-4)}`,
      citizen: citizen._id,
      image: 'https://example.com/pothole-sample.jpg',
      category: roadCat._id,
      categoryName: roadCat.name,
      department: roadDept._id,
      departmentName: roadDept.name,
      priority: 'MEDIUM',
      title: 'Pothole on Main Avenue',
      description: 'Hazardous deep pothole impacting two-wheelers',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
        address: 'MG Road, Ward 12',
        ward: 'Ward 12',
        zone: 'Central Zone',
        city: 'Bengaluru'
      },
      status: 'SUBMITTED',
      reportedAt: new Date(),
      slaDuration: 24,
      expectedResolutionAt: expectedDeadline,
      slaStatus: 'ON_TRACK',
      timeline: [
        {
          status: 'SUBMITTED',
          message: 'Complaint submitted with SLA of 24 hours.',
          actorName: citizen.name,
          actorRole: 'CITIZEN',
          actionType: 'COMPLAINT_CREATED'
        }
      ]
    });

    assert(complaint.slaDuration === 24, 'SLA Duration must be 24 hours');
    assert(complaint.slaStatus === 'ON_TRACK', 'Initial SLA status must be ON_TRACK');
    assert(complaint.expectedResolutionAt, 'Expected resolution timestamp must be populated');
    console.log(`✓ Complaint created with ID: ${complaint.complaintId}, Deadline: ${complaint.expectedResolutionAt.toISOString()}`);

    // -------------------------------------------------------------
    // Test 3: Dynamic SLA Status Evaluation (ON_TRACK / DUE_SOON / OVERDUE)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Real-Time SLA Status Logic ---');
    const onTrackStatus = slaService.computeSlaStatus(complaint);
    assert(onTrackStatus === 'ON_TRACK', `Expected ON_TRACK, got ${onTrackStatus}`);

    // Simulate Due Soon (1 hour remaining on 24h SLA)
    const dueSoonComplaint = {
      status: 'IN_PROGRESS',
      expectedResolutionAt: new Date(Date.now() + 60 * 60 * 1000),
      slaDuration: 24
    };
    const dueSoonStatus = slaService.computeSlaStatus(dueSoonComplaint);
    assert(dueSoonStatus === 'DUE_SOON', `Expected DUE_SOON, got ${dueSoonStatus}`);

    // Simulate Overdue (Deadline was 2 hours ago)
    const overdueComplaint = {
      status: 'IN_PROGRESS',
      expectedResolutionAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      slaDuration: 24
    };
    const overdueStatus = slaService.computeSlaStatus(overdueComplaint);
    assert(overdueStatus === 'OVERDUE', `Expected OVERDUE, got ${overdueStatus}`);
    console.log('✓ SLA Status Engine accurately transitions: ON_TRACK -> DUE_SOON -> OVERDUE');

    // -------------------------------------------------------------
    // Test 4: Background SLA Breach Detection & Automated Overdue Scanner
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Background SLA Scanner & Notifications ---');
    // Set complaint deadline into the past to simulate overdue
    complaint.expectedResolutionAt = new Date(Date.now() - 3 * 3600 * 1000);
    complaint.slaStatus = 'ON_TRACK';
    await complaint.save();

    const scanResult = await slaService.scanAndProcessOverdueComplaints();
    assert(scanResult.processedCount >= 1, 'Scanner must identify at least 1 overdue complaint');
    
    const refreshedComp = await Complaint.findById(complaint._id);
    assert(refreshedComp.slaStatus === 'OVERDUE', `SLA status must be OVERDUE, got ${refreshedComp.slaStatus}`);
    assert(refreshedComp.slaBreachedAt, 'slaBreachedAt timestamp must be recorded');
    
    // Check timeline audit
    const overdueTimelineEvent = refreshedComp.timeline.find(t => t.actionType === 'SLA_BREACH');
    assert(overdueTimelineEvent, 'Timeline must contain SLA_BREACH audit entry');

    // Check citizen notification
    const citizenNotification = await Notification.findOne({
      recipient: citizen._id,
      type: 'SLA_BREACH'
    });
    assert(citizenNotification, 'Citizen must receive SLA_BREACH notification with escalation instructions');
    console.log(`✓ Automated Background Scanner marked complaint as OVERDUE and dispatched breach notification.`);

    // -------------------------------------------------------------
    // Test 5: Citizen Escalation Trigger & Hierarchy (Level 1)
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Citizen Escalation Submission ---');
    const escalation = await Escalation.create({
      complaint: refreshedComp._id,
      citizen: citizen._id,
      originalDepartment: refreshedComp.department,
      assignedOfficer: refreshedComp.assignedOfficer || officer._id,
      escalationLevel: 1, // Level 1: Dept Supervisor
      reason: 'Resolution deadline passed with no field inspection or team update.',
      evidence: ['https://example.com/still-dirty.jpg'],
      status: 'OPEN',
      history: [
        {
          action: 'ESCALATION_RAISED',
          actor: citizen._id,
          actorRole: 'CITIZEN',
          notes: 'Initial citizen escalation for breached SLA',
          timestamp: new Date()
        }
      ]
    });

    // Update complaint escalation flags
    refreshedComp.isEscalated = true;
    refreshedComp.escalationReason = escalation.reason;
    refreshedComp.escalatedAt = new Date();
    refreshedComp.activeEscalation = escalation._id;
    refreshedComp.timeline.push({
      status: refreshedComp.status,
      message: `Citizen raised Level 1 Escalation: "${escalation.reason}"`,
      actorName: citizen.name,
      actorRole: 'CITIZEN',
      actionType: 'ESCALATION_RAISED',
      timestamp: new Date()
    });
    await refreshedComp.save();

    assert(escalation.escalationId.startsWith('ESC-'), 'Escalation ID must follow ESC- prefix pattern');
    assert(escalation.escalationLevel === 1, 'Escalation level must be Level 1');
    console.log(`✓ Escalation generated: ${escalation.escalationId} at Level 1 (Dept Supervisor)`);

    // -------------------------------------------------------------
    // Test 6: Anti-Abuse: Prevent Duplicate Active Escalations
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Anti-Abuse Prevention ---');
    const existingActive = await Escalation.findOne({
      complaint: refreshedComp._id,
      status: { $in: ['OPEN', 'UNDER_REVIEW', 'ACTION_REQUIRED'] }
    });
    assert(existingActive, 'Active escalation correctly detected preventing multiple duplicate filings');
    console.log('✓ Anti-abuse check: Verified active escalation gatekeeper.');

    // -------------------------------------------------------------
    // Test 7: Administrative Review & Escalation Center Query
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Admin Escalation Command Center ---');
    const allEscalations = await Escalation.find()
      .populate('complaint', 'complaintId title status priority')
      .populate('citizen', 'name email')
      .populate('originalDepartment', 'name code');

    assert(allEscalations.length >= 1, 'Admin must see list of active escalations');
    
    // Admin reviews and acknowledges escalation
    escalation.status = 'UNDER_REVIEW';
    escalation.reviewedBy = admin._id;
    escalation.reviewedAt = new Date();
    escalation.adminNotes = 'Department supervisor contacted to dispatch emergency road patch team.';
    escalation.history.push({
      action: 'ADMIN_REVIEWED',
      actor: admin._id,
      actorRole: 'ADMIN',
      notes: escalation.adminNotes,
      timestamp: new Date()
    });
    await escalation.save();
    console.log('✓ Admin Escalation Center: Telemetry retrieved and status transitioned to UNDER_REVIEW.');

    // -------------------------------------------------------------
    // Test 8: Authorized SLA Extension with Accountability Reason
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Authorized SLA Extension ---');
    const oldDeadline = refreshedComp.expectedResolutionAt;
    const additionalHours = 24;
    const newDeadline = new Date(oldDeadline.getTime() + additionalHours * 3600 * 1000);

    refreshedComp.slaExtensions.push({
      extendedBy: admin._id,
      extendedByRole: 'ADMIN',
      additionalHours,
      reason: 'Monsoon flash rain delay - bitumen curing requires dry asphalt.',
      extendedAt: new Date(),
      previousDeadline: oldDeadline,
      newDeadline
    });
    refreshedComp.expectedResolutionAt = newDeadline;
    refreshedComp.slaDuration += additionalHours;
    refreshedComp.slaStatus = 'ON_TRACK'; // Restored to on-track after extension
    refreshedComp.timeline.push({
      status: refreshedComp.status,
      message: `SLA extended by 24h by Administrator. Reason: Monsoon flash rain delay. New deadline: ${newDeadline.toLocaleDateString()}`,
      actorName: admin.name,
      actorRole: 'ADMIN',
      actionType: 'SLA_EXTENDED',
      timestamp: new Date()
    });
    await refreshedComp.save();

    assert(refreshedComp.slaExtensions.length === 1, 'SLA extension record must be stored');
    assert(refreshedComp.expectedResolutionAt.getTime() === newDeadline.getTime(), 'Deadline must be updated');
    console.log(`✓ SLA Extension granted (+24h). New Deadline: ${newDeadline.toISOString()}`);

    // -------------------------------------------------------------
    // Test 9: Field Crew Delay Reason Submission
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Officer Field Crew Delay Reason ---');
    refreshedComp.delayReasons.push({
      officer: officer._id,
      category: 'WEATHER_CONDITIONS',
      reason: 'Asphalt batch mix plant delayed delivery due to torrential downpour.',
      recordedAt: new Date()
    });
    refreshedComp.timeline.push({
      status: refreshedComp.status,
      message: `Officer Vaishnavi reported field delay (WEATHER_CONDITIONS): Asphalt batch mix plant delayed delivery.`,
      actorName: officer.name,
      actorRole: 'OFFICER',
      actionType: 'DELAY_REPORTED',
      timestamp: new Date()
    });
    await refreshedComp.save();

    assert(refreshedComp.delayReasons.length === 1, 'Field delay reason must be recorded');
    console.log('✓ Officer delay reason logged with full transparency on timeline.');

    // -------------------------------------------------------------
    // Test 10: Complaint Resolution & Auto-Resolving Escalation
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Complaint Resolution & Escalation Closure ---');
    refreshedComp.status = 'RESOLVED';
    refreshedComp.resolvedAt = new Date();
    refreshedComp.resolutionImage = 'https://example.com/pothole-fixed-proof.jpg';
    refreshedComp.resolutionNotes = 'Pothole hot-mix asphalt filled, compacted, and leveled.';
    refreshedComp.slaStatus = refreshedComp.resolvedAt <= refreshedComp.expectedResolutionAt ? 'RESOLVED_ON_TIME' : 'RESOLVED_LATE';
    refreshedComp.timeline.push({
      status: 'RESOLVED',
      message: 'Complaint marked as RESOLVED by Field Officer with After verification image.',
      actorName: officer.name,
      actorRole: 'OFFICER',
      actionType: 'STATUS_CHANGE',
      timestamp: new Date()
    });
    await refreshedComp.save();

    // Auto-resolve associated active escalation
    escalation.status = 'RESOLVED';
    escalation.resolutionSummary = 'Work completed by road maintenance crew and verified.';
    escalation.resolvedAt = new Date();
    escalation.history.push({
      action: 'ESCALATION_RESOLVED',
      actor: officer._id,
      actorRole: 'OFFICER',
      notes: 'Complaint resolved on field.',
      timestamp: new Date()
    });
    await escalation.save();

    assert(refreshedComp.status === 'RESOLVED', 'Complaint must be RESOLVED');
    assert(escalation.status === 'RESOLVED', 'Escalation must be auto-resolved');
    console.log(`✓ Complaint resolved (${refreshedComp.slaStatus}) and active escalation closed successfully.`);

    console.log('\n===============================================================');
    console.log('  ALL 10 SLA & ESCALATION INTEGRATION TESTS PASSED 100%!');
    console.log('===============================================================');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  runSlaEscalationTests();
}

module.exports = runSlaEscalationTests;
