const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getMyMonthlyTokens,
    getAllMonthlyTokens,
    processMonthlyDistributions
} = require('../controllers/monthlyTokenController');

// User routes
router.get('/', protect, getMyMonthlyTokens);

// Admin routes
router.get('/all', protect, admin, getAllMonthlyTokens);
router.post('/process', protect, admin, processMonthlyDistributions);

module.exports = router;
