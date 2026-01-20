const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // Standard ID field will be _id (auto)

    transaction_id: {
        type: String,
        required: true,
        // unique: true // Assuming unique, but schema didn't explicitly show index key on column view (though likely is)
    },
    user_id: {
        type: String, // Schema says int(10) but project uses String IDs usually. keeping String for internal consistency.
        required: true
    },
    amount: {
        type: Number, // decimal(10,2)
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    approve: {
        type: Number, // tinyint(1)
        default: 2, // 2 = Pending
        enum: [0, 1, 2] // 0: Rejected, 1: Approved, 2: Pending
    },
    vendor_id: {
        type: String, // varchar(255)
        default: ""
    }
}, {
    timestamps: false // We use created_at specifically, no updated_at needed per schema
});

module.exports = mongoose.model('Payment', paymentSchema);
