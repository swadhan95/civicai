const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.get('/', getDepartments);
router.post('/', protect, authorizeRoles(ROLES.ADMIN), createDepartment);
router.put('/:id', protect, authorizeRoles(ROLES.ADMIN), updateDepartment);
router.delete('/:id', protect, authorizeRoles(ROLES.ADMIN), deleteDepartment);

module.exports = router;
