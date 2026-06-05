const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getMe, 
    forgotPassword, 
    resetPassword,
    setWithdrawalPin,
    verifyWithdrawalPin
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.post('/set-pin', protect, setWithdrawalPin);
router.post('/verify-pin', protect, verifyWithdrawalPin);

module.exports = router;
