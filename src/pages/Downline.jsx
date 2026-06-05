import { useState, useEffect } from "react"
import client from "../api/client"

const LEVEL_DESCRIPTIONS = {};
for (let i = 1; i <= 25; i++) {
    if (i === 1) {
        LEVEL_DESCRIPTIONS[i] = "Direct referrals - Your immediate team members";
    } else {
        LEVEL_DESCRIPTIONS[i] = `Level ${i} referrals - Team members referred by Level ${i - 1}`;
    }
}

const COMMISSION_RATES = [
    5, 2, 1.5, 1, 1, 1, 0.75, 0.50, 0.25, 0.25, // Levels 1-10
    0.24, 0.24, 0.24, 0.24, // Levels 11-14
    0.12, 0.12, 0.12, 0.12, 0.12, // Levels 15-19
    0.06, 0.06, 0.06, 0.06, 0.06, 0.06 // Levels 20-25
];

export default function Downline() {
    const [userInfo, setUserInfo] = useState({
        userId: "",
        name: "",
        email: "",
        totalNetwork: 0,
        activeLevels: 0,
        overallBusiness: "0",
        networkGrowth: 0
    })

    const [rawDownline, setRawDownline] = useState([])
    const [selectedLevel, setSelectedLevel] = useState("") // Empty string means no level open
    const [networkStats, setNetworkStats] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, downlineRes, incomeRes] = await Promise.all([
                    client.get('/auth/me'),
                    client.get('/users/downline'),
                    client.get('/level-income').catch(() => ({ data: [] }))
                ]);

                const userData = userRes.data;
                const downlineData = downlineRes.data || [];
                setRawDownline(downlineData);
                const incomeData = incomeRes.data || [];

                // Process downline data by levels (1-25)
                const levels = new Array(25).fill(0);
                const levelBusiness = new Array(25).fill(0);
                const levelCommission = new Array(25).fill(0);
                let totalMembers = 0;
                let totalBusiness = 0;
                let totalCommission = 0;

                // Count members and business volume per level
                downlineData.forEach(user => {
                    const level = user.level; // 0-based from backend
                    if (level >= 0 && level < 25) {
                        levels[level]++;
                        totalMembers++;
                        // Calculate business from user's investments
                        const userBusiness = user.totalInvestment || 0;
                        levelBusiness[level] += userBusiness;
                        totalBusiness += userBusiness;
                    }
                });

                // Calculate commission from income data
                incomeData.forEach(income => {
                    const level = income.level - 1; // Convert to 0-based
                    if (level >= 0 && level < 25) {
                        levelCommission[level] += income.amount || 0;
                        totalCommission += income.amount || 0;
                    }
                });

                // Calculate network growth (compare current month to previous)
                const currentDate = new Date();
                const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
                const currentMonthMembers = downlineData.filter(user =>
                    new Date(user.create_at) >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                ).length;
                const lastMonthMembers = downlineData.filter(user =>
                    new Date(user.create_at) >= lastMonth &&
                    new Date(user.create_at) < new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                ).length;

                const networkGrowth = lastMonthMembers > 0
                    ? Math.round((currentMonthMembers / lastMonthMembers) * 100)
                    : 0;

                // Build stats array with real data
                const stats = levels.map((count, index) => {
                    const business = levelBusiness[index];
                    const commission = levelCommission[index];
                    const levelGrowth = count > 0 ? Math.min(Math.round((count / 10) * 100), 100) : 0;

                    return {
                        level: index + 1,
                        members: count,
                        business: `₹${business.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                        commission: `₹${commission.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                        growth: levelGrowth
                    };
                });

                const activeLevelsCount = levels.filter(l => l > 0).length;

                setUserInfo({
                    userId: userData.referral_id || userData.user_id || userData._id.substring(userData._id.length - 8).toUpperCase(),
                    name: userData.full_name,
                    email: userData.email,
                    totalNetwork: totalMembers,
                    activeLevels: activeLevelsCount,
                    overallBusiness: `₹${totalBusiness.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                    networkGrowth: networkGrowth
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
            const business = parseFloat(stat.business.replace(/[₹,]/g, '')) || 0;
            return sum + business;
        }, 0),
        totalCommission: networkStats.reduce((sum, stat) => {
            const commission = parseFloat(stat.commission.replace(/[₹,]/g, '')) || 0;
            return sum + commission;
        }, 0),
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const dateObj = new Date(dateStr);
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) return <div className="text-white p-6">Loading network data...</div>

    return (
        <div className="w-full space-y-6 md:space-y-8">
            {/* Header Section */}
            <div className="space-y-3 md:space-y-4">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Referral Network</h2>
                <p className="text-[#b0b0b0] text-sm md:text-lg">Explore your referral hierarchy and team structure. Select a level to view member details.</p>
            </div>

            {/* User Profile Information Card */}
            <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] rounded-2xl border border-teal-500/30 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-teal-500/30 bg-gradient-to-r from-teal-500/10 to-purple-500/10">
                    <h3 className="text-xl md:text-2xl font-bold text-white">Your Profile Information</h3>
                    <p className="text-gray-400 text-sm md:text-base">Complete overview of your referral network account</p>
                </div>

                <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                    <div className="space-y-1 md:space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1 md:p-2 rounded-lg bg-teal-500/20">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <div className="p-1 md:p-2 rounded-lg bg-pink-500/20">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h4 className="text-gray-400 text-xs md:text-sm">Total Network</h4>
                        </div>
                        <div className="flex items-baseline gap-1 md:gap-2">
                            <p className="text-white text-xl md:text-2xl font-bold">{userInfo.totalNetwork}</p>
                            {userInfo.networkGrowth > 0 && (
                                <span className="text-green-400 text-xs md:text-sm">+{userInfo.networkGrowth}%</span>
                            )}
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

            {/* Network Performance Section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-teal-500/20 gap-4">
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-white">Your Network Performance</h3>
                        <p className="text-gray-400 text-sm">Detailed breakdown of your network by levels (1-25)</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Dropdown Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-gray-300 text-sm font-medium">Select Level:</span>
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="bg-[#0b0c16] border border-teal-500/30 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[150px] cursor-pointer"
                            >
                                <option value="">Select Level</option>
                                {Array.from({ length: 25 }, (_, i) => i + 1).map((lvl) => (
                                    <option key={lvl} value={lvl}>Level {lvl}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Active Levels Badge */}
                        <div className="flex items-center gap-2 bg-gradient-brand/10 border border-teal-500/25 px-3 py-1.5 rounded-full text-xs md:text-sm">
                            <span className="text-gray-400">Active Levels:</span>
                            <span className="text-teal-400 font-bold">{userInfo.activeLevels}</span>
                        </div>
                    </div>
                </div>

                {/* Level Detail View (Bottom List) */}
                <div>
                    {selectedLevel === "" ? (
                        // Message when no level is selected/open
                        <div className="text-center py-12 bg-gradient-to-br from-[#040408] to-[#121424] rounded-2xl border border-teal-500/20">
                            <svg className="w-12 h-12 text-teal-500/40 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                            <p className="text-gray-400 text-sm">No level selected. Please select a level from the dropdown to view downline details.</p>
                        </div>
                    ) : (() => {
                        const levelNum = parseInt(selectedLevel);
                        const stat = networkStats.find(s => s.level === levelNum);
                        const members = rawDownline.filter(u => u.level === levelNum - 1);
                        const commPercent = COMMISSION_RATES[levelNum - 1] || 0;

                        // If no member found in level, will not show in list
                        if (members.length === 0) {
                            return null;
                        }

                        return (
                            <div className="bg-gradient-to-br from-[#0b0c16] to-[#121424] rounded-2xl border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] border-l-4 border-l-blue-500 overflow-hidden animate-fade-in-up">
                                {/* Level Summary Header Card */}
                                <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-teal-500/10 gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Level Circle Badge */}
                                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                                            {levelNum}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-white font-bold text-sm md:text-base leading-tight">Level {levelNum}</h4>
                                            <p className="text-[#a0a0a0] text-[10px] md:text-xs truncate mt-0.5">
                                                {LEVEL_DESCRIPTIONS[levelNum]}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats Column */}
                                    <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-6 flex-shrink-0">
                                        {/* Members Pill */}
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold bg-blue-600/20 border border-blue-500/30 text-blue-400">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 00-7 7v1h12v-1a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>{members.length} Members</span>
                                        </div>

                                        <div className="text-right sm:block">
                                            <div className="text-white font-bold text-xs md:text-sm">{stat ? stat.business : "₹0.00"}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Members List */}
                                <div className="bg-[#07080f] p-4 space-y-3">
                                    <div className="grid grid-cols-1 gap-3">
                                        {members.map((user, idx) => (
                                            <div 
                                                key={idx} 
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#121424]/40 hover:bg-[#121424]/70 border border-teal-500/10 hover:border-teal-500/20 rounded-xl transition-all duration-200"
                                            >
                                                {/* Left Side: Avatar and User Details */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                        {(user.full_name?.charAt(0) || 'U').toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h5 className="text-white font-bold text-sm md:text-base leading-tight truncate capitalize">
                                                            {user.full_name}
                                                        </h5>
                                                        <span className="text-gray-400 text-xs block mt-1">
                                                            ID: <span className="text-blue-400 font-mono font-medium">{user.referral_id || user.user_id}</span>
                                                        </span>
                                                        <span className="text-gray-400 text-xs block mt-0.5">
                                                            Sponsor ID: <span className="text-[#a29bfe] font-mono font-medium">{user.sponsor_id || "N/A"}</span>
                                                        </span>
                                                        <span className="text-gray-400 text-xs block mt-0.5">
                                                            Investment: <span className="text-white font-semibold">₹{(user.totalInvestment || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right Side: Level Tag and Registration Date */}
                                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-teal-500/5">
                                                    <span className="px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-[9px] md:text-[10px] rounded uppercase tracking-wider">
                                                        LEVEL {levelNum}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[#909090] text-xs">
                                                        <svg className="w-3.5 h-3.5 text-[#707070]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>{formatDate(user.create_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Overall Network Footer Summary Card */}
                <div className="bg-gradient-to-br from-[#040408] to-[#16172e] rounded-2xl border border-teal-500/30 p-4 md:p-6 mt-6">
                    <h4 className="text-white font-bold text-base md:text-lg mb-4">Total Network Summary</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-center">
                        <div className="p-4 bg-teal-500/5 rounded-xl border border-teal-500/10">
                            <div className="text-gray-400 mb-1 text-xs md:text-sm">Total Members</div>
                            <div className="text-xl md:text-2xl font-bold text-white">{totalStats.totalMembers.toLocaleString()}</div>
                        </div>
                        <div className="p-4 bg-teal-500/5 rounded-xl border border-teal-500/10">
                            <div className="text-gray-400 mb-1 text-xs md:text-sm">Total Business Volume</div>
                            <div className="text-xl md:text-2xl font-bold text-white truncate">₹{totalStats.totalBusiness.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}