require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { checkAndFlagOverdueComplaints } = require('./services/slaService');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5001;

// Connect to Database
connectDB().then(async () => {
  // Auto-seed initial categories, departments, and demo users if empty
  try {
    const { seedIfEmpty } = require('./seeds/seedData');
    await seedIfEmpty();

    // Run initial SLA breach scan on startup
    await checkAndFlagOverdueComplaints();

    // Recurring SLA worker check every 60 seconds
    if (process.env.NODE_ENV !== 'test') {
      setInterval(async () => {
        await checkAndFlagOverdueComplaints();
      }, 60000);
    }
  } catch (seedErr) {
    console.warn('Auto-seed check notice:', seedErr.message);
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root & Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'CivicAI API Service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Modular Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/escalations', require('./routes/escalationRoutes'));
app.use('/api/officer', require('./routes/officerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/geography', require('./routes/geographyRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Centralized Error Handler
app.use(errorHandler);

// Start listening if not required by tests
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` CivicAI Server running on port ${PORT}`);
    console.log(` Health: http://localhost:${PORT}/api/health`);
    console.log(` Mode:   ${process.env.NODE_ENV || 'development'}`);
    console.log(`=========================================`);
  });
}

module.exports = app;
