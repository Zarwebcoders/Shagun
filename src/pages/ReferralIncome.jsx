"use client"

import { useState } from "react"

export default function ReferralIncome() {
    const [referralData, setReferralData] = useState([
        { id: 1, referralName: "Alice Johnson", date: "2024-01-01", amount: 50, status: "Paid" },
        { id: 2, referralName: "Bob Smith", date: "2024-01-05", amount: 100, status: "Paid" },
        { id: 3, referralName: "Carol Davis", date: "2024-01-10", amount: 30, status: "Paid" },
        { id: 4, referralName: "David Wilson", date: "2024-01-12", amount: 75, status: "Pending" },
    ])

    const totalReferralIncome = referralData.reduce((sum, item) => sum + item.amount, 0)
    const pendingIncome = referralData
        .filter((item) => item.status === "Pending")
        .reduce((sum, item) => sum + item.amount, 0)

    return (
        <div className="w-full space-y-8">
            <h2 className="text-4xl font-bold text-white mb-2">Referral Income</h2>
            <p className="text-[#b0b0b0] text-lg">Track your referral earnings</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-6 rounded-lg border border-[#444]">
                    <h3 className="text-[#b0b0b0] text-sm mb-2">Total Referral Income</h3>
                    <p className="text-3xl font-bold text-[#9131e7]">${totalReferralIncome.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-6 rounded-lg border border-[#444]">
                    <h3 className="text-[#b0b0b0] text-sm mb-2">Pending Income</h3>
                    <p className="text-3xl font-bold text-yellow-400">${pendingIncome.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-6 rounded-lg border border-[#444]">
                    <h3 className="text-[#b0b0b0] text-sm mb-2">Total Referrals</h3>
                    <p className="text-3xl font-bold text-green-400">{referralData.length}</p>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-[#9131e7]">Referral Transaction History</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#444]">
                                <th className="text-left py-3 px-4 text-white font-semibold">Referral Name</th>
                                <th className="text-left py-3 px-4 text-white font-semibold">Date</th>
                                <th className="text-left py-3 px-4 text-white font-semibold">Amount</th>
                                <th className="text-left py-3 px-4 text-white font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referralData.map((item) => (
                                <tr key={item.id} className="border-b border-[#444] hover:bg-[#040408]/50 transition-colors">
                                    <td className="py-3 px-4 text-white">{item.referralName}</td>
                                    <td className="py-3 px-4 text-[#b0b0b0]">{item.date}</td>
                                    <td className="py-3 px-4 text-white font-medium">${item.amount}</td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold ${item.status === "Paid" ? "bg-green-600/20 text-green-400" : "bg-yellow-600/20 text-yellow-400"
                                                }`}
                                        >
                                            {item.status}
                                        </span>
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
