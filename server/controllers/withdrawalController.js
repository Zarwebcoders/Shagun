const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

// @desc    Create new withdrawal request
// @route   POST /api/withdrawals
// @access  Private
const createWithdrawal = async (req, res) => {
    const { amount, withdraw_type, method, source, bankDetails } = req.body;

    if (!amount || !withdraw_type) {
        return res.status(400).json({ message: 'Please provide amount and withdrawal type' });
    }

    try {
        // Special validation for level_income withdrawals
        if (withdraw_type === 'level_income') {
            const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

            // Get user's monthly distributions
            const distributions = await MonthlyTokenDistribution.find({
                user_id: req.user._id, // Fix CastError, use ObjectId
                status: 'pending'
            });

            // Calculate total annual and bi-monthly amount
            const monthlyAmounts = {};
            distributions.forEach(dist => {
                const key = `${dist.from_purchase_id}_${dist.level}`;
                if (!monthlyAmounts[key]) {
                    monthlyAmounts[key] = dist.monthly_amount;
                }
            });

            const totalAnnual = Object.values(monthlyAmounts).reduce((sum, amt) => sum + (amt * 12), 0);
            const biMonthlyAmount = totalAnnual / 24;

            // Get user's withdrawal history
            const user = await User.findById(req.user.id);
            const lastWithdrawal = user.level_income_last_withdrawal;
            const withdrawnCount = user.level_income_withdrawn_count || 0;

            // Check 15-day waiting period
            if (lastWithdrawal) {
                const daysSince = Math.floor((new Date() - lastWithdrawal) / (1000 * 60 * 60 * 24));
                if (daysSince < 15) {
                    return res.status(400).json({
                        message: `You must wait 15 days between withdrawals. ${15 - daysSince} days remaining.`
                    });
                }
            }

            // Check max withdrawals
            if (withdrawnCount >= 24) {
                return res.status(400).json({
                    message: 'Maximum 24 withdrawals per year reached.'
                });
            }

            // Check amount
            if (amount > biMonthlyAmount) {
                return res.status(400).json({
                    message: `Maximum withdrawal amount is ${Math.round(biMonthlyAmount * 100) / 100} tokens.`
                });
            }

            // Check if user has enough level_income balance
            if (user.level_income < amount) {
                return res.status(400).json({
                    message: `Insufficient level income balance. Available: ${user.level_income}`
                });
            }

            // Deduct amount from level_income
            user.level_income = (user.level_income || 0) - amount;

            // Update user's withdrawal tracking
            user.level_income_last_withdrawal = new Date();
            user.level_income_withdrawn_count = withdrawnCount + 1;
            await user.save();
        }

        const withdrawal = await Withdrawal.create({
            user_id: req.user.id,
            amount,
            withdraw_type,
            method,
            source,
            bankDetails,
            approve: 2 // Default to pending
        });

        res.status(201).json(withdrawal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's withdrawals
// @route   GET /api/withdrawals/me
// @access  Private
const getMyWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ user_id: req.user.id }).sort({ create_at: -1 });
        res.status(200).json(withdrawals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all withdrawals (Admin)
// @route   GET /api/withdrawals/all
// @access  Private/Admin
const getAllWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({}).sort({ create_at: -1 }).lean();

        // Get unique user_ids from withdrawals
        const userIds = [...new Set(withdrawals.map(w => w.user_id))];

        // Find users with these custom user_ids (search in both user_id and id fields)
        const users = await User.find({
            $or: [
                { user_id: { $in: userIds } },
                { id: { $in: userIds } }
            ]
        })
            .select('user_id id full_name email mobile')
            .lean();

        // Create a map for quick lookup - mapping BOTH user_id and id to the user object
        const userMap = {};
        users.forEach(user => {
            if (user.user_id) userMap[user.user_id] = user;
            if (user.id) userMap[user.id] = user;
        });

        // Attach user details to withdrawals
        const populatedWithdrawals = withdrawals.map(w => ({
            ...w,
            user_id: userMap[w.user_id] || { full_name: 'Unknown User', email: 'N/A' }
        }));

        res.status(200).json(populatedWithdrawals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update withdrawal status (Admin)
// @route   PUT /api/withdrawals/:id
// @access  Private/Admin
const updateWithdrawalStatus = async (req, res) => {
    const { approve } = req.body; // 1: Approve, 0: Reject

    try {
        const withdrawal = await Withdrawal.findById(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({ message: 'Withdrawal request not found' });
        }

        withdrawal.approve = approve;
        await withdrawal.save();

        res.status(200).json(withdrawal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
    updateWithdrawalStatus
};
