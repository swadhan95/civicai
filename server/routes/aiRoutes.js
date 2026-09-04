const express = require('express');
const router = express.Router();
const {
  analyzeImage,
  verifyResolution,
  getStatus,
  setApiKey
} = require('../controllers/aiController');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.get('/status', getStatus);
router.post('/set-key', setApiKey);
router.post('/analyze', upload.single('image'), analyzeImage);
router.post(
  '/verify-resolution',
  protect,
  authorizeRoles(ROLES.OFFICER, ROLES.ADMIN),
  upload.single('afterImage'),
  verifyResolution
);

module.exports = router;
