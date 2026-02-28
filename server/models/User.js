const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    user_id: {
        type: String,
        // required: true, // Optional: logic to generate this? leaving optional for now or auto-generated
    },
    id: {
        type: String, // Legacy ID support
    },
    full_name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        // unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    mobile: {
        type: String,
        default: "",
    },
    referral_id: {
        type: String,
        unique: true,
    },
    sponsor_id: {
        type: String,
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'User',
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false,
    },
    is_admin: {
        type: String, // Changed to String to match DB data
        default: "0",
    },


    airdrop_tokens: {
        type: Number,
        default: 0,
    },
    real_tokens: { // Renamed from rexToken
        type: Number,
        default: 0,
    },
    shopping_tokens: { // Renamed from shoppingPoints
        type: Number,
        default: 0,
    },
    mining_bonus: {
        type: Number,
        default: 0,
    },
    anual_bonus: {
        type: Number,
        default: 0,
    },
    sponsor_income: {
        type: Number,
        default: 0,
    },
    level_income: {
        type: Number,
        default: 0,
    },
    withdrawable_level_income: {
        type: Number,
        default: 0,
    },
    level_income_last_withdrawal: {
        type: Date,
        default: null
    },
    level_income_withdrawn_count: {
        type: Number,
        default: 0 // Tracks bi-monthly withdrawals (max 24 per year)
    },
    total_income: {
        type: Number,
        default: 0,
    },
    last_mining_data: {
        type: Date,
    },
    mining_count_thismounth: {
        type: Number,
        default: 0,
    },


    // created_at and updated_at are handled by timestamps: true, but mongoose default is createdAt/updatedAt.
    // If we want strict db matching we might need timestamps: { createdAt: 'create_at', updatedAt: 'update_at' }
    // The image shows 'create_at' and 'update_at'.
    is_deleted: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    // Check if password is NOT a bcrypt hash (simple check for $2 prefix)
    if (!this.password.startsWith('$2')) {
        return this.password === enteredPassword;
    }
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
