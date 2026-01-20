const mongoose = require('mongoose');

const vendorWalletSchema = new mongoose.Schema({
    vendor_id: {
        type: String,
        required: true
    },
    wallet_add: {
        type: String,
        required: true
    },
    approve: {
        type: Number,
        default: 2 // 2: Pending, 1: Approved, 0: Rejected
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('VendorWallet', vendorWalletSchema);
