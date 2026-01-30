"use client"
import { useState, useEffect } from "react"
import { ArrowUpRight, Check, X, Filter, Building2, CreditCard } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../../api/client"
import Pagination from "../../components/common/Pagination"

export default function BankAccountManagement() {
    const [accounts, setAccounts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalRecords, setTotalRecords] = useState(0)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPage(1) // Reset to page 1 on search change
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        fetchAccounts()
    }, [page, debouncedSearch])

    const fetchAccounts = async () => {
        try {
            setLoading(true)
            const params = {
                page,
                limit: 10,
                search: debouncedSearch
            }
            const { data } = await client.get('/my-account/all', { params });

            // Backend returns { accounts, page, pages, total }
            setAccounts(data.accounts || []);
            setTotalPages(data.pages || 1);
            setTotalRecords(data.total || 0);
        } catch (error) {
            console.error("Error fetching accounts:", error);
            toast.error("Failed to load bank accounts");
            setAccounts([]); // Ensure array on error
        } finally {
            setLoading(false);
        }
    }

    const handleStatusUpdate = async (id, status) => { // status: 1 for Approve, 0 for Reject
        try {
            await client.put(`/my-account/${id}`, { approve: status });
            toast.success(status === 1 ? "Account Approved" : "Account Rejected");
            fetchAccounts(); // Refresh list
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

            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                            Bank Account Management
                        </h2>
                        <p className="text-gray-400 mt-1 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-teal-500" />
                            Manage user bank account submissions ({totalRecords} records)
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-[#0f0f1a] p-2 rounded-xl border border-teal-500/20 max-w-md w-full">
                    <input
                        type="text"
                        placeholder="Search by User Name, ID, Bank Name, Account No..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent border-none text-white focus:ring-0 px-4 py-2 outline-none"
                    />
                </div>
            </div>

            <div className="bg-[#0f0f1a] rounded-xl border border-teal-500/20 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e] border-b border-teal-500/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Bank Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Holder</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Number</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">IFSC / Branch</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-500/10">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading accounts...</td></tr>
                            ) : accounts.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No accounts found</td></tr>
                            ) : (
                                accounts.map((acc) => (
                                    <tr key={acc._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">
                                                    {acc.user_details?.full_name || 'Unknown'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ID: {acc.user_id}
                                                </span>
                                                <span className="text-xs text-gray-600">
                                                    {acc.user_details?.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-teal-400 font-medium">{acc.back_name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-300 text-sm">{acc.acc_name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-3 h-3 text-gray-500" />
                                                <span className="text-gray-300 text-sm font-mono">{acc.acc_num}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-mono">{acc.back_code}</span>
                                                <span className="text-xs text-gray-500">{acc.branch}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {(acc.approve == 2 || acc.approve === 0 || acc.approve === 1) && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(acc._id, 1)}
                                                        className={`p-1.5 rounded-lg transition-all ${acc.approve === 1 ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'}`}
                                                        title="Approve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(acc._id, 0)}
                                                        className={`p-1.5 rounded-lg transition-all ${acc.approve === 0 ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalResults={totalRecords}
                        itemsPerPage={10}
                        itemName="accounts"
                    />
                )}
            </div>
        </div>
    )
}
