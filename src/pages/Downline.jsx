import { useState, useEffect } from "react"
import client from "../api/client"

export default function Downline() {
    const [userInfo, setUserInfo] = useState({
        userId: "",
        name: "",
        email: "",
        totalNetwork: 0,
        activeLevels: 0,
        overallBusiness: "0"
    })

    const [networkStats, setNetworkStats] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, downlineRes] = await Promise.all([
                    client.get('/auth/me'),
                    client.get('/users/downline')
                ]);

                const userData = userRes.data;
                const downlineData = downlineRes.data || [];

                // Process downline data
                const levels = [0, 0, 0, 0, 0]; // Counts for level 1-5
                let totalMembers = 0;

                downlineData.forEach(user => {
                    const level = user.level; // 0-based from backend
                    if (level >= 0 && level < 5) {
                        levels[level]++;
                        totalMembers++;
                    }
                });

                // Mock stats for business/commission as we don't have that logic yet
                const stats = levels.map((count, index) => ({
                    level: index + 1,
                    members: count,
                    business: `₹${(count * 5000).toLocaleString()}`, // Mock multiplier
                    commission: `₹${(count * 500).toLocaleString()}` // Mock multiplier
                }));

                const activeLevelsCount = levels.filter(l => l > 0).length;

                setUserInfo({
                    userId: userData._id.substring(userData._id.length - 8).toUpperCase(),
                    name: userData.name,
                    email: userData.email,
                    totalNetwork: totalMembers,
                    activeLevels: activeLevelsCount,
                    overallBusiness: `₹${(totalMembers * 5000).toLocaleString()}`
                });

                setNetworkStats(stats);
                setLoading(false);

            } catch (error) {
                console.error("Error fetching downline data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const totalStats = {
        totalMembers: networkStats.reduce((sum, stat) => sum + stat.members, 0),
        totalBusiness: networkStats.reduce((sum, stat) => {
            const business = parseInt(stat.business.replace(/[₹,]/g, '')) || 0;
            return sum + business;
        }, 0),
        totalCommission: networkStats.reduce((sum, stat) => {
            const commission = parseInt(stat.commission.replace(/[₹,]/g, '')) || 0;
            return sum + commission;
        }, 0),
    }

    if (loading) return <div className="text-white">Loading network data...</div>

    return (
        <div className="w-full space-y-6 md:space-y-8">
            {/* Header Section */}
            <div className="space-y-3 md:space-y-4">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Referral Network</h2>
                <p className="text-[#b0b0b0] text-sm md:text-lg">Manage and track your referral network growth. View all levels of your downline team and their performance.</p>
            </div>

            {/* User Information Card */}
            <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] rounded-2xl border border-[#9131e7]/30 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-[#9131e7]/30 bg-gradient-to-r from-[#9131e7]/10 to-[#e84495]/10">
                    <h3 className="text-xl md:text-2xl font-bold text-white">Your Profile Information</h3>
                    <p className="text-gray-400 text-sm md:text-base">Complete overview of your referral network account</p>
                </div>

                <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                    <div className="space-y-1 md:space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1 md:p-2 rounded-lg bg-[#9131e7]/20">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#9131e7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                            </div>
                            <h4 className="text-gray-400 text-xs md:text-sm">User ID</h4>
                        </div>
                        <p className="text-white text-lg md:text-xl font-bold truncate">{userInfo.userId}</p>
                    </div>

                    <div className="space-y-1 md:space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1 md:p-2 rounded-lg bg-[#00b894]/20">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#00b894]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h4 className="text-gray-400 text-xs md:text-sm">Full Name</h4>
                        </div>
                        <p className="text-white text-lg md:text-xl font-bold truncate">{userInfo.name}</p>
                    </div>

                    <div className="space-y-1 md:space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1 md:p-2 rounded-lg bg-[#0984e3]/20">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#0984e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h4 className="text-gray-400 text-xs md:text-sm">Email Address</h4>
                        </div>
                        <p className="text-white text-base md:text-lg font-medium truncate">{userInfo.email}</p>
                    </div>

                    <div className="space-y-1 md:space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1 md:p-2 rounded-lg bg-[#fd79a8]/20">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#fd79a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h4 className="text-gray-400 text-xs md:text-sm">Total Network</h4>
                        </div>
                        <div className="flex items-baseline gap-1 md:gap-2">
                            <p className="text-white text-xl md:text-2xl font-bold">{userInfo.totalNetwork}</p>
                            <span className="text-green-400 text-xs md:text-sm">+12%</span>
                        </div>
                    </div>

                    <div className="space-y-1 md:space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1 md:p-2 rounded-lg bg-[#e17055]/20">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#e17055]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h4 className="text-gray-400 text-xs md:text-sm">Overall Business</h4>
                        </div>
                        <p className="text-white text-xl md:text-2xl font-bold truncate">{userInfo.overallBusiness}</p>
                    </div>
                </div>
            </div>

            {/* Your Network Section */}
            <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-white">Your Network Performance</h3>
                        <p className="text-gray-400 text-sm md:text-base">Detailed breakdown of your network by levels</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm md:text-base">Active Levels:</span>
                        <span className="px-2 md:px-3 py-1 bg-[#9131e7] text-white rounded-full font-bold text-sm md:text-base">{userInfo.activeLevels}</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] rounded-2xl border border-[#9131e7]/30 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-[#9131e7]/30 bg-gradient-to-r from-[#9131e7]/10 to-[#e84495]/10">
                        <h4 className="text-white font-bold text-base md:text-lg">Network Summary</h4>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max">
                            <thead>
                                <tr className="border-b border-[#9131e7]/30">
                                    <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Level</th>
                                    <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Members</th>
                                    <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Business Volume</th>
                                    <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Your Commission</th>
                                    <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Performance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {networkStats.map((stat) => (
                                    <tr key={stat.level} className="border-b border-[#444]/30 hover:bg-[#9131e7]/10 transition-colors">
                                        <td className="py-3 md:py-4 px-3 md:px-6">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#9131e7] to-[#e84495] flex items-center justify-center flex-shrink-0">
                                                    <span className="font-bold text-white text-sm md:text-base">L{stat.level}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-white font-bold text-sm md:text-base truncate block">Level {stat.level}</span>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-12 md:w-16 h-1 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-[#9131e7] to-[#e84495] rounded-full"
                                                                style={{ width: `${(stat.members / 50) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-gray-400 text-xs truncate">{stat.members} members</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 md:py-4 px-3 md:px-6">
                                            <div className="flex items-center gap-1 md:gap-2">
                                                <span className="text-lg md:text-2xl font-bold text-white">{stat.members}</span>
                                                <span className="text-gray-400 text-xs md:text-sm">members</span>
                                            </div>
                                        </td>
                                        <td className="py-3 md:py-4 px-3 md:px-6">
                                            <div className="space-y-1">
                                                <span className="text-lg md:text-xl font-bold text-white truncate block">{stat.business}</span>
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-2 h-2 md:w-3 md:h-3 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                    </svg>
                                                    <span className="text-green-400 text-xs truncate">+15% growth</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 md:py-4 px-3 md:px-6">
                                            <div className="space-y-1">
                                                <span className="text-lg md:text-xl font-bold text-[#00b894] truncate block">{stat.commission}</span>
                                                <span className="text-gray-400 text-xs truncate">10% commission rate</span>
                                            </div>
                                        </td>
                                        <td className="py-3 md:py-4 px-3 md:px-6">
                                            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                                <div className="w-16 md:w-24 flex-shrink-0">
                                                    <div className="text-xs text-gray-400 mb-1 truncate">Growth</div>
                                                    <div className="w-full h-1.5 md:h-2 bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-[#00b894] to-[#00cec9] rounded-full"
                                                            style={{ width: `${(stat.level / 5) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <span className="text-white font-bold text-sm md:text-base flex-shrink-0">{Math.round((stat.level / 5) * 100)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Total Summary Row */}
                    <div className="p-4 md:p-6 bg-gradient-to-r from-[#9131e7]/10 to-[#e84495]/10 border-t border-[#9131e7]/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            <div className="text-center">
                                <div className="text-gray-400 mb-1 text-sm md:text-base">Total Members</div>
                                <div className="text-2xl md:text-3xl font-bold text-white">{totalStats.totalMembers.toLocaleString()}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-400 mb-1 text-sm md:text-base">Total Business Volume</div>
                                <div className="text-2xl md:text-3xl font-bold text-white truncate">₹{totalStats.totalBusiness.toLocaleString()}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-400 mb-1 text-sm md:text-base">Total Commission</div>
                                <div className="text-2xl md:text-3xl font-bold text-[#00b894] truncate">₹{totalStats.totalCommission.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}