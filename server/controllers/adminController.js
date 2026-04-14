const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Package = require('../models/Package');
const KYC = require('../models/KYC');
const Investment = require('../models/Investment');
const Withdrawal = require('../models/Withdrawal');
const Product = require('../models/Product');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // 1. Counters
        // Total Users (Exclude Admins and hard-deleted users)
        const totalUsers = await User.countDocuments({ 
            is_admin: { $nin: ["1", 1] },
            is_deleted: { $ne: 1 }
        });

        const totalAdmins = await User.countDocuments({ 
            is_admin: { $in: ["1", 1] } 
        });

        // 2. Integrated Metrics (Investment + Product)
        
        // Active Users: Unique users with active investments or approved products
        const [activeInvUsers, approvedProdUsers] = await Promise.all([
            Investment.aggregate([
                { $match: { status: { $regex: /^active$/i } } },
                { $group: { _id: '$user' } }
            ]),
            Product.aggregate([
                { $match: { approve: 1 } },
                { $group: { _id: '$user_id' } }
            ])
        ]);

        const allActiveUserIds = new Set([
            ...activeInvUsers.map(u => u._id.toString()),
            ...approvedProdUsers.map(u => u._id.toString())
        ]);
        const activeUsersCount = allActiveUserIds.size;

        // Total Revenue: Sum of active/completed investments + approved products
        const [revInv, revProd] = await Promise.all([
            Investment.aggregate([
                { $match: { status: { $in: ['active', 'completed', 'Active', 'Completed'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Product.aggregate([
                { $match: { approve: 1 } },
                { $group: { _id: null, total: { $sum: { $multiply: ['$amount', '$quantity'] } } } }
            ])
        ]);

        const totalRevenue = (revInv[0]?.total || 0) + (revProd[0]?.total || 0);

        // Active Investments (Count)
        const [countInv, countProd] = await Promise.all([
            Investment.countDocuments({ status: { $in: ['active', 'Active'] } }),
            Product.countDocuments({ approve: 1 })
        ]);
        const activeInvestmentsCount = countInv + countProd;

        // Total Withdrawal (Sum of approved withdrawals)
        // approve: "1" or 1 means Approved
        const totalWithdrawalResult = await Withdrawal.aggregate([
            { $match: { approve: { $in: ["1", 1] } } },
            { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
        ]);
        const totalWithdrawal = totalWithdrawalResult[0]?.total || 0;

        // Pending Withdrawals (Count)
        // approve: "2" or 2 means Pending
        const pendingWithdrawals = await Withdrawal.countDocuments({ 
            approve: { $in: ["2", 2] } 
        });

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
                totalAdmins,
                activeUsers: activeUsersCount,
                totalRevenue,
                activeInvestments: activeInvestmentsCount,
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
