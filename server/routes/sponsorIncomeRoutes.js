const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getMyIncome, addIncome } = require('../controllers/sponsorIncomeController');

router.get('/my-income', protect, getMyIncome);
router.post('/', protect, admin, addIncome);

module.exports = router;
