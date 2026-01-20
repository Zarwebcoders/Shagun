const mongoose = require('mongoose');

const sponsorIncomeSchema = new mongoose.Schema({
    user_id: {
        type: Number,
        required: true,
        ref: 'User' // Assuming User model has numerical IDs or we will adjust if ObjectId
    },
    from_user_id: {
        type: Number,
        required: true,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('SponsorIncome', sponsorIncomeSchema);
