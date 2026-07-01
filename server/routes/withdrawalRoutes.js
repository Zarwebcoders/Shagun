const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
    updateWithdrawalStatus
} = require('../controllers/withdrawalController');

router.post('/', protect, createWithdrawal);
router.get('/me', protect, getMyWithdrawals);
router.get('/all', protect, admin, (req, res, next) => {
    // Never let browser/CDN cache the admin list — the server handles caching internally
    res.set('Cache-Control', 'no-store');
    next();
}, getAllWithdrawals);
router.put('/:id', protect, admin, updateWithdrawalStatus);

module.exports = router;
