const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const mongoose = require('mongoose');

            // Get user from the token
            if (mongoose.isValidObjectId(decoded.id)) {
                req.user = await User.findById(decoded.id).select('-password').populate('sponsor_id', 'full_name email referral_id');
            } else {
                // Handle legacy string IDs
                req.user = await User.findOne({
                    $or: [
                        { user_id: decoded.id },
                        { id: decoded.id }
                    ]
                }).select('-password').populate('sponsor_id', 'full_name email referral_id');
            }

            if (!req.user) {
                // Double check if it might be an ObjectId string but stored in user_id field?
                // Fallback to findById just in case isValidObjectId was strict but mongo could cast it?
                // No, avoid crash. If not found, return 401.
                throw new Error('User not found');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    // Check if user is admin (handles both number 1 and string "1")
    if (req.user && (req.user.is_admin === 1 || req.user.is_admin === "1")) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
