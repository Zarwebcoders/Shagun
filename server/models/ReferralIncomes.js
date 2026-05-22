const mongoose = require('mongoose');

const referralIncomesSchema = new mongoose.Schema({
    earner_user_id: {
        type: String,
        required: true,
        ref: 'User'
    },
    referred_user_id: {
        type: String,
        required: true,
        ref: 'User'
    },
    product_id: {
        type: String,
        default: null
    },
    product_transcation_id: { // Keeping the spelling exactly as requested
        type: String,
        default: null,
        maxLength: 255
    },
    amount: {
        type: Number, // Decimal(14,2)
        required: true
    },
    percentage: {
        type: Number, // Decimal(5,2)
        default: 8.00
    },
    referral_amount: {
        type: Number, // Decimal(14,2)
        default: 0.00
    },
    status: {
        type: String,
        default: 'credited',
        maxLength: 32
    }
}, {
    timestamps: { createdAt: 'create_at', updatedAt: false } // Only create_at as per schema
});

module.exports = mongoose.model('ReferralIncomes', referralIncomesSchema);
