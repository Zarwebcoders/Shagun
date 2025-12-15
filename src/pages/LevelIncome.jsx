"use client"

import { useState } from "react"

export default function LevelIncome() {
    const [selectedLevel, setSelectedLevel] = useState("all")
    const allLevelData = [
        { level: 1, members: 5, totalInvestment: 2500, commissionRate: 5, income: 125 },
        { level: 2, members: 12, totalInvestment: 6800, commissionRate: 3, income: 204 },
        { level: 3, members: 8, totalInvestment: 4200, commissionRate: 1, income: 42 },
        { level: 4, members: 3, totalInvestment: 1500, commissionRate: 0.5, income: 7.5 },
        { level: 5, members: 7, totalInvestment: 3500, commissionRate: 0.3, income: 10.5 },
        { level: 6, members: 2, totalInvestment: 1000, commissionRate: 0.2, income: 2 },
        { level: 7, members: 4, totalInvestment: 2200, commissionRate: 0.1, income: 2.2 },
        { level: 8, members: 1, totalInvestment: 500, commissionRate: 0.05, income: 0.25 },
    ]

    // Filter data based on selected level
    const filteredData = selectedLevel === "all"
        ? allLevelData
        : allLevelData.filter(item => item.level === parseInt(selectedLevel))

    // Calculate totals based on filtered data
    const totalLevelIncome = filteredData.reduce((sum, item) => sum + item.income, 0)
    const totalMembers = filteredData.reduce((sum, item) => sum + item.members, 0)

    return (
        <div className="w-full space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Level Income</h2>
                    <p className="text-[#b0b0b0] text-sm md:text-lg">View your income from network levels</p>
                </div>

                {/* Dropdown for level selection */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3">
                    <span className="text-[#b0b0b0] text-sm md:text-base">Select Level:</span>
                    <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="bg-[#040408] border border-[#9131e7] text-white rounded-lg px-3 md:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9131e7] w-full sm:w-auto min-w-[150px] text-sm md:text-base"
                    >
                        <option value="all">All Levels</option>
                        {allLevelData.map((item) => (
                            <option key={item.level} value={item.level}>
                                Level {item.level}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-4 md:p-6 rounded-lg border border-[#444]">
                    <h3 className="text-[#b0b0b0] text-xs md:text-sm mb-2">Total Level Income</h3>
                    <p className="text-2xl md:text-3xl font-bold text-[#9131e7]">${totalLevelIncome.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-4 md:p-6 rounded-lg border border-[#444]">
                    <h3 className="text-[#b0b0b0] text-xs md:text-sm mb-2">Total Network Members</h3>
                    <p className="text-2xl md:text-3xl font-bold text-blue-400">{totalMembers}</p>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-4 md:p-6 rounded-lg border border-[#444]">
                    <h3 className="text-[#b0b0b0] text-xs md:text-sm mb-2">Active Levels</h3>
                    <p className="text-2xl md:text-3xl font-bold text-green-400">
                        {selectedLevel === "all" ? allLevelData.length : "1"}
                    </p>
                </div>
            </div>

            <div className="space-y-4 md:space-y-6">
                <h3 className="text-xl md:text-2xl font-bold text-[#9131e7]">
                    Level Income Breakdown {selectedLevel !== "all" && `- Level ${selectedLevel}`}
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max">
                        <thead>
                            <tr className="border-b border-[#444]">
                                <th className="text-left py-3 px-3 md:px-4 text-white font-semibold text-xs md:text-sm">Level</th>
                                <th className="text-left py-3 px-3 md:px-4 text-white font-semibold text-xs md:text-sm">Members</th>
                                <th className="text-left py-3 px-3 md:px-4 text-white font-semibold text-xs md:text-sm">Total Investment</th>
                                <th className="text-left py-3 px-3 md:px-4 text-white font-semibold text-xs md:text-sm">Commission %</th>
                                <th className="text-left py-3 px-3 md:px-4 text-white font-semibold text-xs md:text-sm">Income</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, index) => (
                                <tr key={index} className="border-b border-[#444] hover:bg-[#040408]/50 transition-colors">
                                    <td className="py-3 px-3 md:px-4">
                                        <span className="px-2 md:px-3 py-1 bg-[#9131e7]/20 text-[#9131e7] rounded-full text-xs md:text-sm font-semibold">
                                            {item.level}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 md:px-4 text-white text-sm md:text-base">{item.members}</td>
                                    <td className="py-3 px-3 md:px-4 text-white text-sm md:text-base">${item.totalInvestment.toLocaleString()}</td>
                                    <td className="py-3 px-3 md:px-4 text-white text-sm md:text-base">{item.commissionRate}%</td>
                                    <td className="py-3 px-3 md:px-4 text-[#9131e7] font-bold text-sm md:text-base">${item.income.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}