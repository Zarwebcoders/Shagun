"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "react-hot-toast"
import client from "../api/client"
import MiningOperationsCard from "../components/MiningOperationsCard"
import StatsCard from "../components/StatsCard"
import MiningHistoryTable from "../components/MiningHistoryTable"
import { useWeb3 } from "../hooks/useWeb3"
import {
    CurrencyDollarIcon,
    ChartBarIcon,
    UserGroupIcon,
    BoltIcon,
    ArrowTrendingUpIcon,
    BanknotesIcon,
    GiftIcon,
    BriefcaseIcon,
    CpuChipIcon,
    ClockIcon,
    ShieldCheckIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import { WalletIcon } from "lucide-react"

export default function Dashboard() {
    const navigate = useNavigate()
    const { 
        connectWallet, 
        disconnectWallet, 
        isConnected, 
        account, 
        balance: onChainBalance, 
        stakedBalance,
        miningBonus: contractMiningBonus,
        miningSlots: contractMiningSlots,
        contract
    } = useWeb3()
    const [walletBalance, setWalletBalance] = useState(0)
    const [userName, setUserName] = useState("")
    const [loading, setLoading] = useState(true)
    const [miningHistory, setMiningHistory] = useState([]);
    const [miningHistoryLoading, setMiningHistoryLoading] = useState(true);

    const [tokenStats, setTokenStats] = useState({
        loyaltyToken: 0,
        rexToken: 0,
        stakedTokens: 0,
        sgnRate: 10,
        currentPhase: "Phase 6",
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
        lastMinedAt: null,
        monthlyCount: 0,
        totalMiningCount: 0
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
                // Fetch basic user data and downline in parallel
                const [userRes, downlineRes, referralRes, historyRes] = await Promise.all([
                    client.get('/auth/me'),
                    client.get('/users/downline'),
                    client.get('/referral-incomes/my-referrals'),
                    client.get('/users/mining-history')
                ]);

                const userData = userRes.data;
                const downlineData = downlineRes.data || [];
                const referralData = referralRes.data || [];
                
                setMiningHistory(historyRes.data || []);
                setMiningHistoryLoading(false);

                // Calculate accurate referral income from transactions
                const calculatedSponsorIncome = referralData.reduce((acc, curr) => acc + Number(curr.referral_amount || 0), 0);

                setWalletBalance(0);
                setUserName(userData.full_name || "User");

                setTokenStats(prev => ({
                    ...prev,
                    loyaltyToken: Number(userData.airdrop_tokons || 0),
                    rexToken: Number(userData.real_tokens || 0),
                    shoppingPoint: Number(userData.shopping_tokons || 0),
                }));

                // Calculate direct team size (Level 0 in downline response)
                const directTeamCount = downlineData.filter(u => u.level === 0).length;

                const sponsorDisplay = userData.sponsor_id && typeof userData.sponsor_id === 'object' 
                    ? userData.sponsor_id.referral_id 
                    : userData.sponsor_id || "None";

                setReferralProgram(prev => ({
                    ...prev,
                    referralId: userData.referral_id || "---",
                    sponsor: sponsorDisplay,
                    totalDirectTeam: directTeamCount,
                    levelIncomeEarned: Number(userData.level_income || 0),
                    sponsorIncomeEarned: calculatedSponsorIncome,
                    totalEarnedIncome: Number(userData.total_income || 0),
                }));

                const totalCalculatedIncome = 
                    calculatedSponsorIncome + 
                    Number(userData.level_income || 0) + 
                    Number(userData.anual_bonus || 0);

                setIncomeBreakdown({
                    miningBonus: Number(userData.mining_bonus || 0),
                    dailyMiningRewards: 0, 
                    yearlyBonus: Number(userData.anual_bonus || 0),
                    sponsorIncome: calculatedSponsorIncome,
                    levelIncome: Number(userData.level_income || 0),
                    totalIncome: totalCalculatedIncome,
                });

                setMiningCenter({
                    status: Number(userData.mining_bonus || 0) > 0 ? "Active" : "Pending",
                    miningPower: userData.mining_count_thismounth ? `${Number(userData.mining_count_thismounth).toLocaleString()} TH/s` : "0 TH/s",
                    earningsToday: Number(userData.mining_bonus || 0),
                    lastMinedAt: userData.last_mining_data,
                    monthlyCount: Number(userData.mining_count_thismounth || 0),
                    totalMiningCount: Number(userData.total_mining_count || 0)
                });

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleMine = async () => {
        if (!isConnected) {
            toast.error("Please connect your wallet first!");
            connectWallet();
            return;
        }

        const miningToast = toast.loading("Processing blockchain transaction...");
        try {
            // 1. Trigger On-chain Mining
            // Call claimMiningRewards on the smart contract
            const tx = await contract.claimMiningRewards();
            toast.loading("Waiting for network confirmation...", { id: miningToast });
            await tx.wait(); // Wait for 1 confirmation
            
            // 2. Trigger Backend Mining Sync
            toast.loading("Syncing with mining server...", { id: miningToast });
            const { data } = await client.post('/users/mine');
            
            toast.success(data.message || "Mining successful!", { id: miningToast });
            
            // Re-fetch data to show new mining time/bonus
            const [userRes, historyRes] = await Promise.all([
                client.get('/auth/me'),
                client.get('/users/mining-history')
            ]);
            
            const userData = userRes.data;
            setMiningHistory(historyRes.data || []);
            setMiningCenter(prev => ({
                ...prev,
                lastMinedAt: userData.last_mining_data,
                monthlyCount: Number(userData.mining_count_thismounth || 0),
                totalMiningCount: Number(userData.total_mining_count || 0),
                earningsToday: Number(userData.mining_bonus || 0)
            }));
            
            setIncomeBreakdown(prev => ({
                ...prev,
                miningBonus: Number(userData.mining_bonus || 0),
                totalIncome: Number(userData.total_income || 0)
            }));

        } catch (error) {
            console.error("Mining error:", error);
            let msg = "Failed to start mining";
            
            // Handle blockchain errors specifically
            if (error.code === 'ACTION_REJECTED') {
                msg = "Transaction rejected by user";
            } else if (error.reason) {
                msg = `Contract Error: ${error.reason}`;
            } else if (error.response?.data?.message) {
                msg = error.response.data.message;
            }
            
            toast.error(msg, { id: miningToast });
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9131e7]"></div>
        </div>
    )

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full space-y-8 max-w-[1600px] mx-auto"
        >
            {/* Hero / Welcome Section */}
            <motion.section variants={itemVariants} className="relative">
                <div className="bg-gradient-to-r from-teal-500/20 via-[#1a1a2e] to-[#040408] rounded-3xl p-6 md:p-8 border border-teal-500/30 overflow-hidden relative">
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3"></div>

                    <div className="flex flex-col lg:flex-row justify-between items-center gap-8 relative z-10">
                        <div className="flex-1 space-y-4">
                            <div className="inline-block px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold tracking-wider uppercase mb-2">
                                Dashboard Overview
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                                Welcome back,<br />
                                <span className="bg-gradient-brand bg-clip-text text-transparent">
                                    {userName}
                                </span>
                            </h2>
                            <p className="text-gray-400 text-lg max-w-xl">
                                Your portfolio performance and network growth at a glance.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-2">
                                {!isConnected && (
                                    <button
                                        onClick={connectWallet}
                                        className="px-8 py-3 bg-gradient-brand text-white font-bold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all hover:-translate-y-1 active:translate-y-0"
                                    >
                                        Connect Wallet
                                    </button>
                                )}
                                {isConnected && (
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md overflow-hidden max-w-[200px] md:max-w-xs transition-all hover:bg-white/10">
                                            <WalletIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                                            <span className="text-gray-300 font-mono text-sm truncate">
                                                {account}
                                            </span>
                                        </div>
                                        <button
                                            onClick={disconnectWallet}
                                            className="px-6 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all duration-300"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Wallet Card Integration */}
                        <div className="w-full max-w-lg">
                            <MiningOperationsCard
                                status={miningCenter.status}
                                miningPower={miningCenter.miningPower}
                                earningsToday={isConnected ? contractMiningBonus : miningCenter.earningsToday}
                                lastMinedAt={miningCenter.lastMinedAt}
                                monthlyCount={miningCenter.monthlyCount}
                                totalMiningCount={isConnected ? contractMiningSlots : miningCenter.totalMiningCount}
                                stakedBalance={isConnected ? stakedBalance : "0"}
                                isConnected={isConnected}
                                onMine={handleMine}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Token Stats Grid */}
            <motion.section variants={itemVariants}>
                <div className="flex items-center gap-3 mb-6">
                    <BoltIcon className="w-6 h-6 text-[#ffcc4d]" />
                    <h3 className="text-2xl font-bold text-white">Token Performance</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Shagun"
                        amount={isConnected ? Number(onChainBalance).toFixed(2) : Number(tokenStats.rexToken).toFixed(2)}
                        color="#2DD4BF"
                        icon={CpuChipIcon}
                        subValue="Asset Balance"
                    />
                    <StatsCard
                        title="Loyalty Token"
                        amount={tokenStats.loyaltyToken.toString()}
                        color="#3B82F6"
                        icon={ShieldCheckIcon}
                        subValue="Reward Balance"
                    />
                    <StatsCard
                        title="Live Rate"
                        amount={`₹${tokenStats.sgnRate}`}
                        color="#ffcc4d"
                        icon={ArrowTrendingUpIcon}
                        subValue="+2.5% Today"
                    />
                    <StatsCard
                        title="Current Phase"
                        amount={tokenStats.currentPhase}
                        color="#a855f7"
                        icon={ClockIcon}
                        subValue="Ends Dec 31"
                    />

                </div>
            </motion.section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Income Center - Spans 2 cols */}
                <motion.section variants={itemVariants} className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BanknotesIcon className="w-6 h-6 text-[#4caf50]" />
                            <h3 className="text-2xl font-bold text-white">Income Analysis</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400 hidden sm:block">Total: ₹{incomeBreakdown.totalIncome.toFixed(2)}</span>
                            <button className="px-5 py-2 rounded-xl bg-teal-500/10 border border-teal-500/50 text-teal-300 font-bold hover:bg-teal-500 hover:text-white hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all duration-300 text-sm flex items-center gap-2">
                                <ChartBarIcon className="w-4 h-4" />
                                Earnings Analytics
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#1a1a2e]/40 backdrop-blur-xl border border-teal-500/20 rounded-3xl p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StatsCard
                                title="Level Income"
                                amount={`${incomeBreakdown.levelIncome.toFixed(2)} SGN`}
                                color="#2196f3"
                                icon={ArrowTrendingUpIcon}
                            />
                            <StatsCard
                                title="- Holding Commission"
                                amount={`${incomeBreakdown.yearlyBonus.toFixed(2)} SGN`}
                                color="#a855f7"
                                icon={GiftIcon}
                            />
                            <StatsCard
                                title="Referral Income"
                                amount={`₹${incomeBreakdown.sponsorIncome.toFixed(2)}`}
                                color="#ff9800"
                                icon={UsersIcon}
                            />
                            <StatsCard
                                title="Total Income"
                                amount={`₹${incomeBreakdown.totalIncome.toFixed(2)}`}
                                color="#00bcd4"
                                icon={ChartBarIcon}
                            />
                        </div>
                    </div>


                </motion.section>

                {/* Right Column - Referral & Profile */}
                <motion.section variants={itemVariants} className="space-y-6">
                    <div className="flex items-center gap-3">
                        <UserGroupIcon className="w-6 h-6 text-purple-500" />
                        <h3 className="text-2xl font-bold text-white">Network</h3>
                    </div>

                    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-3xl p-6 border border-teal-500/20 flex flex-col h-[calc(100%-3rem)]">
                        {/* Referral ID Card */}
                        <div className="bg-teal-500/10 rounded-2xl p-4 border border-teal-500/30 mb-6 text-center relative group">
                            <p className="text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">Your Referral ID</p>
                            <h4 className="text-3xl font-black text-white tracking-widest">{referralProgram.referralId}</h4>
                            <button
                                className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/60 rounded-2xl transition-opacity font-bold text-white backdrop-blur-sm"
                                onClick={() => { navigator.clipboard.writeText(referralProgram.referralId); toast.success("Referral ID Copied!") }}
                            >
                                Copy ID
                            </button>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#2196f3]/10 text-[#2196f3]"><BriefcaseIcon className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Direct Team</p>
                                        <p className="text-white font-bold">{referralProgram.totalDirectTeam}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#4caf50]/10 text-[#4caf50]"><ShieldCheckIcon className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Sponsor</p>
                                        <p className="text-white font-bold truncate max-w-[120px]">{referralProgram.sponsor}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#ff9800]/10 text-[#ff9800]"><UsersIcon className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Referral Income</p>
                                        <p className="text-white font-bold">₹{referralProgram.sponsorIncomeEarned.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/downline')}
                            className="w-full mt-6 py-3 rounded-xl border border-teal-500/30 text-teal-300 font-bold hover:bg-teal-500/10 transition-colors"
                        >
                            View Full Network
                        </button>
                    </div>
                </motion.section>
            </div>

            {/* Mining History Section */}
            <motion.section variants={itemVariants} className="w-full">
                <MiningHistoryTable 
                    history={miningHistory} 
                    loading={miningHistoryLoading} 
                />
            </motion.section>
        </motion.div>
    )
}