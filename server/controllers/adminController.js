const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Package = require('../models/Package');
const KYC = require('../models/KYC');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const activeUsers = await User.countDocuments({ role: 'user', status: 'active' });

        const totalInvestment = await Transaction.aggregate([
            { $match: { type: 'investment', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalWithdrawals = await Transaction.aggregate([
            { $match: { type: 'withdrawal', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const pendingKYC = await KYC.countDocuments({ status: 'pending' });

        res.json({
            totalUsers,
            activeUsers,
            totalInvestment: totalInvestment[0]?.total || 0,
            totalWithdrawals: totalWithdrawals[0]?.total || 0,
            pendingKYC,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Analytics Reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getReports = async (req, res) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        // Aggregate daily deposits and withdrawals for the last 7 days
        const transactions = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'completed',
                    type: { $in: ['deposit', 'withdrawal'] }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    deposits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0]
                        }
                    },
                    withdrawals: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "withdrawal"] }, "$amount", 0]
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format data for chart
        const revenueData = transactions.map(t => ({
            date: t._id,
            deposits: t.deposits,
            withdrawals: t.withdrawals,
            netRevenue: t.deposits - t.withdrawals
        }));

        res.json({
            revenueData,
            topCountries: [] // Placeholder as we don't track country yet
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getReports,
};
