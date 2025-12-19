"use client"

import { useState } from "react"

export default function WithdrawalRequests() {
    const [filterStatus, setFilterStatus] = useState("pending")

    const withdrawals = [
        {
            id: 1,
            user: "John Doe",
            email: "john@email.com",
            amount: "₹5,200",
            wallet: "0x742d...3a8f",
            date: "2024-03-15 14:30",
            status: "pending",
            method: "BTC",
        },
        {
            id: 2,
            user: "Alice Johnson",
            email: "alice@email.com",
            amount: "₹8,400",
            wallet: "0x9e2c...4b1a",
            date: "2024-03-15 12:15",
            status: "pending",
            method: "ETH",
        },
        {
            id: 3,
            user: "Bob Smith",
            email: "bob@email.com",
            amount: "₹3,100",
            wallet: "0x1f5a...7c4e",
            date: "2024-03-14 18:45",
            status: "approved",
            method: "USDT",
        },
        {
            id: 4,
            user: "Carol Davis",
            email: "carol@email.com",
            amount: "₹12,750",
            wallet: "0x6c8e...2d9b",
            date: "2024-03-14 09:20",
            status: "approved",
            method: "BTC",
        },
        {
            id: 5,
            user: "David Wilson",
            email: "david@email.com",
            amount: "₹2,900",
            wallet: "0x3a7f...8e1c",
            date: "2024-03-13 16:30",
            status: "rejected",
            method: "ETH",
        },
    ]

    const handleApprove = (id) => {
        alert(`Withdrawal #${id} approved`)
    }

    const handleReject = (id) => {
        alert(`Withdrawal #${id} rejected`)
    }

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
            <div>
                <h2 className="text-3xl font-bold text-white">Withdrawal Requests</h2>
                <p className="text-gray-400 mt-1">Process and manage user withdrawal requests</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Pending Requests", value: "67", color: "yellow" },
                    { label: "Approved Today", value: "45", color: "green" },
                    { label: "Total Amount", value: "₹234.5K", color: "blue" },
                    { label: "Rejected Today", value: "3", color: "red" },
                ].map((stat, index) => (
                    <div key={index} className="bg-[#0f0f1a] rounded-xl p-6 border border-[#9131e7]/30">
                        <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-[#0f0f1a] rounded-xl p-4 border border-[#9131e7]/30">
                <div className="flex flex-wrap gap-2">
                    {["pending", "approved", "rejected", "all"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-6 py-2 rounded-lg font-semibold capitalize transition-all ${filterStatus === status ? "bg-[#9131e7] text-white" : "bg-[#1a1a2e] text-gray-400 hover:text-white"
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Withdrawals Table */}
            <div className="bg-[#0f0f1a] rounded-xl border border-[#9131e7]/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e]">
                            <tr>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">ID</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">User</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Amount</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Method</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Wallet Address</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Date</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Status</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#9131e7]/30">
                            {withdrawals.map((withdrawal) => (
                                <tr key={withdrawal.id} className="hover:bg-[#1a1a2e] transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-[#9131e7] font-mono">#{withdrawal.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-white font-medium">{withdrawal.user}</p>
                                            <p className="text-gray-400 text-sm">{withdrawal.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-green-500 font-bold text-lg">{withdrawal.amount}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-[#9131e7]/20 text-[#9131e7] rounded-full text-xs font-semibold">
                                            {withdrawal.method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-gray-400 text-sm">{withdrawal.wallet}</code>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">{withdrawal.date}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${withdrawal.status === "pending"
                                                ? "bg-yellow-500/20 text-yellow-500"
                                                : withdrawal.status === "approved"
                                                    ? "bg-green-500/20 text-green-500"
                                                    : "bg-red-500/20 text-red-500"
                                                }`}
                                        >
                                            {withdrawal.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {withdrawal.status === "pending" ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleApprove(withdrawal.id)}
                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(withdrawal.id)}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <button className="px-4 py-2 bg-[#1a1a2e] text-gray-400 rounded-lg text-sm">View Details</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
