const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    payable_amount: {
        type: Number,
        required: true
    },
    withdraw_type: {
        type: String,
        required: true
    },
    source: {
        type: String,
        default: 'Level Income'
    },
    method: {
        type: String,
        default: 'Bank Transfer'
    },
    bankDetails: {
        type: Object,
        default: null
    },
    approve: {
        type: String,
        default: "2" // 2: Pending, 1: Approved, 0: Rejected
    },
    onchain_tx_hash: {
        type: String,
        default: ""
    },
    token_rate: {
        type: Number,
        default: null
    },
    remark: {
        type: String,
        default: ""
    }
}, {
    timestamps: { createdAt: 'create_at', updatedAt: 'update_at' }
});

withdrawalSchema.index({ user_id: 1 });
// Equality-first compound indexes: status → sort, type+status → sort
withdrawalSchema.index({ approve: 1, create_at: -1 });
withdrawalSchema.index({ withdraw_type: 1, approve: 1, create_at: -1 });
withdrawalSchema.index({ create_at: -1 }); // fallback for unfiltered sorts

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
