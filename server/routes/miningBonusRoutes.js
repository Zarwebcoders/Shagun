const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getMyMiningBonuses,
    getAllMiningBonuses,
    createMiningBonus
} = require('../controllers/miningBonusController');

router.route('/')
    .get(protect, getMyMiningBonuses)
    .post(protect, admin, createMiningBonus);

router.route('/all')
    .get(protect, admin, getAllMiningBonuses);

module.exports = router;
