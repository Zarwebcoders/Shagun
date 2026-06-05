"use client"
import { useState, useEffect } from "react"
import { ArrowUpRight, Check, X, Filter, TrendingUp } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../../api/client"
import Pagination from "../../components/common/Pagination"

export default function WithdrawalRequests() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, pending, approved, rejected
    const [page, setPage] = useState(1)
    const [liveRate, setLiveRate] = useState(12) // Default fallback
    const [typeFilter, setTypeFilter] = useState('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const itemsPerPage = 10

    useEffect(() => {
        fetchLiveRate()
    }, [])

    const fetchLiveRate = async () => {
        try {
            const { data } = await client.get('/token-rate/latest');
            if (data && data.rate) {
                setLiveRate(data.rate);
            }
        } catch (error) {
            console.error("Error fetching latest token rate:", error);
        }
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = {
                status: filter,
                type: typeFilter,
                startDate,
                endDate
            };
            const { data } = await client.get('/withdrawals/all', { params });
            setRequests(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
            toast.error("Failed to load withdrawal requests");
            setLoading(false);
        }
    }

    const handleStatusUpdate = async (id, status) => { // status: 1 for Approve, 0 for Reject
        try {
            await client.put(`/withdrawals/${id}`, { approve: status });
            toast.success(status === 1 ? "Withdrawal Approved" : "Withdrawal Rejected");
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    }

    const filteredRequests = requests;

    // Calculate pagination
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedRequests = filteredRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    // Fetch requests whenever any filter changes
    useEffect(() => {
        fetchRequests();
    }, [filter, typeFilter, startDate, endDate]);

    // Reset page when any filter changes
    useEffect(() => {
        setPage(1);
    }, [filter, typeFilter, startDate, endDate]);

    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
            `}</style>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Withdrawal Requests
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-teal-500" />
                        Manage and approve user withdrawals
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Live Token Rate Card */}
                    <div className="bg-[#0f0f1a] border border-teal-500/30 rounded-xl px-4 py-2 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase block tracking-wider font-bold">Live Rate (SGN/INR)</span>
                            <span className="text-sm font-extrabold text-teal-400 font-mono">₹{liveRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {['all', 'pending', 'approved', 'rejected'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                    : 'bg-[#1a1a2e] text-gray-400 hover:text-white border border-teal-500/20'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-[#0f0f1a] p-4 rounded-xl border border-teal-500/20 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Type Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Withdrawal Type</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-sm text-white focus:border-teal-500 focus:outline-none transition-all"
                        >
                            <option value="all">All Types</option>
                            <option value="level_income">Level Income (Tokens)</option>
                            <option value="mining_bonus">Mining Bonus (Tokens)</option>
                            <option value="sponsor">Sponsor Income</option>
                        </select>
                    </div>

                    {/* Date Filters */}
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Request Date Range</label>
                        <div className="flex gap-3 items-center">
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-sm text-white focus:border-teal-500 focus:outline-none transition-all"
                                />
                            </div>
                            <span className="text-gray-500 text-sm">to</span>
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-sm text-white focus:border-teal-500 focus:outline-none transition-all"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => {
                                        setStartDate("");
                                        setEndDate("");
                                    }}
                                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-all"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#0f0f1a] rounded-xl border border-teal-500/20 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e] border-b border-teal-500/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Token Qty</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Net Token (-15%)</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Rate</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rate When Raised</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rupees Value</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Bank Details</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-500/10">
                            {loading ? (
                                <tr><td colSpan="11" className="px-6 py-8 text-center text-gray-500">Loading requests...</td></tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan="11" className="px-6 py-8 text-center text-gray-500">No requests found</td></tr>
                            ) : (
                                paginatedRequests.map((req) => {
                                    const isTokenWithdrawal = req.withdraw_type === 'level_income' || req.withdraw_type === 'mining_bonus' || req.withdraw_type === 'level';
                                    const tokenQty = req.amount;
                                    const netQty = req.payable_amount || (req.amount * 0.85);
                                    const conversionRate = isTokenWithdrawal ? liveRate : null;
                                    const netPayableINR = isTokenWithdrawal ? (netQty * liveRate) : netQty;
                                    const bd = req.bankDetails;
 
                                    return (
                                        <tr key={req._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                                            {/* User — name + user ID */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-normal">
                                                        {req.user_id?.full_name ? req.user_id.full_name : 'User Not Found'}
                                                    </span>
                                                    <span className="text-xs text-teal-400 font-mono">
                                                        ID: {req.user_id?.referral_id || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-gray-300 text-sm capitalize">{req.withdraw_type?.replace('_', ' ')}</span>
                                            </td>
                                            {/* Token Qty */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-normal">
                                                        {isTokenWithdrawal ? `${tokenQty.toLocaleString()} Token` : `₹${tokenQty.toLocaleString()}`}
                                                    </span>
                                                    {isTokenWithdrawal && (
                                                        <span className="text-[10px] text-gray-500 font-normal">Token Qty</span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Net Token */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-teal-400 font-normal">
                                                        {isTokenWithdrawal ? `${netQty.toLocaleString(undefined, { maximumFractionDigits: 4 })} Token` : `₹${netQty.toLocaleString()}`}
                                                    </span>
                                                    {isTokenWithdrawal && (
                                                        <span className="text-[10px] text-teal-600/70 font-normal">Net token qty</span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Current Rate */}
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                                                {isTokenWithdrawal ? (
                                                    <span className="text-emerald-400">₹{conversionRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </td>
                                            {/* Rate When Raised */}
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                                                {isTokenWithdrawal ? (
                                                    <span className="text-teal-400">₹{Number(req.token_rate || 14.40).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </td>
                                            {/* Rupees Value */}
                                            <td className="px-6 py-4 whitespace-nowrap font-mono font-normal">
                                                {isTokenWithdrawal ? (
                                                    <span className="text-teal-400 font-bold">
                                                        ₹{(netQty * (req.token_rate || 14.40)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                ) : (
                                                    <span className="text-teal-400">₹{netQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                )}
                                            </td>
                                            {/* Bank Details */}
                                            <td className="px-6 py-4">
                                                {bd ? (
                                                    <div className="flex flex-col gap-0.5 text-[11px]">
                                                        <span className="text-white font-semibold">{bd.accountHolderName || bd.account_holder_name || '—'}</span>
                                                        <span className="text-gray-400 font-mono">{bd.accountNumber || bd.account_number || '—'}</span>
                                                        <span className="text-gray-500">IFSC: {bd.ifscCode || bd.ifsc_code || '—'}</span>
                                                        <span className="text-gray-500">{bd.bankName || bd.bank_name || '—'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600 text-xs">{req.method === 'crypto' ? 'On-chain' : 'No bank info'}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-300 text-sm">
                                                        {new Date(req.create_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(req.create_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${req.approve == 1
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : req.approve == 0
                                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                    }`}>
                                                    {req.approve == 1 ? 'Approved' : req.approve == 0 ? 'Rejected' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {req.approve == 2 && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleStatusUpdate(req._id, 1)}
                                                            className="p-1.5 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all"
                                                            title="Approve"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(req._id, 0)}
                                                            className="p-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                            title="Reject"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>

                    </table>
                </div>

                {/* Pagination */}
                {filteredRequests.length > itemsPerPage && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalResults={filteredRequests.length}
                        itemsPerPage={itemsPerPage}
                        itemName="requests"
                    />
                )}
            </div>
        </div>
    )
}
