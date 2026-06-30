"use client"
import { useState, useEffect } from "react"
import { 
    Activity, 
    RefreshCw, 
    Search, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Clock, 
    User, 
    DollarSign,
    Calendar,
    Filter,
    TrendingUp,
    UserCheck,
    X,
    Hash,
    Building
} from "lucide-react"
import client from "../../api/client"
import { toast } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import Pagination from "../../components/common/Pagination"

const TypeBadge = ({ type }) => {
    const styles = {
        deposit: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        withdrawal: "bg-red-500/10 text-red-400 border-red-500/20",
        referral: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        referral_income: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        level_income: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        payout: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        investment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        purchase: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        mining_bonus: "bg-teal-500/10 text-teal-400 border-teal-500/20"
    }

    const icons = {
        deposit: <ArrowDownLeft className="w-3 h-3" />,
        withdrawal: <ArrowUpRight className="w-3 h-3" />,
        referral: <Activity className="w-3 h-3" />,
        referral_income: <Activity className="w-3 h-3" />,
        level_income: <Activity className="w-3 h-3" />,
        payout: <ArrowUpRight className="w-3 h-3" />,
        investment: <ArrowDownLeft className="w-3 h-3" />,
        purchase: <ArrowDownLeft className="w-3 h-3" />,
        mining_bonus: <Activity className="w-3 h-3" />
    }

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[type] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
            {icons[type] || <Activity className="w-3 h-3" />}
            {type?.replace('_', ' ')?.toUpperCase()}
        </span>
    )
}

const StatusBadge = ({ status }) => {
    const styles = {
        completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        failed: "bg-red-500/10 text-red-400 border-red-500/20",
        rejected: "bg-red-500/10 text-red-400 border-red-500/20"
    }

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${styles[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
            {status?.toUpperCase()}
        </span>
    )
}

export default function TransactionMonitor({ defaultType = "all" }) {
    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const todayStr = getTodayString();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState(defaultType);
    const [idFilter, setIdFilter] = useState("");
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [activeTx, setActiveTx] = useState(null);
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, selectedType, idFilter, startDate, endDate]);

    const fetchTransactions = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else setLoading(true);
        try {
            const params = {
                page,
                limit: itemsPerPage,
                type: selectedType,
                search: searchTerm,
                startDate,
                endDate,
            };
            const { data } = await client.get('/transactions', { params });
            setTransactions(data.transactions || data);
            setPages(data.pages || 1);
            setTotal(data.total || 0);
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            if (isManual) toast.error("Failed to refresh transactions");
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, selectedType, startDate, endDate]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => { fetchTransactions(); }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const clearAllFilters = () => {
        setSearchTerm("");
        setSelectedType(defaultType);
        setIdFilter("");
        setStartDate(todayStr);
        setEndDate(todayStr);
    };

    // All filtering is now done server-side — transactions contains only the current page
    const filteredTransactions = transactions;

    // Compute stats dynamically from current page transactions
    const totalFilteredAmount = filteredTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    
    // Referral income stats
    const referralTransactions = filteredTransactions.filter(tx => tx.type === 'referral_income' || tx.type === 'referral');
    const totalReferralIncome = referralTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);

    // Level income stats
    const levelTransactions = filteredTransactions.filter(tx => tx.type === 'level_income');
    const totalLevelIncome = levelTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);

    const isReferralOnly = defaultType === "referral_income";

    // Pagination now driven by server — `pages` and `total` come from API response
    const paginatedTransactions = filteredTransactions; // already paginated by backend

    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .glass-card {
                    background: rgba(26, 26, 46, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
            `}</style>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {isReferralOnly ? "Referral Earnings" : "Transaction Monitor"}
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-teal-500" />
                        {isReferralOnly ? "Track and audit all user referral rewards and bonuses" : "Live tracking & referral income reports"}
                    </p>
                </div>
            </div>

            {/* Dynamic Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group ${isReferralOnly ? "md:col-span-2" : ""}`}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-16 h-16 text-teal-400" />
                    </div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{isReferralOnly ? "Total Referral Volume" : "Filtered Volume"}</p>
                    <h3 className="text-2xl font-bold mt-2 font-mono text-teal-400">₹{totalFilteredAmount.toLocaleString()}</h3>
                    <p className="text-[11px] text-gray-500 mt-1">{filteredTransactions.length} transaction(s)</p>
                </div>

                <div className={`glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group ${isReferralOnly ? "md:col-span-2" : ""}`}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-16 h-16 text-indigo-400" />
                    </div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Referral Income</p>
                    <h3 className="text-2xl font-bold mt-2 font-mono text-indigo-400">₹{totalReferralIncome.toLocaleString()}</h3>
                    <p className="text-[11px] text-gray-500 mt-1">{referralTransactions.length} reward(s)</p>
                </div>

                {!isReferralOnly && (
                    <>
                        <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Activity className="w-16 h-16 text-purple-400" />
                            </div>
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Level Income</p>
                            <h3 className="text-2xl font-bold mt-2 font-mono text-purple-400">₹{totalLevelIncome.toLocaleString()}</h3>
                            <p className="text-[11px] text-gray-500 mt-1">{levelTransactions.length} level payouts</p>
                        </div>

                        <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group text-left">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <UserCheck className="w-16 h-16 text-emerald-400" />
                            </div>
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Active Filters</p>

                    <div className="flex flex-wrap gap-1 mt-2">
                        {selectedType !== 'all' && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">
                                Type: {selectedType}
                            </span>
                        )}
                        {idFilter && (
                            <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
                                ID: {idFilter}
                            </span>
                        )}
                        {(startDate !== todayStr || endDate !== todayStr) && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                                Date Filtered
                            </span>
                        )}
                        {startDate === todayStr && endDate === todayStr && (
                            <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 rounded font-mono">
                                Today
                            </span>
                        )}
                        {!idFilter && selectedType === 'all' && startDate === todayStr && endDate === todayStr && (
                            <span className="text-[10px] bg-gray-500/20 text-gray-400 border border-gray-500/30 px-1.5 py-0.5 rounded font-mono">
                                None
                            </span>
                        )}
                    </div>
                    {(selectedType !== 'all' || idFilter || startDate !== todayStr || endDate !== todayStr) && (
                        <button
                            onClick={clearAllFilters}
                            className="text-[10px] text-red-400 hover:text-red-300 underline mt-2 block transition-all"
                        >
                            Reset all filters
                        </button>
                    )}
                </div>
                    </>
                )}
            </div>

            {/* Filter Section */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Quick Type Selection Tabs */}
                    {!isReferralOnly && (
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {[
                                { value: 'all', label: 'All Transactions' },
                                { value: 'referral_income', label: 'Referral Income' },
                                { value: 'level_income', label: 'Level Income' },
                                { value: 'deposit', label: 'Deposits' },
                                { value: 'withdrawal', label: 'Withdrawals' },
                            ].map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setSelectedType(tab.value)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        selectedType === tab.value
                                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/30 shadow-lg shadow-teal-500/5'
                                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                showAdvancedFilters || idFilter || startDate || endDate
                                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                                    : 'bg-[#0f0f1a] text-gray-400 border-white/10 hover:bg-white/5'
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
                            {(idFilter || startDate || endDate) && (
                                <span className="w-2 h-2 rounded-full bg-teal-400 inline-block animate-pulse"></span>
                            )}
                        </button>

                        <button
                            onClick={() => fetchTransactions(true)}
                            className={`p-2.5 bg-[#0f0f1a] border border-white/10 rounded-xl hover:bg-white/5 transition-all ${
                                refreshing ? 'animate-spin text-teal-400' : 'text-gray-400'
                            }`}
                            title="Refresh transactions"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Advanced Filter Panel */}
                <AnimatePresence>
                    {(showAdvancedFilters || idFilter || startDate || endDate) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border-t border-white/5 pt-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Search input */}
                                <div className="relative">
                                    <label className="text-[11px] text-gray-400 font-semibold mb-1.5 block">Search Name/Email</label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Name, email, details..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-[#0f0f1a] border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-teal-500/50 transition-all"
                                        />
                                        {searchTerm && (
                                            <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* ID-wise input */}
                                <div>
                                    <label className="text-[11px] text-gray-400 font-semibold mb-1.5 block">Filter by User ID / Referral ID</label>
                                    <div className="relative">
                                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="UID-1234 or REF-5678"
                                            value={idFilter}
                                            onChange={(e) => setIdFilter(e.target.value)}
                                            className="w-full bg-[#0f0f1a] border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-teal-500/50 transition-all font-mono"
                                        />
                                        {idFilter && (
                                            <button onClick={() => setIdFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div>
                                    <label className="text-[11px] text-gray-400 font-semibold mb-1.5 block">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-[#0f0f1a] border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-teal-500/50 transition-all scheme-dark"
                                        />
                                        {startDate && (
                                            <button onClick={() => setStartDate("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* End Date */}
                                <div>
                                    <label className="text-[11px] text-gray-400 font-semibold mb-1.5 block">End Date</label>
                                    <div className="relative">
                                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-[#0f0f1a] border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-teal-500/50 transition-all scheme-dark"
                                        />
                                        {endDate && (
                                            <button onClick={() => setEndDate("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Table Card */}
            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Time</th>
                                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence>
                                {loading && transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-20 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-4">
                                                <RefreshCw className="w-10 h-10 animate-spin text-teal-500/30" />
                                                <p className="animate-pulse">Analyzing blockchain records...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-20 text-center text-gray-500">
                                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                            <p>No transactions found matching current filters.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTransactions.map((tx, index) => (
                                        <motion.tr
                                            key={tx._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="hover:bg-white/[0.02] transition-colors group"
                                        >
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500/20 to-indigo-500/20 flex items-center justify-center border border-white/5 group-hover:border-teal-500/30 transition-all flex-shrink-0">
                                                        <User className="w-4 h-4 text-teal-400" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-semibold text-white">{tx.user?.full_name || 'Anonymous'}</p>
                                                            {tx.user?.user_id && (
                                                                <span className="text-[9px] bg-teal-500/10 text-teal-400 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider border border-teal-500/20">
                                                                    {tx.user.user_id}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-400">{tx.user?.email}</p>
                                                        {tx.user?.referral_id && (
                                                            <p className="text-[10px] text-indigo-400 font-mono mt-0.5">
                                                                Ref ID: {tx.user.referral_id}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <TypeBadge type={tx.type} />
                                                {tx.relatedUser && (
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        From: <span className="text-indigo-300 font-medium">{tx.relatedUser.full_name}</span>
                                                        {tx.relatedUser.user_id && (
                                                            <span className="font-mono text-[9px] bg-indigo-500/15 text-indigo-400 px-1 py-0.5 ml-1 rounded">
                                                                {tx.relatedUser.user_id}
                                                            </span>
                                                        )}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-1.5 font-mono">
                                                    <span className="text-gray-400 text-xs">₹</span>
                                                    <span className="text-sm font-bold text-white">{tx.amount?.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <StatusBadge status={tx.status} />
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="text-xs">
                                                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <button 
                                                    onClick={() => setActiveTx(tx)}
                                                    className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded hover:bg-white/10 transition-all uppercase tracking-widest text-gray-400 hover:text-white"
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {pages > 1 && (
                    <div className="border-t border-white/5 p-4 flex justify-end">
                        <Pagination
                            currentPage={page}
                            totalPages={pages}
                            onPageChange={setPage}
                            totalResults={total}
                            itemsPerPage={itemsPerPage}
                            itemName="transactions"
                        />
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {activeTx && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-[#0b0b14] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 relative shadow-2xl"
                        >
                            {/* Close button */}
                            <button 
                                onClick={() => setActiveTx(null)}
                                className="absolute top-6 right-6 p-1.5 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div>
                                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    Transaction Details
                                </h3>
                                <p className="text-gray-400 text-xs mt-1 font-mono">{activeTx._id}</p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-left">
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">User Info</span>
                                        <p className="text-sm font-bold mt-0.5 text-white">{activeTx.user?.full_name || 'Anonymous'}</p>
                                        <p className="text-xs text-gray-400">{activeTx.user?.email}</p>
                                        {activeTx.user?.user_id && (
                                            <div className="mt-1 flex gap-2 flex-wrap">
                                                <span className="text-[9px] bg-teal-500/10 text-teal-400 px-1.5 py-0.5 rounded font-mono font-bold border border-teal-500/20">
                                                    UID: {activeTx.user.user_id}
                                                </span>
                                                {activeTx.user?.referral_id && (
                                                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold border border-indigo-500/20">
                                                        REF: {activeTx.user.referral_id}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Transaction Info</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <TypeBadge type={activeTx.type} />
                                            <StatusBadge status={activeTx.status} />
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Amount</span>
                                        <p className="text-lg font-extrabold text-white mt-0.5 font-mono">
                                            ₹{activeTx.amount?.toLocaleString()} <span className="text-xs font-semibold text-gray-400">{activeTx.currency}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Date & Time</span>
                                        <p className="text-xs text-white font-medium mt-0.5">
                                            {new Date(activeTx.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    {activeTx.relatedUser && (
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Related User (Referral source)</span>
                                            <p className="text-sm font-bold text-indigo-300 mt-0.5">{activeTx.relatedUser.full_name}</p>
                                            {activeTx.relatedUser.user_id && (
                                                <p className="text-xs text-gray-400 font-mono mt-0.5">UID: {activeTx.relatedUser.user_id}</p>
                                            )}
                                        </div>
                                    )}

                                    {activeTx.crypto && activeTx.crypto !== 'None' && (
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Crypto & Hash</span>
                                            <p className="text-xs text-white font-semibold mt-0.5 flex items-center gap-1.5">
                                                <DollarSign className="w-3.5 h-3.5 text-teal-400" /> {activeTx.crypto}
                                            </p>
                                            {activeTx.hash && (
                                                <p className="text-[10px] text-teal-400 font-mono break-all mt-1 bg-teal-500/5 p-2 rounded border border-teal-500/10 flex items-start gap-1.5">
                                                    <Hash className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                                                    <span>{activeTx.hash}</span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {activeTx.description && (
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Description</span>
                                            <p className="text-xs text-gray-300 mt-0.5 italic">{activeTx.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bank Details from KYC if available */}
                            {activeTx.bankDetails && (
                                <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-3 text-left">
                                    <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-wider">
                                        <Building className="w-4 h-4 text-teal-400" />
                                        <span>User Bank Details (KYC info)</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
                                        <div>
                                            <span className="text-[10px] text-gray-500 block">Bank Name</span>
                                            <span className="text-white font-bold">{activeTx.bankDetails.bank_name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 block">Account Holder</span>
                                            <span className="text-white font-bold">{activeTx.bankDetails.acc_name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 block">Account Number</span>
                                            <span className="text-white font-bold">{activeTx.bankDetails.acc_num || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 block">IFSC Code</span>
                                            <span className="text-white font-bold">{activeTx.bankDetails.ifsc_code || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 block">Branch</span>
                                            <span className="text-white font-bold">{activeTx.bankDetails.branch || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Close Action Button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setActiveTx(null)}
                                    className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
