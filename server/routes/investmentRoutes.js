const express = require('express');
const router = express.Router();
const {
    createInvestment,
    getInvestments,
    getAllInvestments,
    updateInvestmentStatus
} = require('../controllers/investmentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createInvestment)
    .get(protect, getInvestments);

router.route('/all').get(protect, admin, getAllInvestments);
router.route('/:id').put(protect, admin, updateInvestmentStatus);

module.exports = router;
