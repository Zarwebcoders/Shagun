const express = require('express');
const router = express.Router();
const { getReports } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, getReports);

module.exports = router;
