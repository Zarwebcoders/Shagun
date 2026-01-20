const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getMyLevelIncomes,
    getAllLevelIncomes
} = require('../controllers/levelIncomeController');

router.route('/')
    .get(protect, getMyLevelIncomes);

router.route('/all')
    .get(protect, admin, getAllLevelIncomes);

module.exports = router;
