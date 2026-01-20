"use client"
import { useState, useEffect } from "react"
import { ArrowUpRight, Check, X, Filter } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../../api/client"

export default function WithdrawalRequests() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, pending, approved, rejected

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const { data } = await client.get('/api/withdrawals/all');
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
            await client.put(`/api/withdrawals/${id}`, { approve: status });
            toast.success(status === 1 ? "Withdrawal Approved" : "Withdrawal Rejected");
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    }

    const filteredRequests = requests.filter(req => {
        if (filter === 'all') return true;
        if (filter === 'pending') return req.approve === 2;
        if (filter === 'approved') return req.approve === 1;
        if (filter === 'rejected') return req.approve === 0;
        return true;
    });

    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <style jsx>{`
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

            <div className="bg-[#0f0f1a] rounded-xl border border-teal-500/20 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e] border-b border-teal-500/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-500/10">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading requests...</td></tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No requests found</td></tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{req.user_id?.full_name || 'Unknown User'}</span>
                                                <span className="text-xs text-gray-500">{req.user_id?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-teal-400 font-bold">₹{req.amount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-300 text-sm">{req.withdraw_type}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-400 text-sm">{new Date(req.create_at).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${req.approve === 1
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : req.approve === 0
                                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                {req.approve === 1 ? 'Approved' : req.approve === 0 ? 'Rejected' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {req.approve === 2 && (
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
