"use client"

import { useState, useEffect } from "react"
import client from "../../api/client"

export default function AdminDashboard() {
    const [timeRange, setTimeRange] = useState("24h")
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRevenue: 0,
        pendingKYC: 0,
        activeInvestments: 0,
        pendingWithdrawals: 0,
        totalTransactions: 0
    })
    const [recentActivities, setRecentActivities] = useState([])
    const [topUsers, setTopUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [usersRes, transactionsRes, kycRes, investmentsRes] = await Promise.all([
                client.get('/users'),
                client.get('/transactions/all').catch(() => ({ data: [] })),
                client.get('/kyc/all').catch(() => ({ data: [] })),
                client.get('/investments/all').catch(() => ({ data: [] }))
            ]);

            const users = usersRes.data || [];
            const transactions = transactionsRes.data || [];
            const kycRequests = kycRes.data || [];
            const investments = investmentsRes.data || [];

            // Calculate stats
            const totalRevenue = investments
                .filter(inv => inv.status === 'approved')
                .reduce((sum, inv) => sum + inv.amount, 0);

            const pendingKYC = kycRequests.filter(kyc => kyc.status === 'pending').length;
            const activeInvestments = investments.filter(inv => inv.status === 'approved').length;
            const pendingWithdrawals = transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'pending').length;

            setStats({
                totalUsers: users.length,
                totalRevenue: totalRevenue,

                activeInvestments: activeInvestments,
                pendingWithdrawals: pendingWithdrawals,
                totalTransactions: transactions.length
            });

            // Get recent activities (last 5 transactions/registrations)
            const recentTx = transactions
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map(tx => ({
                    type: tx.type,
                    action: `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} ${tx.status}`,
                    user: tx.user?.email || 'Unknown',
                    time: getTimeAgo(tx.createdAt),
                    status: tx.status
                }));

            setRecentActivities(recentTx);

            // Get top users by investment
            const userInvestments = users
                .map(user => {
                    const userInvs = investments.filter(inv => inv.user?._id === user._id && inv.status === 'approved');
                    const totalInvestment = userInvs.reduce((sum, inv) => sum + inv.amount, 0);
                    return {
                        name: user.name,
                        investment: totalInvestment,
                        returns: totalInvestment * 0.15, // Mock 15% returns
                        level: totalInvestment > 50000 ? 'Diamond' : totalInvestment > 30000 ? 'Platinum' : totalInvestment > 15000 ? 'Gold' : 'Silver'
                    };
                })
                .filter(user => user.investment > 0)
                .sort((a, b) => b.investment - a.investment)
                .slice(0, 5);

            setTopUsers(userInvestments);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setLoading(false);
        }
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds} secs ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} mins ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        return `${days} days ago`;
    };

    const statsConfig = [
        { label: "Total Users", value: stats.totalUsers, change: "+12%", icon: "👥", color: "from-blue-500 to-blue-600" },
        { label: "Total Revenue", value: `₹${(stats.totalRevenue / 1000).toFixed(1)}K`, change: "+8%", icon: "💰", color: "from-green-500 to-green-600" },

        { label: "Active Investments", value: stats.activeInvestments, change: "+15%", icon: "📦", color: "from-purple-500 to-purple-600" },
        { label: "Pending Withdrawals", value: stats.pendingWithdrawals, change: "+3%", icon: "💳", color: "from-red-500 to-red-600" },
        { label: "Total Transactions", value: stats.totalTransactions, change: "+22%", icon: "🔄", color: "from-teal-500 to-purple-500" },
    ];

    if (loading) return <div className="text-white">Loading dashboard...</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(45, 212, 191, 0.5); }
          50% { box-shadow: 0 0 20px rgba(45, 212, 191, 0.8); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
      `}</style>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
                    <p className="text-gray-400 mt-1">Welcome back! Here's what's happening today.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statsConfig.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-[#0f0f1a] rounded-xl p-6 border border-teal-500/30 hover:border-teal-500 transition-all hover:shadow-lg hover:shadow-teal-500/20"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                            </div>
                            <div
                                className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-2xl`}
                            >
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-[#0f0f1a] rounded-xl p-6 border border-teal-500/30">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentActivities.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">No recent activities</p>
                        ) : (
                            recentActivities.map((activity, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg hover:bg-[#2a2a3e] transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.status === "completed" || activity.status === "approved"
                                                ? "bg-green-500/20 text-green-500"
                                                : "bg-yellow-500/20 text-yellow-500"
                                                }`}
                                        >
                                            {activity.status === "completed" || activity.status === "approved" ? "✓" : "⏳"}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{activity.action}</p>
                                            <p className="text-gray-400 text-sm">{activity.user}</p>
                                        </div>
                                    </div>
                                    <span className="text-gray-500 text-sm">{activity.time}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Users */}
                <div className="bg-[#0f0f1a] rounded-xl p-6 border border-teal-500/30">
                    <h3 className="text-xl font-bold text-white mb-4">Top Investors</h3>
                    <div className="space-y-3">
                        {topUsers.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">No investors yet</p>
                        ) : (
                            topUsers.map((user, index) => (
                                <div key={index} className="p-3 bg-[#1a1a2e] rounded-lg hover:bg-[#2a2a3e] transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{user.name}</p>
                                                <p className="text-gray-400 text-xs">{user.level}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">
                                            Investment: <span className="text-green-500">₹{user.investment.toLocaleString()}</span>
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
