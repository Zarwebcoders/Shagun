const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
    },
    // Required Schema Fields
    product_name: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    packag_type: { // Schema typo maintained
        type: String,
        default: 'Standard'
    },
    status: {
        type: Number, // 0: Rejected, 1: Approved, 2: Pending
        default: 2
    },
    transcation_id: { // Schema typo maintained
        type: String,
        required: true
    },
    cereate_at: { // Schema typo maintained
        type: Date,
        default: Date.now
    },
    update_at: { // Schema typo maintained
        type: Date,
        default: Date.now
    },

    // Additional Fields for Business Logic (mapped to snake_case for consistency)
    sponsor_id: {
        type: String,
        default: ""
    },
    payment_slip: {
        type: String, // Base64 or URL
        default: ""
    },
    business_volume: {
        type: Number,
        default: 0
    },
    daily_return: {
        type: Number,
        default: 0
    },
    daily_return_amount: {
        type: Number,
        default: 0
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    end_date: {
        type: Date
    },
    next_roi_date: {
        type: Date,
        default: Date.now
    },
    wallet_address: {
        type: String,
        default: ""
    }
}, {
    timestamps: false // We use cereate_at and update_at
});

// Middleware to update 'update_at' on save
productSchema.pre('save', function (next) {
    this.update_at = Date.now();
    next();
});

module.exports = mongoose.model('Product', productSchema);
