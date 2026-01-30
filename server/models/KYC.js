const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
    user_id: {
        type: String, // Matching User Model Ref (String/ObjectId)
        required: true,
        ref: 'User',
        unique: true
    },
    aadharcard: {
        type: String, // Front Image URL
        required: true
    },
    aadhar_back: {
        type: String, // Back Image URL
        required: true
    },
    pancard: {
        type: String, // PAN Image URL
        required: true
    },
    agreement: {
        type: String, // Agreement Image URL
        default: ""
    },
    approval: {
        type: Number, // 0: Rejected, 1: Approved, 2: Pending
        default: 2
    },
    aadhar: {
        type: String, // Aadhar Number
        required: true
    },
    pan: {
        type: String, // PAN Number
        required: true
    }
}, {
    timestamps: true // Schema doesn't explicitly show timestamps but usually good to have. Schema didn't forbid created_at.
});

module.exports = mongoose.model('KYC', kycSchema);
