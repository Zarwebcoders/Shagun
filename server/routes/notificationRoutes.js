const express = require('express');
const router = express.Router();
const {
    getMyNotifications,
    getUnseenCount,
    markAllAsSeen,
    markAsRead,
    sendNotification
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyNotifications);
router.get('/unseen-count', getUnseenCount);
router.put('/mark-seen', markAllAsSeen);
router.put('/:id/read', markAsRead);
router.post('/send', admin, sendNotification);

module.exports = router;
