"use client"

import { useState } from "react"

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState([
        { id: 1, type: "Deposit", amount: 500, date: "2024-01-15", status: "Completed", txHash: "0x123abc..." },
        { id: 2, type: "Withdrawal", amount: 250, date: "2024-01-14", status: "Completed", txHash: "0x456def..." },
        { id: 3, type: "Referral Bonus", amount: 50, date: "2024-01-13", status: "Completed", txHash: "0x789ghi..." },
        { id: 4, type: "Level Income", amount: 75, date: "2024-01-12", status: "Completed", txHash: "0xabcjkl..." },
        { id: 5, type: "Deposit", amount: 1000, date: "2024-01-11", status: "Completed", txHash: "0xdefmno..." },
    ])

    return (
        <div className="w-full space-y-6 md:space-y-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Transaction History</h2>
            <p className="text-[#b0b0b0] text-sm md:text-lg">View all your transaction records</p>

            <div className="overflow-x-auto bg-gradient-to-br from-[#040408] to-[#1f1f1f] rounded-xl border border-[#444]">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-[#444]">
                            <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-semibold text-xs md:text-sm">Type</th>
                            <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-semibold text-xs md:text-sm">Amount</th>
                            <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-semibold text-xs md:text-sm">Date</th>
                            <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-semibold text-xs md:text-sm">Status</th>
                            <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-semibold text-xs md:text-sm">Tx Hash</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="border-b border-[#444] hover:bg-[#040408]/50 transition-colors">
                                <td className="py-3 md:py-4 px-3 md:px-6">
                                    <span className="px-2 md:px-3 py-1 bg-[#9131e7]/20 text-[#9131e7] rounded-full text-xs md:text-sm font-semibold">
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="py-3 md:py-4 px-3 md:px-6 text-white font-medium text-sm md:text-base">${tx.amount}</td>
                                <td className="py-3 md:py-4 px-3 md:px-6 text-[#b0b0b0] text-xs md:text-sm">{tx.date}</td>
                                <td className="py-3 md:py-4 px-3 md:px-6">
                                    <span className="px-2 md:px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs md:text-sm font-semibold">
                                        {tx.status}
                                    </span>
                                </td>
                                <td className="py-3 md:py-4 px-3 md:px-6 text-[#b0b0b0] font-mono text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{tx.txHash}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}