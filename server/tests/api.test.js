/**
 * CivicAI Backend Automated API & Business Logic Verification Test Suite
 */
const assert = require('assert');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const IssueCategory = require('../models/IssueCategory');
const MasterIssue = require('../models/MasterIssue');
const rankingService = require('../services/rankingService');
const duplicateService = require('../services/duplicateDetectionService');
const aiService = require('../services/aiService');
const { seedAll } = require('../seeds/seedData');

process.env.NODE_ENV = 'test';

async function runTests() {
  console.log('--- STARTING CIVICAI AUTOMATED TEST SUITE ---');

  try {
    // 1. Connect DB & Seed
    await connectDB();
    await seedAll();
    console.log('✓ Database connected and seeded');

    // 2. Verify Users & Auth Models
    const citizen = await User.findOne({ email: 'citizen@civicai.org' }).select('+password');
    assert(citizen, 'Demo citizen must exist');
    const isPassValid = await citizen.matchPassword('Citizen123!');
    assert(isPassValid === true, 'Password hashing & comparison must match');
    console.log('✓ Auth & Password hashing verified');

    // 3. Verify AI Service Abstraction
    const mockAnalysis = await aiService.analyzeIssueImage({
      filename: 'pothole-test.jpg',
      originalname: 'pothole-photo.jpg',
      userHint: 'hazardous pothole on road'
    });
    assert(mockAnalysis.detectedCategory === 'Pothole', 'AI should classify pothole');
    assert(mockAnalysis.confidence >= 75, 'AI confidence should be realistic (>=75%)');
    console.log(`✓ AI Issue Classification verified: ${mockAnalysis.detectedCategory} (${mockAnalysis.confidence}%)`);

    const resolutionCheck = await aiService.verifyResolution({
      beforeImage: 'pothole.jpg',
      afterImage: 'pothole-fixed.jpg',
      categoryName: 'Pothole'
    });
    assert(resolutionCheck.isResolved === true, 'Resolution verification must return resolved status');
    console.log('✓ AI Resolution Verification verified');

    // 4. Test Duplicate Detection Algorithm
    const testCat = await IssueCategory.findOne({ slug: 'pothole' });
    const testDept = await Department.findOne({ code: 'ROAD_MAINT' });

    // Complaint A at Location 1
    const compA = await Complaint.create({
      complaintId: 'CIV-TEST-001',
      citizen: citizen._id,
      image: 'https://example.com/pothole1.jpg',
      category: testCat._id,
      categoryName: 'Pothole',
      priority: 'MEDIUM',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: 'MG Road Junction Test',
      description: 'Pothole in left lane',
      suggestedDepartment: testDept._id,
      assignedDepartment: testDept._id
    });

    const resA = await duplicateService.processDuplicate(compA);
    assert(resA.isDuplicate === false, 'First complaint should not be a duplicate');

    // Complaint B at Location 1 + 20 meters (~0.00018 deg lat)
    const compB = await Complaint.create({
      complaintId: 'CIV-TEST-002',
      citizen: citizen._id,
      image: 'https://example.com/pothole2.jpg',
      category: testCat._id,
      categoryName: 'Pothole',
      priority: 'MEDIUM',
      location: { type: 'Point', coordinates: [77.5946, 12.97178] },
      address: 'MG Road Junction Test near curb',
      description: 'Big pothole same road',
      suggestedDepartment: testDept._id,
      assignedDepartment: testDept._id
    });

    const resB = await duplicateService.processDuplicate(compB);
    assert(resB.isDuplicate === true, 'Nearby second complaint within radius must be flagged duplicate');
    assert(resB.masterIssue !== null, 'Should link to or create MasterIssue');
    console.log(`✓ Duplicate Detection & MasterIssue clustering verified (Detected duplicate at ~${resB.distanceMeters}m)`);

    // 5. Test Quality-based Ranking System & Anti-Spam
    const initialPoints = citizen.points;
    const awardRes = await rankingService.awardPoints({
      userId: citizen._id,
      complaintId: compA._id,
      actionType: 'RESOLVED',
      customDescription: 'Test resolved issue'
    });

    assert(awardRes.pointsAwarded === 40, 'Resolved action must award +40 points');
    assert(awardRes.user.points === initialPoints + 40, 'User point total must accurately increase');
    console.log(`✓ Points Allocation Engine verified: ${initialPoints} -> ${awardRes.user.points} pts`);

    // Cleanup test complaints
    await Complaint.deleteMany({ complaintId: { $in: ['CIV-TEST-001', 'CIV-TEST-002'] } });
    if (resB.masterIssue) {
      await MasterIssue.findByIdAndDelete(resB.masterIssue._id);
    }

    console.log('\n=============================================');
    console.log(' ALL BACKEND & SERVICE TESTS PASSED 100%! ');
    console.log('=============================================\n');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  runTests();
}
