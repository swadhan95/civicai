const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.get('/', getCategories);
router.post('/', protect, authorizeRoles(ROLES.ADMIN), createCategory);
router.put('/:id', protect, authorizeRoles(ROLES.ADMIN), updateCategory);
router.delete('/:id', protect, authorizeRoles(ROLES.ADMIN), deleteCategory);

module.exports = router;
