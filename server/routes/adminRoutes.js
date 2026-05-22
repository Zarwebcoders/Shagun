const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getReports,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getDashboardStats);
router.get('/reports', protect, admin, getReports);

module.exports = router;
