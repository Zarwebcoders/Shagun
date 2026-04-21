"use client"
import { useState, useEffect } from "react"
import { Activity, RefreshCw, Search, ArrowUpRight, ArrowDownLeft, Clock, User, DollarSign } from "lucide-react"
import client from "../../api/client"
import { toast } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

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

export default function TransactionMonitor() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchTransactions = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const { data } = await client.get('/transactions');
            setTransactions(data);
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

        // Polling every 15 seconds
        const interval = setInterval(() => {
            fetchTransactions();
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    const filteredTransactions = transactions.filter(tx => 
        (tx.user?.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (tx.user?.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (tx.type?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <style jsx>{`
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
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Transaction Monitor
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-teal-500" />
                        Live tracking of platform transactions
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-72 bg-[#0f0f1a] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500/50 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => fetchTransactions(true)}
                        className={`p-2.5 bg-[#0f0f1a] border border-white/10 rounded-xl hover:bg-white/5 transition-all ${refreshing ? 'animate-spin text-teal-400' : 'text-gray-400'}`}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

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
                                            <p>No transactions found for current filter.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx, index) => (
                                        <motion.tr
                                            key={tx._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-white/[0.02] transition-colors group"
                                        >
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500/20 to-indigo-500/20 flex items-center justify-center border border-white/5 group-hover:border-teal-500/30 transition-all">
                                                        <User className="w-4 h-4 text-teal-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{tx.user?.full_name || 'Anonymous'}</p>
                                                        <p className="text-[11px] text-gray-400">{tx.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <TypeBadge type={tx.type} />
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
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-xs">
                                                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <button className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded hover:bg-white/10 transition-colors uppercase tracking-widest text-gray-400">
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
            </div>
        </div>
    )
}
