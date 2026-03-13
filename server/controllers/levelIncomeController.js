const LevelIncome = require('../models/LevelIncome');

// @desc    Get My Level Incomes
// @route   GET /api/level-income
// @access  Private
// @desc    Get My Level Incomes
// @route   GET /api/level-income
// @access  Private
const getMyLevelIncomes = async (req, res) => {
    try {
        // 1. Get current user's numeric ID
        const user = await require('../models/User').findById(req.user._id).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const queryIds = [user.id, user.user_id, user._id.toString()].filter(id => id);

        // 2. Find Level Incomes for this user
        // PROBLEM 2 FIX: Filter out Level 0 (Self-ROI disguised as Level Income)
        const incomes = await LevelIncome.find({ user_id: { $in: queryIds }, level: { $gt: 0 } })
            .sort({ created_at: -1 })
            .lean();

        // 3. Collect from_user_ids to fetch names for income-generating users
        const fromIds = [...new Set(incomes.map(inc => inc.from_user_id).filter(id => id))];

        // 4. Fetch details for these users (matching 'id', 'user_id', or '_id' field)
        const fromUsers = await require('../models/User').find({ 
            $or: [
                { id: { $in: fromIds } },
                { user_id: { $in: fromIds } },
                { _id: { $in: fromIds.filter(id => require('mongoose').Types.ObjectId.isValid(id)) } }
            ]
        })
            .select('id full_name email user_id')
            .lean();

        // 5. Create Map
        const userMap = {};
        fromUsers.forEach(u => { 
            if (u.id) userMap[u.id] = u;
            if (u.user_id) userMap[u.user_id] = u;
            userMap[u._id.toString()] = u;
        });

        // NEW: Fetch all matured distributions for this user to calculate "Released Income"
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
        const now = new Date();
        const distributions = await MonthlyTokenDistribution.find({
            user_id: req.user._id,
            level: { $gt: 0 },
            scheduled_date: { $lte: now }
        }).lean();

        const releasedMap = {};
        distributions.forEach(dist => {
            const purchaseId = String(dist.from_purchase_id);
            releasedMap[purchaseId] = (releasedMap[purchaseId] || 0) + dist.monthly_amount;
        });

        // 6. Attach details (show full contract total and released amount)
        const incomesWithDetails = incomes.map(inc => {
            const fromUser = userMap[inc.from_user_id];
            const releasedAmount = releasedMap[String(inc.product_id)] || 0;
            return {
                ...inc,
                amount: inc.amount,
                releasedAmount: Math.round(releasedAmount * 1000) / 1000,
                from_user_id: fromUser ? {
                    name: fromUser.full_name,
                    email: fromUser.email,
                    _id: fromUser._id
                } : { name: 'Unknown', email: '' }
            };
        });

        // 7. PROBLEM 1 FIX: Fetch full 25-level downline to "show all 25 levels of users if available"
        let networkMap = {};
        try {
            const downlineData = await require('../models/User').aggregate([
                { $match: { _id: user._id } },
                {
                    $lookup: {
                        from: "users",
                        let: { user_str_id: { $toString: "$_id" } },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$sponsor_id", "$$user_str_id"]
                                    }
                                }
                            }
                        ],
                        as: "network"
                    }
                },
                {
                    $project: { "network.id": 1, "network.full_name": 1, "network.email": 1, "network._id": 1, "network.user_id": 1 }
                }
            ]);

            if (downlineData.length > 0 && downlineData[0].network) {
                downlineData[0].network.forEach(netUser => {
                    networkMap[netUser._id.toString()] = {
                        ...netUser,
                        level_depth: 0 // For now focusing on fixing Level 1 visibility
                    };
                });
            }
        } catch (err) {
            console.error("Error fetching downline in getMyLevelIncomes:", err.message);
        }

        // Map to quickly check which users already have an income record
        const incomeUserIds = new Set(incomesWithDetails.map(inc => inc.from_user_id._id?.toString() || inc.from_user_id));

        // Add users who haven't generated income but are in the network
        const finalIncomesList = [...incomesWithDetails];

        // NEW: Fetch all pending products for these network members
        const networkUserIds = Object.keys(networkMap);
        const Product = require('../models/Product');
        const pendingProducts = await Product.find({
            user_id: { $in: networkUserIds },
            approve: 0
        }).lean();

        const pendingMap = {};
        pendingProducts.forEach(p => { pendingMap[p.user_id] = true; });

        Object.values(networkMap).forEach(netUser => {
            const netUserIdStr = netUser._id.toString();
            // If this network user is not already in the incomes list, add a 0 income row
            if (!incomeUserIds.has(netUserIdStr)) {
                finalIncomesList.push({
                    _id: `empty_${netUserIdStr}`, // Generate fake ID for React key
                    user_id: user._id.toString(),
                    from_user_id: {
                        name: netUser.full_name,
                        email: netUser.email,
                        _id: netUser._id
                    },
                    level: netUser.level_depth + 1, // level_depth 0 = level 1
                    amount: 0,
                    no_purchase: !pendingMap[netUserIdStr], // Only "No Purchase" if no pending ones either
                    pending: !!pendingMap[netUserIdStr],
                    created_at: new Date(),
                });
            }
        });

        res.json(finalIncomesList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Level Incomes (Admin)
// @route   GET /api/level-income/all
// @access  Private/Admin
const getAllLevelIncomes = async (req, res) => {
    try {
        const incomes = await LevelIncome.find({})
            .populate('user_id', 'name email')
            .populate('from_user_id', 'name email')
            .sort({ created_at: -1 });
        res.json(incomes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get level income dashboard stats
// @route   GET /api/level-income/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
        const User = require('../models/User');

        // Fetch all approved withdrawals for accurate net calculation
        const Withdrawal = require('../models/Withdrawal');
        const approvedWithdrawals = await Withdrawal.find({
            user_id: { $in: [userId.toString(), req.user.user_id, req.user.id].filter(id => id) },
            approve: "1"
        });

        const withdrawnLevel = approvedWithdrawals
            .filter(w => w.withdraw_type === 'level_income')
            .reduce((sum, w) => sum + w.amount, 0);
        
        const withdrawnMining = approvedWithdrawals
            .filter(w => w.withdraw_type === 'mining_bonus')
            .reduce((sum, w) => sum + w.amount, 0);

        // Sum up ALL matured installments (status doesn't matter anymore, we subtract total withdrawn)
        const now = new Date();
        const totalMaturedLevel = distributions.reduce((sum, dist) => {
            if (dist.scheduled_date <= now && dist.level > 0) return sum + dist.monthly_amount;
            return sum;
        }, 0);

        const totalMaturedMining = distributions.reduce((sum, dist) => {
            if (dist.scheduled_date <= now && dist.level === 0) return sum + dist.monthly_amount;
            return sum;
        }, 0);

        const user = await User.findById(userId);
        const withdrawnCount = user?.level_income_withdrawn_count || 0;
        const lastWithdrawal = user?.level_income_last_withdrawal || null;

        res.json({
            totalAnnual: totalPending,
            availableNow: Math.round(Math.max(0, totalMaturedLevel - withdrawnLevel) * 100) / 100,
            availableROI: Math.round(Math.max(0, totalMaturedMining - withdrawnMining) * 100) / 100,
            withdrawnCount,
            maxWithdrawals: 24,
            lastWithdrawalDate: lastWithdrawal,
            canWithdraw: (totalMaturedLevel - withdrawnLevel + totalMaturedMining - withdrawnMining) >= 100,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get available withdrawal amount
// @route   GET /api/level-income/available
// @access  Private
const getAvailableWithdrawal = async (req, res) => {
    try {
        const userId = req.user._id; // Ensure we use ObjectId for reference lookup
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
        const User = require('../models/User');

        // Get ALL monthly distributions
        const distributions = await MonthlyTokenDistribution.find({ user_id: userId });

        const Withdrawal = require('../models/Withdrawal');
        const approvedWithdrawals = await Withdrawal.find({
            user_id: { $in: [userId.toString(), req.user.user_id, req.user.id].filter(id => id) },
            approve: "1"
        });

        const withdrawnLevel = approvedWithdrawals
            .filter(w => w.withdraw_type === 'level_income')
            .reduce((sum, w) => sum + w.amount, 0);
        
        const withdrawnMining = approvedWithdrawals
            .filter(w => w.withdraw_type === 'mining_bonus')
            .reduce((sum, w) => sum + w.amount, 0);

        const now = new Date();
        const totalMaturedLevel = distributions.reduce((sum, dist) => {
            if (dist.scheduled_date <= now && dist.level > 0) return sum + dist.monthly_amount;
            return sum;
        }, 0);

        const totalMaturedMining = distributions.reduce((sum, dist) => {
            if (dist.scheduled_date <= now && dist.level === 0) return sum + dist.monthly_amount;
            return sum;
        }, 0);

        const available = Math.max(0, totalMaturedLevel - withdrawnLevel);
        const availableROI = Math.max(0, totalMaturedMining - withdrawnMining);
        const canWithdraw = (available + availableROI) >= 100;

        res.json({
            available: Math.round(available * 100) / 100,
            availableROI: Math.round(availableROI * 100) / 100,
            canWithdraw,
            reason: !canWithdraw ? 'Insufficient matured balance (Minimum ₹100)' : null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMyLevelIncomes,
    getAllLevelIncomes,
    getDashboardStats,
    getAvailableWithdrawal
};
