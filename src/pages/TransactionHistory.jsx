"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    History, 
    ShoppingBag, 
    ArrowUpRight, 
    GitBranch, 
    UserPlus, 
    Cpu, 
    Search, 
    Calendar, 
    RefreshCw, 
    Download, 
    FileText, 
    X, 
    ChevronRight,
    TrendingUp,
    DollarSign,
    Percent
} from "lucide-react"
import client from "../api/client"
import InvoiceModal from "../components/common/InvoiceModal"
import { useWeb3 } from "../hooks/useWeb3"
import { ethers } from "ethers"

export default function TransactionHistory() {
    const { isConnected, account, contract, provider } = useWeb3()
    const getTodayString = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }
    const todayStr = getTodayString()

    // History Datasets
    const [transactions, setTransactions] = useState([])
    const [packages, setPackages] = useState([])
    const [withdrawals, setWithdrawals] = useState([])
    const [levelIncome, setLevelIncome] = useState([])
    const [referralIncome, setReferralIncome] = useState([])
    const [miningHistory, setMiningHistory] = useState([])
    const [currentUser, setCurrentUser] = useState(null)

    // Layout and UI States
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("transactions")
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

    // Filter Inputs (Binding state)
    const [searchTerm, setSearchTerm] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    // Applied Filters (State used for actual filtering, updated on Search button click)
    const [appliedSearch, setAppliedSearch] = useState("")
    const [appliedStartDate, setAppliedStartDate] = useState("")
    const [appliedEndDate, setAppliedEndDate] = useState("")

    // Fetch all histories on mount
    const fetchAllHistories = async () => {
        setLoading(true)
        try {
            const [
                txRes,
                pkgRes,
                withdrawRes,
                lvlRes,
                refRes,
                miningRes,
                userRes
            ] = await Promise.all([
                client.get('/transactions').catch(err => { console.error("Error fetching transactions:", err); return { data: [] }; }),
                client.get('/products', { params: { limit: 1000 } }).catch(err => { console.error("Error fetching products:", err); return { data: { products: [] } }; }),
                client.get('/withdrawals/me').catch(err => { console.error("Error fetching withdrawals:", err); return { data: [] }; }),
                client.get('/level-income').catch(err => { console.error("Error fetching level-income:", err); return { data: [] }; }),
                client.get('/referral-incomes/my-referrals').catch(err => { console.error("Error fetching referral-income:", err); return { data: [] }; }),
                client.get('/users/mining-history').catch(err => { console.error("Error fetching mining history:", err); return { data: [] }; }),
                client.get('/auth/me').catch(err => { console.error("Error fetching profile:", err); return { data: null }; })
            ])

            setTransactions(txRes.data || [])
            setPackages(pkgRes.data?.products || pkgRes.data || [])
            setWithdrawals(withdrawRes.data || [])
            setLevelIncome(lvlRes.data || [])
            setReferralIncome(refRes.data || [])
            setCurrentUser(userRes?.data || null)

            let finalMining = miningRes.data || []
            if (isConnected && contract && account) {
                try {
                    const filter = contract.filters.MiningClaimed(account)
                    let events = []
                    try {
                        events = await contract.queryFilter(filter, 0, 'latest')
                    } catch (error) {
                        if (error.message && error.message.includes("block range")) {
                            try {
                                const latestBlock = await provider.getBlockNumber()
                                const startBlock = Math.max(0, latestBlock - 9999)
                                events = await contract.queryFilter(filter, startBlock, 'latest')
                            } catch (innerError) {
                                console.error("Failed querying in limited range:", innerError)
                                throw error
                            }
                        } else {
                            throw error
                        }
                    }

                    const blockchainMiningHistory = await Promise.all(events.map(async (event) => {
                        const slotNumber = event.args ? (event.args.slotNumber !== undefined ? event.args.slotNumber : event.args[1]) : 0
                        const rewardAmount = event.args ? (event.args.rewardAmount !== undefined ? event.args.rewardAmount : event.args[2]) : 0

                        let timestamp = Date.now()
                        try {
                            const block = await event.getBlock()
                            if (block && block.timestamp) {
                                timestamp = block.timestamp * 1000
                            }
                        } catch (blockErr) {
                            console.error("Error fetching block for event:", blockErr)
                        }

                        return {
                            _id: event.transactionHash + "-" + slotNumber,
                            created_at: new Date(timestamp).toISOString(),
                            wallet_address: account,
                            amount: ethers.formatEther(rewardAmount),
                            cycle_number: Number(slotNumber),
                            hash: event.transactionHash,
                            fromBlockchain: true
                        }
                    }))

                    blockchainMiningHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    finalMining = blockchainMiningHistory
                } catch (blockchainErr) {
                    console.error("Error fetching blockchain mining history, falling back to db:", blockchainErr)
                }
            }
            setMiningHistory(finalMining)
        } catch (error) {
            console.error("Failed to load historical datasets:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAllHistories()
    }, [isConnected, account, contract, provider])

    // Trigger filtering parameters
    const handleSearchClick = () => {
        setAppliedSearch(searchTerm)
        setAppliedStartDate(startDate)
        setAppliedEndDate(endDate)
    }

    // Reset filtering parameters
    const handleResetClick = () => {
        setSearchTerm("")
        setStartDate("")
        setEndDate("")
        setAppliedSearch("")
        setAppliedStartDate("")
        setAppliedEndDate("")
    }

    // Date Range Matching Helper
    const matchesDate = (dateVal) => {
        if (!dateVal) return true
        const recordDate = new Date(dateVal)
        recordDate.setHours(0, 0, 0, 0)
        
        if (appliedStartDate) {
            const start = new Date(appliedStartDate)
            start.setHours(0, 0, 0, 0)
            if (recordDate < start) return false
        }
        
        if (appliedEndDate) {
            const end = new Date(appliedEndDate)
            end.setHours(23, 59, 59, 999)
            if (recordDate > end) return false
        }
        
        return true
    }

    // Filtered Datasets
    const getFilteredTransactions = () => {
        return transactions.filter(tx => {
            const dateMatch = matchesDate(tx.createdAt)
            const textMatch = !appliedSearch ? true : (
                (tx.type && tx.type.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (tx.description && tx.description.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (tx.status && tx.status.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (tx.hash && tx.hash.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (tx._id && tx._id.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (tx.amount && tx.amount.toString().includes(appliedSearch))
            )
            return dateMatch && textMatch
        })
    }

    const getFilteredPackages = () => {
        return packages.filter(pkg => {
            const dateMatch = matchesDate(pkg.cereate_at || pkg.createdAt)
            const textMatch = !appliedSearch ? true : (
                (pkg.packag_type && pkg.packag_type.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (pkg.transcation_id && pkg.transcation_id.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (pkg.wallet_address && pkg.wallet_address.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (pkg.amount && pkg.amount.toString().includes(appliedSearch)) ||
                (pkg.token_amount && pkg.token_amount.toString().includes(appliedSearch)) ||
                (pkg.quantity && pkg.quantity.toString().includes(appliedSearch))
            )
            return dateMatch && textMatch
        })
    }

    const getFilteredWithdrawals = () => {
        return withdrawals.filter(w => {
            const dateMatch = matchesDate(w.create_at || w.createdAt)
            const textMatch = !appliedSearch ? true : (
                (w.source && w.source.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (w.method && w.method.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (w.withdraw_type && w.withdraw_type.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (w.amount && w.amount.toString().includes(appliedSearch)) ||
                (w._id && w._id.toLowerCase().includes(appliedSearch.toLowerCase()))
            )
            return dateMatch && textMatch
        })
    }

    const getFilteredLevel = () => {
        return levelIncome.filter(lvl => {
            const dateMatch = matchesDate(lvl.approved_date || lvl.created_at || lvl.createdAt)
            const textMatch = !appliedSearch ? true : (
                (lvl.from_user_id?.name && lvl.from_user_id.name.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (lvl.from_user_id?.email && lvl.from_user_id.email.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (lvl.from_user_id?.referral_id && lvl.from_user_id.referral_id.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (lvl.level && lvl.level.toString() === appliedSearch) ||
                (lvl.amount && lvl.amount.toString().includes(appliedSearch))
            )
            return dateMatch && textMatch
        })
    }

    const getFilteredReferral = () => {
        return referralIncome.filter(ref => {
            const dateMatch = matchesDate(ref.create_at || ref.createdAt)
            const textMatch = !appliedSearch ? true : (
                (ref.referred_user_name && ref.referred_user_name.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (ref.referred_user_referral_id && ref.referred_user_referral_id.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (ref.product_id && ref.product_id.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (ref.product_transcation_id && ref.product_transcation_id.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (ref.amount && ref.amount.toString().includes(appliedSearch)) ||
                (ref.referral_amount && ref.referral_amount.toString().includes(appliedSearch))
            )
            return dateMatch && textMatch
        })
    }

    const getFilteredMining = () => {
        return miningHistory.filter(m => {
            const dateMatch = matchesDate(m.created_at || m.createdAt)
            const textMatch = !appliedSearch ? true : (
                (m.wallet_address && m.wallet_address.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                (m.amount && m.amount.toString().includes(appliedSearch)) ||
                (m.cycle_number && m.cycle_number.toString() === appliedSearch)
            )
            return dateMatch && textMatch
        })
    }

    // Stats calculations
    const stats = {
        transactionsCount: transactions.length,
        packagesTotal: packages.filter(p => p.approve === 1 || p.approve === "1").reduce((acc, curr) => acc + Number(curr.business_volume || curr.amount || 0), 0),
        withdrawalsTotal: withdrawals.filter(w => w.approve === 1 || w.approve === "1" || w.status === 'Completed').reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
        levelTotal: levelIncome.reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
        referralTotal: referralIncome.reduce((acc, curr) => acc + Number(curr.referral_amount || 0), 0),
        miningTotal: miningHistory.reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
    }

    // Navigation Tabs config
    const TABS = [
        { id: "transactions", label: "Transactions", icon: History, count: transactions.length },
        { id: "packages", label: "Packages", icon: ShoppingBag, count: packages.length },
        { id: "withdrawals", label: "Withdrawals", icon: ArrowUpRight, count: withdrawals.length },
        { id: "level", label: "Level Income", icon: GitBranch, count: levelIncome.length },
        { id: "referral", label: "Referral Income", icon: UserPlus, count: referralIncome.length },
        { id: "mining", label: "Mining History", icon: Cpu, count: miningHistory.length },
    ]

    return (
        <div className="w-full space-y-6 md:space-y-8 animate-fadeIn text-white font-sans max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-brand bg-clip-text text-transparent mb-2">
                        Financial Hub & History
                    </h2>
                    <p className="text-[#b0b0b0] text-sm md:text-base">
                        Consolidated ledger of your investments, withdrawals, network earnings, and mining operations.
                    </p>
                </div>
                <button
                    onClick={fetchAllHistories}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a2e] border border-teal-500/30 text-white rounded-xl hover:bg-teal-500/10 transition-all text-xs font-semibold cursor-pointer active:scale-95 self-start md:self-auto"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Sync Ledger
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Stats 1 */}
                <div className="bg-gradient-to-br from-[#040408] to-[#121222] p-4 rounded-2xl border border-white/5 shadow-xl hover:border-teal-500/30 transition-all group">
                    <p className="text-gray-400 text-xs uppercase font-medium tracking-wider group-hover:text-teal-400 transition-colors">Tx Count</p>
                    <p className="text-xl md:text-2xl font-black mt-2 text-white">{stats.transactionsCount}</p>
                    <span className="text-[10px] text-gray-500 block mt-1">Total Logs</span>
                </div>
                {/* Stats 2 */}
                <div className="bg-gradient-to-br from-[#040408] to-[#121222] p-4 rounded-2xl border border-white/5 shadow-xl hover:border-teal-500/30 transition-all group">
                    <p className="text-gray-400 text-xs uppercase font-medium tracking-wider group-hover:text-teal-400 transition-colors">Total Buy</p>
                    <p className="text-xl md:text-2xl font-black mt-2 text-teal-400">₹{stats.packagesTotal.toLocaleString('en-IN')}</p>
                    <span className="text-[10px] text-gray-500 block mt-1">Product Packages</span>
                </div>
                {/* Stats 3 */}
                <div className="bg-gradient-to-br from-[#040408] to-[#121222] p-4 rounded-2xl border border-white/5 shadow-xl hover:border-teal-500/30 transition-all group">
                    <p className="text-gray-400 text-xs uppercase font-medium tracking-wider group-hover:text-teal-400 transition-colors">Withdrawn</p>
                    <p className="text-xl md:text-2xl font-black mt-2 text-red-400">{stats.withdrawalsTotal.toLocaleString()} Tkn</p>
                    <span className="text-[10px] text-gray-500 block mt-1">Approved Withdraws</span>
                </div>
                {/* Stats 4 */}
                <div className="bg-gradient-to-br from-[#040408] to-[#121222] p-4 rounded-2xl border border-white/5 shadow-xl hover:border-teal-500/30 transition-all group">
                    <p className="text-gray-400 text-xs uppercase font-medium tracking-wider group-hover:text-teal-400 transition-colors">Level Pay</p>
                    <p className="text-xl md:text-2xl font-black mt-2 text-blue-400">{stats.levelTotal.toLocaleString()} SGN</p>
                    <span className="text-[10px] text-gray-500 block mt-1">Network Level Earnings</span>
                </div>
                {/* Stats 5 */}
                <div className="bg-gradient-to-br from-[#040408] to-[#121222] p-4 rounded-2xl border border-white/5 shadow-xl hover:border-teal-500/30 transition-all group">
                    <p className="text-gray-400 text-xs uppercase font-medium tracking-wider group-hover:text-teal-400 transition-colors">Referral Pay</p>
                    <p className="text-xl md:text-2xl font-black mt-2 text-purple-400">₹{stats.referralTotal.toLocaleString('en-IN')}</p>
                    <span className="text-[10px] text-gray-500 block mt-1">Direct Referrals</span>
                </div>
                {/* Stats 6 */}
                <div className="bg-gradient-to-br from-[#040408] to-[#121222] p-4 rounded-2xl border border-white/5 shadow-xl hover:border-teal-500/30 transition-all group">
                    <p className="text-gray-400 text-xs uppercase font-medium tracking-wider group-hover:text-teal-400 transition-colors">Mined SGN</p>
                    <p className="text-xl md:text-2xl font-black mt-2 text-yellow-400">+{stats.miningTotal.toFixed(3)}</p>
                    <span className="text-[10px] text-gray-500 block mt-1">Total Mining Rewards</span>
                </div>
            </div>

            {/* Filter and Advanced Search Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-[#0f0f1a] border border-teal-500/20 p-5 rounded-2xl shadow-2xl relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-xl pointer-events-none"></div>
                
                {/* Search Bar */}
                <div className="lg:col-span-2">
                    <label className="text-xs text-gray-400 font-bold mb-1.5 block tracking-wide uppercase">Search Keyword</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search hash, amount, referred users, description, product, status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[#05050d] border border-teal-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm transition-all"
                            id="global-search-input"
                        />
                        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                    </div>
                </div>

                {/* Date Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 font-bold mb-1.5 block tracking-wide uppercase">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-3 bg-[#05050d] border border-teal-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 scheme-dark transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold mb-1.5 block tracking-wide uppercase">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-3 bg-[#05050d] border border-teal-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 scheme-dark transition-all"
                        />
                    </div>
                </div>

                {/* Search Actions */}
                <div className="flex gap-3 items-end">
                    <button
                        onClick={handleSearchClick}
                        className="flex-1 py-3 bg-gradient-brand text-white font-bold rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                        id="global-search-btn"
                    >
                        <Search className="w-4 h-4" />
                        Search
                    </button>
                    <button
                        onClick={handleResetClick}
                        className="py-3 px-4 bg-[#1a1a2e] border border-teal-500/20 text-gray-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 active:scale-[0.98] transition-all text-sm flex items-center justify-center cursor-pointer"
                        title="Reset Filters"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Navigation Tabs (Scrollable on Mobile) */}
            <div className="flex gap-2 border-b border-white/5 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
                {TABS.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 whitespace-nowrap transition-all duration-300 cursor-pointer ${
                                isActive
                                    ? "bg-gradient-brand text-white shadow-xl shadow-teal-500/10"
                                    : "bg-[#0c0c14] text-gray-400 hover:bg-[#1a1a2e] hover:text-white border border-white/5"
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-teal-500/70'}`} />
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-teal-500/10 text-teal-400'}`}>
                                {tab.count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Main Content Area */}
            <div className="bg-[#0f0f1a]/80 backdrop-blur-xl border border-teal-500/10 rounded-2xl overflow-hidden shadow-2xl min-h-[300px]">
                {loading ? (
                    <div className="w-full py-24 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm font-medium">Retrieving database histories...</p>
                    </div>
                ) : (
                    <div className="w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                                className="p-4 md:p-6"
                            >
                                {/* ── TAB 1: TRANSACTIONS ── */}
                                {activeTab === "transactions" && (() => {
                                    const data = getFilteredTransactions()
                                    return (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <History className="w-5 h-5 text-teal-400" />
                                                    Ledger Logs
                                                </h3>
                                                <span className="text-xs text-gray-400 font-medium">Showing {data.length} transactions</span>
                                            </div>

                                            <div className="overflow-x-auto rounded-xl border border-white/5">
                                                <table className="w-full text-left">
                                                    <thead className="bg-[#05050f]">
                                                        <tr>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hash / ID</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 bg-[#0a0a14]">
                                                        {data.length > 0 ? (
                                                            data.map((tx) => (
                                                                <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                                                                    <td className="p-4 whitespace-nowrap">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${
                                                                                tx.type === 'deposit' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                                                tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                                                tx.type === 'referral' || tx.type === 'referral_income' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                                                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                                            }`}>
                                                                                {tx.type?.replace('_', ' ')}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 text-sm text-gray-300 max-w-[280px] truncate" title={tx.description}>{tx.description}</td>
                                                                    <td className="p-4 whitespace-nowrap font-bold">
                                                                        <span className={
                                                                            tx.type === 'deposit' || tx.type === 'bonus' || tx.type === 'referral' || tx.type === 'referral_income' || tx.type === 'level_income'
                                                                                ? 'text-green-400'
                                                                                : 'text-red-400'
                                                                        }>
                                                                            {tx.type === 'deposit' || tx.type === 'bonus' || tx.type === 'referral' || tx.type === 'referral_income' || tx.type === 'level_income' ? '+' : '-'}${tx.amount}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm text-gray-400">
                                                                        {new Date(tx.createdAt).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap">
                                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                                            tx.status === 'completed' ? 'bg-green-500/15 text-green-400' :
                                                                            tx.status === 'pending' || tx.status === 'pending_approval' ? 'bg-yellow-500/15 text-yellow-400' :
                                                                            'bg-red-500/15 text-red-400'
                                                                        }`}>
                                                                            {tx.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap font-mono text-xs text-gray-500 max-w-[120px] truncate" title={tx.hash || tx._id}>
                                                                        {tx.hash || tx._id}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="6" className="p-12 text-center text-gray-500 italic">No transactions match your search filter criteria.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                })()}

                                {/* ── TAB 2: PACKAGES ── */}
                                {activeTab === "packages" && (() => {
                                    const data = getFilteredPackages()
                                    return (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <ShoppingBag className="w-5 h-5 text-teal-400" />
                                                    Strategic Purchases
                                                </h3>
                                                <span className="text-xs text-gray-400 font-medium">Showing {data.length} packages</span>
                                            </div>

                                            <div className="overflow-x-auto rounded-xl border border-white/5">
                                                <table className="w-full text-left">
                                                    <thead className="bg-[#05050f]">
                                                        <tr>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Qty</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Price/Unit</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Buy</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tokens</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Txn ID</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 bg-[#0a0a14]">
                                                        {data.length > 0 ? (
                                                            data.map((item) => {
                                                                const qty = item.quantity && Number(item.quantity) > 0 ? Number(item.quantity) : 1
                                                                const hasBV = item.business_volume && item.business_volume > 0
                                                                const totalAmount = hasBV ? item.business_volume : Number(item.amount || 0)
                                                                const unitPrice = Math.round(totalAmount / qty)
                                                                
                                                                return (
                                                                    <tr key={item._id} className="hover:bg-white/5 transition-colors">
                                                                        <td className="p-4 whitespace-nowrap text-sm text-gray-300">
                                                                            {new Date(item.cereate_at).toLocaleDateString()}
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap text-sm text-white font-semibold">
                                                                            {item.packag_type || "Standard"}
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap text-center text-sm text-gray-300">
                                                                            {qty}
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap text-sm text-gray-300 font-bold">
                                                                            ₹{unitPrice.toLocaleString('en-IN')}
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap text-sm text-teal-400 font-bold">
                                                                            ₹{totalAmount.toLocaleString('en-IN')}
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap text-sm text-gray-400">
                                                                            {item.token_amount ? Number(item.token_amount).toFixed(2) : "0.00"}
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap font-mono text-xs text-gray-400" title={item.transcation_id}>
                                                                            {item.transcation_id ? `${item.transcation_id.substring(0, 10)}...` : '-'}
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap">
                                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                                                (item.approve === 1 || item.approve === "1") ? 'bg-green-500/15 text-green-400' :
                                                                                (item.approve === 2 || item.approve === "2") ? 'bg-red-500/15 text-red-400' :
                                                                                'bg-yellow-500/15 text-yellow-400'
                                                                            }`}>
                                                                                {(item.approve === 1 || item.approve === "1") ? 'APPROVED' : (item.approve === 2 || item.approve === "2") ? 'REJECTED' : 'PENDING'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap text-right">
                                                                            <button 
                                                                                onClick={() => {
                                                                                    setSelectedInvoice({
                                                                                        ...item,
                                                                                        displayAmount: unitPrice,
                                                                                        displayTotal: totalAmount
                                                                                    })
                                                                                    setIsInvoiceModalOpen(true)
                                                                                }}
                                                                                className="text-teal-400 hover:text-white hover:underline text-xs font-semibold flex items-center justify-end gap-1 w-full transition-colors cursor-pointer"
                                                                            >
                                                                                <FileText className="w-3.5 h-3.5" />
                                                                                Invoice
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="9" className="p-12 text-center text-gray-500 italic">No packages found matching your criteria.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                })()}

                                {/* ── TAB 3: WITHDRAWALS ── */}
                                {activeTab === "withdrawals" && (() => {
                                    const data = getFilteredWithdrawals()
                                    return (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <ArrowUpRight className="w-5 h-5 text-teal-400" />
                                                    Withdrawal Ledger
                                                </h3>
                                                <span className="text-xs text-gray-400 font-medium">Showing {data.length} requests</span>
                                            </div>

                                            <div className="overflow-x-auto rounded-xl border border-white/5">
                                                <table className="w-full text-left">
                                                    <thead className="bg-[#05050f]">
                                                        <tr>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Source</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 bg-[#0a0a14]">
                                                        {data.length > 0 ? (
                                                            data.map((item) => {
                                                                const statusStr = (item.approve === 1 || item.approve === "1") ? 'Completed' : (item.approve === 0 || item.approve === "0") ? 'Rejected' : 'Pending'
                                                                const sourceStr = item.source || (item.withdraw_type === 'level_income' ? "Level Income" : "Wallet Balance")
                                                                
                                                                return (
                                                                    <tr key={item._id} className="hover:bg-white/5 transition-colors">
                                                                        <td className="p-4 whitespace-nowrap">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`w-2.5 h-2.5 rounded-full ${
                                                                                    sourceStr === "Level Income" ? "bg-teal-400" :
                                                                                    sourceStr === "Mining Bonus" ? "bg-purple-400" : "bg-orange-400"
                                                                                }`}></div>
                                                                                <span className="text-white font-medium text-sm">{sourceStr}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap">
                                                                            <span className="text-sm font-black text-white">Level Token {item.amount}</span>
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap text-[#b0b0b0] text-sm">
                                                                            {new Date(item.create_at).toLocaleDateString()}
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap">
                                                                            <span className="text-white text-sm">{item.method || "Bank Transfer"}</span>
                                                                        </td>
                                                                        <td className="p-4 whitespace-nowrap">
                                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                                                statusStr === "Completed"
                                                                                    ? "bg-green-500/15 text-green-400"
                                                                                    : statusStr === "Pending"
                                                                                        ? "bg-yellow-500/15 text-yellow-400"
                                                                                        : "bg-red-500/15 text-red-400"
                                                                            }`}>
                                                                                {statusStr}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="p-12 text-center text-gray-500 italic">No withdrawals found matching your filters.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                })()}

                                {/* ── TAB 4: LEVEL INCOME ── */}
                                {activeTab === "level" && (() => {
                                    const data = getFilteredLevel()
                                    return (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <GitBranch className="w-5 h-5 text-teal-400" />
                                                    Network Levels Earnings
                                                </h3>
                                                <span className="text-xs text-gray-400 font-medium">Showing {data.length} records</span>
                                            </div>

                                            <div className="overflow-x-auto rounded-xl border border-white/5">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-[#05050f]">
                                                        <tr className="text-left">
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Level</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">From User</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Referral ID</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Income</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Released</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-[#0a0a14] divide-y divide-white/5">
                                                        {data.length > 0 ? (
                                                            data.map((item, idx) => (
                                                                <tr key={item._id || idx} className="hover:bg-white/5 transition-colors">
                                                                    <td className="p-4 whitespace-nowrap">
                                                                        <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-md font-bold text-xs">
                                                                            Level {item.level}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm font-semibold text-white">
                                                                        {item.from_user_id?.name || "Unknown User"}
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm text-teal-400 font-mono">
                                                                        {item.from_user_id?.referral_id || "N/A"}
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm text-gray-400">
                                                                        {item.from_user_id?.email || "N/A"}
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm font-bold text-white">
                                                                        {item.pending ? (
                                                                            <span className="text-yellow-500 text-xs font-semibold">Pending Approval</span>
                                                                        ) : item.no_purchase ? (
                                                                            <span className="text-orange-400 text-xs font-semibold">No Purchase Yet</span>
                                                                        ) : (
                                                                            <span>SGN {Number(item.amount).toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm font-bold text-teal-400">
                                                                        {!item.no_purchase && (
                                                                            <span>SGN {Number(item.releasedAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm text-gray-400">
                                                                        {new Date(item.approved_date || item.created_at || item.createdAt).toLocaleDateString()}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="7" className="p-12 text-center text-gray-500 italic">No level incomes matched your search.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                })()}

                                {/* ── TAB 5: REFERRAL INCOME ── */}
                                {activeTab === "referral" && (() => {
                                    const data = getFilteredReferral()
                                    return (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <UserPlus className="w-5 h-5 text-teal-400" />
                                                    Direct Network Earnings
                                                </h3>
                                                <span className="text-xs text-gray-400 font-medium">Showing {data.length} records</span>
                                            </div>

                                            <div className="overflow-x-auto rounded-xl border border-white/5">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-[#05050f]">
                                                        <tr>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">From User</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Info</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Txn Amount</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Percentage</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Referral Reward</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-[#0a0a14] divide-y divide-white/5">
                                                        {data.length > 0 ? (
                                                            data.map((item) => (
                                                                <tr key={item._id} className="hover:bg-white/5 transition-colors">
                                                                    <td className="p-4 whitespace-nowrap text-sm text-gray-300">
                                                                        {new Date(item.create_at || item.createdAt).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-white font-bold text-sm">{item.referred_user_name}</span>
                                                                            <span className="text-[10px] text-teal-400 font-mono">{item.referred_user_referral_id}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm text-gray-400">
                                                                        {item.product_id ? `Product ID: ${item.product_id}` : '-'}
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm text-gray-300 font-bold">
                                                                        ₹{Number(item.amount).toLocaleString('en-IN')}
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm text-yellow-400 font-bold">
                                                                        {item.percentage}%
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm text-green-400 font-black">
                                                                        +₹{Number(item.referral_amount).toLocaleString('en-IN')}
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap">
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                                            item.status === 'credited'
                                                                                ? 'bg-green-500/15 text-green-400'
                                                                                : 'bg-yellow-500/15 text-yellow-400'
                                                                        }`}>
                                                                            {item.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="7" className="p-12 text-center text-gray-500 italic">No referral incomes match your criteria.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                })()}

                                {/* ── TAB 6: MINING HISTORY ── */}
                                {activeTab === "mining" && (() => {
                                    const data = getFilteredMining()
                                    return (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <Cpu className="w-5 h-5 text-teal-400" />
                                                    Mining Sessions Log
                                                </h3>
                                                <span className="text-xs text-gray-400 font-medium">Showing {data.length} sessions</span>
                                            </div>

                                            <div className="overflow-x-auto rounded-xl border border-white/5">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-[#05050f]">
                                                        <tr>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Wallet Address</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">SGN Reward</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cycle Status</th>
                                                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-[#0a0a14] divide-y divide-white/5">
                                                        {data.length > 0 ? (
                                                            data.map((record, index) => (
                                                                <tr key={record._id || index} className="hover:bg-white/5 transition-colors">
                                                                    <td className="p-4 whitespace-nowrap">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-white font-semibold text-sm">
                                                                                {new Date(record.created_at || record.createdAt).toLocaleDateString()}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-500">
                                                                                {new Date(record.created_at || record.createdAt).toLocaleTimeString()}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap font-mono text-xs text-purple-400">
                                                                        {record.wallet_address && record.wallet_address !== 'N/A' && record.wallet_address.length > 16 ? 
                                                                            `${record.wallet_address.substring(0, 8)}...${record.wallet_address.substring(record.wallet_address.length - 8)}` 
                                                                            : <span className="text-yellow-500/80 font-sans italic">Not Connected</span>
                                                                        }
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-sm text-teal-400 font-bold">
                                                                        +{Number(record.amount || 0).toFixed(4)} SGN
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-20 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                                                <div 
                                                                                    className="bg-gradient-brand h-full rounded-full" 
                                                                                    style={{ width: `${((record.cycle_number || 0) / 24) * 100}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-xs text-gray-400">
                                                                                {record.cycle_number || '0'}/24
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 whitespace-nowrap text-right">
                                                                        {record.hash ? (
                                                                            <a
                                                                                href={`https://polygonscan.com/tx/${record.hash}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 text-[10px] font-bold border border-green-500/20 inline-flex items-center gap-1 transition-all"
                                                                                title="View on Polygonscan"
                                                                            >
                                                                                SUCCESS
                                                                                <ChevronRight className="w-3 h-3" />
                                                                            </a>
                                                                        ) : (
                                                                            <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20">
                                                                                SUCCESS
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="p-12 text-center text-gray-500 italic">No mining records matched your criteria.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Print/Download Invoice Modal */}
            <InvoiceModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                invoiceData={selectedInvoice}
                userData={currentUser}
            />
        </div>
    )
}