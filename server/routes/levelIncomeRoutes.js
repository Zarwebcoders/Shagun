const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getMyLevelIncomes,
    getAllLevelIncomes,
    getDashboardStats,
    getAvailableWithdrawal
} = require('../controllers/levelIncomeController');

router.route('/')
    .get(protect, getMyLevelIncomes);

router.route('/dashboard')
    .get(protect, getDashboardStats);

router.route('/available')
    .get(protect, getAvailableWithdrawal);

router.route('/all')
    .get(protect, admin, getAllLevelIncomes);

module.exports = router;
