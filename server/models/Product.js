const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
    },
    // Required Schema Fields matching products.json
    transcation_id: {
        type: String,
        required: true
    },
    w2_transaction_id: {
        type: String,
        default: ""
    },
    packag_type: { // Matches JSON spelling
        type: String,
        default: 'Standard'
    },
    product_id: {
        type: Number,
        min: 1,
        max: 4 // 1: Milkish Herbal, 2: Petro, 3: Smart Home, 4: Shagun EV
    },
    token_value: {
        type: Number // 10000 for products 1-3, 20000 for product 4
    },
    amount: {
        type: Number,
        required: true
    },
    token_amount: {
        type: Number,
        default: 0
    },
    wallet_address: {
        type: String,
        default: ""
    },
    approvel: { // Matches JSON spelling
        type: Number,
        default: 0
    },
    cereate_at: { // Matches JSON spelling
        type: Date,
        default: Date.now
    },
    update_at: { // Matches JSON spelling
        type: Date,
        default: Date.now
    },
    quantity: {
        type: Number,
        default: 1
    },
    approve: { // Matches JSON spelling (seems duplicate of approvel but present in data)
        type: Number,
        default: 0
    },
    next_commission_date: {
        type: Date,
        default: null
    },
    cycle_count: {
        type: Number,
        default: 0
    },
    total_cycles: {
        type: Number,
        default: 24
    },
    // Keeping logic fields that might be useful but are not in JSON explicitly or mapped
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
    }
}, {
    timestamps: false // We use cereate_at and update_at
});

// Middleware removed to fix 'next is not a function' error with Mongoose 9? 
// update_at is handled manually or by timestamps if enabled.

module.exports = mongoose.model('Product', productSchema);
