const mongoose = require('mongoose');

const levelIncomeSchema = new mongoose.Schema({
    user_id: {
        type: String, // Matching User Model Ref
        required: true,
        ref: 'User'
    },
    from_user_id: {
        type: String, // Matching User Model Ref
        required: true,
        ref: 'User'
    },
    level: {
        type: Number,
        required: true
    },
    amount: {
        type: Number, // decimal(10,4)
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    cycle: {
        type: Number,
        default: null
    },
    distribution_id: {
        type: Number,
        default: null
    },
    product_id: {
        type: String, // String for internal consistency if Product IDs are ObjectId/Strings
        default: null
    },
    staked_tokens: {
        type: Number, // decimal(15,4)
        default: 0.0000
    },
    create_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: false // Schema has custom timestamps
});

module.exports = mongoose.model('LevelIncome', levelIncomeSchema);
