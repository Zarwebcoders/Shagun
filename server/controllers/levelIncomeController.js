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

        const queryId = user.id || user.user_id; // "827"

        // 2. Find Level Incomes for this user
        const incomes = await LevelIncome.find({ user_id: queryId })
            .sort({ created_at: -1 })
            .lean();

        // 3. Collect from_user_ids to fetch names
        const fromIds = [...new Set(incomes.map(inc => inc.from_user_id).filter(id => id))];

        // 4. Fetch details for these users (matching 'id' field)
        const fromUsers = await require('../models/User').find({ id: { $in: fromIds } })
            .select('id full_name email user_id')
            .lean();

        // 5. Create Map
        const userMap = {};
        fromUsers.forEach(u => { userMap[u.id] = u; });

        // 6. Attach details
        const incomesWithDetails = incomes.map(inc => {
            const fromUser = userMap[inc.from_user_id];
            return {
                ...inc,
                from_user_id: fromUser ? {
                    name: fromUser.full_name,
                    email: fromUser.email,
                    _id: fromUser._id
                } : { name: 'Unknown', email: '' }
            };
        });

        res.json(incomesWithDetails);
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
        const userId = req.user.id || req.user._id;
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
        const User = require('../models/User');

        // Get all monthly distributions for this user
        const distributions = await MonthlyTokenDistribution.find({
            user_id: userId,
            status: 'pending' // Only count pending (future) distributions
        });

        // Calculate total annual income (sum of all monthly amounts × 12)
        const monthlyAmounts = {};
        distributions.forEach(dist => {
            const key = `${dist.from_purchase_id}_${dist.level}`;
            if (!monthlyAmounts[key]) {
                monthlyAmounts[key] = dist.monthly_amount;
            }
        });

        const totalAnnual = Object.values(monthlyAmounts).reduce((sum, amount) => sum + (amount * 12), 0);

        // Bi-monthly amount (annual ÷ 24)
        const biMonthlyAmount = totalAnnual / 24;

        // Get user's withdrawal info
        const user = await User.findById(userId);
        const lastWithdrawal = user.level_income_last_withdrawal;
        const withdrawnCount = user.level_income_withdrawn_count || 0;

        // Check if user can withdraw (15 days passed)
        let canWithdraw = false;
        let daysSinceLastWithdrawal = 0;
        let nextWithdrawalDate = null;

        if (!lastWithdrawal) {
            // Never withdrawn before
            canWithdraw = true;
            nextWithdrawalDate = new Date();
        } else {
            const now = new Date();
            daysSinceLastWithdrawal = Math.floor((now - lastWithdrawal) / (1000 * 60 * 60 * 24));
            canWithdraw = daysSinceLastWithdrawal >= 15 && withdrawnCount < 24;

            // Calculate next withdrawal date
            nextWithdrawalDate = new Date(lastWithdrawal);
            nextWithdrawalDate.setDate(nextWithdrawalDate.getDate() + 15);
        }

        // Available amount
        const availableNow = canWithdraw ? biMonthlyAmount : 0;

        res.json({
            totalAnnual: Math.round(totalAnnual * 100) / 100,
            biMonthlyAmount: Math.round(biMonthlyAmount * 100) / 100,
            availableNow: Math.round(availableNow * 100) / 100,
            withdrawnCount,
            maxWithdrawals: 24,
            lastWithdrawalDate: lastWithdrawal,
            nextWithdrawalDate,
            canWithdraw,
            daysSinceLastWithdrawal
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
        const userId = req.user.id || req.user._id;
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
        const User = require('../models/User');

        // Get all monthly distributions
        const distributions = await MonthlyTokenDistribution.find({
            user_id: userId,
            status: 'pending'
        });

        const monthlyAmounts = {};
        distributions.forEach(dist => {
            const key = `${dist.from_purchase_id}_${dist.level}`;
            if (!monthlyAmounts[key]) {
                monthlyAmounts[key] = dist.monthly_amount;
            }
        });

        const totalAnnual = Object.values(monthlyAmounts).reduce((sum, amount) => sum + (amount * 12), 0);
        const biMonthlyAmount = totalAnnual / 24;

        // Check eligibility
        const user = await User.findById(userId);
        const lastWithdrawal = user.level_income_last_withdrawal;
        const withdrawnCount = user.level_income_withdrawn_count || 0;

        let canWithdraw = false;
        if (!lastWithdrawal) {
            canWithdraw = true;
        } else {
            const now = new Date();
            const daysSince = Math.floor((now - lastWithdrawal) / (1000 * 60 * 60 * 24));
            canWithdraw = daysSince >= 15 && withdrawnCount < 24;
        }

        const available = canWithdraw ? biMonthlyAmount : 0;

        res.json({
            available: Math.round(available * 100) / 100,
            canWithdraw,
            reason: !canWithdraw ? (withdrawnCount >= 24 ? 'Maximum withdrawals reached' : 'Must wait 15 days') : null
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
