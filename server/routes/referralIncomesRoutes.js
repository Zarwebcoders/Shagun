const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getMyReferrals, addReferralIncome } = require('../controllers/referralIncomesController');

router.get('/my-referrals', protect, getMyReferrals);
router.post('/', protect, admin, addReferralIncome);

module.exports = router;
