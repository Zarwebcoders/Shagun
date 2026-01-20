const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    addOrUpdateWallet,
    getMyWallet,
    getAllWallets,
    getWalletByUser
} = require('../controllers/walletController');

router.post('/', protect, addOrUpdateWallet);
router.get('/me', protect, getMyWallet);
router.get('/all', protect, admin, getAllWallets);
router.get('/user/:id', protect, admin, getWalletByUser);

module.exports = router;
