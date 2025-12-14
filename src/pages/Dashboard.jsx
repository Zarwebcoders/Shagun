"use client"

import { useState } from "react"
import WalletCard from "../components/WalletCard"
import StatsCard from "../components/StatsCard"
import IncomeChart from "../components/IncomeChart"

export default function Dashboard() {
    const [walletBalance, setWalletBalance] = useState(25500.5)
    const [userName] = useState("John Doe")

    const [tokenStats, setTokenStats] = useState({
        loyaltyToken: 1250,
        sgnToken: 850,
        stakedTokens: 420,
        sgnRate: 2.5,
        currentPhase: "Phase 3",
        shoppingPoint: 1560,
    })

    const [incomeBreakdown, setIncomeBreakdown] = useState({
        miningBonus: 1200.5,
        dailyMiningRewards: 450.25,
        yearlyBonus: 800.0,
        sponsorIncome: 650.75,
        levelIncome: 800.25,
        totalIncome: 3901.75,
    })

    const [miningCenter, setMiningCenter] = useState({
        status: "Active",
        miningPower: "2.5 TH/s",
        uptime: "99.8%",
        earningsToday: 45.50,
    })

    const [referralProgram, setReferralProgram] = useState({
        referralId: "REF123456",
        sponsor: "Alice Smith",
        totalDirectTeam: 24,
        levelIncomeEarned: 1200.5,
        sponsorIncomeEarned: 650.75,
        totalEarnedIncome: 1851.25,
    })

    const [phaseInfo, setPhaseInfo] = useState({
        phaseNumber: 3,
        phaseRate: "4.8",
        tokensSold: "1.2M/2M",
        endDate: "Dec 31, 2024"
    })

    const [recentLoyaltyPoints, setRecentLoyaltyPoints] = useState([
        { date: "2024-01-10", activity: "Purchase", points: 50 },
        { date: "2024-01-09", activity: "Referral", points: 100 },
        { date: "2024-01-08", activity: "Staking Reward", points: 25 },
        { date: "2024-01-07", activity: "Daily Mining", points: 15 },
        { date: "2024-01-06", activity: "Shopping", points: 30 },
    ])

    const connectWallet = () => {
        // Wallet connection logic here
        alert("Connect wallet functionality")
    }

    return (
        <div className="w-full space-y-8">
            {/* Welcome Section */}
            <section className="bg-gradient-to-r from-[#9131e7]/20 to-[#e84495]/20 p-6 rounded-2xl border border-[#9131e7]/30">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome back, <span className="text-[#9131e7]">{userName}</span>!</h2>
                        <p className="text-gray-300 text-lg mb-4">Track your earnings, manage your tokens, and grow your network all in one place.</p>
                        <button
                            onClick={connectWallet}
                            className="px-8 py-3 bg-gradient-to-r from-[#9131e7] to-[#e84495] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#9131e7]/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
                        >
                            Connect Wallet
                        </button>
                    </div>
                    <div className="md:w-1/3">
                        <WalletCard balance={walletBalance} />
                    </div>
                </div>
            </section>

            {/* Token Stats Section */}
            <section className="space-y-4">
                <h3 className="text-2xl font-bold text-[#9131e7]">Token Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    <StatsCard title="Loyalty Points" amount={tokenStats.loyaltyToken.toString()} color="#9131e7" />
                    <StatsCard title="REX Token" amount={tokenStats.sgnToken.toString()} color="#4caf50" />
                    <StatsCard title="SGN Rate" amount={`$${tokenStats.sgnRate}`} color="#ff9800" />
                    <StatsCard title="Current Phase" amount={tokenStats.currentPhase} color="#9c27b0" />
                </div>
            </section>

            {/* Income Breakdown and Mining Center Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Income Breakdown */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-[#9131e7]">Income Breakdown</h3>
                        <button className="px-4 py-2 bg-[#9131e7] hover:bg-[#7a27c9] text-white font-medium rounded-lg transition-colors duration-200">
                            Earnings Analytics
                        </button>
                    </div>
                    <div className="bg-[#1a1a2e] border border-[#9131e7]/30 rounded-2xl p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-[#9131e7]">Mining Center</h3>
                        <button className="px-4 py-2 bg-[#9131e7] hover:bg-[#7a27c9] text-white font-medium rounded-lg transition-colors duration-200">
                            Claim ROI
                        </button>
                    </div>
                    <div className="bg-[#1a1a2e] border border-[#9131e7]/30 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h4 className="text-xl font-bold text-white">Status: <span className="text-green-400">{miningCenter.status}</span></h4>
                                <p className="text-gray-400">Your mining operations are running smoothly</p>
                            </div>
                            <div className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                                <span className="text-green-400 font-bold">{miningCenter.uptime} Uptime</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#0f0f1a] p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-sm">Monthly Percentage</p>
                                <p className="text-2xl font-bold text-white">{miningCenter.miningPower}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-sm">Total Income</p>
                                <p className="text-2xl font-bold text-[#9131e7]">${miningCenter.earningsToday.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Current Phase and Referral Program Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Current Phase */}
                <section className="space-y-4">
                    <h3 className="text-2xl font-bold text-[#9131e7]">Current Phase</h3>
                    <div className="bg-[#1a1a2e] border border-[#9131e7]/30 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-2xl font-bold text-white">Phase {phaseInfo.phaseNumber}</h4>
                                <p className="text-gray-400">Current Token Sale Phase</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Phase Rate:</span>
                                <span className="text-xl font-bold text-[#9131e7]">{phaseInfo.phaseRate}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Referral Program */}
                <section className="space-y-4">
                    <h3 className="text-2xl font-bold text-[#9131e7]">Referral Program</h3>
                    <div className="bg-[#1a1a2e] border border-[#9131e7]/30 rounded-2xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#0f0f1a] p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-sm">Your Referral ID</p>
                                <p className="text-xl font-bold text-white">{referralProgram.referralId}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-sm">Your Sponsor</p>
                                <p className="text-xl font-bold text-white">{referralProgram.sponsor}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-sm">Total Direct Team</p>
                                <p className="text-2xl font-bold text-[#9131e7]">{referralProgram.totalDirectTeam}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-sm">Level Income Earned</p>
                                <p className="text-2xl font-bold text-[#4caf50]">${referralProgram.levelIncomeEarned.toFixed(2)}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-sm">Sponsor Income Earned</p>
                                <p className="text-2xl font-bold text-[#2196f3]">${referralProgram.sponsorIncomeEarned.toFixed(2)}</p>
                            </div>
                            <div className="bg-[#0f0f1a] p-4 rounded-xl border border-[#9131e7]/20">
                                <p className="text-gray-400 text-sm">Total Earned Income</p>
                                <p className="text-2xl font-bold text-[#e91e63]">${referralProgram.totalEarnedIncome.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}