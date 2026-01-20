"use client"
import { useState, useEffect } from "react"
import { ArrowUpRight, Check, X, Wallet } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../../api/client"

export default function VendorWallets() {
    const [wallets, setWallets] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, pending, approved, rejected

    useEffect(() => {
        fetchWallets()
    }, [])

    const fetchWallets = async () => {
        try {
            const { data } = await client.get('/api/vendor-wallet/all');
            setWallets(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching wallets:", error);
            toast.error("Failed to load wallets");
            setLoading(false);
        }
    }

    const handleStatusUpdate = async (id, status) => {
        try {
            await client.put(`/api/vendor-wallet/${id}`, { approve: status });
            toast.success(status === 1 ? "Wallet Approved" : "Wallet Rejected");
            fetchWallets();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    }

    const filteredWallets = wallets.filter(w => {
        if (filter === 'all') return true;
        if (filter === 'pending') return w.approve === 2;
        if (filter === 'approved') return w.approve === 1;
        if (filter === 'rejected') return w.approve === 0;
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
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                        Vendor Wallets
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-blue-500" />
                        Manage vendor wallet addresses
                    </p>
                </div>

                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-[#1a1a2e] text-gray-400 hover:text-white border border-blue-500/20'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-[#0f0f1a] rounded-xl border border-blue-500/20 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e] border-b border-blue-500/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Wallet Address</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-500/10">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading wallets...</td></tr>
                            ) : filteredWallets.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No wallets found</td></tr>
                            ) : (
                                filteredWallets.map((wallet) => (
                                    <tr key={wallet._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-white font-medium font-mono">{wallet.vendor_id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-300 font-mono text-sm break-all">{wallet.wallet_add}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-400 text-sm">{new Date(wallet.createdAt).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${wallet.approve === 1
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : wallet.approve === 0
                                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                {wallet.approve === 1 ? 'Approved' : wallet.approve === 0 ? 'Rejected' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {wallet.approve === 2 && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(wallet._id, 1)}
                                                        className="p-1.5 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(wallet._id, 0)}
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
