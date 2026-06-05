"use client"
import { useState, useEffect } from "react"
import { Package, Search, Calendar, User, CheckCircle, Trash2 } from "lucide-react"
import client from "../../api/client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { useWeb3 } from "../../hooks/useWeb3"
import { toast } from "react-hot-toast"

export default function PackageManagement() {
    const { contract, isConnected, connectWallet } = useWeb3()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [packageFilter, setPackageFilter] = useState("all")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

    useEffect(() => {
        fetchProducts()
    }, [])

    // Reset page when search parameters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, packageFilter, startDate, endDate]);

    const fetchProducts = async () => {
        try {
            const { data } = await client.get('/products/all');
            setProducts(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching products:", error);
            setLoading(false);
        }
    }


    const handleStatusUpdate = async (productRecord, status) => { // 1 = Approve, 2 = Reject
        const id = productRecord._id;
        
        if (status === 1) {
            if (!isConnected) {
                toast.error("Please connect admin wallet first!");
                connectWallet();
                return;
            }

            const loadingToast = toast.loading("Initiating blockchain approval...");
            try {
                // 1. Trigger Smart Contract Call
                console.log("Approving on chain:", productRecord.wallet_address, productRecord.product_id, productRecord.quantity);
                
                const tx = await contract.approveProductPurchase(
                    productRecord.wallet_address, 
                    productRecord.product_id, 
                    productRecord.quantity
                );
                
                toast.loading("Waiting for network confirmation...", { id: loadingToast });
                const receipt = await tx.wait();
                
                // 2. Sync with Backend
                toast.loading("Syncing with database...", { id: loadingToast });
                await client.put(`/products/${id}`, { 
                    status, 
                    onchain_tx_hash: tx.hash 
                });
                
                toast.success("Product approved on blockchain & database!", { id: loadingToast });
                fetchProducts();
            } catch (error) {
                console.error("Approval Error:", error);
                const msg = error.reason || error.message || "Approval failed";
                toast.error(`Blockchain Error: ${msg}`, { id: loadingToast });
            }
        } else {
            // Rejection logic (No blockchain call needed)
            try {
                await client.put(`/products/${id}`, { status });
                toast.success("Product rejected.");
                fetchProducts();
            } catch (error) {
                console.error("Error updating status:", error);
                toast.error("Failed to update status.");
            }
        }
    }



    // Filter Logic
    const filteredProducts = products.filter(p => {
        // Search Term
        const matchesSearch = 
            (p.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.user?.referral_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.packag_type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.transcation_id || "").toLowerCase().includes(searchTerm.toLowerCase());

        // Status Filter
        let matchesStatus = true;
        if (statusFilter !== "all") {
            if (statusFilter === "approved") {
                matchesStatus = p.approve === 1 || p.approve === "1";
            } else if (statusFilter === "pending") {
                matchesStatus = p.approve === 0 || p.approve === "0";
            } else if (statusFilter === "rejected") {
                matchesStatus = p.approve === 2 || p.approve === "2";
            }
        }

        // Package Filter
        let matchesPackage = true;
        if (packageFilter !== "all") {
            matchesPackage = p.packag_type === packageFilter;
        }

        // Date Filter
        let matchesDate = true;
        if (p.cereate_at) {
            const itemDate = new Date(p.cereate_at);
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (itemDate < start) matchesDate = false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (itemDate > end) matchesDate = false;
            }
        } else if (startDate || endDate) {
            matchesDate = false;
        }

        return matchesSearch && matchesStatus && matchesPackage && matchesDate;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-full text-green-500">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Total Approved</p>
                            <p className="text-xl font-bold text-white">
                                {products.filter(p => p.approve === 1 || p.approve === "1").length}
                            </p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-500">
                            <Trash2 className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Total Pending</p>
                            <p className="text-xl font-bold text-white">
                                {products.filter(p => p.approve === 0 || p.approve === "0").length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Filter controls */}
            <div className="bg-[#0f0f1a] rounded-xl border border-teal-500/20 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-teal-500/10 pb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-400">
                        Filter Options
                    </h3>
                    {(statusFilter !== "all" || packageFilter !== "all" || startDate || endDate || searchTerm) && (
                        <button
                            onClick={() => {
                                setStatusFilter("all");
                                setPackageFilter("all");
                                setStartDate("");
                                setEndDate("");
                                setSearchTerm("");
                            }}
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
                                placeholder="Search user, ID, txn..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-sm text-white focus:border-teal-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Package Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Package Type</label>
                        <select
                            value={packageFilter}
                            onChange={(e) => setPackageFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-sm text-white focus:border-teal-500 focus:outline-none transition-all"
                        >
                            <option value="all">All Packages</option>
                            {[...new Set(products.map(p => p.packag_type).filter(Boolean))].map(pkg => (
                                <option key={pkg} value={pkg}>{pkg}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
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
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-2 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-xs text-white focus:border-teal-500 focus:outline-none transition-all"
                            />
                            <span className="text-gray-500 text-xs">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-2 py-2 bg-[#1a1a2e] border border-teal-500/20 rounded-lg text-xs text-white focus:border-teal-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

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
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">Loading history...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">No records found</td></tr>
                            ) : (
                                currentItems.map((item) => (
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
                                                const hasBV = item.business_volume && item.business_volume > 0;
                                                const totalAmount = hasBV ? item.business_volume : Number(item.amount);
                                                return (
                                                    <span className="text-teal-400 font-bold">₹{totalAmount.toLocaleString()}</span>
                                                );
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
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${(item.approve === 1 || item.approve === "1")
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
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && filteredProducts.length > 0 && (
                    <div className="px-6 py-4 bg-[#1a1a2e]/50 border-t border-teal-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-gray-400">
                            Showing <span className="text-white font-medium">{indexOfFirstItem + 1}</span> to <span className="text-white font-medium">{Math.min(indexOfLastItem, filteredProducts.length)}</span> of <span className="text-white font-medium">{filteredProducts.length}</span> results
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-[#0f0f1a] border border-gray-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/50 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(num => (num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1)))
                                .map((number, index, array) => (
                                    <div key={number} className="flex">
                                        {index > 0 && array[index - 1] !== number - 1 && <span className="px-2 text-gray-600">...</span>}
                                        <button
                                            onClick={() => paginate(number)}
                                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${currentPage === number
                                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                                : 'bg-[#0f0f1a] border border-gray-700 text-gray-400 hover:text-teal-400 hover:border-teal-500/50'
                                                }`}
                                        >
                                            {number}
                                        </button>
                                    </div>
                                ))}

                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg bg-[#0f0f1a] border border-gray-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/50 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


// 1 oct 2025 to 5 dec 2025 = rate 4rs
// 6 dec 2025 to 26 dec 2025 = rate 4.8rs
// 27 dec 2025 to 12 jan 2025 = rate 5.8rs
// 13 jan till now = rate 7rs

// iss rate ke hisab se hoga to usko phir se generate karo users ki level income ko