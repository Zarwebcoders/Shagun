const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Package = require('../models/Package');
const KYC = require('../models/KYC');
const Investment = require('../models/Investment');
const Withdrawal = require('../models/Withdrawal');
const Product = require('../models/Product');
const MyAccount = require('../models/MyAccount');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const VendorKYC = require('../models/VendorKYC');
const VendorWithdraw = require('../models/VendorWithdraw');
const VendorWallet = require('../models/VendorWallet');
const VendorAccount = require('../models/VendorAccount');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
//
// PERFORMANCE FIX: All DB queries run concurrently in a single Promise.all()
// instead of being scattered across sequential awaits.
// Key improvements:
//  - Replaced regex status match ($regex /^active$/i) with exact $in list → uses index
//  - Added lean() to all find() calls (returns plain JS objects, ~2x faster)
//  - All 8 aggregate/count queries fire in parallel → total time = slowest single query
//  - Transaction.find uses createdAt index (added below in Transaction model)
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalAdmins,
            activeInvUsers,
            approvedProdUsers,
            revInv,
            revProd,
            countInv,
            countProd,
            totalWithdrawalResult,
            pendingWithdrawals,
            totalTransactions,
            recentActivities,
            topInvestors,
        ] = await Promise.all([
            // 1. Total non-admin users
            User.countDocuments({
                is_admin: { $nin: ['1', 1] },
                is_deleted: { $ne: 1 },
            }),

            // 2. Total admins
            User.countDocuments({ is_admin: { $in: ['1', 1] } }),

            // 3. Unique users with active investments (exact string match → uses index)
            Investment.aggregate([
                { $match: { status: { $in: ['active', 'Active'] } } },
                { $group: { _id: '$user' } },
                { $project: { _id: 1 } },
            ]),

            // 4. Unique users with approved products
            Product.aggregate([
                { $match: { approve: { $in: [1, '1'] } } },
                { $group: { _id: '$user_id' } },
                { $project: { _id: 1 } },
            ]),

            // 5. Revenue from investments
            Investment.aggregate([
                { $match: { status: { $in: ['active', 'Active', 'completed', 'Completed'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),

            // 6. Revenue from products
            Product.aggregate([
                { $match: { approve: { $in: [1, '1'] } } },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $cond: {
                                    if: { $gt: [{ $ifNull: ['$business_volume', 0] }, 0] },
                                    then: { $toDouble: '$business_volume' },
                                    else: { $toDouble: '$amount' },
                                },
                            },
                        },
                    },
                },
            ]),

            // 7. Count active investments
            Investment.countDocuments({ status: { $in: ['active', 'Active'] } }),

            // 8. Count approved products
            Product.countDocuments({ approve: { $in: [1, '1'] } }),

            // 9. Total approved withdrawal amount
            Withdrawal.aggregate([
                { $match: { approve: { $in: ['1', 1] } } },
                { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } },
            ]),

            // 10. Pending withdrawal count
            Withdrawal.countDocuments({ approve: { $in: ['2', 2] } }),

            // 11. Total transaction count
            Transaction.countDocuments({}),

            // 12. Recent 5 transactions — lean() skips hydration overhead
            Transaction.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('user', 'email full_name')
                .select('type status createdAt user')
                .lean(),

            // 13. Top 5 investors by amount
            Investment.aggregate([
                { $match: { status: { $in: ['active', 'Active', 'completed', 'Completed'] } } },
                { $group: { _id: '$user', totalInvestment: { $sum: '$amount' } } },
                { $sort: { totalInvestment: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'userDetails',
                        pipeline: [{ $project: { full_name: 1, email: 1 } }],
                    },
                },
                { $unwind: '$userDetails' },
                {
                    $project: {
                        name: '$userDetails.full_name',
                        email: '$userDetails.email',
                        investment: '$totalInvestment',
                    },
                },
            ]),
        ]);

        // Merge active user IDs from both sources
        const allActiveUserIds = new Set([
            ...activeInvUsers.map((u) => u._id?.toString()),
            ...approvedProdUsers.map((u) => u._id?.toString()),
        ]);

        res.json({
            stats: {
                totalUsers,
                totalAdmins,
                activeUsers: allActiveUserIds.size,
                totalRevenue: (revInv[0]?.total || 0) + (revProd[0]?.total || 0),
                activeInvestments: countInv + countProd,
                totalWithdrawal: totalWithdrawalResult[0]?.total || 0,
                pendingWithdrawals,
                totalTransactions,
            },
            recentActivities: recentActivities.map((tx) => ({
                type: tx.type,
                action: `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} ${tx.status}`,
                user: tx.user?.email || 'Unknown',
                time: tx.createdAt,
                status: tx.status,
            })),
            topUsers: topInvestors.map((inv) => ({
                name: inv.name,
                investment: inv.investment,
                level:
                    inv.investment > 50000
                        ? 'Diamond'
                        : inv.investment > 30000
                        ? 'Platinum'
                        : inv.investment > 15000
                        ? 'Gold'
                        : 'Silver',
            })),
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
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

        const transactions = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'completed',
                    type: { $in: ['deposit', 'withdrawal'] },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    deposits: {
                        $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] },
                    },
                    withdrawals: {
                        $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json({
            revenueData: transactions.map((t) => ({
                date: t._id,
                deposits: t.deposits,
                withdrawals: t.withdrawals,
                netRevenue: t.deposits - t.withdrawals,
            })),
            topCountries: [],
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Pending Request Counts
// @route   GET /api/admin/pending-counts
// @access  Private/Admin
//
// PERFORMANCE FIX: Models are imported at the top of the file (not re-required
// inside the function on every call), and all 9 counts run concurrently.
const getPendingCounts = async (req, res) => {
    try {
        const [
            kycCount,
            withdrawalCount,
            bankCount,
            paymentCount,
            walletCount,
            vendorKycCount,
            vendorWithdrawCount,
            vendorWalletCount,
            vendorAccountCount,
        ] = await Promise.all([
            KYC.countDocuments({ approval: 2 }),
            Withdrawal.countDocuments({ approve: { $in: ['2', 2] } }),
            MyAccount.countDocuments({ approve: 2 }),
            Payment.countDocuments({ approve: 2 }),
            Wallet.countDocuments({ approve: 2 }),
            VendorKYC.countDocuments({ approval: 2 }),
            VendorWithdraw.countDocuments({ approve: 2 }),
            VendorWallet.countDocuments({ approve: 2 }),
            VendorAccount.countDocuments({ approve: 2 }),
        ]);

        const total =
            kycCount +
            withdrawalCount +
            bankCount +
            paymentCount +
            walletCount +
            vendorKycCount +
            vendorWithdrawCount +
            vendorWalletCount +
            vendorAccountCount;

        res.json({
            kyc: kycCount,
            withdrawals: withdrawalCount,
            bankAccounts: bankCount,
            payments: paymentCount,
            wallets: walletCount,
            vendorKyc: vendorKycCount,
            vendorWithdrawals: vendorWithdrawCount,
            vendorWallets: vendorWalletCount,
            vendorAccounts: vendorAccountCount,
            total,
        });
    } catch (error) {
        console.error('Pending Counts Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getReports,
    getPendingCounts,
};
