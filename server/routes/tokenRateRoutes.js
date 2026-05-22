const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { addRate, getRates, getLatestRate } = require('../controllers/tokenRateController');

router.post('/', protect, admin, addRate);
router.get('/all', protect, admin, getRates);
router.get('/latest', getLatestRate);

module.exports = router;
