"use client"

import { useState, useEffect } from "react"
import client from "../api/client"
import WithdrawalForm from "../components/WithdrawalForm"

export default function Withdrawal() {
    const [userData, setUserData] = useState({
        name: "",
        points: {
            loyalty: 0,
            rex: 0,
            shopping: 0,
            total: 0
        }
    })
    const [withdrawalHistory, setWithdrawalHistory] = useState([])
    const [kycData, setKycData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, txRes, kycRes] = await Promise.all([
                    client.get('/auth/me'),
                    client.get('/transactions'),
                    client.get('/kyc/me').catch(() => ({ data: null }))
                ]);

                const user = userRes.data;
                setUserData({
                    name: user.name,
                    points: {
                        loyalty: user.loyaltyPoints || 0,
                        rex: user.rexToken || 0,
                        shopping: user.shoppingPoints || 0,
                        total: user.balance || 0
                    }
                });

                // Filter withdrawals from transactions
                const withdrawals = txRes.data
                    .filter(tx => tx.type === 'withdrawal')
                    .map(tx => ({
                        id: tx._id,
                        amount: tx.amount,
                        date: new Date(tx.createdAt).toISOString().split('T')[0],
                        status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
                        method: tx.description.includes("Bank") ? "Bank Transfer" : "Crypto Wallet",
                        source: "Main Balance" // Simplified for now as transaction doesn't store source
                    }));
                setWithdrawalHistory(withdrawals);
                setKycData(kycRes.data);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleWithdraw = async (data) => {
        try {
            await client.post('/transactions', {
                type: 'withdrawal',
                amount: data.amount,
                description: `Withdrawal via ${data.method} from ${data.source}`,
                status: 'pending' // Default to pending
            });
            alert("Withdrawal request submitted successfully!");

            // Refresh history
            const { data: txData } = await client.get('/transactions');
            const withdrawals = txData
                .filter(tx => tx.type === 'withdrawal')
                .map(tx => ({
                    id: tx._id,
                    amount: tx.amount,
                    date: new Date(tx.createdAt).toISOString().split('T')[0],
                    status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
                    method: tx.description.includes("Bank") ? "Bank Transfer" : "Crypto Wallet",
                    source: "Main Balance"
                }));
            setWithdrawalHistory(withdrawals);

        } catch (error) {
            console.error("Error submitting withdrawal:", error);
            alert("Failed to submit withdrawal request");
        }
    }

    return (
        <div className="w-full space-y-6 md:space-y-8 animate-fadeIn">
            {/* Header Section */}
            <div className="space-y-3 md:space-y-4">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Withdrawal Center</h2>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <p className="text-[#b0b0b0] text-sm md:text-lg flex-1">
                        Welcome, <span className="text-[#9131e7] font-bold">{userData.name}!</span> Manage your earnings and withdraw funds securely from your available wallets.
                    </p>
                    <div className="flex items-center gap-2 bg-[#9131e7]/10 border border-[#9131e7]/30 px-3 md:px-4 py-2 rounded-lg w-full md:w-auto">
                        <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-xs md:text-sm font-semibold">Available Balance</span>
                    </div>
                </div>
            </div>

            {/* Wallet Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Loyalty Points Card */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-4 md:p-6 rounded-xl border border-[#9131e7]/30 hover:border-[#9131e7] transition-all group hover:shadow-lg hover:shadow-[#9131e7]/20">
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div>
                            <h3 className="text-white font-bold text-base md:text-lg">Monthly Income</h3>
                            <p className="text-gray-400 text-xs md:text-sm">Reward Points</p>
                        </div>
                        <div className="p-1 md:p-2 rounded-lg bg-[#9131e7]/20 group-hover:bg-[#9131e7]/30 transition-all">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#9131e7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mb-2">
                        <span className="text-2xl md:text-3xl font-bold text-white">{userData.points.loyalty.toLocaleString()}</span>
                        <span className="text-gray-400 ml-2 text-sm md:text-base">Points</span>
                    </div>
                    <div className="w-full bg-[#444]/50 rounded-full h-1.5 md:h-2">
                        <div className="bg-gradient-to-r from-[#9131e7] to-[#e84495] h-1.5 md:h-2 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                </div>

                {/* REX Token Card */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-4 md:p-6 rounded-xl border border-[#00b894]/30 hover:border-[#00b894] transition-all group hover:shadow-lg hover:shadow-[#00b894]/20">
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div>
                            <h3 className="text-white font-bold text-base md:text-lg">REX Token</h3>
                            <p className="text-gray-400 text-xs md:text-sm">Mining Tokens</p>
                        </div>
                        <div className="p-1 md:p-2 rounded-lg bg-[#00b894]/20 group-hover:bg-[#00b894]/30 transition-all">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#00b894]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mb-2">
                        <span className="text-2xl md:text-3xl font-bold text-white">{userData.points.rex.toLocaleString()}</span>
                        <span className="text-gray-400 ml-2 text-sm md:text-base">REX</span>
                    </div>
                    <div className="w-full bg-[#444]/50 rounded-full h-1.5 md:h-2">
                        <div className="bg-gradient-to-r from-[#00b894] to-[#00cec9] h-1.5 md:h-2 rounded-full" style={{ width: "60%" }}></div>
                    </div>
                </div>

                {/* SOS Withdrawal Card */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-4 md:p-6 rounded-xl border border-[#fd79a8]/30 hover:border-[#fd79a8] transition-all group hover:shadow-lg hover:shadow-[#fd79a8]/20">
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div>
                            <h3 className="text-white font-bold text-base md:text-lg">SOS Withdrawal</h3>
                            <p className="text-gray-400 text-xs md:text-sm">SOS Points Balance</p>
                        </div>
                        <div className="p-1 md:p-2 rounded-lg bg-[#fd79a8]/20 group-hover:bg-[#fd79a8]/30 transition-all">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#fd79a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mb-2">
                        <span className="text-2xl md:text-3xl font-bold text-white">{userData.points.shopping.toLocaleString()}</span>
                        <span className="text-gray-400 ml-2 text-sm md:text-base">Points</span>
                    </div>
                    <div className="w-full bg-[#444]/50 rounded-full h-1.5 md:h-2">
                        <div className="bg-gradient-to-r from-[#fd79a8] to-[#e17055] h-1.5 md:h-2 rounded-full" style={{ width: "40%" }}></div>
                    </div>
                </div>

                {/* Total Withdrawable Card */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-4 md:p-6 rounded-xl border border-[#0984e3]/30 hover:border-[#0984e3] transition-all group hover:shadow-lg hover:shadow-[#0984e3]/20">
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div>
                            <h3 className="text-white font-bold text-base md:text-lg">Total Withdrawable</h3>
                            <p className="text-gray-400 text-xs md:text-sm">Available Balance</p>
                        </div>
                        <div className="p-1 md:p-2 rounded-lg bg-[#0984e3]/20 group-hover:bg-[#0984e3]/30 transition-all">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#0984e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mb-2">
                        <span className="text-2xl md:text-3xl font-bold text-white">₹{userData.points.total.toLocaleString()}</span>
                        <span className="text-gray-400 ml-2 text-sm md:text-base">INR</span>
                    </div>
                    <div className="w-full bg-[#444]/50 rounded-full h-1.5 md:h-2">
                        <div className="bg-gradient-to-r from-[#0984e3] to-[#00cec9] h-1.5 md:h-2 rounded-full" style={{ width: "90%" }}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Withdrawal Form Section */}
                <div className="lg:col-span-1">
                    <WithdrawalForm
                        onSubmit={handleWithdraw}
                        walletPoints={userData.points}
                        kycData={kycData}
                    />
                </div>

                {/* Withdrawal History Section */}
                <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] rounded-xl border border-[#9131e7]/30 overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-[#9131e7]/30 bg-gradient-to-r from-[#9131e7]/10 to-[#e84495]/10">
                            <h3 className="text-xl md:text-2xl font-bold text-white">Withdrawal History</h3>
                            <p className="text-gray-400 text-sm md:text-base">Track all your withdrawal requests</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-max">
                                <thead>
                                    <tr className="border-b border-[#9131e7]/30">
                                        <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Source</th>
                                        <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Amount</th>
                                        <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Date</th>
                                        <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Method</th>
                                        <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Status</th>
                                        <th className="text-left py-3 md:py-4 px-3 md:px-6 text-white font-bold text-xs md:text-sm">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawalHistory.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-[#444]/30 hover:bg-[#9131e7]/10 transition-colors group"
                                        >
                                            <td className="py-3 md:py-4 px-3 md:px-6">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${item.source === "Loyalty Points" ? "bg-[#9131e7]/20" : item.source === "REX Token" ? "bg-[#00b894]/20" : "bg-[#fd79a8]/20"}`}>
                                                        <span className={`font-bold text-sm md:text-base ${item.source === "Loyalty Points" ? "text-[#9131e7]" : item.source === "REX Token" ? "text-[#00b894]" : "text-[#fd79a8]"}`}>
                                                            {item.source.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <span className="text-white font-medium text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{item.source}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 md:py-4 px-3 md:px-6">
                                                <span className="text-lg md:text-xl font-bold text-white">₹{item.amount}</span>
                                            </td>
                                            <td className="py-3 md:py-4 px-3 md:px-6 text-[#b0b0b0] text-xs md:text-sm">{item.date}</td>
                                            <td className="py-3 md:py-4 px-3 md:px-6">
                                                <div className="flex items-center gap-1 md:gap-2">
                                                    <div className={`p-1 rounded ${item.method === "Bank Transfer" ? "bg-blue-500/20" : "bg-yellow-500/20"}`}>
                                                        {item.method === "Bank Transfer" ? (
                                                            <svg className="w-3 h-3 md:w-4 md:h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="text-white text-xs md:text-sm truncate max-w-[60px] md:max-w-none">{item.method}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 md:py-4 px-3 md:px-6">
                                                <span className={`inline-flex items-center gap-1 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${item.status === "Completed"
                                                    ? "bg-green-600/20 text-green-400 border border-green-600/30"
                                                    : item.status === "Pending"
                                                        ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30"
                                                        : "bg-red-600/20 text-red-400 border border-red-600/30"
                                                    }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-3 md:py-4 px-3 md:px-6">
                                                <button className="px-2 md:px-3 py-1 bg-[#9131e7]/20 text-[#9131e7] rounded-lg hover:bg-[#9131e7]/30 transition-colors text-xs md:text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty State */}
                        {withdrawalHistory.length === 0 && (
                            <div className="p-6 md:p-12 text-center">
                                <div className="inline-block p-3 md:p-4 rounded-full bg-gradient-to-br from-[#9131e7]/10 to-[#e84495]/10 mb-3 md:mb-4">
                                    <svg className="w-12 h-12 md:w-16 md:h-16 text-[#9131e7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-white mb-2">No Withdrawal History</h3>
                                <p className="text-gray-400 mb-4 md:mb-6 text-sm md:text-base">Your withdrawal requests will appear here</p>
                            </div>
                        )}

                        {/* Table Footer */}
                        <div className="p-3 md:p-4 bg-[#0f0f1a] border-t border-[#9131e7]/30 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="text-gray-400 text-xs md:text-sm">
                                Showing {withdrawalHistory.length} withdrawals
                            </div>
                            <div className="flex gap-1 md:gap-2">
                                <button className="px-2 md:px-3 py-1 bg-[#9131e7]/20 text-[#9131e7] rounded-lg hover:bg-[#9131e7]/30 transition-colors text-xs md:text-sm">
                                    Previous
                                </button>
                                <button className="px-2 md:px-3 py-1 bg-[#9131e7] text-white rounded-lg hover:bg-[#7a27c9] transition-colors text-xs md:text-sm">
                                    1
                                </button>
                                <button className="px-2 md:px-3 py-1 bg-[#9131e7]/20 text-[#9131e7] rounded-lg hover:bg-[#9131e7]/30 transition-colors text-xs md:text-sm">
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-4 md:p-6 rounded-xl border border-[#9131e7]/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold text-base md:text-lg">Total Withdrawn</h4>
                            <p className="text-gray-400 text-xs md:text-sm">All Time</p>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-[#9131e7]">₹2,800</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-4 md:p-6 rounded-xl border border-[#00b894]/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold text-base md:text-lg">Pending Withdrawals</h4>
                            <p className="text-gray-400 text-xs md:text-sm">Awaiting Processing</p>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-[#00b894]">₹1,000</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] p-4 md:p-6 rounded-xl border border-[#0984e3]/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold text-base md:text-lg">Withdrawal Fee</h4>
                            <p className="text-gray-400 text-xs md:text-sm">Standard Charge</p>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-[#0984e3]">5%</div>
                    </div>
                </div>
            </div>
        </div>
    )
}


