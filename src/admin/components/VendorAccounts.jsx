"use client"
import { useState, useEffect } from "react"
import { Check, X, Landmark } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../../api/client"

export default function VendorAccounts() {
    const [accounts, setAccounts] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, pending, approved, rejected

    useEffect(() => {
        fetchAccounts()
    }, [])

    const fetchAccounts = async () => {
        try {
            const { data } = await client.get('/api/vendor-account/all');
            setAccounts(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching vendor accounts:", error);
            toast.error("Failed to load accounts");
            setLoading(false);
        }
    }

    const handleStatusUpdate = async (id, status) => {
        try {
            await client.put(`/api/vendor-account/${id}`, { approve: status });
            toast.success(status === 1 ? "Account Approved" : "Account Rejected");
            fetchAccounts();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    }

    const filteredAccounts = accounts.filter(acc => {
        if (filter === 'all') return true;
        if (filter === 'pending') return acc.approve === 2;
        if (filter === 'approved') return acc.approve === 1;
        if (filter === 'rejected') return acc.approve === 0;
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
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Vendor Bank Accounts
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-purple-500" />
                        Manage vendor bank details
                    </p>
                </div>

                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f
                                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                    : 'bg-[#1a1a2e] text-gray-400 hover:text-white border border-purple-500/20'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-[#0f0f1a] rounded-xl border border-purple-500/20 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e] border-b border-purple-500/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Bank Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Bank Code</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Num</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-500/10">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading accounts...</td></tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No accounts found</td></tr>
                            ) : (
                                filteredAccounts.map((acc) => (
                                    <tr key={acc._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-white font-medium font-mono">{acc.vendor_id}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-300">{acc.back_name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-300 font-mono">{acc.back_code}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-300 font-mono">{acc.acc_num}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${acc.approve === 1
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : acc.approve === 0
                                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                {acc.approve === 1 ? 'Approved' : acc.approve === 0 ? 'Rejected' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {acc.approve === 2 && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(acc._id, 1)}
                                                        className="p-1.5 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(acc._id, 0)}
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
