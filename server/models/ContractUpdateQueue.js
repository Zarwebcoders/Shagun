const mongoose = require('mongoose');

const contractUpdateQueueSchema = new mongoose.Schema({
    rate: {
        type: String,
        required: true
    },
    phase: {
        type: String,
        default: null
    },
    target_contract: {
        type: String,
        default: null
    },
    status: {
        type: String,
        default: 'queued'
    },
    output: {
        type: String,
        default: null
    },
    tx_hash: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false // We use custom created_at/updated_at
});

// Updateting updated_at on save
contractUpdateQueueSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model('ContractUpdateQueue', contractUpdateQueueSchema);
