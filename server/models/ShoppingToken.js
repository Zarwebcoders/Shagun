const mongoose = require('mongoose');

const shoppingTokenSchema = new mongoose.Schema({
    user_id: {
        type: Number,
        required: true,
        ref: 'User'
    },
    source: {
        type: String,
        required: true,
        maxLength: 200
    },
    amount: {
        type: Number,
        required: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('ShoppingToken', shoppingTokenSchema);
