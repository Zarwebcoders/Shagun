const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Package = require('../models/Package');
const KYC = require('../models/KYC');
const Investment = require('../models/Investment');
const Withdrawal = require('../models/Withdrawal');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // 1. Counters
        // is_admin stored as String "0" in DB
        const totalUsers = await User.countDocuments({ is_admin: "0" });

        // Total Revenue (Sum of all active/completed investments)
        // Investment amount is Number, so straightforward sum
        const totalRevenueResult = await Investment.aggregate([
            { $match: { status: { $in: ['active', 'completed'] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        // Active Investments (Count)
        const activeInvestments = await Investment.countDocuments({ status: 'active' });

        // Total Withdrawal (Sum of approved withdrawals)
        // Withdrawal amount is stored as String in DB ("300"), perform conversion
        // approve is String "1"
        const totalWithdrawalResult = await Withdrawal.aggregate([
            { $match: { approve: "1" } },
            { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
        ]);
        const totalWithdrawal = totalWithdrawalResult[0]?.total || 0;

        // Pending Withdrawals (Count)
        // approve is String "2"
        const pendingWithdrawals = await Withdrawal.countDocuments({ approve: "2" });

        // Total Transactions (Count)
        const totalTransactions = await Transaction.countDocuments({});

        // 2. Recent Activity (Last 5 transactions)
        const recentActivities = await Transaction.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'email full_name')
            .lean();

        // 3. Top Investors (Top 5 by total investment)
        const topInvestors = await Investment.aggregate([
            { $match: { status: { $in: ['active', 'completed'] } } },
            { $group: { _id: "$user", totalInvestment: { $sum: "$amount" } } },
            { $sort: { totalInvestment: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    name: "$userDetails.full_name",
                    email: "$userDetails.email",
                    investment: "$totalInvestment"
                }
            }
        ]);


        res.json({
            stats: {
                totalUsers,
                totalRevenue,
                activeInvestments,
                totalWithdrawal,
                pendingWithdrawals,
                totalTransactions
            },
            recentActivities: recentActivities.map(tx => ({
                type: tx.type,
                action: `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} ${tx.status}`,
                user: tx.user?.email || 'Unknown',
                time: tx.createdAt, // Frontend will format
                status: tx.status
            })),
            topUsers: topInvestors.map(inv => ({
                name: inv.name,
                investment: inv.investment,
                level: inv.investment > 50000 ? 'Diamond' : inv.investment > 30000 ? 'Platinum' : inv.investment > 15000 ? 'Gold' : 'Silver'
            }))
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
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
