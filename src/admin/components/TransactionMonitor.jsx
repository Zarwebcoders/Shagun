"use client"

import { useState } from "react"

export default function TransactionMonitor() {
  const [filterType, setFilterType] = useState("all")

  const transactions = [
    {
      id: "TXN001234",
      type: "deposit",
      user: "john.doe@email.com",
      amount: "$5,200",
      crypto: "BTC",
      hash: "0x742d35a8f...",
      status: "completed",
      date: "2024-03-15 14:30:22",
    },
    {
      id: "TXN001235",
      type: "withdrawal",
      user: "alice.j@email.com",
      amount: "$8,400",
      crypto: "ETH",
      hash: "0x9e2c4b1a...",
      status: "pending",
      date: "2024-03-15 14:25:10",
    },
    {
      id: "TXN001236",
      type: "investment",
      user: "bob.smith@email.com",
      amount: "$12,000",
      crypto: "USDT",
      hash: "0x1f5a7c4e...",
      status: "completed",
      date: "2024-03-15 14:20:45",
    },
    {
      id: "TXN001237",
      type: "referral",
      user: "carol.d@email.com",
      amount: "$150",
      crypto: "BTC",
      hash: "0x6c8e2d9b...",
      status: "completed",
      date: "2024-03-15 14:15:33",
    },
    {
      id: "TXN001238",
      type: "withdrawal",
      user: "david.w@email.com",
      amount: "$3,500",
      crypto: "ETH",
      hash: "0x3a7f8e1c...",
      status: "failed",
      date: "2024-03-15 14:10:18",
    },
  ]

  const getTypeColor = (type) => {
    switch (type) {
      case "deposit":
        return "bg-green-500/20 text-green-500"
      case "withdrawal":
        return "bg-red-500/20 text-red-500"
      case "investment":
        return "bg-blue-500/20 text-blue-500"
      case "referral":
        return "bg-purple-500/20 text-purple-500"
      default:
        return "bg-gray-500/20 text-gray-500"
    }
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
        <h2 className="text-3xl font-bold text-white">Transaction Monitor</h2>
        <p className="text-gray-400 mt-1">Real-time monitoring of all platform transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: "Total Transactions", value: "45,234", icon: "📊" },
          { label: "Total Volume", value: "$12.4M", icon: "💰" },
          { label: "Pending", value: "23", icon: "⏳" },
          { label: "Failed", value: "5", icon: "❌" },
          { label: "Today", value: "1,234", icon: "📅" },
        ].map((stat, index) => (
          <div key={index} className="bg-[#1f1f1f] rounded-xl p-6 border border-[#3f3f3f]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#1f1f1f] rounded-xl p-4 border border-[#3f3f3f]">
        <div className="flex flex-wrap gap-2">
          {["all", "deposit", "withdrawal", "investment", "referral"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-2 rounded-lg font-semibold capitalize transition-all ${filterType === type ? "bg-[#f3b232] text-[#1f1f1f]" : "bg-[#2b2b2b] text-gray-400 hover:text-white"
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#1f1f1f] rounded-xl border border-[#3f3f3f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#2b2b2b]">
              <tr>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Transaction ID</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Type</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">User</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Amount</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Crypto</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Hash</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Status</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Date/Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3f3f3f]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#2b2b2b] transition-colors">
                  <td className="px-6 py-4">
                    <code className="text-[#f3b232] text-sm font-mono">{tx.id}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getTypeColor(tx.type)}`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{tx.user}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${tx.type === "deposit" ? "text-green-500" : "text-white"}`}>
                      {tx.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-[#f3b232]/20 text-[#f3b232] rounded text-xs font-semibold">
                      {tx.crypto}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-gray-400 text-xs">{tx.hash}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${tx.status === "completed"
                          ? "bg-green-500/20 text-green-500"
                          : tx.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
