const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    user_id: {
        user_id: {
            type: String,
            required: true
        },
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
        type: String,
        default: "2" // 2: Pending, 1: Approved, 0: Rejected
    }
}, {
    timestamps: { createdAt: 'create_at', updatedAt: 'update_at' }
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
