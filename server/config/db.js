const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let mongoServerInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`Connecting to MongoDB at: ${uri}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('MongoDB connected successfully via MONGODB_URI.');
      const { restoreAndSeedOnStartup } = require('../services/persistenceService');
      await restoreAndSeedOnStartup();
      return;
    } catch (err) {
      console.warn(`Could not connect to configured MONGODB_URI (${err.message}). Falling back to embedded Mongo engine...`);
    }
  }

  // Fallback: Use MongoMemoryServer with persistent db directory
  const dbPath = path.join(__dirname, '..', 'data', 'embedded-db');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  // Clean stale lock file if left over from a previous killed process
  const lockFile = path.join(dbPath, 'mongod.lock');
  if (fs.existsSync(lockFile)) {
    try {
      fs.unlinkSync(lockFile);
    } catch (e) {
      // ignore
    }
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Starting embedded MongoDB engine for seamless development...');
    mongoServerInstance = await MongoMemoryServer.create({
      instance: {
        dbPath: dbPath,
        storageEngine: 'wiredTiger'
      }
    });

    const memoryUri = mongoServerInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Embedded MongoDB connected successfully at ${memoryUri}`);
    const { restoreAndSeedOnStartup } = require('../services/persistenceService');
    await restoreAndSeedOnStartup();
  } catch (embeddedErr) {
    console.warn(`Persistent embedded engine warning (${embeddedErr.message}). Starting standard in-memory database with persistent disk sync...`);
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServerInstance = await MongoMemoryServer.create();
    const fallbackUri = mongoServerInstance.getUri();
    await mongoose.connect(fallbackUri);
    console.log(`In-memory MongoDB connected successfully at ${fallbackUri}`);
    const { restoreAndSeedOnStartup } = require('../services/persistenceService');
    await restoreAndSeedOnStartup();
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServerInstance) {
    await mongoServerInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
