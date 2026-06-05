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

notificationSchema.index({ user_id: 1, is_seen: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
