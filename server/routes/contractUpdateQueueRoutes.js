const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getQueue,
    addToQueue,
    updateQueueItem
} = require('../controllers/contractUpdateQueueController');

router.route('/')
    .get(protect, admin, getQueue)
    .post(protect, admin, addToQueue);

router.route('/:id')
    .put(protect, admin, updateQueueItem);

module.exports = router;
