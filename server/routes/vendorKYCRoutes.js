const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { submitKYC, getAllKYC, updateStatus } = require('../controllers/vendorKYCController');

// Allow public submission or protect if vendor login logic exists. Using public for flexible vendor_id input as requested previously.
router.post('/', submitKYC);
router.get('/all', protect, admin, getAllKYC);
router.put('/:id', protect, admin, updateStatus);

module.exports = router;
