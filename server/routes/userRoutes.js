const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getDownline,
    mineTokens,
    getMiningHistory,
    checkSponsor,
    impersonateUser,
    getDashboardSummary
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/check-sponsor/:referralId', checkSponsor);
router.get('/', protect, admin, getUsers);
router.get('/dashboard-summary', protect, getDashboardSummary);
router.get('/downline', protect, getDownline);
router.post('/mine', protect, mineTokens);
router.get('/mining-history', protect, getMiningHistory);
router.post('/:id/impersonate', protect, admin, impersonateUser);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
