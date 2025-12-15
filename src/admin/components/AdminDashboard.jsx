"use client"

import { useState } from "react"

export default function AdminDashboard() {
    const [timeRange, setTimeRange] = useState("24h")

    const stats = [
        { label: "Total Users", value: "12,450", change: "+12%", icon: "👥", color: "from-blue-500 to-blue-600" },
        { label: "Total Revenue", value: "$1.2M", change: "+8%", icon: "💰", color: "from-green-500 to-green-600" },
        { label: "Pending KYC", value: "145", change: "-5%", icon: "⏳", color: "from-yellow-500 to-yellow-600" },
        { label: "Active Packages", value: "8,234", change: "+15%", icon: "📦", color: "from-purple-500 to-purple-600" },
        { label: "Pending Withdrawals", value: "67", change: "+3%", icon: "💳", color: "from-red-500 to-red-600" },
        { label: "Total Transactions", value: "45.2K", change: "+22%", icon: "🔄", color: "from-[#f3b232] to-[#d4941f]" },
    ]

    const recentActivities = [
        {
            type: "user",
            action: "New user registration",
            user: "john.doe@email.com",
            time: "2 mins ago",
            status: "success",
        },
        {
            type: "kyc",
            action: "KYC verification pending",
            user: "jane.smith@email.com",
            time: "5 mins ago",
            status: "pending",
        },
        {
            type: "withdrawal",
            action: "Withdrawal request",
            user: "mike.wilson@email.com",
            time: "12 mins ago",
            status: "pending",
        },
        {
            type: "package",
            action: "Package purchased",
            user: "sarah.jones@email.com",
            time: "18 mins ago",
            status: "success",
        },
        {
            type: "transaction",
            action: "Transaction completed",
            user: "alex.brown@email.com",
            time: "25 mins ago",
            status: "success",
        },
    ]

    const topUsers = [
        { name: "Alice Johnson", investment: "$45,200", returns: "$8,340", level: "Diamond" },
        { name: "Bob Smith", investment: "$38,900", returns: "$7,120", level: "Platinum" },
        { name: "Carol Davis", investment: "$32,500", returns: "$6,450", level: "Gold" },
        { name: "David Wilson", investment: "$28,100", returns: "$5,280", level: "Gold" },
        { name: "Emma Brown", investment: "$24,800", returns: "$4,890", level: "Silver" },
    ]

    return (
        <div className="space-y-6 animate-fadeIn">
            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(243, 178, 50, 0.5); }
          50% { box-shadow: 0 0 20px rgba(243, 178, 50, 0.8); }
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
                <div className="flex items-center gap-2">
                    {["24h", "7d", "30d", "All"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range ? "bg-[#f3b232] text-[#1f1f1f]" : "bg-[#1f1f1f] text-gray-400 hover:text-white"
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-[#1f1f1f] rounded-xl p-6 border border-[#3f3f3f] hover:border-[#f3b232] transition-all hover:shadow-lg hover:shadow-[#f3b232]/20"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
                                <p className={`text-sm font-medium ${stat.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                                    {stat.change} from last period
                                </p>
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
                <div className="lg:col-span-2 bg-[#1f1f1f] rounded-xl p-6 border border-[#3f3f3f]">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentActivities.map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-[#2b2b2b] rounded-lg hover:bg-[#3f3f3f] transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.status === "success"
                                                ? "bg-green-500/20 text-green-500"
                                                : "bg-yellow-500/20 text-yellow-500"
                                            }`}
                                    >
                                        {activity.status === "success" ? "✓" : "⏳"}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{activity.action}</p>
                                        <p className="text-gray-400 text-sm">{activity.user}</p>
                                    </div>
                                </div>
                                <span className="text-gray-500 text-sm">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Users */}
                <div className="bg-[#1f1f1f] rounded-xl p-6 border border-[#3f3f3f]">
                    <h3 className="text-xl font-bold text-white mb-4">Top Investors</h3>
                    <div className="space-y-3">
                        {topUsers.map((user, index) => (
                            <div key={index} className="p-3 bg-[#2b2b2b] rounded-lg hover:bg-[#3f3f3f] transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-[#f3b232] to-[#d4941f] rounded-full flex items-center justify-center text-white text-sm font-bold">
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
                                        Investment: <span className="text-green-500">{user.investment}</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-[#f3b232] to-[#d4941f] rounded-xl p-6">
                <h3 className="text-xl font-bold text-[#1f1f1f] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Approve KYC", icon: "✅", count: "145" },
                        { label: "Process Withdrawals", icon: "💰", count: "67" },
                        { label: "Review Tickets", icon: "🎫", count: "23" },
                        { label: "System Settings", icon: "⚙️", count: "—" },
                    ].map((action, index) => (
                        <button
                            key={index}
                            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg p-4 text-center transition-all hover:scale-105"
                        >
                            <div className="text-3xl mb-2">{action.icon}</div>
                            <p className="text-[#1f1f1f] font-semibold text-sm">{action.label}</p>
                            <p className="text-[#1f1f1f] text-xs mt-1">{action.count} pending</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
