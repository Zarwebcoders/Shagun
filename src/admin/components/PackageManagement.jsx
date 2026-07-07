"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Package, Search, Calendar, User, CheckCircle, Trash2, Eye, X, ExternalLink } from "lucide-react"
import client from "../../api/client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useWeb3 } from "../../hooks/useWeb3"
import { toast } from "react-hot-toast"

export default function PackageManagement() {
    const { contract, isConnected, connectWallet } = useWeb3()

    // ── Data ────────────────────────────────────────────────────────────────
    const [products, setProducts]           = useState([])
    const [packageTypes, setPackageTypes]   = useState([])
    const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0, total: 0 })
    const [loading, setLoading]             = useState(true)

    // ── Filters ─────────────────────────────────────────────────────────────
    const [searchInput, setSearchInput]     = useState("")   // raw input (debounced)
    const [searchTerm, setSearchTerm]       = useState("")   // debounced value sent to API
    const [statusFilter, setStatusFilter]   = useState("all")
    const [packageFilter, setPackageFilter] = useState("all")
    const [startDate, setStartDate]         = useState("")
    const [endDate, setEndDate]             = useState("")

    // ── Pagination ───────────────────────────────────────────────────────────
    const [currentPage, setCurrentPage]     = useState(1)
    const [totalPages, setTotalPages]       = useState(1)
    const [totalCount, setTotalCount]       = useState(0)
    const ITEMS_PER_PAGE = 10

    // ── Modal ────────────────────────────────────────────────────────────────
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [isModalOpen, setIsModalOpen]         = useState(false)

    // ── Debounce search input ────────────────────────────────────────────────
    const debounceRef = useRef(null)
    const handleSearchInput = (val) => {
        setSearchInput(val)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setSearchTerm(val)
            setCurrentPage(1)
        }, 400)
    }

    // ── Fetch from server ────────────────────────────────────────────────────
    const fetchProducts = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page:        currentPage,
                limit:       ITEMS_PER_PAGE,
                search:      searchTerm,
                status:      statusFilter,
                packageType: packageFilter,
                startDate,
                endDate,
            })
            const { data } = await client.get(`/products/all?${params.toString()}`)

            setProducts(data.products || [])
            setTotalPages(data.pagination?.totalPages || 1)
            setTotalCount(data.pagination?.total      || 0)
            setStats({
                approved: data.stats?.approved ?? 0,
                pending:  data.stats?.pending  ?? 0,
                rejected: data.stats?.rejected ?? 0,
                total:    data.stats?.total    ?? 0,
            })
            if (data.packageTypes?.length) {
                setPackageTypes(data.packageTypes)
            }
        } catch (error) {
            console.error("Error fetching products:", error)
            toast.error("Failed to load products")
        } finally {
            setLoading(false)
        }
    }, [currentPage, searchTerm, statusFilter, packageFilter, startDate, endDate])

    // Re-fetch whenever any filter/page changes
    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    // Reset to page 1 when any filter changes (except currentPage itself)
    const applyFilter = (setter) => (val) => {
        setter(val)
        setCurrentPage(1)
    }

    // ── Approve / Reject ────────────────────────────────────────────────────
    const handleStatusUpdate = async (productRecord, status) => {
        const id = productRecord._id

        if (status === 1) {
            if (!isConnected) {
                toast.error("Please connect admin wallet first!")
                connectWallet()
                return
            }

            const loadingToast = toast.loading("Initiating blockchain approval...")
            try {
                // Map product ID for blockchain since contract only allows 1 or 2
                let onchainProductId = Number(productRecord.product_id);
                let onchainQuantity = Number(productRecord.quantity) || 1;

                if (onchainProductId === 3 || onchainProductId === 4) {
                    onchainProductId = 1; // Map to product 1, same 10,000 token value per unit
                }

                console.log("Approving on chain:", productRecord.wallet_address, onchainProductId, onchainQuantity)

                const tx = await contract.approveProductPurchase(
                    productRecord.wallet_address,
                    onchainProductId,
                    onchainQuantity
                )

                toast.loading("Waiting for network confirmation...", { id: loadingToast })
                await tx.wait()

                toast.loading("Syncing with database...", { id: loadingToast })
                await client.put(`/products/${id}`, { status, onchain_tx_hash: tx.hash })

                toast.success("Product approved on blockchain & database!", { id: loadingToast })
                fetchProducts()
            } catch (error) {
                console.error("Approval Error:", error)
                const msg = error.reason || error.message || "Approval failed"
                toast.error(`Blockchain Error: ${msg}`, { id: loadingToast })
            }
        } else {
            try {
                await client.put(`/products/${id}`, { status })
                toast.success("Product rejected.")
                fetchProducts()
            } catch (error) {
                console.error("Error updating status:", error)
                toast.error("Failed to update status.")
            }
        }
    }

    const resetFilters = () => {
        setSearchInput("")
        setSearchTerm("")
        setStatusFilter("all")
        setPackageFilter("all")
        setStartDate("")
        setEndDate("")
        setCurrentPage(1)
    }

    const hasActiveFilters = statusFilter !== "all" || packageFilter !== "all" || startDate || endDate || searchTerm

    const indexOfFirst = (currentPage - 1) * ITEMS_PER_PAGE + 1
    const indexOfLast  = Math.min(currentPage * ITEMS_PER_PAGE, totalCount)

    return (
        <div className="space-y-6 animate-fadeIn text-white">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
            `}} />

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Product Management
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <Package className="w-4 h-4 text-teal-500" />
                        View all user Investment History
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">

                    {/* Total All */}
                    <button
                        onClick={() => applyFilter(setStatusFilter)("all")}
                        className={`px-4 py-2 border rounded-lg flex items-center gap-3 transition-all cursor-pointer hover:scale-105 ${
                            statusFilter === "all"
                                ? "bg-teal-500/20 border-teal-400/60 ring-2 ring-teal-400/40"
                                : "bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20"
                        }`}
                        title="Show all records"
                    >
                        <div className="p-2 bg-teal-500/20 rounded-full text-teal-400">
                            <Package className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-gray-400">Total Requests</p>
                            <p className="text-xl font-bold text-white">{stats.total.toLocaleString()}</p>
                            {statusFilter === "all" && (
                                <p className="text-[10px] text-teal-400 font-semibold">● All</p>
                            )}
                        </div>
                    </button>

                    {/* Total Approved */}
                    <button
                        onClick={() => applyFilter(setStatusFilter)(statusFilter === "approved" ? "all" : "approved")}
                        className={`px-4 py-2 border rounded-lg flex items-center gap-3 transition-all cursor-pointer hover:scale-105 ${
                            statusFilter === "approved"
                                ? "bg-green-500/20 border-green-400/60 ring-2 ring-green-400/40"
                                : "bg-green-500/10 border-green-500/20 hover:bg-green-500/20"
                        }`}
                        title="Click to show only approved records"
                    >
                        <div className="p-2 bg-green-500/20 rounded-full text-green-500">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-gray-400">Approved</p>
                            <p className="text-xl font-bold text-white">{stats.approved.toLocaleString()}</p>
                            {statusFilter === "approved" && (
                                <p className="text-[10px] text-green-400 font-semibold">● Filtered</p>
                            )}
                        </div>
                    </button>

                    {/* Total Pending */}
                    <button
                        onClick={() => applyFilter(setStatusFilter)(statusFilter === "pending" ? "all" : "pending")}
                        className={`px-4 py-2 border rounded-lg flex items-center gap-3 transition-all cursor-pointer hover:scale-105 ${
                            statusFilter === "pending"
                                ? "bg-yellow-500/20 border-yellow-400/60 ring-2 ring-yellow-400/40"
                                : "bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20"
                        }`}
                        title="Click to show only pending records"
                    >
                        <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-500">
                            <Trash2 className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-gray-400">Pending</p>
                            <p className="text-xl font-bold text-white">{stats.pending.toLocaleString()}</p>
                            {statusFilter === "pending" && (
                                <p className="text-[10px] text-yellow-400 font-semibold">● Filtered</p>
                            )}
                        </div>
                    </button>

                    {/* Rejected */}
                    <button
                        onClick={() => applyFilter(setStatusFilter)(statusFilter === "rejected" ? "all" : "rejected")}
                        className={`px-4 py-2 border rounded-lg flex items-center gap-3 transition-all cursor-pointer hover:scale-105 ${
                            statusFilter === "rejected"
                                ? "bg-red-500/20 border-red-400/60 ring-2 ring-red-400/40"
                                : "bg-red-500/10 border-red-500/20 hover:bg-red-500/20"
                        }`}
                        title="Click to show only rejected records"
                    >
                        <div className="p-2 bg-red-500/20 rounded-full text-red-400">
                            <X className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-gray-400">Rejected</p>
                            <p className="text-xl font-bold text-white">{stats.rejected.toLocaleString()}</p>
                            {statusFilter === "rejected" && (
                                <p className="text-[10px] text-red-400 font-semibold">● Filtered</p>
                            )}
                        </div>
                    </button>
                </div>

            </div>

            {/* ── Filters ── */}
            <div className="bg-[#0f0f1a] rounded-xl border border-teal-500/20 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-teal-500/10 pb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-400">Filter Options</h3>
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Name, ID, txn, wallet..."
                                value={searchInput}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-sm text-white focus:border-teal-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Package Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Package Type</label>
                        <select
                            value={packageFilter}
                            onChange={(e) => applyFilter(setPackageFilter)(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-sm text-white focus:border-teal-500 focus:outline-none transition-all"
                        >
                            <option value="all">All Packages</option>
                            {packageTypes.map(pkg => (
                                <option key={pkg} value={pkg}>{pkg}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => applyFilter(setStatusFilter)(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-sm text-white focus:border-teal-500 focus:outline-none transition-all"
                        >
                            <option value="all">All Statuses</option>
                            <option value="approved">Active / Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {/* Date Filters */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Date Range</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1) }}
                                className="w-full px-2 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-xs text-white focus:border-teal-500 focus:outline-none transition-all"
                            />
                            <span className="text-gray-500 text-xs">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1) }}
                                className="w-full px-2 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-xs text-white focus:border-teal-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-[#0f0f1a] rounded-xl border border-teal-500/20 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#1a1a2e] border-b border-teal-500/20">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Referral ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product / Qty</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Txn Info</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-500/10">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-500">
                                            <div className="w-8 h-8 border-2 border-teal-500/40 border-t-teal-400 rounded-full animate-spin" />
                                            <span className="text-sm">Loading products...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">No records found</td>
                                </tr>
                            ) : (
                                products.map((item) => (
                                    <tr key={item._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{item.user?.name || "Unknown"}</p>
                                                    <p className="text-xs text-gray-500">{item.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-teal-400 font-mono text-xs font-bold bg-teal-500/10 px-2 py-1 rounded border border-teal-500/20">
                                                {item.user?.referral_id || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <span className="text-gray-300 font-medium block">{item.packag_type}</span>
                                                <div className="flex flex-col gap-0.5 mt-0.5">
                                                    <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                                                    <span className="text-xs text-teal-400 font-mono">
                                                        Tokens: {Number(item.token_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded w-fit">
                                                    {item.transcation_id}
                                                </span>
                                                {item.wallet_address && (
                                                    <span className="text-[10px] text-gray-500 truncate max-w-[120px]" title={item.wallet_address}>
                                                        {item.wallet_address}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(() => {
                                                const isEV = item.packag_type && item.packag_type.toLowerCase().includes("ev");
                                                if (isEV) {
                                                    return (
                                                        <span className="text-teal-400 font-bold">{item.quantity || 1} PV</span>
                                                    )
                                                }
                                                const hasBV = item.business_volume && item.business_volume > 0
                                                const totalAmount = hasBV ? item.business_volume : Number(item.amount)
                                                return (
                                                    <span className="text-teal-400 font-bold">₹{totalAmount.toLocaleString()}</span>
                                                )
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col text-sm text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(item.cereate_at).toLocaleDateString()}
                                                </div>
                                                <span className="text-[10px] opacity-60 ml-5">
                                                    {new Date(item.cereate_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                (item.approve === 1 || item.approve === "1")
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : (item.approve === 2 || item.approve === "2")
                                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                                {(item.approve === 1 || item.approve === "1") ? 'Active' : (item.approve === 2 || item.approve === "2") ? 'Rejected' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedProduct(item); setIsModalOpen(true) }}
                                                    className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white transition-all border border-teal-500/30"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {(item.approve === 0 || item.approve === "0") && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(item, 1)}
                                                            className="p-1.5 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all border border-green-500/30"
                                                            title="Approve on Blockchain"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(item, 2)}
                                                            className="p-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/30"
                                                            title="Reject"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                {!loading && totalCount > 0 && (
                    <div className="px-6 py-4 bg-[#1a1a2e]/50 border-t border-teal-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-gray-400">
                            Showing <span className="text-white font-medium">{indexOfFirst}</span> to{" "}
                            <span className="text-white font-medium">{indexOfLast}</span> of{" "}
                            <span className="text-white font-medium">{totalCount.toLocaleString()}</span> results
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-[#0f0f1a] border border-gray-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/50 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(num => num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1))
                                .map((number, index, array) => (
                                    <div key={number} className="flex">
                                        {index > 0 && array[index - 1] !== number - 1 && (
                                            <span className="px-2 text-gray-600">...</span>
                                        )}
                                        <button
                                            onClick={() => setCurrentPage(number)}
                                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                                                currentPage === number
                                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                                    : 'bg-[#0f0f1a] border border-gray-700 text-gray-400 hover:text-teal-400 hover:border-teal-500/50'
                                            }`}
                                        >
                                            {number}
                                        </button>
                                    </div>
                                ))}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg bg-[#0f0f1a] border border-gray-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/50 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            {isModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                    <div
                        className="absolute inset-0"
                        onClick={() => { setIsModalOpen(false); setSelectedProduct(null) }}
                    />
                    <div className="bg-[#0f0f1c] border border-teal-500/30 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-teal-500/20 bg-[#16162e]">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Package className="w-5 h-5 text-teal-400" />
                                Transaction Details
                            </h3>
                            <button
                                onClick={() => { setIsModalOpen(false); setSelectedProduct(null) }}
                                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                            {/* Status Banner */}
                            <div className={`p-4 rounded-xl border flex justify-between items-center ${
                                (selectedProduct.approve === 1 || selectedProduct.approve === "1")
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                    : (selectedProduct.approve === 2 || selectedProduct.approve === "2")
                                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                            }`}>
                                <div>
                                    <p className="text-xs uppercase font-semibold tracking-wider opacity-75">Current Status</p>
                                    <p className="text-lg font-bold">
                                        {(selectedProduct.approve === 1 || selectedProduct.approve === "1") ? 'Active / Approved' : (selectedProduct.approve === 2 || selectedProduct.approve === "2") ? 'Rejected' : 'Pending Verification'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase font-semibold tracking-wider opacity-75">Date Submitted</p>
                                    <p className="font-semibold text-white">
                                        {new Date(selectedProduct.cereate_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* User & Package Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#16162e]/40 p-4 rounded-xl border border-teal-500/10 space-y-3">
                                    <h4 className="font-bold text-teal-400 border-b border-teal-500/10 pb-1.5 mb-2">User Information</h4>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Name</label>
                                        <span className="text-white font-medium">{selectedProduct.user?.name || "Unknown"}</span>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Email</label>
                                        <span className="text-white font-mono break-all">{selectedProduct.user?.email || "N/A"}</span>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Referral ID</label>
                                        <span className="text-teal-400 font-mono font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 text-xs inline-block mt-0.5">
                                            {selectedProduct.user?.referral_id || "N/A"}
                                        </span>
                                    </div>
                                    {selectedProduct.wallet_address && (
                                        <div>
                                            <label className="text-xs text-gray-500 block">Wallet Address</label>
                                            <span className="text-white font-mono text-xs break-all block">{selectedProduct.wallet_address}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-[#16162e]/40 p-4 rounded-xl border border-teal-500/10 space-y-3">
                                    <h4 className="font-bold text-teal-400 border-b border-teal-500/10 pb-1.5 mb-2">Package Information</h4>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Product Package</label>
                                        <span className="text-white font-bold">{selectedProduct.packag_type || "N/A"}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-500 block">Quantity</label>
                                            <span className="text-white font-medium">{selectedProduct.quantity || 1}</span>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block">{selectedProduct.packag_type?.toLowerCase().includes("ev") ? "Amount (PV)" : "Amount (INR)"}</label>
                                            <span className="text-teal-400 font-bold">
                                                {selectedProduct.packag_type?.toLowerCase().includes("ev")
                                                    ? `${selectedProduct.quantity || 1} PV`
                                                    : `₹${(selectedProduct.business_volume || (Number(selectedProduct.amount) * (selectedProduct.quantity || 1))).toLocaleString()}`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    {selectedProduct.token_amount && (
                                        <div>
                                            <label className="text-xs text-gray-500 block">Tokens Allocated</label>
                                            <span className="text-teal-400 font-bold font-mono">
                                                {Number(selectedProduct.token_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SGN
                                            </span>
                                        </div>
                                    )}
                                    {selectedProduct.onchain_tx_hash && (
                                        <div>
                                            <label className="text-xs text-gray-500 block">Onchain TX Hash</label>
                                            <span className="text-teal-400 font-mono text-xs break-all block">{selectedProduct.onchain_tx_hash}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Transaction Details */}
                            <div className="bg-[#16162e]/40 p-4 rounded-xl border border-teal-500/10 space-y-3">
                                <h4 className="font-bold text-teal-400 border-b border-teal-500/10 pb-1.5 mb-2">Transaction Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block">UTR / Transaction ID</label>
                                        <span className="text-white font-mono font-bold bg-white/5 border border-white/10 px-2 py-1 rounded inline-block mt-1">
                                            {selectedProduct.transcation_id || "N/A"}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Database Record ID</label>
                                        <span className="text-gray-400 font-mono text-xs">{selectedProduct._id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Slip */}
                            <div className="bg-[#16162e]/40 p-4 rounded-xl border border-teal-500/10 space-y-3">
                                <h4 className="font-bold text-teal-400 border-b border-teal-500/10 pb-1.5 mb-2">Payment Slip / Proof</h4>
                                {selectedProduct.paymentSlip ? (
                                    <div className="space-y-3">
                                        <div className="border border-teal-500/20 rounded-lg overflow-hidden bg-black/40 flex justify-center p-2 max-h-[300px]">
                                            <img
                                                src={selectedProduct.paymentSlip}
                                                alt="Payment Proof"
                                                className="max-w-full max-h-[280px] object-contain rounded hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                                                onClick={() => {
                                                    const w = window.open()
                                                    w.document.write(`<img src="${selectedProduct.paymentSlip}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`)
                                                    w.document.title = "Payment Proof Slip"
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => {
                                                    const w = window.open()
                                                    w.document.write(`<img src="${selectedProduct.paymentSlip}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`)
                                                    w.document.title = "Payment Proof Slip"
                                                }}
                                                className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-bold transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                View Full Size
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-[#1a1a38]/30 rounded-lg border border-dashed border-red-500/20 text-gray-500">
                                        No payment proof image uploaded for this transaction.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-teal-500/20 bg-[#16162e] flex justify-between items-center gap-4">
                            <button
                                onClick={() => { setIsModalOpen(false); setSelectedProduct(null) }}
                                className="px-4 py-2 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Close
                            </button>

                            {(selectedProduct.approve === 0 || selectedProduct.approve === "0") && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={async () => {
                                            const p = selectedProduct
                                            setIsModalOpen(false)
                                            setSelectedProduct(null)
                                            await handleStatusUpdate(p, 2)
                                        }}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 hover:border-red-500 rounded-lg text-sm font-bold transition-all"
                                    >
                                        Reject Transaction
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const p = selectedProduct
                                            setIsModalOpen(false)
                                            setSelectedProduct(null)
                                            await handleStatusUpdate(p, 1)
                                        }}
                                        className="px-4 py-2 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/30 hover:border-green-500 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve & Mint
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


// 1 oct 2025 to 5 dec 2025 = rate 4rs
// 6 dec 2025 to 26 dec 2025 = rate 4.8rs
// 27 dec 2025 to 12 jan 2025 = rate 5.8rs
// 13 jan till now = rate 7rs