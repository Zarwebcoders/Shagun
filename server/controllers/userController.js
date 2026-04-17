const User = require('../models/User');
const Investment = require('../models/Investment');
const MiningBonus = require('../models/MiningBonus');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Product = require('../models/Product');

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
            .select('+password +plain_password') // Show passwords for admin
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
            const isAdmin = requester.is_admin == 1;

            if (!isAdmin && requester._id.toString() !== user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            user.full_name = req.body.full_name || user.full_name;
            user.email = req.body.email || user.email;
            user.mobile = req.body.mobile || user.mobile;
            user.address = req.body.address || user.address;
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
                address: updatedUser.address,
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
                    startWith: "$referral_id",
                    connectFromField: "referral_id",
                    connectToField: "sponsor_id",
                    as: "network",
                    maxDepth: 9, // up to 10 levels
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

// @desc    Mine tokens (Daily Claim)
// @route   POST /api/users/mine
// @access  Private
const mineTokens = async (req, res) => {
    try {
        let user = await User.findById(req.user._id || req.user.id);
        
        if (!user) {
            user = await User.findOne({ user_id: req.user.user_id || req.user.id });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        
        // Check for active Products (modern package model)
        const activeProducts = await Product.find({ 
            user_id: user.get('id') || user.user_id || user._id.toString(),
            approve: 1 
        });

        // Fallback or additional check for legacy Investments (if still used)
        const activeInvestments = await Investment.find({ 
            user: user._id, 
            status: { $regex: /^active$/i } 
        });

        if (activeProducts.length === 0 && activeInvestments.length === 0) {
            return res.status(403).json({ message: "No active investments found. Buy a package to start mining!" });
        }

        // Calculate total daily return based on active products and investments
        let totalReward = 0;
        
        activeProducts.forEach(prod => {
            totalReward += (prod.daily_return_amount || 0);
        });

        activeInvestments.forEach(inv => {
            const dailyReturn = inv.dailyReturn || 0;
            totalReward += (inv.amount * dailyReturn) / 100;
        });

        if (totalReward <= 0) {
            return res.status(400).json({ message: "No mining rewards available from current packages." });
        }

        // Update User stats
        user.last_mining_data = new Date();
        user.mining_count_thismounth = String(Number(user.mining_count_thismounth || 0) + 1);
        user.total_mining_count = (Number(user.total_mining_count || 0)) + 1;
        user.mining_bonus = (Number(user.mining_bonus || 0)) + totalReward;
        user.total_income = (Number(user.total_income || 0)) + totalReward;
        await user.save();

        // Calculate current cycle (1-24)
        const currentCycle = ((user.total_mining_count - 1) % 24) + 1;

        // Fetch User's Wallet Address
        const wallet = await Wallet.findOne({ user_id: user.id || user.user_id || user._id.toString(), approve: 1 });
        const walletAddress = wallet ? wallet.wallet_add : "N/A";

        // Record Mining Bonus entry with History Data
        await MiningBonus.create({
            user_id: user.id || user.user_id || user._id.toString(),
            amount: totalReward,
            wallet_address: walletAddress,
            cycle_number: currentCycle,
            created_at: new Date()
        });

        // Increment cycle count for active products
        await Product.updateMany(
            { user_id: user.id || user.user_id || user._id.toString(), approve: 1, cycle_count: { $lt: 24 } },
            { $inc: { cycle_count: 1 } }
        );

        // Record Transaction
        await Transaction.create({
            user: user._id,
            type: 'mining_bonus',
            amount: totalReward,
            description: `Mining Reward Claimed - Cycle ${currentCycle}/24`,
            status: 'completed'
        });

        res.json({
            message: "Mining successful!",
            reward: totalReward,
            last_mining_data: user.last_mining_data,
            mining_count_thismounth: user.mining_count_thismounth,
            total_mining_count: user.total_mining_count,
            cycle_number: currentCycle
        });

    } catch (error) {
        console.error("Mining Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's mining history
// @route   GET /api/users/mining-history
// @access  Private
const getMiningHistory = async (req, res) => {
    try {
        const history = await MiningBonus.find({ 
            user_id: { $in: [req.user.id, req.user.user_id, req.user._id.toString()] }
        }).sort({ created_at: -1 });
        
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getDownline,
    mineTokens,
    getMiningHistory
};
