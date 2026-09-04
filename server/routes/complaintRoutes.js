const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  getNearbyComplaints,
  updateComplaintStatus,
  resolveComplaint,
  addOfficerNote
} = require('../controllers/complaintController');
const {
  createEscalation,
  extendSla,
  recordDelayReason
} = require('../controllers/escalationController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { ROLES } = require('../config/constants');

router.get('/nearby', getNearbyComplaints);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);

// Protected citizen & officer routes
router.post('/', protect, upload.single('image'), createComplaint);

// Citizen Escalation
router.post('/:id/escalate', protect, createEscalation);

// Officer and Admin routes
router.patch('/:id/status', protect, authorizeRoles(ROLES.OFFICER, ROLES.ADMIN), updateComplaintStatus);
router.post('/:id/resolve', protect, authorizeRoles(ROLES.OFFICER, ROLES.ADMIN), upload.single('afterImage'), resolveComplaint);
router.post('/:id/notes', protect, authorizeRoles(ROLES.OFFICER, ROLES.ADMIN), addOfficerNote);
router.post('/:id/extend-sla', protect, authorizeRoles(ROLES.OFFICER, ROLES.ADMIN), extendSla);
router.post('/:id/delay-reason', protect, authorizeRoles(ROLES.OFFICER, ROLES.ADMIN), recordDelayReason);

module.exports = router;
