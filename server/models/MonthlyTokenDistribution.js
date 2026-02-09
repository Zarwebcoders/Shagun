const mongoose = require('mongoose');

const monthlyTokenDistributionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    from_purchase_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    from_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // The user who made the purchase
    },
    level: {
        type: Number,
        required: true,
        min: 1,
        max: 25
    },
    monthly_amount: {
        type: Number,
        required: true
    },
    month_number: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    scheduled_date: {
        type: Date,
        required: true
    },
    paid_date: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
monthlyTokenDistributionSchema.index({ user_id: 1, status: 1 });
monthlyTokenDistributionSchema.index({ scheduled_date: 1, status: 1 });

module.exports = mongoose.model('MonthlyTokenDistribution', monthlyTokenDistributionSchema);
