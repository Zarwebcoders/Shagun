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

            console.log(`Auth request for user ID: ${decoded.id}`);

            if (mongoose.isValidObjectId(decoded.id)) {
                req.user = await User.findById(decoded.id).select('-password');
            } else {
                // Handle legacy string IDs
                req.user = await User.findOne({
                    $or: [
                        { user_id: decoded.id },
                        { id: decoded.id }
                    ]
                }).select('-password');
            }

            if (!req.user) {
                console.error(`Auth Error: User with ID ${decoded.id} not found in database.`);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(`Auth Error Details: ${error.message}`);
            return res.status(401).json({ message: 'Not authorized, token failed' });
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
