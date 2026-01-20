const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { addWallet, getWallets, updateStatus } = require('../controllers/vendorWalletController');

router.post('/', addWallet);
router.get('/all', protect, admin, getWallets);
router.put('/:id', protect, admin, updateStatus);

module.exports = router;
