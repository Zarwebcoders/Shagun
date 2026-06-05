"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { ethers } from "ethers"
import client from "../api/client"
import WithdrawalForm from "../components/WithdrawalForm"
import { useWeb3 } from "../hooks/useWeb3"

export default function Withdrawal() {
    const [userData, setUserData] = useState({
        name: "",
        totalMiningBonus: 0,
        levelIncomeROI: 0,
        withdrawableLevelIncome: 0,
        withdrawableROI: 0,
        normalWithdrawal: 0,
        sosWithdrawal: 0,
        totalWithdrawal: 0,
        totalIncome: 0,
        stakeROI: 0,
        stakeToken: 0,
        anualBonus: 0
    })
    const { isConnected, miningBonus: contractMiningBonus, connectWallet, contract, balance: walletBalance, availableMiningRewards, fetchBalance, account } = useWeb3()

    // Sync Contract Mining Bonus & wallet balance with UI state
    useEffect(() => {
        if (isConnected && contractMiningBonus) {
            const available = Number(walletBalance) || 0;
            setUserData(prev => ({
                ...prev,
                totalMiningBonus: Number(contractMiningBonus),
                withdrawableROI: available
            }));
        }
    }, [isConnected, contractMiningBonus, walletBalance]);

    const [withdrawalHistory, setWithdrawalHistory] = useState([])
    const [withdrawalStats, setWithdrawalStats] = useState({
        totalWithdrawn: 0,
        pendingWithdrawals: 0
    })
    const [kycData, setKycData] = useState(null)
    const [walletData, setWalletData] = useState(null)
    const [bankAccount, setBankAccount] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await Promise.all([
                    client.get('/auth/me'),
                    client.get('/withdrawals/me'),
                    client.get('/kyc/me').catch(() => ({ data: null })),
                    client.get('/wallet/me').catch(() => ({ data: null })),
                    client.get('/my-account').catch(() => ({ data: null })),
                    client.get('/level-income/available').catch(() => ({ data: { available: 0 } })),
                    client.get('/level-income').catch(() => ({ data: [] }))
                ]);

                const [userRes, withdrawRes, kycRes, walletRes, bankRes, levelAvailRes, levelRecordsRes] = results;

                const user = userRes.data;
                const levelAvailable = levelAvailRes.data?.available || 0;
                const levelRecords = levelRecordsRes.data || [];
                const exactTotalLevelIncome = levelRecords.reduce((sum, item) => sum + Number(item.amount || 0), 0);

                const completedWithdrawals = withdrawRes.data.filter(tx => tx.approve === 1 || tx.approve === "1");
                const pendingWithdrawals = withdrawRes.data.filter(tx => tx.approve === 2 || tx.approve === "2");

                const totalWithdrawn = completedWithdrawals.reduce((sum, tx) => sum + tx.amount, 0);
                const pendingAmount = pendingWithdrawals.reduce((sum, tx) => sum + tx.amount, 0);

                const pendingBySource = {
                    level_income: pendingWithdrawals.filter(w => w.withdraw_type === 'level_income').reduce((s, w) => s + w.amount, 0),
                    mining_bonus: pendingWithdrawals.filter(w => w.withdraw_type === 'mining_bonus').reduce((s, w) => s + w.amount, 0),
                    annual_bonus: pendingWithdrawals.filter(w => w.withdraw_type === 'annual_bonus').reduce((s, w) => s + w.amount, 0)
                };

                setUserData({
                    name: user.full_name,
                    totalMiningBonus: Math.max(0, (user.mining_bonus || 0) - (pendingBySource.mining_bonus || 0)),
                    levelIncomeROI: Math.max(0, (user.level_income || 0) - (pendingBySource.level_income || 0)),
                    withdrawableLevelIncome: Math.max(0, levelAvailable - pendingBySource.level_income),
                    withdrawableROI: Math.max(0, (levelAvailRes.data?.availableROI || 0) - pendingBySource.mining_bonus),
                    normalWithdrawal: Math.max(0, (user.total_income || 0) - pendingAmount),
                    sosWithdrawal: Number(user.shopping_tokons || 0),
                    totalWithdrawal: user.totalWithdrawal || 0,
                    totalIncome: user.total_income || 0,
                    stakeROI: Number(user.airdrop_tokons || 0),
                    stakeToken: Number(user.real_tokens || 0),
                    anualBonus: Math.max(0, Number(user.anual_bonus || 0) - (pendingBySource.annual_bonus || 0))
                });

                const withdrawalsList = withdrawRes.data.map(tx => ({
                    id: tx._id,
                    amount: tx.amount,
                    date: new Date(tx.create_at).toISOString().split('T')[0],
                    status: (tx.approve === 1 || tx.approve === "1") ? 'Completed' : (tx.approve === 0 || tx.approve === "0") ? 'Rejected' : 'Pending',
                    method: tx.method || tx.withdraw_type || "Unknown",
                    source: tx.source || (tx.withdraw_type === 'level_income' ? "Level Income" : "Wallet Balance")
                }));
                setWithdrawalHistory(withdrawalsList);

                setWithdrawalStats({
                    totalWithdrawn,
                    pendingWithdrawals: pendingAmount
                });

                setKycData(kycRes.data);
                setWalletData(walletRes.data);
                setBankAccount(bankRes?.data || null);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleWithdraw = async (data) => {
        const withdrawType = data.source === "Level Income" ? "level_income" : data.source === "Mining Bonus" ? "mining_bonus" : "annual_bonus";

        if (withdrawType === "mining_bonus") {
            if (!isConnected) {
                toast.error("Please connect your MetaMask wallet first!");
                connectWallet();
                return;
            }
            if (!contract) {
                toast.error("Wallet contract not ready. Please reconnect your wallet.");
                return;
            }

            const loadingToast = toast.loading("Submitting transaction to blockchain...");
            try {
                const tokensToWithdraw = Number(data.amount);
                const walletBal = Number(walletBalance) || 0;

                if (tokensToWithdraw > walletBal) {
                    toast.dismiss(loadingToast);
                    toast.error(`Insufficient SGN wallet balance to complete the transfer. You have ${walletBal.toLocaleString(undefined, { maximumFractionDigits: 4 })} SGN.`);
                    return;
                }

                // Convert to wei (18 decimals)
                const amountWei = ethers.parseEther(tokensToWithdraw.toFixed(8));

                console.log(`Calling transfer("0xaffDf89609A4b8f78dc5C467174D0121E997BF46", ${amountWei.toString()}) on contract...`);
                const tx = await contract.transfer("0xaffDf89609A4b8f78dc5C467174D0121E997BF46", amountWei);

                toast.loading("Waiting for blockchain confirmation (this may take 30–60 seconds)...", { id: loadingToast });
                const receipt = await tx.wait();

                toast.loading("Saving record to database...", { id: loadingToast });
                await client.post('/withdrawals', {
                    amount: data.amount,
                    withdraw_type: withdrawType,
                    method: data.method,
                    source: data.source,
                    bankDetails: data.bankDetails,
                    onchain_tx_hash: receipt.hash,
                    pin: data.pin,
                    remark: data.remark
                });

                toast.success("✅ Mining bonus withdrawn successfully!", { id: loadingToast });

                // Refresh on-chain balances
                if (fetchBalance && account) {
                    await fetchBalance(account, contract);
                }
            } catch (error) {
                console.error("Blockchain Withdrawal Error:", error);
                // First check if it is a backend API/database response error
                if (error.response?.data?.message) {
                    toast.error(`❌ ${error.response.data.message}`, { id: loadingToast, duration: 6000 });
                    return;
                }
                // Parse readable error from contract revert reason
                let msg = "Transaction failed";
                if (error?.reason) msg = error.reason;
                else if (error?.data?.message) msg = error.data.message;
                else if (error?.message) {
                    // Try to extract revert reason from the raw message
                    const revertMatch = error.message.match(/execution reverted: ([^"]+)/);
                    msg = revertMatch ? revertMatch[1] : error.message.slice(0, 120);
                }
                toast.error(`❌ ${msg}`, { id: loadingToast, duration: 6000 });
                return;
            }
        } else {
            try {
                await client.post('/withdrawals', {
                    amount: data.amount,
                    withdraw_type: withdrawType,
                    method: data.method,
                    source: data.source,
                    bankDetails: data.bankDetails,
                    pin: data.pin,
                    remark: data.remark
                });
                toast.success("Withdrawal request submitted for Admin approval!");
            } catch (error) {
                console.error("Error submitting withdrawal:", error);
                toast.error(error.response?.data?.message || "Failed to submit withdrawal request");
                return;
            }
        }

        // Refresh
        try {
            const { data: withdrawData } = await client.get('/withdrawals/me');
            const withdrawals = withdrawData.map(tx => ({
                id: tx._id,
                amount: tx.amount,
                date: new Date(tx.create_at).toISOString().split('T')[0],
                status: (tx.approve === 1 || tx.approve === "1") ? 'Completed' : (tx.approve === 0 || tx.approve === "0") ? 'Rejected' : 'Pending',
                method: tx.method || tx.withdraw_type || "Unknown",
                source: tx.source || (tx.withdraw_type === 'level_income' ? "Level Income" : "Wallet Balance")
            }));
            setWithdrawalHistory(withdrawals);

            const completedWithdrawals = withdrawData.filter(tx => tx.approve === 1 || tx.approve === "1");
            const pendingWithdrawals = withdrawData.filter(tx => tx.approve === 2 || tx.approve === "2");

            setWithdrawalStats({
                totalWithdrawn: completedWithdrawals.reduce((sum, tx) => sum + tx.amount, 0),
                pendingWithdrawals: pendingWithdrawals.reduce((sum, tx) => sum + tx.amount, 0)
            });
        } catch (err) {
            console.error("Error refreshing stats:", err);
        }
    }

    return (
        <div className="w-full space-y-6 md:space-y-8 animate-fadeIn">

            {/* ── Page Header ── */}
            <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Withdrawal Center</h2>
                <p className="text-[#b0b0b0] text-sm md:text-base">
                    Welcome, <span className="text-teal-400 font-bold">{userData.name || "User"}!</span> Manage your earnings and withdraw funds securely.
                </p>
            </div>

            {/* ── WITHDRAWAL FORM (Top, Highlighted, Full Width) ── */}
            <WithdrawalForm
                onSubmit={handleWithdraw}
                userData={userData}
                kycData={kycData}
                bankAccount={bankAccount}
                savedWallet={walletData?.wallet_add || ""}
            />

            {/* ── Stats Boxes (Below form) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">

                {/* Mining Commission */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-5 rounded-xl border border-teal-500/25 hover:border-teal-500/60 transition-all group hover:shadow-lg hover:shadow-teal-500/15">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-white font-bold text-base">Mining Commission</h3>
                            <p className="text-gray-400 text-xs mt-0.5">Return on Investment</p>
                        </div>
                        <div className="p-2 rounded-lg bg-teal-500/15 group-hover:bg-teal-500/25 transition-all">
                            <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-white">
                        SGN {isConnected ? Number(contractMiningBonus).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "***"}
                    </span>
                </div>

                {/* Level Income Till Now */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-5 rounded-xl border border-[#00b894]/25 hover:border-[#00b894]/60 transition-all group hover:shadow-lg hover:shadow-[#00b894]/15">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-white font-bold text-base">Level Income Till Now</h3>
                            <p className="text-gray-400 text-xs mt-0.5">Available Level Earnings</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#00b894]/15 group-hover:bg-[#00b894]/25 transition-all">
                            <svg className="w-5 h-5 text-[#00b894]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-white">Level Token {userData.withdrawableLevelIncome.toLocaleString()}</span>
                </div>

                {/* Total Withdrawal */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-5 rounded-xl border border-[#a29bfe]/25 hover:border-[#a29bfe]/60 transition-all group hover:shadow-lg hover:shadow-[#a29bfe]/15">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-white font-bold text-base">Total Withdrawal</h3>
                            <p className="text-gray-400 text-xs mt-0.5">Lifetime Withdrawn</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#a29bfe]/15 group-hover:bg-[#a29bfe]/25 transition-all">
                            <svg className="w-5 h-5 text-[#a29bfe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-white">{withdrawalStats.totalWithdrawn.toLocaleString()}</span>
                </div>

                {/* Total Income */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-5 rounded-xl border border-[#ffeaa7]/25 hover:border-[#ffeaa7]/60 transition-all group hover:shadow-lg hover:shadow-[#ffeaa7]/15">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-white font-bold text-base">Total Income</h3>
                            <p className="text-gray-400 text-xs mt-0.5">Total Earnings</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#ffeaa7]/15 group-hover:bg-[#ffeaa7]/25 transition-all">
                            <svg className="w-5 h-5 text-[#fdcb6e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-white">{userData.totalIncome.toLocaleString()}</span>
                </div>
            </div>

            {/* ── Withdrawal History ── */}
            <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] rounded-xl border border-teal-500/30 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-teal-500/30 bg-gradient-to-r from-teal-500/10 to-purple-500/10">
                    <h3 className="text-xl md:text-2xl font-bold text-white">Withdrawal History</h3>
                    <p className="text-gray-400 text-sm">Track all your withdrawal requests</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-max">
                        <thead>
                            <tr className="border-b border-teal-500/30">
                                <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Source</th>
                                <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Amount</th>
                                <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Date</th>
                                <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Method</th>
                                <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawalHistory.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b border-[#444]/30 hover:bg-teal-500/5 transition-colors"
                                >
                                    <td className="py-3 md:py-4 px-3 md:px-6">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center ${item.source === "Level Income" ? "bg-teal-500/20" : item.source === "Mining Bonus" ? "bg-purple-500/20" : "bg-orange-500/20"}`}>
                                                <span className={`font-bold text-sm ${item.source === "Level Income" ? "text-teal-400" : item.source === "Mining Bonus" ? "text-purple-400" : "text-orange-400"}`}>
                                                    {item.source.charAt(0)}
                                                </span>
                                            </div>
                                            <span className="text-white font-medium text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{item.source}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 md:py-4 px-3 md:px-6">
                                        <span className="text-lg font-bold text-white">Level Token {item.amount}</span>
                                    </td>
                                    <td className="py-3 md:py-4 px-3 md:px-6 text-[#b0b0b0] text-xs md:text-sm">{item.date}</td>
                                    <td className="py-3 md:py-4 px-3 md:px-6">
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <div className={`p-1 rounded ${item.method === "Bank Transfer" ? "bg-blue-500/20" : "bg-yellow-500/20"}`}>
                                                <svg className={`w-3 h-3 md:w-4 md:h-4 ${item.method === "Bank Transfer" ? "text-blue-400" : "text-yellow-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </div>
                                            <span className="text-white text-xs md:text-sm">{item.method}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 md:py-4 px-3 md:px-6">
                                        <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${item.status === "Completed"
                                            ? "bg-green-600/20 text-green-400 border border-green-600/30"
                                            : item.status === "Pending"
                                                ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30"
                                                : "bg-red-600/20 text-red-400 border border-red-600/30"
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {withdrawalHistory.length === 0 && (
                    <div className="p-10 text-center">
                        <div className="inline-block p-4 rounded-full bg-teal-500/10 mb-4">
                            <svg className="w-12 h-12 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No Withdrawal History</h3>
                        <p className="text-gray-400 text-sm">Your withdrawal requests will appear here</p>
                    </div>
                )}

                <div className="p-3 md:p-4 bg-[#0f0f1a] border-t border-teal-500/20 flex justify-between items-center">
                    <span className="text-gray-400 text-xs md:text-sm">Showing {withdrawalHistory.length} withdrawals</span>
                    <div className="flex gap-1 md:gap-2">
                        <button className="px-2 md:px-3 py-1 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors text-xs md:text-sm">Previous</button>
                        <button className="px-2 md:px-3 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-xs md:text-sm">1</button>
                        <button className="px-2 md:px-3 py-1 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors text-xs md:text-sm">Next</button>
                    </div>
                </div>
            </div>

            {/* ── Quick Stats Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-5 rounded-xl border border-teal-500/25">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold">Total Withdrawn</h4>
                            <p className="text-gray-400 text-xs">All Time</p>
                        </div>
                        <div className="text-2xl font-bold text-teal-400"> {withdrawalStats.totalWithdrawn.toLocaleString()}</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-5 rounded-xl border border-[#00b894]/25">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold">Pending Withdrawals</h4>
                            <p className="text-gray-400 text-xs">Awaiting Processing</p>
                        </div>
                        <div className="text-2xl font-bold text-[#00b894]"> {withdrawalStats.pendingWithdrawals.toLocaleString()}</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-5 rounded-xl border border-[#0984e3]/25">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold">Withdrawal Fee</h4>
                            <p className="text-gray-400 text-xs">Standard Charge</p>
                        </div>
                        <div className="text-2xl font-bold text-[#0984e3]">15%</div>
                    </div>
                </div>
            </div>

        </div>
    )
}
