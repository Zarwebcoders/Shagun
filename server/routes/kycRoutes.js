const express = require('express');
const router = express.Router();
const {
    submitKYC,
    getPendingKYC,
    updateKYCStatus,
} = require('../controllers/kycController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, submitKYC);
router.get('/pending', protect, admin, getPendingKYC);
router.put('/:id', protect, admin, updateKYCStatus);

module.exports = router;
