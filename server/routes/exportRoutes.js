const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { exportLevelIncome, exportReferralIncome, exportMiningHistory } = require('../controllers/exportController');

router.get('/level-income', protect, exportLevelIncome);
router.get('/referral-income', protect, exportReferralIncome);
router.get('/mining-history', protect, exportMiningHistory);

module.exports = router;
