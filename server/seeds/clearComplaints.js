/**
 * CivicAI Database Clear Utility
 * Clears all Complaints, MasterIssues, Escalations, and Notifications.
 * Preserves Users, Departments, Categories, and the complete Andhra Pradesh Geographic Hierarchy.
 */
const Complaint = require('../models/Complaint');
const MasterIssue = require('../models/MasterIssue');
const Escalation = require('../models/Escalation');
const Notification = require('../models/Notification');
const PointTransaction = require('../models/PointTransaction');
const User = require('../models/User');

async function clearAllProblems() {
  console.log('--- Clearing All Complaints & Problems (Setting Problem Count to 0) ---');

  const complaintRes = await Complaint.deleteMany({});
  console.log(`✓ Deleted ${complaintRes.deletedCount} complaints.`);

  const masterRes = await MasterIssue.deleteMany({});
  console.log(`✓ Deleted ${masterRes.deletedCount} master issues.`);

  const escRes = await Escalation.deleteMany({});
  console.log(`✓ Deleted ${escRes.deletedCount} escalations.`);

  const notifRes = await Notification.deleteMany({});
  console.log(`✓ Deleted ${notifRes.deletedCount} notifications.`);

  const ptRes = await PointTransaction.deleteMany({});
  console.log(`✓ Deleted ${ptRes.deletedCount} point transactions.`);

  // Reset Citizen reports counters to 0
  await User.updateMany(
    { role: 'CITIZEN' },
    {
      $set: {
        reportsCount: 0,
        validReportsCount: 0,
        resolvedReportsCount: 0
      }
    }
  );
  console.log('✓ Reset citizen problem report counters to 0.');

  console.log('===================================================================');
  console.log('  ALL PROBLEMS CLEARED SUCCESSFULLY — INBUILT STATE SET TO 0');
  console.log('===================================================================');
}

module.exports = { clearAllProblems };

if (require.main === module) {
  const { connectDB } = require('../config/db');
  require('dotenv').config();
  connectDB().then(async () => {
    await clearAllProblems();
    process.exit(0);
  });
}
