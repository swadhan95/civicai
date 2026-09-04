const express = require('express');
const router = express.Router();
const {
  createEscalation,
  getEscalations,
  getEscalationById,
  updateEscalationStatus,
  extendSla,
  recordDelayReason,
  getSlaMetrics
} = require('../controllers/escalationController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

// Escalation list & SLA metrics
router.get('/', authorizeRoles(ROLES.OFFICER, ROLES.ADMIN), getEscalations);
router.get('/metrics', authorizeRoles(ROLES.ADMIN), getSlaMetrics);
router.get('/:id', getEscalationById);

// Escalation status updates & administrative actions
router.patch('/:id/status', authorizeRoles(ROLES.OFFICER, ROLES.ADMIN), updateEscalationStatus);
router.put('/:id/status', authorizeRoles(ROLES.OFFICER, ROLES.ADMIN), updateEscalationStatus);

module.exports = router;
