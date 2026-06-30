const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { addAccount, getAccounts, updateStatus } = require('../controllers/vendorAccountController');

router.post('/', addAccount);
router.get('/all', protect, admin, getAccounts);
router.put('/:id', protect, admin, updateStatus);

module.exports = router;
