"use client"

import { useState, useEffect } from "react"
import client from "../api/client"

export default function LevelIncome() {
    const [selectedLevel, setSelectedLevel] = useState("all")
    const [levelData, setLevelData] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedLevel, setExpandedLevel] = useState(null)

    useEffect(() => {
        const fetchLevelIncome = async () => {
            try {
                const { data } = await client.get('/level-income');

                // Process level income data
                const processed = data.map(income => ({
                    level: income.level,
                    members: 1, // Each income record represents one member
                    totalInvestment: 0, // Not directly available in new flat structure unless populated
                    income: Number(income.amount),
                    fromUser: income.from_user_id?.name || "Unknown User",
                    email: income.from_user_id?.email || "N/A",
                    // Format date and time
                    date: new Date(income.created_at).toLocaleDateString(),
                    time: new Date(income.created_at).toLocaleTimeString(),
                    originalDate: new Date(income.created_at), // For sorting if needed
                    id: income._id // Unique ID for key
                }));

                setLevelData(processed);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching level income:", error);
                setLoading(false);
            }
        };
        fetchLevelIncome();
    }, [])

    // Group by level
    const groupedData = levelData.reduce((acc, curr) => {
        const existing = acc.find(item => item.level === curr.level);
        if (existing) {
            existing.income += Number(curr.income);
            existing.members += 1;
            existing.totalInvestment += curr.totalInvestment;
            existing.details.push(curr); // Add to details array
        } else {
            acc.push({
                level: curr.level,
                income: Number(curr.income),
                members: 1,
                totalInvestment: curr.totalInvestment,
                details: [curr] // Initialize details array
            });
        }
        return acc;
    }, []).sort((a, b) => a.level - b.level);

    const displayData = selectedLevel === "all"
        ? groupedData
        : groupedData.filter(item => item.level === parseInt(selectedLevel));

    const totalLevelIncome = displayData.reduce((sum, item) => sum + item.income, 0);
    const totalMembers = displayData.reduce((sum, item) => sum + item.members, 0);

    const toggleExpand = (level) => {
        if (expandedLevel === level) {
            setExpandedLevel(null);
        } else {
            setExpandedLevel(level);
        }
    };

    if (loading) return <div className="text-white">Loading level income...</div>

    return (
        <div className="w-full space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Level Income</h2>
                    <p className="text-[#b0b0b0] text-sm md:text-lg">View your income from network levels</p>
                </div>

                {/* Dropdown removed as per request */}

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-4 md:p-6 rounded-lg border border-[#444]">
                    <h3 className="text-[#b0b0b0] text-xs md:text-sm mb-2">Total Level Income</h3>
                    <p className="text-2xl md:text-3xl font-bold text-teal-400">SGN {totalLevelIncome.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-4 md:p-6 rounded-lg border border-[#444]">
                    <h3 className="text-[#b0b0b0] text-xs md:text-sm mb-2">Total Network Members</h3>
                    <p className="text-2xl md:text-3xl font-bold text-blue-400">{totalMembers}</p>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-4 md:p-6 rounded-lg border border-[#444]">
                    <h3 className="text-[#b0b0b0] text-xs md:text-sm mb-2">Active Levels</h3>
                    <p className="text-2xl md:text-3xl font-bold text-green-400">
                        {groupedData.length}
                    </p>
                </div>
            </div>

            <div className="space-y-4 md:space-y-6">
                <h3 className="text-xl md:text-2xl font-bold text-teal-400">
                    Level Income Breakdown {selectedLevel !== "all" && `- Level ${selectedLevel}`}
                </h3>
                {displayData.length === 0 ? (
                    <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-8 rounded-lg border border-[#444] text-center">
                        <p className="text-gray-400">No level income data available yet.</p>
                        <p className="text-gray-500 text-sm mt-2">Build your network to start earning level income!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayData.map((item) => (
                            <div key={item.level} className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] rounded-lg border border-[#444] overflow-hidden">
                                <div
                                    className="p-4 flex flex-wrap justify-between items-center cursor-pointer hover:bg-[#1a1a24] transition-colors"
                                    onClick={() => toggleExpand(item.level)}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm font-semibold">
                                            Level {item.level}
                                        </span>
                                        <span className="text-gray-300 text-sm md:text-base">
                                            {item.members} Members
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                        <span className="text-teal-400 font-bold text-lg">
                                            SGN {item.income.toLocaleString()}
                                        </span>
                                        <span className="text-[#b0b0b0]">
                                            {expandedLevel === item.level ? '▲' : '▼'}
                                        </span>
                                    </div>
                                </div>

                                {expandedLevel === item.level && (
                                    <div className="border-t border-[#444] bg-[#0a0a10] overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-400 uppercase bg-[#0f0f1a]">
                                                <tr className="text-center">
                                                    <th className="px-4 py-3">From User</th>
                                                    <th className="px-4 py-3">Email</th>
                                                    <th className="px-4 py-3">Income</th>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-center">
                                                {item.details.map((detail, idx) => (
                                                    <tr key={idx} className="border-b border-[#333] hover:bg-[#1f1f2e]">
                                                        <td className="px-4 py-3 font-medium text-white">
                                                            {detail.fromUser}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-300">
                                                            {detail.email}
                                                        </td>
                                                        <td className="px-4 py-3 text-teal-400">
                                                            SGN {detail.income}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-400">
                                                            {detail.date}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-400">
                                                            {detail.time}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}