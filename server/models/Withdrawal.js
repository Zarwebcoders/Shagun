const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    withdraw_type: {
        type: String,
        required: true
    },
    approve: {
        type: Number,
        default: 2 // 2: Pending, 1: Approved, 0: Rejected
    }
}, {
    timestamps: { createdAt: 'create_at', updatedAt: 'update_at' }
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
