const express = require('express');
const router = express.Router();
const {
    getTransactions,
    createTransaction,
    updateTransactionStatus,
} = require('../controllers/transactionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getTransactions)
    .post(protect, createTransaction);

router.route('/:id')
    .put(protect, admin, updateTransactionStatus);

module.exports = router;
