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
    // Placeholder for more complex reporting logic (group by date, country etc.)
    res.json({ message: 'Reports endpoint ready' });
};

module.exports = {
    getDashboardStats,
    getReports,
};
