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
router.get('/all', protect, admin, getAllWithdrawals);
router.put('/:id', protect, admin, updateWithdrawalStatus);

module.exports = router;
