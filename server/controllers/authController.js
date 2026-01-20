const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { full_name, email, password, referral_id } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    let sponsor_id = null;
    if (referral_id) {
        const sponsor = await User.findOne({ referral_id });
        if (sponsor) {
            sponsor_id = sponsor._id;
        }
    }

    // Generate random referral code for new user
    // Using full_name for generation logic
    const newReferralCode = full_name.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

    // Create user
    try {
        const user = await User.create({
            full_name,
            email,
            password,
            referral_id: newReferralCode,
            sponsor_id: sponsor_id,
            // Default values for other new fields are handled by schema defaults
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

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

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

module.exports = {
    registerUser,
    loginUser,
    getMe,
};
