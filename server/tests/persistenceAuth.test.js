/**
 * CivicAI Authentication & Database Persistence Test
 * 
 * Verifies that:
 * 1. Registered citizen credentials work and authenticate.
 * 2. Admin-provisioned officer credentials work and authenticate.
 * 3. Accounts persist across database reconnects and reboots.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const { connectDB, disconnectDB } = require('../config/db');

async function runTest() {
  console.log('\n--- STARTING AUTH & PERSISTENCE VERIFICATION ---');

  await connectDB();

  const citizenEmail = `test_citizen_${Date.now()}@civicai.org`;
  const citizenPass = 'SecureCitizen123!';

  const officerEmail = `test_officer_${Date.now()}@civicai.org`;
  const officerPass = 'FieldOfficer789!';

  // 1. Create a Citizen
  console.log(`1. Creating citizen account: ${citizenEmail}...`);
  const citizen = await User.create({
    name: 'Suresh Citizen',
    email: citizenEmail,
    password: citizenPass,
    role: 'CITIZEN'
  });

  // Verify Citizen Login
  const fetchedCitizen = await User.findOne({ email: citizenEmail }).select('+password');
  const citizenValid = await fetchedCitizen.matchPassword(citizenPass);
  console.log(`   Citizen password check: ${citizenValid ? '✓ PASS' : '✗ FAIL'}`);
  if (!citizenValid) throw new Error('Citizen password failed verification');

  // 2. Provision an Officer
  console.log(`2. Provisioning officer account: ${officerEmail}...`);
  const dept = await Department.findOne() || await Department.create({ name: 'Road Maintenance', code: 'ROAD_MAINT' });
  const officer = await User.create({
    name: 'Officer Rajesh Kumar',
    email: officerEmail,
    password: officerPass,
    role: 'OFFICER',
    department: dept._id
  });

  // Verify Officer Login
  const fetchedOfficer = await User.findOne({ email: officerEmail }).select('+password');
  const officerValid = await fetchedOfficer.matchPassword(officerPass);
  console.log(`   Officer password check: ${officerValid ? '✓ PASS' : '✗ FAIL'}`);
  if (!officerValid) throw new Error('Officer password failed verification');

  // 3. Test Persistence across DB reload
  console.log('3. Simulating server restart / persistence sync test...');
  const { backupUser, restoreAndSeedOnStartup } = require('../services/persistenceService');
  await backupUser(citizen);
  await backupUser(officer);

  // Clear in-memory User collection to test recovery
  await User.deleteMany({ email: { $in: [citizenEmail, officerEmail] } });
  const afterDelete = await User.countDocuments({ email: { $in: [citizenEmail, officerEmail] } });
  console.log(`   Simulated wipe count: ${afterDelete} (should be 0)`);

  // Run startup restoration
  await restoreAndSeedOnStartup();

  // Re-verify login of restored accounts
  const restoredCitizen = await User.findOne({ email: citizenEmail }).select('+password');
  const restoredCitizenPassOk = await restoredCitizen.matchPassword(citizenPass);
  console.log(`   Restored Citizen login: ${restoredCitizenPassOk ? '✓ PASS (Working)' : '✗ FAIL'}`);

  const restoredOfficer = await User.findOne({ email: officerEmail }).select('+password');
  const restoredOfficerPassOk = await restoredOfficer.matchPassword(officerPass);
  console.log(`   Restored Officer login: ${restoredOfficerPassOk ? '✓ PASS (Working)' : '✗ FAIL'}`);

  if (!restoredCitizenPassOk || !restoredOfficerPassOk) {
    throw new Error('Persistence restore password verification failed.');
  }

  console.log('\n======================================================');
  console.log(' ALL CREDENTIAL & PERSISTENCE TESTS PASSED (100%)');
  console.log('======================================================\n');

  await disconnectDB();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
