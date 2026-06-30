"use client"
import { useState, useEffect } from "react"
import { Search, Wallet } from "lucide-react"
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
    const [totalWallets, setTotalWallets] = useState(0)

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
            setTotalWallets(data.total || 0);
        } catch (error) {
            console.error("Error fetching wallets:", error);
            toast.error("Failed to load wallets");
            setWallets([]);
        } finally {
            setLoading(false);
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
                        Connected user wallets list
                    </p>
                </div>

                {/* Stats & Search Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0f0f1a] rounded-xl p-5 border border-teal-500/20 md:col-span-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Wallets Connected</p>
                                <h3 className="text-2xl font-bold text-white mt-1">{totalWallets}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
                                <Wallet className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Search Bar - Height matched with cards */}
                    <div className="relative h-full md:col-span-2">
                        <input
                            type="text"
                            placeholder="Search by User or Wallet Address..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-full bg-[#0f0f1a] border border-teal-500/20 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 transition-colors min-h-[70px] md:min-h-0"
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-500/10">
                            {loading ? (
                                <tr><td colSpan="2" className="px-6 py-8 text-center text-gray-500">Loading wallets...</td></tr>
                            ) : wallets.length === 0 ? (
                                <tr><td colSpan="2" className="px-6 py-8 text-center text-gray-500">No wallets found</td></tr>
                            ) : (
                                wallets.map((curr) => (
                                    <tr key={curr._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                                         <td className="px-6 py-4 whitespace-nowrap">
                                             <div className="flex flex-col gap-0.5">
                                                 <span className="text-white font-medium text-sm">
                                                     {curr.user_id?.full_name || 'Unknown User'}
                                                 </span>
                                                 <span className="text-[11px] text-teal-400 font-mono">
                                                     UID: {curr.user_id?.user_id || (typeof curr.user_id === 'string' ? curr.user_id : 'N/A')}
                                                 </span>
                                                 {curr.user_id?.referral_id && (
                                                     <span className="text-[11px] text-purple-400 font-mono">
                                                         Ref: {curr.user_id.referral_id}
                                                     </span>
                                                 )}
                                                 <span className="text-[11px] text-gray-500 font-mono">
                                                     {curr.user_id?.email || 'N/A'}
                                                 </span>
                                             </div>
                                         </td>
                                        <td className="px-6 py-4">
                                            <span className="text-teal-400 font-mono text-sm break-all">{curr.wallet_add}</span>
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
