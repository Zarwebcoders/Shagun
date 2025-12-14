"use client"

import { useState } from "react"
import WithdrawalForm from "../components/WithdrawalForm"

export default function Withdrawal() {
    const [userData] = useState({
        name: "NIRMALABEN SURESHBHAI PATEL",
        points: {
            loyalty: 12500,
            sgn: 8500,
            shopping: 3200,
            total: 24200
        }
    })

    const [withdrawalHistory, setWithdrawalHistory] = useState([
        { id: 1, amount: 500, date: "2024-01-15", status: "Completed", method: "Bank Transfer", source: "Loyalty Points" },
        { id: 2, amount: 250, date: "2024-01-10", status: "Completed", method: "Crypto Wallet", source: "REX Token" },
        { id: 3, amount: 1000, date: "2024-01-08", status: "Pending", method: "Bank Transfer", source: "Shopping Tokens" },
        { id: 4, amount: 750, date: "2024-01-05", status: "Completed", method: "Crypto Wallet", source: "Loyalty Points" },
        { id: 5, amount: 300, date: "2024-01-03", status: "Completed", method: "Bank Transfer", source: "REX Token" },
    ])

    const handleWithdraw = (data) => {
        const newWithdrawal = {
            id: withdrawalHistory.length + 1,
            ...data,
            date: new Date().toISOString().split("T")[0],
            status: "Pending",
        }
        setWithdrawalHistory((prev) => [newWithdrawal, ...prev])
    }

    return (
        <div className="w-full space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
                <h2 className="text-4xl font-bold text-white mb-2">Withdrawal Center</h2>
                <div className="flex items-center justify-between">
                    <p className="text-[#b0b0b0] text-lg">
                        Welcome, <span className="text-[#9131e7] font-bold">{userData.name}!</span> Manage your earnings and withdraw funds securely from your available wallets.
                    </p>
                    <div className="flex items-center gap-2 bg-[#9131e7]/10 border border-[#9131e7]/30 px-4 py-2 rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-semibold">Available Balance</span>
                    </div>
                </div>
            </div>

            {/* Wallet Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Loyalty Points Card */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-6 rounded-xl border border-[#9131e7]/30 hover:border-[#9131e7] transition-all group hover:shadow-lg hover:shadow-[#9131e7]/20">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-white font-bold text-lg">Monthly Income</h3>
                            <p className="text-gray-400 text-sm">Reward Points</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#9131e7]/20 group-hover:bg-[#9131e7]/30 transition-all">
                            <svg className="w-6 h-6 text-[#9131e7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mb-2">
                        <span className="text-3xl font-bold text-white">{userData.points.loyalty.toLocaleString()}</span>
                        <span className="text-gray-400 ml-2">Points</span>
                    </div>
                    <div className="w-full bg-[#444]/50 rounded-full h-2">
                        <div className="bg-gradient-to-r from-[#9131e7] to-[#e84495] h-2 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                </div>

                {/* SGN Token Card */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-6 rounded-xl border border-[#00b894]/30 hover:border-[#00b894] transition-all group hover:shadow-lg hover:shadow-[#00b894]/20">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-white font-bold text-lg">REX Token</h3>
                            <p className="text-gray-400 text-sm">Mining Tokens</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#00b894]/20 group-hover:bg-[#00b894]/30 transition-all">
                            <svg className="w-6 h-6 text-[#00b894]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mb-2">
                        <span className="text-3xl font-bold text-white">{userData.points.sgn.toLocaleString()}</span>
                        <span className="text-gray-400 ml-2">REX</span>
                    </div>
                    <div className="w-full bg-[#444]/50 rounded-full h-2">
                        <div className="bg-gradient-to-r from-[#00b894] to-[#00cec9] h-2 rounded-full" style={{ width: "60%" }}></div>
                    </div>
                </div>

                {/* Shopping Tokens Card */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-6 rounded-xl border border-[#fd79a8]/30 hover:border-[#fd79a8] transition-all group hover:shadow-lg hover:shadow-[#fd79a8]/20">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-white font-bold text-lg">Annual Bonus</h3>
                            <p className="text-gray-400 text-sm">E-commerce Tokens</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#fd79a8]/20 group-hover:bg-[#fd79a8]/30 transition-all">
                            <svg className="w-6 h-6 text-[#fd79a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mb-2">
                        <span className="text-3xl font-bold text-white">{userData.points.shopping.toLocaleString()}</span>
                        <span className="text-gray-400 ml-2">Tokens</span>
                    </div>
                    <div className="w-full bg-[#444]/50 rounded-full h-2">
                        <div className="bg-gradient-to-r from-[#fd79a8] to-[#e17055] h-2 rounded-full" style={{ width: "40%" }}></div>
                    </div>
                </div>

                {/* Total Withdrawable Card */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-6 rounded-xl border border-[#0984e3]/30 hover:border-[#0984e3] transition-all group hover:shadow-lg hover:shadow-[#0984e3]/20">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-white font-bold text-lg">Total Withdrawable</h3>
                            <p className="text-gray-400 text-sm">Available Balance</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#0984e3]/20 group-hover:bg-[#0984e3]/30 transition-all">
                            <svg className="w-6 h-6 text-[#0984e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mb-2">
                        <span className="text-3xl font-bold text-white">₹{userData.points.total.toLocaleString()}</span>
                        <span className="text-gray-400 ml-2">INR</span>
                    </div>
                    <div className="w-full bg-[#444]/50 rounded-full h-2">
                        <div className="bg-gradient-to-r from-[#0984e3] to-[#00cec9] h-2 rounded-full" style={{ width: "90%" }}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Withdrawal Form Section */}
                <div className="lg:col-span-1">
                    <WithdrawalForm 
                        onSubmit={handleWithdraw} 
                        walletPoints={userData.points}
                    />
                </div>

                {/* Withdrawal History Section */}
                <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] rounded-xl border border-[#9131e7]/30 overflow-hidden">
                        <div className="p-6 border-b border-[#9131e7]/30 bg-gradient-to-r from-[#9131e7]/10 to-[#e84495]/10">
                            <h3 className="text-2xl font-bold text-white">Withdrawal History</h3>
                            <p className="text-gray-400">Track all your withdrawal requests</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#9131e7]/30">
                                        <th className="text-left py-4 px-6 text-white font-bold">Source</th>
                                        <th className="text-left py-4 px-6 text-white font-bold">Amount</th>
                                        <th className="text-left py-4 px-6 text-white font-bold">Date</th>
                                        <th className="text-left py-4 px-6 text-white font-bold">Method</th>
                                        <th className="text-left py-4 px-6 text-white font-bold">Status</th>
                                        <th className="text-left py-4 px-6 text-white font-bold">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawalHistory.map((item) => (
                                        <tr 
                                            key={item.id} 
                                            className="border-b border-[#444]/30 hover:bg-[#9131e7]/10 transition-colors group"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.source === "Loyalty Points" ? "bg-[#9131e7]/20" : item.source === "REX Token" ? "bg-[#00b894]/20" : "bg-[#fd79a8]/20"}`}>
                                                        <span className={`font-bold ${item.source === "Loyalty Points" ? "text-[#9131e7]" : item.source === "REX Token" ? "text-[#00b894]" : "text-[#fd79a8]"}`}>
                                                            {item.source.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <span className="text-white font-medium">{item.source}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-xl font-bold text-white">₹{item.amount}</span>
                                            </td>
                                            <td className="py-4 px-6 text-[#b0b0b0]">{item.date}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1 rounded ${item.method === "Bank Transfer" ? "bg-blue-500/20" : "bg-yellow-500/20"}`}>
                                                        {item.method === "Bank Transfer" ? (
                                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="text-white">{item.method}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${item.status === "Completed"
                                                        ? "bg-green-600/20 text-green-400 border border-green-600/30"
                                                        : item.status === "Pending"
                                                        ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30"
                                                        : "bg-red-600/20 text-red-400 border border-red-600/30"
                                                    }`}
                                                >
                                                    {item.status === "Completed" && (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    {item.status === "Pending" && (
                                                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    )}
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <button className="px-3 py-1 bg-[#9131e7]/20 text-[#9131e7] rounded-lg hover:bg-[#9131e7]/30 transition-colors text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty State */}
                        {withdrawalHistory.length === 0 && (
                            <div className="p-12 text-center">
                                <div className="inline-block p-4 rounded-full bg-gradient-to-br from-[#9131e7]/10 to-[#e84495]/10 mb-4">
                                    <svg className="w-16 h-16 text-[#9131e7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No Withdrawal History</h3>
                                <p className="text-gray-400 mb-6">Your withdrawal requests will appear here</p>
                            </div>
                        )}

                        {/* Table Footer */}
                        <div className="p-4 bg-[#0f0f1a] border-t border-[#9131e7]/30 flex justify-between items-center">
                            <div className="text-gray-400 text-sm">
                                Showing {withdrawalHistory.length} withdrawals
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-[#9131e7]/20 text-[#9131e7] rounded-lg hover:bg-[#9131e7]/30 transition-colors">
                                    Previous
                                </button>
                                <button className="px-3 py-1 bg-[#9131e7] text-white rounded-lg hover:bg-[#7a27c9] transition-colors">
                                    1
                                </button>
                                <button className="px-3 py-1 bg-[#9131e7]/20 text-[#9131e7] rounded-lg hover:bg-[#9131e7]/30 transition-colors">
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-6 rounded-xl border border-[#9131e7]/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold text-lg">Total Withdrawn</h4>
                            <p className="text-gray-400 text-sm">All Time</p>
                        </div>
                        <div className="text-3xl font-bold text-[#9131e7]">₹2,800</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-6 rounded-xl border border-[#00b894]/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold text-lg">Pending Withdrawals</h4>
                            <p className="text-gray-400 text-sm">Awaiting Processing</p>
                        </div>
                        <div className="text-3xl font-bold text-[#00b894]">₹1,000</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-6 rounded-xl border border-[#0984e3]/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold text-lg">Withdrawal Fee</h4>
                            <p className="text-gray-400 text-sm">Standard Charge</p>
                        </div>
                        <div className="text-3xl font-bold text-[#0984e3]">5%</div>
                    </div>
                </div>
            </div>
        </div>
    )
}