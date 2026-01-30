"use client"
import { useState, useEffect } from "react"
import { Check, X, Building2, Search, Wallet } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../../api/client"
import Pagination from "../../components/common/Pagination"

export default function ManageWallet() {
    const [wallets, setWallets] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalWallets, setTotalWallets] = useState(0) // Add usage
    const [stats, setStats] = useState({ approved: 0, rejected: 0, pending: 0 })

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPage(1)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        fetchWallets()
    }, [page, debouncedSearch])

    const fetchWallets = async () => {
        try {
            setLoading(true)
            const params = {
                page,
                limit: 10,
                search: debouncedSearch
            }
            const { data } = await client.get('/wallet/all', { params });

            setWallets(data.wallets || []);
            setTotalPages(data.pages || 1);
            setTotalWallets(data.total || 0); // Capture total
            setStats(data.stats || { approved: 0, rejected: 0, pending: 0 });
        } catch (error) {
            console.error("Error fetching wallets:", error);
            toast.error("Failed to load wallets");
            setWallets([]);
        } finally {
            setLoading(false);
        }
    }

    const handleStatusUpdate = async (id, status) => {
        try {
            await client.put(`/wallet/${id}`, { approve: status });
            toast.success(status === 1 ? "Wallet Approved" : "Wallet Rejected");
            fetchWallets();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    }

    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
            `}</style>

            {/* Header & Stats */}
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                        Manage Wallets
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-teal-500" />
                        Manage user wallet submissions
                    </p>
                </div>

                {/* Stats & Search Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0f0f1a] rounded-xl p-5 border border-green-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Approved</p>
                                <h3 className="text-2xl font-bold text-white mt-1">{stats.approved}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <Check className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#0f0f1a] rounded-xl p-5 border border-red-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Rejected</p>
                                <h3 className="text-2xl font-bold text-white mt-1">{stats.rejected}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                <X className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Search Bar - Height matched with cards */}
                    <div className="relative h-full">
                        <input
                            type="text"
                            placeholder="Search by User, Bank, or Wallet Address..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-full bg-[#0f0f1a] border border-teal-500/20 rounded-xl px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 transition-colors"
                        />
                        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0f0f1a] rounded-xl border border-teal-500/20 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e] border-b border-teal-500/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Wallet Address</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-500/10">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading wallets...</td></tr>
                            ) : wallets.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No wallets found</td></tr>
                            ) : (
                                wallets.map((curr) => (
                                    <tr key={curr._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">
                                                    {curr.user_id?.full_name || 'Unknown User'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ID: {curr.user_id?.user_id || (typeof curr.user_id === 'string' ? curr.user_id : 'N/A')}
                                                </span>
                                                <span className="text-xs text-gray-600">
                                                    {curr.user_id?.email || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-teal-400 font-mono text-sm break-all">{curr.wallet_add}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${curr.approve === 1
                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                : curr.approve === 0
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                {curr.approve === 1 ? 'Approved' : curr.approve === 0 ? 'Rejected' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleStatusUpdate(curr._id, 1)}
                                                    className={`p-1.5 rounded-lg transition-all ${curr.approve === 1 ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'}`}
                                                    title="Approve"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(curr._id, 0)}
                                                    className={`p-1.5 rounded-lg transition-all ${curr.approve === 0 ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}
                                                    title="Reject"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalResults={totalWallets}
                        itemsPerPage={10}
                        itemName="wallets"
                    />
                )}
            </div>
        </div>
    )
}
