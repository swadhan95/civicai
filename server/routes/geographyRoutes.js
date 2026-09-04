const express = require('express');
const router = express.Router();
const {
  getRootRegions,
  getRegionById,
  getChildRegions,
  getRegionStatistics,
  getRegionMatrix,
  getRegionProblems,
  searchRegions
} = require('../controllers/geographyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/root', getRootRegions);
router.get('/search', searchRegions);
router.get('/:id', getRegionById);
router.get('/:id/children', getChildRegions);
router.get('/:id/statistics', getRegionStatistics);
router.get('/:id/matrix', getRegionMatrix);
router.get('/:id/problems', getRegionProblems);

module.exports = router;
