const express = require('express');
const router = express.Router();
const {
    submitKYC,
    getPendingKYC,
    getMyKYC,
    updateKYCStatus,
    getKYCStats,
    getKYCHistory,
    getKYCDetails,
} = require('../controllers/kycController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, submitKYC);
router.get('/pending', protect, admin, getPendingKYC);
router.get('/history', protect, admin, getKYCHistory);
router.get('/stats', protect, admin, getKYCStats);
router.get('/me', protect, getMyKYC);
router.get('/:id', protect, admin, getKYCDetails);
router.put('/:id', protect, admin, updateKYCStatus);

module.exports = router;
