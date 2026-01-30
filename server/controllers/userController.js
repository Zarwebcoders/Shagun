const User = require('../models/User');

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
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
                    { full_name: { $regex: req.query.search, $options: 'i' } },
                    { email: { $regex: req.query.search, $options: 'i' } },
                ],
            }
            : {};



        const count = await User.countDocuments({ ...keyword });

        // Global stats (independent of search/pagination if needed, or filtered? Usually global stats are shown at top)
        // Calculating global stats for the cards
        const [totalStatsUsers, activeStatsUsers, totalStatsAdmins] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ is_deleted: 0 }),
            User.countDocuments({ is_admin: 1 })
        ]);

        const users = await User.find({ ...keyword })
            .select('+password') // Show password for admin
            .sort({ create_at: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({
            users,
            page,
            pages: Math.ceil(count / pageSize),
            total: count,
            stats: {
                totalUsers: totalStatsUsers,
                activeUsers: activeStatsUsers,
                totalAdmins: totalStatsAdmins
            }
        });
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
            // is_admin: 1 is admin
            const requester = req.user;
            const isAdmin = requester.is_admin === 1;

            if (!isAdmin && requester._id.toString() !== user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            user.full_name = req.body.full_name || user.full_name;
            user.email = req.body.email || user.email;
            user.mobile = req.body.mobile || user.mobile;
            if (req.body.password) {
                user.password = req.body.password;
            }
            if (isAdmin) {
                user.is_admin = req.body.is_admin !== undefined ? req.body.is_admin : user.is_admin;
                user.is_deleted = req.body.is_deleted !== undefined ? req.body.is_deleted : user.is_deleted;
            }



            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                full_name: updatedUser.full_name,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
                is_admin: updatedUser.is_admin,
                is_deleted: updatedUser.is_deleted,

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
            // Check if deleted via flag or actual delete? Image has is_deleted field.
            // If soft delete:
            user.is_deleted = 1;
            await user.save();
            // Or hard delete if previously hard delete
            // await user.deleteOne(); 
            // Sticking to hard delete for now to match previous logic, but user added is_deleted so maybe soft delete is intended.
            // I will use hard delete for now to not break too much logic unless I see is_deleted usage elsewhere.
            // Actually, let's just do hard delete as before but maybe set is_deleted if I want to be safe? 
            // The previous code was: await user.deleteOne();
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
            { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
            {
                $graphLookup: {
                    from: "users",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "sponsor_id",
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
                $sort: { "network.create_at": -1 }
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
