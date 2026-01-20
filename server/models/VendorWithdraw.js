const mongoose = require('mongoose');

const vendorWithdrawSchema = new mongoose.Schema({
    vendor_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    approve: {
        type: Number,
        default: 2 // 2: Pending, 1: Approved, 0: Rejected
    }
}, {
    timestamps: { createdAt: 'create_at', updatedAt: 'update_at' }
});

module.exports = mongoose.model('VendorWithdraw', vendorWithdrawSchema);
