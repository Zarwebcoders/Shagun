const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    addBankDetails,
    getBankDetails,
    getAllBankRequests,
    updateBankStatus
} = require('../controllers/myAccountController');

router.route('/')
    .post(protect, addBankDetails)
    .get(protect, getBankDetails);

router.route('/all')
    .get(protect, admin, getAllBankRequests);

router.route('/:id')
    .put(protect, admin, updateBankStatus);

module.exports = router;
