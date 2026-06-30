const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    vendor_id: {
        type: String,
        required: true,
        unique: true
    },
    full_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    acceptance_percentage: {
        type: Number,
        default: 0
    },
    settlement_cycle: {
        type: Number,
        default: 0
    }
}, {
    timestamps: { createdAt: 'create_at', updatedAt: 'update_at' }
});

module.exports = mongoose.model('Vendor', vendorSchema);
