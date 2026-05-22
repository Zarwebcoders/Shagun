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
        default: 2
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Wallet', walletSchema);
