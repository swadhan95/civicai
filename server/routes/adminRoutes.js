const express = require('express');
const router = express.Router();
const {
  getOverview,
  getMasterMonitoring,
  getAnalytics,
  getAreas,
  createArea,
  updateArea,
  deleteArea,
  getOfficersManagement,
  updateOfficerDetails,
  reassignComplaint,
  getDepartmentsManagement,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getUsersManagement,
  toggleUserStatus,
  updateUserRole,
  getDepartmentDashboards,
  getUsers,
  createOfficer,
  updateUser,
  getSettings,
  updateSettings,
  getPointAuditLogs
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);
router.use(authorizeRoles(ROLES.ADMIN));

// 1. Master Monitoring & Analytics
router.get('/overview', getOverview);
router.get('/master-monitoring', getMasterMonitoring);
router.get('/analytics', getAnalytics);

// 2. Area Management
router.get('/areas', getAreas);
router.post('/areas', createArea);
router.put('/areas/:id', updateArea);
router.delete('/areas/:id', deleteArea);

// 3. Officer Management
router.get('/officers-management', getOfficersManagement);
router.put('/officers/:id', updateOfficerDetails);
router.post('/reassign-complaint', reassignComplaint);

// 4. Department Management
router.get('/departments-management', getDepartmentsManagement);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// 5. User Management & Governance
router.get('/users-management', getUsersManagement);
router.put('/users/:id/status', toggleUserStatus);
router.put('/users/:id/role', updateUserRole);

// Legacy & Settings endpoints (preserved)
router.get('/departments-dashboard', getDepartmentDashboards);
router.get('/users', getUsers);
router.post('/officers', createOfficer);
router.patch('/users/:id', updateUser);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/audit-points', getPointAuditLogs);

module.exports = router;
