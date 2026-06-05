const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
    from_user_id: {
        type: String, // Referencing User (String for compatibility)
        required: true,
        ref: 'User'
    },
    to_user_id: {
        type: String, // Referencing User
        required: true,
        ref: 'User'
    },
    level: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    stake_amount: {
        type: Number,
        default: null
    },
    tx_hash: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false // Using custom created_at
});

module.exports = mongoose.model('Commission', commissionSchema);
