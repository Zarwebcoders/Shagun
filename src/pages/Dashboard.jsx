"use client"

import { useState, useEffect } from "react"
import client from "../api/client"
import WalletCard from "../components/WalletCard"
import StatsCard from "../components/StatsCard"
import { UsersIcon, CheckCircleIcon, CurrencyDollarIcon, PresentationChartLineIcon } from '@heroicons/react/24/solid';

export default function Dashboard() {
    const [walletBalance, setWalletBalance] = useState(0)
    const [userName, setUserName] = useState("")
    const [loading, setLoading] = useState(true)

    const [tokenStats, setTokenStats] = useState({
        loyaltyToken: 0,
        sgnToken: 0,
        stakedTokens: 0,
        sgnRate: 2.5,
        currentPhase: "Phase 3",
        shoppingPoint: 0,
    })

    const [incomeBreakdown, setIncomeBreakdown] = useState({
        miningBonus: 0,
        dailyMiningRewards: 0,
        yearlyBonus: 0,
        sponsorIncome: 0,
        levelIncome: 0,
        totalIncome: 0,
    })

    const [miningCenter, setMiningCenter] = useState({
        status: "Active",
        miningPower: "0 TH/s",
        uptime: "99.8%",
        earningsToday: 0,
    })

    const [referralProgram, setReferralProgram] = useState({
        referralId: "---",
        sponsor: "None",
        totalDirectTeam: 0,
        levelIncomeEarned: 0,
        sponsorIncomeEarned: 0,
        totalEarnedIncome: 0,
    })

    const [phaseInfo, setPhaseInfo] = useState({
        phaseNumber: 3,
        phaseRate: "4.8",
        tokensSold: "1.2M/2M",
        endDate: "Dec 31, 2024"
    })

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Fetch user data and downline in parallel
                const [userRes, downlineRes] = await Promise.all([
                    client.get('/auth/me'),
                    client.get('/users/downline')
                ]);

                const userData = userRes.data;
                const downlineData = downlineRes.data || [];

                setWalletBalance(userData.balance || 0);
                setUserName(userData.name || "User");

                setTokenStats(prev => ({
                    ...prev,
                    loyaltyToken: userData.loyaltyPoints || 0,
                    sgnToken: userData.sgnToken || 0,
                    shoppingPoint: userData.shoppingPoints || 0,
                }));

                // Calculate direct team size (Level 0 in downline response)
                const directTeamCount = downlineData.filter(u => u.level === 0).length;

                setReferralProgram(prev => ({
                    ...prev,
                    referralId: userData.referralCode || "---",
                    sponsor: userData.referredBy ? userData.referredBy.name : "None",
                    totalDirectTeam: directTeamCount,
                    // Keeping other stats mock or 0 for now as they require Income logic
                }));

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const connectWallet = () => {
        alert("Connect wallet functionality")
    }

    if (loading) return <div className="text-white">Loading dashboard...</div>

    return (
        <div className="w-full space-y-6 md:space-y-8">
            {/* Welcome Section */}
            <section className="bg-gradient-to-r from-[#9131e7]/20 to-[#e84495]/20 p-4 md:p-6 rounded-2xl border border-[#9131e7]/30">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Welcome back, <span className="text-[#9131e7]">{userName}</span>!
                        </h2>
                        <p className="text-gray-300 text-sm md:text-lg mb-4">
                            Track your earnings, manage your tokens, and grow your network all in one place.
                        </p>
                        <button
                            onClick={connectWallet}
                            className="px-6 py-3 md:px-8 md:py-3 bg-gradient-to-r from-[#9131e7] to-[#e84495] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#9131e7]/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 text-sm md:text-base w-full md:w-auto"
                        >
                            Connect Wallet
                        </button>
                    </div>
                    <div className="w-full lg:w-1/3 mt-0">
                        <WalletCard balance={walletBalance} />
                    </div>
                </div>
            </section>

            {/* Token Stats Section */}
            <section className="space-y-4">
                <h3 className="text-xl md:text-2xl font-bold text-[#9131e7]">Token Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
                    <StatsCard title="Loyalty Points" amount={tokenStats.loyaltyToken.toString()} color="#9131e7" />
                    <StatsCard title="REX Token" amount={tokenStats.sgnToken.toString()} color="#4caf50" />
                    <StatsCard title="SGN Rate" amount={`$${tokenStats.sgnRate}`} color="#ff9800" />
                    <StatsCard title="Current Phase" amount={tokenStats.currentPhase} color="#9c27b0" />
                </div>
            </section>

            {/* Income Breakdown and Mining Center Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Income Breakdown */}
                <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h3 className="text-xl md:text-2xl font-bold text-[#9131e7]">Income Breakdown</h3>
                        <button className="px-4 py-2 bg-[#9131e7] hover:bg-[#7a27c9] text-white font-medium rounded-lg transition-colors duration-200 text-sm md:text-base w-full sm:w-auto">
                            Earnings Analytics
                        </button>
                    </div>
                    <div className="bg-[#1a1a2e] border border-[#9131e7]/30 rounded-2xl p-4 md:p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <StatsCard title="ROI" amount={`$${incomeBreakdown.miningBonus.toFixed(2)}`} color="#9131e7" />
                            <StatsCard title="Yearly Bonus" amount={`$${incomeBreakdown.yearlyBonus.toFixed(2)}`} color="#2196f3" />
                            <StatsCard title="Sponsor Income" amount={`$${incomeBreakdown.sponsorIncome.toFixed(2)}`} color="#ff9800" />
                            <StatsCard title="Level Income" amount={`$${incomeBreakdown.levelIncome.toFixed(2)}`} color="#9c27b0" />
                            <StatsCard title="Total Income" amount={`$${incomeBreakdown.totalIncome.toFixed(2)}`} color="#e91e63" />
                        </div>
                    </div>
                </section>

                {/* Mining Center */}
                <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h3 className="text-xl md:text-2xl font-bold text-[#9131e7]">Mining Center</h3>
                        <button className="px-4 py-2 bg-[#9131e7] hover:bg-[#7a27c9] text-white font-medium rounded-lg transition-colors duration-200 text-sm md:text-base w-full sm:w-auto">
                            Claim ROI
                        </button>
                    </div>
                    <div className="bg-[#1a1a2e] border border-[#9131e7]/30 rounded-2xl p-4 md:p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-4">
                            <div className="flex-1">
                                <h4 className="text-lg md:text-xl font-bold text-white">
                                    Status: <span className="text-green-400">{miningCenter.status}</span>
                                </h4>
                                <p className="text-gray-400 text-sm md:text-base">Your mining operations are running smoothly</p>
                            </div>
                            <div className="px-3 py-2 md:px-4 md:py-2 bg-green-500/20 border border-green-500/50 rounded-lg w-full md:w-auto">
                                <span className="text-green-400 font-bold text-sm md:text-base">{miningCenter.uptime} Uptime</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div className="bg-[#0f0f1a] p-3 md:p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-xs md:text-sm">Monthly Percentage</p>
                                <p className="text-xl md:text-2xl font-bold text-white">{miningCenter.miningPower}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-3 md:p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-xs md:text-sm">Total Income</p>
                                <p className="text-xl md:text-2xl font-bold text-[#9131e7]">${miningCenter.earningsToday.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Current Phase and Referral Program Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Current Phase */}
                <section className="space-y-4">
                    <h3 className="text-xl md:text-2xl font-bold text-[#9131e7]">Current Phase</h3>
                    <div className="bg-[#1a1a2e] border border-[#9131e7]/30 rounded-2xl p-4 md:p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
                            <div>
                                <h4 className="text-xl md:text-2xl font-bold text-white">Phase {phaseInfo.phaseNumber}</h4>
                                <p className="text-gray-400 text-sm md:text-base">Current Token Sale Phase</p>
                            </div>
                        </div>
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300 text-sm md:text-base">Phase Rate:</span>
                                <span className="text-lg md:text-xl font-bold text-[#9131e7]">{phaseInfo.phaseRate}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Referral Program */}
                <section className="space-y-4">
                    <h3 className="text-xl md:text-2xl font-bold text-[#9131e7]">Referral Program</h3>
                    <div className="bg-[#1a1a2e] border border-[#9131e7]/30 rounded-2xl p-3 md:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div className="bg-[#0f0f1a] p-3 md:p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-xs md:text-sm">Your Referral ID</p>
                                <p className="text-lg md:text-xl font-bold text-white truncate">{referralProgram.referralId}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-3 md:p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-xs md:text-sm">Your Sponsor</p>
                                <p className="text-lg md:text-xl font-bold text-white truncate">{referralProgram.sponsor}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-3 md:p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-xs md:text-sm">Total Direct Team</p>
                                <p className="text-xl md:text-2xl font-bold text-[#9131e7]">{referralProgram.totalDirectTeam}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-3 md:p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-xs md:text-sm">Level Income Earned</p>
                                <p className="text-xl md:text-2xl font-bold text-[#4caf50]">${referralProgram.levelIncomeEarned.toFixed(2)}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-3 md:p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-xs md:text-sm">Sponsor Income Earned</p>
                                <p className="text-xl md:text-2xl font-bold text-[#2196f3]">${referralProgram.sponsorIncomeEarned.toFixed(2)}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-3 md:p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-xs md:text-sm">Total Earned Income</p>
                                <p className="text-xl md:text-2xl font-bold text-[#e91e63]">${referralProgram.totalEarnedIncome.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}