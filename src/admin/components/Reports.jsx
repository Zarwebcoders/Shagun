"use client"

import { useState } from "react"

export default function Reports() {
    const [reportType, setReportType] = useState("revenue")
    const [dateRange, setDateRange] = useState("7days")

    const revenueData = [
        { date: "2024-03-09", deposits: 45200, withdrawals: 23400, netRevenue: 21800 },
        { date: "2024-03-10", deposits: 52100, withdrawals: 28900, netRevenue: 23200 },
        { date: "2024-03-11", deposits: 48700, withdrawals: 25600, netRevenue: 23100 },
        { date: "2024-03-12", deposits: 61500, withdrawals: 32100, netRevenue: 29400 },
        { date: "2024-03-13", deposits: 58900, withdrawals: 31200, netRevenue: 27700 },
        { date: "2024-03-14", deposits: 67200, withdrawals: 35800, netRevenue: 31400 },
        { date: "2024-03-15", deposits: 72400, withdrawals: 38900, netRevenue: 33500 },
    ]

    const topCountries = [
        { country: "United States", users: 3420, revenue: "$456,200" },
        { country: "United Kingdom", users: 2890, revenue: "$389,100" },
        { country: "Germany", users: 2340, revenue: "$312,800" },
        { country: "Canada", users: 1890, revenue: "$245,600" },
        { country: "Australia", users: 1560, revenue: "$198,400" },
    ]

    return (
        <div className="space-y-6 animate-fadeIn">
            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Reports & Analytics</h2>
                    <p className="text-gray-400 mt-1">Detailed insights and performance metrics</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-6 py-3 bg-[#2b2b2b] text-white rounded-lg font-semibold hover:bg-[#3f3f3f] transition-all">
                        Export PDF
                    </button>
                    <button className="px-6 py-3 bg-[#f3b232] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#d4941f] transition-all">
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#1f1f1f] rounded-xl p-4 border border-[#3f3f3f]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full px-4 py-3 bg-[#2b2b2b] text-white rounded-lg border border-[#3f3f3f] focus:border-[#f3b232] focus:outline-none"
                        >
                            <option value="revenue">Revenue Report</option>
                            <option value="users">User Growth</option>
                            <option value="transactions">Transactions</option>
                            <option value="packages">Package Performance</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Date Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full px-4 py-3 bg-[#2b2b2b] text-white rounded-lg border border-[#3f3f3f] focus:border-[#f3b232] focus:outline-none"
                        >
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="90days">Last 90 Days</option>
                            <option value="1year">Last Year</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Revenue", value: "₹234.5K", change: "+12.5%", color: "green" },
                    { label: "Total Deposits", value: "₹405.9K", change: "+8.2%", color: "blue" },
                    { label: "Total Withdrawals", value: "₹215.6K", change: "+5.7%", color: "red" },
                    { label: "Net Profit", value: "₹190.3K", change: "+15.3%", color: "yellow" },
                ].map((stat, index) => (
                    <div key={index} className="bg-[#1f1f1f] rounded-xl p-6 border border-[#3f3f3f]">
                        <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                        <p className="text-green-500 text-sm font-medium">{stat.change}</p>
                    </div>
                ))}
            </div>

            {/* Revenue Chart */}
            <div className="bg-[#1f1f1f] rounded-xl p-6 border border-[#3f3f3f]">
                <h3 className="text-xl font-bold text-white mb-6">Revenue Trend (Last 7 Days)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e]">
                            <tr>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Date</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Deposits</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Withdrawals</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Net Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#9131e7]/30">
                            {revenueData.map((row, index) => (
                                <tr key={index} className="hover:bg-[#1a1a2e] transition-colors">
                                    <td className="px-6 py-4 text-white">{row.date}</td>
                                    <td className="px-6 py-4 text-green-500 font-semibold">₹{row.deposits.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-red-500 font-semibold">₹{row.withdrawals.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-[#9131e7] font-bold">₹{row.netRevenue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-[#1a1a2e]">
                            <tr>
                                <td className="px-6 py-4 text-white font-bold">Total</td>
                                <td className="px-6 py-4 text-green-500 font-bold">₹406,000</td>
                                <td className="px-6 py-4 text-red-500 font-bold">₹215,900</td>
                                <td className="px-6 py-4 text-[#9131e7] font-bold">₹190,100</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Top Countries */}
            <div className="bg-[#0f0f1a] rounded-xl p-6 border border-[#9131e7]/30">
                <h3 className="text-xl font-bold text-white mb-6">Top Countries by Revenue</h3>
                <div className="space-y-4">
                    {topCountries.map((country, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg hover:bg-[#9131e7]/30 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#9131e7] to-[#7a28c2] rounded-lg flex items-center justify-center text-white font-bold">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{country.country}</p>
                                    <p className="text-gray-400 text-sm">{country.users.toLocaleString()} users</p>
                                </div>
                            </div>
                            <span className="text-green-500 font-bold text-lg">{country.revenue}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
