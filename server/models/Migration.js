const mongoose = require('mongoose');

const migrationSchema = new mongoose.Schema({
    version: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    group: {
        type: String,
        required: true
    },
    namespace: {
        type: String,
        required: true
    },
    time: {
        type: Number, // int(11) - Unix timestamp
        required: true
    },
    batch: {
        type: Number, // int(11)
        required: true
    }
}, {
    timestamps: false // Using 'time' field as per schema
});

module.exports = mongoose.model('Migration', migrationSchema);
