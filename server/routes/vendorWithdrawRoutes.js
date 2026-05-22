const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createRequest,
    getAllRequests,
    updateStatus
} = require('../controllers/vendorWithdrawController');

router.post('/', createRequest); // Public for now to allow any inputs, or can be protected if needed
router.get('/all', protect, admin, getAllRequests);
router.put('/:id', protect, admin, updateStatus);

module.exports = router;
