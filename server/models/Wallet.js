const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    wallet_add: {
        type: String,
    },
    approve: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

walletSchema.index({ user_id: 1 });
walletSchema.index({ approve: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
