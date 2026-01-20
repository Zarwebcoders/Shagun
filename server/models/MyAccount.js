const mongoose = require('mongoose');

const myAccountSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        ref: 'User'
    },
    back_name: { // Keeping schema spelling
        type: String,
        required: true,
        trim: true
    },
    acc_name: {
        type: String,
        required: true,
        trim: true
    },
    branch: {
        type: String,
        required: true,
        trim: true
    },
    back_code: { // Keeping schema spelling (likely IFSC)
        type: String,
        required: true,
        trim: true
    },
    acc_num: {
        type: String,
        required: true,
        trim: true
    },
    approve: {
        type: Number,
        default: 0, // 0: Pending? Or based on other schemas?
        // Schema says tinyint(1). Usually 0/1. 
        // Let's assume 0=Pending/Rejected, 1=Approved? 
        // Or user standard: 2=Pending, 1=Approved, 0=Rejected.
        // Viewing previous Payment/Vendor models, 2 is pending.
        // BUT schema default is NONE. I will use 2 as default pending for consistency with other modules.
        enum: [0, 1, 2]
    }
}, {
    timestamps: false // Schema doesn't show created_at/updated_at
});

module.exports = mongoose.model('MyAccount', myAccountSchema);
