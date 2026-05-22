const mongoose = require('mongoose');

const vendorKYCSchema = new mongoose.Schema({
    vendor_id: {
        type: String,
        required: true
    },
    aadharcard: {
        type: String, // Front Image - Base64
        default: ""
    },
    aadhar_back: {
        type: String, // Back Image - Base64
        default: ""
    },
    pancard: {
        type: String, // Pan Image - Base64
        default: ""
    },
    agreement: {
        type: String, // Agreement Image/Doc - Base64
        default: ""
    },
    approval: {
        type: Number,
        default: 2 // 2: Pending, 1: Approved, 0: Rejected
    },
    aadhar: {
        type: String, // Number
        required: true
    },
    pan: {
        type: String, // Number
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('VendorKYC', vendorKYCSchema);
