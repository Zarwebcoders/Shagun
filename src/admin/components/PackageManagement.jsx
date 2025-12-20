"use client"

import { useState, useEffect } from "react"
import client from "../../api/client"

export default function PackageManagement() {
    const [investments, setInvestments] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalInvestments: 0,
        totalAmount: 0,
        pendingInvestments: 0,
        approvedInvestments: 0
    })

    const fetchInvestments = async () => {
        try {
            const { data } = await client.get('/investments/all');
            setInvestments(data);

            // Calculate stats
            const totalAmount = data.reduce((sum, inv) => sum + inv.amount, 0);
            const pending = data.filter(inv => inv.status === 'pending').length;
            const approved = data.filter(inv => inv.status === 'approved').length;

            setStats({
                totalInvestments: data.length,
                totalAmount: totalAmount,
                pendingInvestments: pending,
                approvedInvestments: approved
            });
        } catch (error) {
            console.error("Error fetching investments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvestments();
    }, []);

    const handleApprove = async (investmentId) => {
        try {
            await client.put(`/investments/${investmentId}`, { status: 'approved' });
            fetchInvestments(); // Refresh list
            alert("Investment approved successfully!");
        } catch (error) {
            console.error("Error approving investment:", error);
            alert("Failed to approve investment");
        }
    };

    const handleReject = async (investmentId) => {
        try {
            await client.put(`/investments/${investmentId}`, { status: 'rejected' });
            fetchInvestments(); // Refresh list
            alert("Investment rejected");
        } catch (error) {
            console.error("Error rejecting investment:", error);
            alert("Failed to reject investment");
        }
    };

    if (loading) return <div className="text-white">Loading investments...</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Investment Management</h2>
                    <p className="text-gray-400 mt-1">View and manage all user investments</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#0f0f1a] rounded-xl p-6 border border-[#9131e7]/30">
                    <p className="text-gray-400 text-sm mb-1">Total Investments</p>
                    <h3 className="text-3xl font-bold text-white">{stats.totalInvestments}</h3>
                </div>
                <div className="bg-[#0f0f1a] rounded-xl p-6 border border-[#00b894]/30">
                    <p className="text-gray-400 text-sm mb-1">Total Amount</p>
                    <h3 className="text-3xl font-bold text-white">₹{stats.totalAmount.toLocaleString()}</h3>
                </div>
                <div className="bg-[#0f0f1a] rounded-xl p-6 border border-[#f3b232]/30">
                    <p className="text-gray-400 text-sm mb-1">Pending Approvals</p>
                    <h3 className="text-3xl font-bold text-white">{stats.pendingInvestments}</h3>
                </div>
                <div className="bg-[#0f0f1a] rounded-xl p-6 border border-[#00b894]/30">
                    <p className="text-gray-400 text-sm mb-1">Approved</p>
                    <h3 className="text-3xl font-bold text-white">{stats.approvedInvestments}</h3>
                </div>
            </div>

            {/* Investments Table */}
            <div className="bg-[#0f0f1a] rounded-xl border border-[#9131e7]/30 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-[#9131e7]/30 bg-gradient-to-r from-[#9131e7]/10 to-[#e84495]/10">
                    <h4 className="text-white font-bold text-base md:text-lg">All Investments</h4>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e]">
                            <tr>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">User</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Amount</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Transaction ID</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Sponsor ID</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Date</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Status</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#9131e7]/30">
                            {investments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                                        No investments found
                                    </td>
                                </tr>
                            ) : (
                                investments.map((investment) => (
                                    <tr key={investment._id} className="hover:bg-[#1a1a2e] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-[#9131e7] to-[#e84495] rounded-full flex items-center justify-center text-white font-bold">
                                                    {investment.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{investment.user?.name || 'Unknown'}</p>
                                                    <p className="text-gray-400 text-sm">{investment.user?.email || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-green-500 font-bold text-lg">₹{investment.amount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-[#9131e7] text-sm">{investment.transactionId || 'N/A'}</code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white text-sm">{investment.sponsorId || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            {new Date(investment.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${investment.status === 'approved'
                                                        ? 'bg-green-500/20 text-green-500'
                                                        : investment.status === 'pending'
                                                            ? 'bg-yellow-500/20 text-yellow-500'
                                                            : 'bg-red-500/20 text-red-500'
                                                    }`}
                                            >
                                                {investment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {investment.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(investment._id)}
                                                            className="px-3 py-1 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-all text-sm font-semibold"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(investment._id)}
                                                            className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-all text-sm font-semibold"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {investment.status !== 'pending' && (
                                                    <span className="text-gray-500 text-sm">No actions</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
