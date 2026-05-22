const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Get report analytics
// @route   GET /api/reports
// @access  Private/Admin
const getReports = async (req, res) => {
    try {
        const { range, type } = req.query;
        const days = parseInt(range) || 30;
        const reportType = type || "revenue";
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const endDate = new Date();

        // 1. Calculate General Stats (Always based on total data for quick overview)
        const [revenueProd, revenueInv, depositData, withdrawalData] = await Promise.all([
            Product.aggregate([
                { $match: { approve: { $in: [1, "1"] } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Investment.aggregate([
                { $match: { status: { $in: ['active', 'completed', 'Active', 'Completed'] } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Transaction.aggregate([
                { $match: { type: { $in: ['deposit', 'purchase'] }, status: 'completed' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Transaction.aggregate([
                { $match: { type: 'withdrawal', status: 'completed' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])
        ]);

        const totalRevenue = (revenueProd[0]?.total || 0) + (revenueInv[0]?.total || 0);
        const totalDeposits = depositData[0]?.total || 0;
        const totalWithdrawals = withdrawalData[0]?.total || 0;
        const netProfit = totalRevenue - totalWithdrawals;

        // 2. Fetch Chart Data based on type
        let chartData = [];
        
        if (reportType === "revenue") {
            // Combine Products and Investments
            const [prodTrend, invTrend] = await Promise.all([
                Product.aggregate([
                    { $match: { approve: { $in: [1, "1"] }, cereate_at: { $gte: startDate } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$cereate_at" } },
                            value: { $sum: "$amount" }
                        }
                    }
                ]),
                Investment.aggregate([
                    { $match: { status: { $in: ['active', 'completed', 'Active', 'Completed'] }, createdAt: { $gte: startDate } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            value: { $sum: "$amount" }
                        }
                    }
                ])
            ]);

            // Merge trends
            const trendMap = {};
            prodTrend.forEach(d => trendMap[d._id] = (trendMap[d._id] || 0) + d.value);
            invTrend.forEach(d => trendMap[d._id] = (trendMap[d._id] || 0) + d.value);
            
            chartData = Object.entries(trendMap)
                .map(([date, value]) => ({ date, value }))
                .sort((a, b) => a.date.localeCompare(b.date));

        } else if (reportType === "users") {
            const userTrend = await User.aggregate([
                { $match: { create_at: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$create_at" } },
                        value: { $count: {} }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            chartData = userTrend.map(d => ({ date: d._id, value: d.value }));

        } else if (reportType === "transactions") {
            const txTrend = await Transaction.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        value: { $count: {} }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            chartData = txTrend.map(d => ({ date: d._id, value: d.value }));
        }

        // Format dates for UI (YYYY-MM-DD -> DD/MM)
        chartData = chartData.map(d => {
            const [y, m, day] = d.date.split('-');
            return {
                date: `${day}/${m}`,
                value: d.value
            };
        });

        // 3. Top Regions (Improved Logic)
        const users = await User.find({ address: { $exists: true, $ne: null, $ne: "" } }, 'address').lean();
        const regionCounts = {};
        users.forEach(u => {
            const parts = u.address.split(',').map(p => p.trim()).filter(p => p.length > 0);
            let region = "Other";
            for (let i = parts.length - 1; i >= 0; i--) {
                const part = parts[i];
                if (!/^\d+$/.test(part.replace(/\s/g, ''))) {
                    region = part;
                    break;
                }
            }
            regionCounts[region] = (regionCounts[region] || 0) + 1;
        });

        const topRegions = Object.entries(regionCounts)
            .map(([name, count]) => ({
                name,
                users: count,
                volume: `₹${(count * (totalRevenue / (users.length || 1))).toFixed(0)}`
            }))
            .sort((a, b) => b.users - a.users)
            .slice(0, 5);

        // Max chart value for scaling
        let maxChartValue = 1000;
        if (chartData.length > 0) {
            maxChartValue = Math.max(...chartData.map(d => d.value), 1000) * 1.2; // 20% buffer
        }

        res.json({
            stats: {
                totalRevenue,
                totalDeposits,
                totalWithdrawals,
                netProfit,
                maxChartValue
            },
            chartData: chartData.length > 0 ? chartData : [{ date: 'No Data', value: 0 }],
            topCountries: topRegions
        });

    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getReports
};
