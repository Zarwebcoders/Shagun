const express = require('express');
const router = express.Router();
const { getLevelIncome, getReferralIncome } = require('../controllers/incomeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/level-income', protect, getLevelIncome);
router.get('/referral-income', protect, getReferralIncome);

module.exports = router;
