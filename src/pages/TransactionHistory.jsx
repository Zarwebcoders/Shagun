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
        <div className="w-full space-y-8">
            <h2 className="text-4xl font-bold text-white mb-2">Transaction History</h2>
            <p className="text-[#b0b0b0] text-lg">View all your transaction records</p>

            <div className="overflow-x-auto bg-gradient-to-br from-[#040408] to-[#1f1f1f] rounded-xl border border-[#444]">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#444]">
                            <th className="text-left py-4 px-6 text-white font-semibold">Type</th>
                            <th className="text-left py-4 px-6 text-white font-semibold">Amount</th>
                            <th className="text-left py-4 px-6 text-white font-semibold">Date</th>
                            <th className="text-left py-4 px-6 text-white font-semibold">Status</th>
                            <th className="text-left py-4 px-6 text-white font-semibold">Tx Hash</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="border-b border-[#444] hover:bg-[#040408]/50 transition-colors">
                                <td className="py-4 px-6">
                                    <span className="px-3 py-1 bg-[#9131e7]/20 text-[#9131e7] rounded-full text-sm font-semibold">
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-white font-medium">${tx.amount}</td>
                                <td className="py-4 px-6 text-[#b0b0b0]">{tx.date}</td>
                                <td className="py-4 px-6">
                                    <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-semibold">
                                        {tx.status}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-[#b0b0b0] font-mono text-sm">{tx.txHash}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
