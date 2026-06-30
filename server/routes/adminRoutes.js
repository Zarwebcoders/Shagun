const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getReports,
    getPendingCounts,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getDashboardStats);
router.get('/reports', protect, admin, getReports);
router.get('/pending-counts', protect, admin, getPendingCounts);

module.exports = router;
