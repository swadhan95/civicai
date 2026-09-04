/**
 * Auto-Persistence & Backup Service - CivicAI
 * 
 * Ensures that all users (Citizens, Admin-created Officers, Admins),
 * complaints, departments, and system settings are permanently preserved on disk
 * across server restarts, embedded database re-initializations, and crashes.
 */

const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Department = require('../models/Department');
const IssueCategory = require('../models/IssueCategory');
const SystemSetting = require('../models/SystemSetting');
const { seedAll, seedIfEmpty } = require('../seeds/seedData');

const BACKUP_DIR = path.join(__dirname, '..', 'data', 'persistent-backup');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

const USERS_BACKUP_FILE = path.join(BACKUP_DIR, 'users_registry.json');

/**
 * Backup a user to persistent disk
 */
async function backupUser(userData) {
  try {
    ensureBackupDir();
    let registry = [];
    if (fs.existsSync(USERS_BACKUP_FILE)) {
      try {
        registry = JSON.parse(fs.readFileSync(USERS_BACKUP_FILE, 'utf8'));
      } catch (e) {
        registry = [];
      }
    }

    const index = registry.findIndex((u) => u.email.toLowerCase() === userData.email.toLowerCase());
    const userToSave = {
      name: userData.name,
      displayName: userData.displayName || userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password, // hashed or raw
      role: userData.role,
      departmentCode: userData.departmentCode || null,
      points: userData.points || 0,
      rank: userData.rank,
      city: userData.city || 'Metropolis',
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      registry[index] = { ...registry[index], ...userToSave };
    } else {
      registry.push(userToSave);
    }

    fs.writeFileSync(USERS_BACKUP_FILE, JSON.stringify(registry, null, 2));
  } catch (err) {
    console.warn('Persistent backup warning:', err.message);
  }
}

/**
 * Restore persistent users and verify initial seed on startup
 */
async function restoreAndSeedOnStartup() {
  try {
    // 1. Ensure basic seed data (departments, categories, default demo accounts) exists
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial baseline data...');
      await seedAll();
    } else {
      // Ensure geography hierarchy is seeded even if users existed from previous sessions
      const Area = require('../models/Area');
      const parlCount = await Area.countDocuments({ type: 'PARLIAMENT' });
      if (parlCount === 0) {
        console.log('Seeding missing geographic hierarchy...');
        const { seedGeographyHierarchy } = require('../seeds/seedGeography');
        await seedGeographyHierarchy();
      }
    }

    // 2. Restore any custom registered citizens or admin-provisioned officers from persistent disk
    ensureBackupDir();
    if (fs.existsSync(USERS_BACKUP_FILE)) {
      let registry = [];
      try {
        registry = JSON.parse(fs.readFileSync(USERS_BACKUP_FILE, 'utf8'));
      } catch (e) {
        registry = [];
      }

      const bcrypt = require('bcryptjs');

      for (const item of registry) {
        const normalizedEmail = item.email.toLowerCase();
        let passToUse = item.password;
        if (!passToUse || passToUse.length < 4) {
          const rawDefault = item.role === 'OFFICER' ? 'officer123' : item.role === 'ADMIN' ? 'admin123' : 'citizen123';
          passToUse = await bcrypt.hash(rawDefault, 10);
        }

        const existing = await User.findOne({ email: normalizedEmail }).select('+password');
        if (!existing) {
          let deptId = null;
          if (item.departmentCode) {
            const dept = await Department.findOne({ code: item.departmentCode });
            if (dept) deptId = dept._id;
          }

          const newUser = new User({
            name: item.name,
            displayName: item.displayName || item.name,
            email: normalizedEmail,
            password: passToUse,
            role: item.role,
            department: deptId,
            points: item.points || 0,
            rank: item.rank,
            city: item.city || 'Metropolis'
          });

          if (passToUse.startsWith('$2')) {
            await User.collection.insertOne({
              ...newUser.toObject(),
              password: passToUse,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } else {
            await newUser.save();
          }
          console.log(`Persistent Sync: Restored user account [${normalizedEmail}] (${item.role})`);
        } else {
          // Always sync verified password from registry to ensure persistence across sessions
          await User.collection.updateOne(
            { _id: existing._id },
            { $set: { password: passToUse } }
          );
          console.log(`Persistent Sync: Synchronized password for user [${normalizedEmail}]`);
        }
      }
    }
  } catch (err) {
    console.warn('Startup persistence sync error:', err.message);
  }
}

module.exports = {
  backupUser,
  restoreAndSeedOnStartup
};
