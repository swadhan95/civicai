const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/officerController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);
router.use(authorizeRoles(ROLES.OFFICER, ROLES.ADMIN));

router.get('/stats', getDashboardStats);

module.exports = router;
