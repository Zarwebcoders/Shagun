const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getDownline,
    mineTokens,
    getMiningHistory
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, getUsers);
router.get('/downline', protect, getDownline);
router.post('/mine', protect, mineTokens);
router.get('/mining-history', protect, getMiningHistory);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
