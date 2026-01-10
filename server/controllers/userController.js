const User = require('../models/User');

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;

        const keyword = req.query.search
            ? {
                $or: [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { email: { $regex: req.query.search, $options: 'i' } },
                    { wallet: { $regex: req.query.search, $options: 'i' } },
                ],
            }
            : {};

        const filterStatus = req.query.status && req.query.status !== 'all'
            ? { status: req.query.status }
            : {};

        const filterKYC = req.query.kycStatus && req.query.kycStatus !== 'all'
            ? { kycStatus: req.query.kycStatus }
            : {};

        const count = await User.countDocuments({ ...keyword, ...filterStatus, ...filterKYC });
        const users = await User.find({ ...keyword, ...filterStatus, ...filterKYC })
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ users, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (User can update self, Admin can update anyone)
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Check permissions: Admin or Self
            if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            if (req.body.password) {
                user.password = req.body.password;
            }
            if (req.user.role === 'admin') {
                user.role = req.body.role || user.role;
                user.status = req.body.status || user.status;
                user.kycStatus = req.body.kycStatus || user.kycStatus;
                user.balance = req.body.balance || user.balance;
            }

            // Allow user to update their wallet address (or admin)
            if (req.body.wallet) {
                user.wallet = req.body.wallet;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                status: updatedUser.status,
                kycStatus: updatedUser.kycStatus,
                wallet: updatedUser.wallet,
                balance: updatedUser.balance
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user downline
// @route   GET /api/users/downline
// @access  Private
const getDownline = async (req, res) => {
    try {
        const mongoose = require('mongoose');

        // 1. Find the current user and get their graph
        // 2. Unwind the network to process each user individually
        // 3. Lookup investments for each network user
        // 4. Sum up the active investments

        const downline = await User.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.user.id) } },
            {
                $graphLookup: {
                    from: "users",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "referredBy",
                    as: "network",
                    maxDepth: 4,
                    depthField: "level"
                }
            },
            { $unwind: "$network" },
            {
                $lookup: {
                    from: "investments",
                    localField: "network._id",
                    foreignField: "user",
                    as: "userInvestments"
                }
            },
            {
                $addFields: {
                    "network.totalInvestment": {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$userInvestments",
                                        as: "inv",
                                        cond: { $eq: ["$$inv.status", "active"] } // Only count active investments? Or all? Usually total business is active.
                                    }
                                },
                                as: "activeInv",
                                in: { $ifNull: ["$$activeInv.businessVolume", "$$activeInv.amount"] }
                            }
                        }
                    }
                }
            },
            {
                $sort: { "network.createdAt": -1 }
            },
            {
                $project: {
                    "network.password": 0, // Security: don't send passwords
                    "userInvestments": 0
                }
            },
            {
                $replaceRoot: { newRoot: "$network" }
            }
        ]);

        res.json(downline);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getDownline,
};
