const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createPayment,
    getPayments,
    getMyPayments,
    updatePaymentStatus
} = require('../controllers/paymentController');

router.route('/')
    .post(protect, createPayment)
    .get(protect, admin, getPayments);

router.route('/my')
    .get(protect, getMyPayments);

router.route('/:id')
    .put(protect, admin, updatePaymentStatus);

module.exports = router;
