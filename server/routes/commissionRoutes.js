const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getMyCommissions,
    getAllCommissions
} = require('../controllers/commissionController');

router.get('/', protect, admin, getAllCommissions);
router.get('/my-commissions', protect, getMyCommissions);

module.exports = router;
