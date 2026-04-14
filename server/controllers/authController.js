const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { full_name, email, mobile, password, referral_id } = req.body;

    if (!full_name || !email || !password || !mobile || !referral_id) {
        return res.status(400).json({ message: 'Please add all fields including Mobile and Sponsor Referral ID' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Check sponsor (Sponsor Referral ID is mandatory now)
    const sponsor = await User.findOne({ referral_id });
    if (!sponsor) {
        return res.status(400).json({ message: 'Invalid Sponsor Referral ID' });
    }
    const sponsor_id = sponsor.referral_id; // Store referral_id as sponsor_id string to match DB

    // Generate next ID sequence
    const allUsers = await User.find({}, { id: 1 }).lean();
    const maxId = allUsers
        .map(u => parseInt(u.id))
        .filter(n => !isNaN(n))
        .reduce((max, curr) => Math.max(max, curr), 0);
    
    const nextId = maxId + 1;
    const nextIdStr = String(nextId);
    const paddedId = String(nextId).padStart(3, '0');
    
    const newUserId = `SGN${paddedId}`;
    const newReferralId = `SGN9${paddedId}`;

    // Create user
    try {
        const user = await User.create({
            full_name,
            email,
            mobile,
            password,
            user_id: newUserId,
            id: nextIdStr,
            referral_id: newReferralId,
            sponsor_id: sponsor_id,
            // Initializing fields from image
            airdrop_tokons: "0",
            real_tokens: "0",
            shopping_tokons: "0",
            mining_bonus: 0,
            anual_bonus: "0",
            sponsor_income: "0",
            level_income: 0,
            total_income: 0,
            mining_count_thismounth: "0",
            last_mining_data: "",
            is_admin: "0",
            is_deleted: "0",
            level_income_withdrawn_count: 0
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                full_name: user.full_name,
                email: user.email,
                is_admin: user.is_admin,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Check for user by email or referral_id (user_id)
    const user = await User.findOne({
        $or: [
            { email: email },
            { referral_id: email },
            { user_id: email }
        ]
    }).select('+password');

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user.id,
            full_name: user.full_name,
            email: user.email,
            is_admin: user.is_admin,
            token: generateToken(user._id)
        });
    } else {
        res.status(400).json({ message: 'Invalid credentials' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.status(404).json({ message: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (5 minutes as requested)
    user.resetPasswordExpire = Date.now() + 5 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a put request to: \n\n ${resetUrl} \n\n This link will expire in 5 minutes.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message,
            html: `<p>You requested a password reset. Please click the link below to reset your password. This link is only valid for 5 minutes.</p><a href="${resetUrl}">${resetUrl}</a>`
        });

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        console.log(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        res.status(500).json({ message: 'Email could not be sent' });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        data: 'Password reset successful',
        token: generateToken(user._id)
    });
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    forgotPassword,
    resetPassword,
};
