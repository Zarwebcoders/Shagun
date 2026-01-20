const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { createVendor, getVendors, updateVendor, getVendorByVendorId } = require('../controllers/vendorController');

router.post('/', createVendor);
router.get('/all', protect, admin, getVendors);
router.put('/:id', protect, admin, updateVendor);
router.get('/:vendor_id', getVendorByVendorId); // Public for now to fetch profile by ID

module.exports = router;
