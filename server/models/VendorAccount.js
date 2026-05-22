const mongoose = require('mongoose');

const vendorAccountSchema = new mongoose.Schema({
    vendor_id: {
        type: String,
        required: true
    },
    back_name: {
        type: String, // Bank Name
        required: true
    },
    back_code: {
        type: String, // Bank Code / IFSC
        required: true
    },
    acc_num: {
        type: String, // Account Number
        required: true
    },
    approve: {
        type: Number,
        default: 2 // 2: Pending, 1: Approved, 0: Rejected
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('VendorAccount', vendorAccountSchema);
