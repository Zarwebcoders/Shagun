const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const User = require('../models/User');

// @desc    Get my monthly token distributions
// @route   GET /api/monthly-tokens
// @access  Private
const getMyMonthlyTokens = async (req, res) => {
    try {
        const distributions = await MonthlyTokenDistribution.find({
            user_id: req.user.id
        })
            .populate('from_user_id', 'full_name email')
            .populate('from_purchase_id', 'product_id packag_type quantity')
            .sort({ scheduled_date: 1 });

        res.json(distributions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all monthly token distributions (Admin)
// @route   GET /api/monthly-tokens/all
// @access  Private/Admin
const getAllMonthlyTokens = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};

        const distributions = await MonthlyTokenDistribution.find(query)
            .populate('user_id', 'full_name email')
            .populate('from_user_id', 'full_name email')
            .populate('from_purchase_id', 'product_id packag_type quantity')
            .sort({ scheduled_date: 1 });

        res.json(distributions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process pending monthly distributions (Admin/Cron)
// @route   POST /api/monthly-tokens/process
// @access  Private/Admin
const processMonthlyDistributions = async (req, res) => {
    try {
        const now = new Date();

        // Find all pending distributions that are due
        const pendingDistributions = await MonthlyTokenDistribution.find({
            status: 'pending',
            scheduled_date: { $lte: now }
        }).populate('user_id');

        let processed = 0;
        let failed = 0;

        for (const dist of pendingDistributions) {
            try {
                const user = await User.findById(dist.user_id);

                if (user) {
                    // Tokens are now added upfront during distribution creation in levelIncome25.js
                    // But we still need to track what is actually unlocked to withdraw
                    user.withdrawable_level_income = (user.withdrawable_level_income || 0) + dist.monthly_amount;

                    // Mark as paid
                    dist.status = 'paid';
                    dist.paid_date = new Date();
                    await dist.save();

                    processed++;
                    console.log(`Processed ${dist.monthly_amount} tokens for ${user.email} (Month ${dist.month_number}, Level ${dist.level})`);
                } else {
                    failed++;
                    console.error(`User not found: ${dist.user_id}`);
                }
            } catch (err) {
                failed++;
                console.error(`Error processing distribution ${dist._id}:`, err);
            }
        }

        res.json({
            message: 'Monthly distributions processed',
            processed,
            failed,
            total: pendingDistributions.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMyMonthlyTokens,
    getAllMonthlyTokens,
    processMonthlyDistributions
};
