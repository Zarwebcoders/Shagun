const express = require('express');
const router = express.Router();
const {
    getTransactions,
    createTransaction,
    updateTransactionStatus,
    getTransactionStats,
    bulkUpdateTransactionStatus
} = require('../controllers/transactionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getTransactions)
    .post(protect, createTransaction);

router.route('/:id')
    .put(protect, admin, updateTransactionStatus);

router.put('/bulk/status', protect, admin, bulkUpdateTransactionStatus);

router.get('/stats', protect, admin, getTransactionStats);

module.exports = router;
