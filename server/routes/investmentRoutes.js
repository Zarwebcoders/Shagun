const express = require('express');
const router = express.Router();
const { createInvestment, getInvestments } = require('../controllers/investmentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createInvestment)
    .get(protect, getInvestments);

module.exports = router;
