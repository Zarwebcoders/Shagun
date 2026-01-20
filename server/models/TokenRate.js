const mongoose = require('mongoose');

const tokenRateSchema = new mongoose.Schema({
    phase: {
        type: Number,
        required: true
    },
    rate: {
        type: Number,
        required: true
    },
    phase_number: {
        type: Number,
        default: null
    },
    source: {
        type: String,
        default: 'contract_getCurrentPhase',
        maxLength: 100
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('TokenRate', tokenRateSchema);
