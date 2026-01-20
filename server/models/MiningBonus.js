const mongoose = require('mongoose');

const miningBonusSchema = new mongoose.Schema({
    user_id: {
        type: String, // Storing as String to match other User references in this codebase
        required: true,
        ref: 'User'
    },
    amount: {
        type: Number, // int(11) in schema, Number in Mongoose handles int/float
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false // Schema has created_at, but not updated_at
});

module.exports = mongoose.model('MiningBonus', miningBonusSchema);
