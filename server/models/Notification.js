const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['product', 'kyc', 'withdrawal', 'referral', 'income', 'general'],
        default: 'general'
    },
    path: {
        type: String,
        default: ''
    },
    is_seen: {
        type: Boolean,
        default: false
    },
    is_read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

notificationSchema.index({ user_id: 1, createdAt: -1 });
notificationSchema.index({ user_id: 1, is_seen: 1 });
notificationSchema.index({ user_id: 1, is_read: 1 });

notificationSchema.post('save', async function(doc) {
    try {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(doc.user_id, {
            $inc: { unreadNotificationsCount: 1 }
        });
    } catch (err) {
        console.error('Error incrementing unread count:', err);
    }
});

notificationSchema.post('insertMany', async function(docs) {
    try {
        const User = mongoose.model('User');
        const increments = {};
        docs.forEach(doc => {
            if (doc.user_id) {
                const uid = doc.user_id.toString();
                increments[uid] = (increments[uid] || 0) + 1;
            }
        });
        for (const [uid, inc] of Object.entries(increments)) {
            await User.findByIdAndUpdate(uid, {
                $inc: { unreadNotificationsCount: inc }
            });
        }
    } catch (err) {
        console.error('Error incrementing unread count in insertMany:', err);
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
