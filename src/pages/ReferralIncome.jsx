"use client"
import { useState, useEffect, useMemo } from "react"
import { TrendingUp, Calendar, User, ShoppingBag, Percent } from "lucide-react"
import client from "../api/client"
import DateRangePicker from "../components/DateRangePicker.jsx"
import ExportButtons from "../components/ExportButtons.jsx"
import { toast } from "react-hot-toast"
import { FaRupeeSign } from "react-icons/fa";

export default function ReferralIncome() {
    const [incomes, setIncomes] = useState([])
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    useEffect(() => {
        const fetchIncome = async () => {
            try {
                const { data } = await client.get('/referral-incomes/my-referrals')
                setIncomes(data)
                setLoading(false)
            } catch (error) {
                console.error("Error fetching referral income:", error)
                toast.error("Failed to load referral income")
                setLoading(false)
            }
        }
        fetchIncome()
    }, [])

    // ── Client-side date filter ───────────────────────────────────────────────
    const filteredIncomes = useMemo(() => {
        return incomes.filter(item => {
            const d = new Date(item.create_at || item.created_at)
            if (startDate && d < new Date(startDate)) return false
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                if (d > end) return false
            }
            return true
        })
    }, [incomes, startDate, endDate])

    const totalIncome = filteredIncomes.reduce((acc, curr) => acc + Number(curr.referral_amount || 0), 0)

    const handleExport = (format) => {
        const params = new URLSearchParams({
            format,
            ...(startDate && { startDate }),
            ...(endDate && { endDate })
        })
        window.open(`/api/export/referral-income?${params.toString()}`, '_blank')
    }

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent mb-1">
                            Referral Income
                        </h1>
                        <p className="text-gray-400 text-sm md:text-base">Detailed breakdown of earnings from your network</p>
                    </div>
                    <ExportButtons onExport={handleExport} />
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0a12] border border-[#2a2a3a] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Filter by date</span>
                        {(startDate || endDate) && (
                            <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2 py-0.5">
                                {filteredIncomes.length} results
                            </span>
                        )}
                    </div>
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                    />
                </div>
            </div>

            {/* Total earnings card */}
            <div className="bg-[#0f0f1a] border border-yellow-500/20 rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-yellow-500/5">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shrink-0">
                    <FaRupeeSign className="text-yellow-400 text-xl" />
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        {(startDate || endDate) ? "Filtered Referral Earnings" : "Total Referral Earnings"}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-white">
                        {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0f0f1a] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-white/5 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-lg font-semibold">Income History</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">From User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Info</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Txn Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Percentage</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Referral Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-500">Loading income history...</td></tr>
                            ) : filteredIncomes.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center">
                                        <p className="text-gray-400">{(startDate || endDate) ? "No results for the selected date range." : "No referral income found yet."}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredIncomes.map((item) => (
                                    <tr key={item._id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                {new Date(item.create_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-indigo-400" />
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{item.referred_user_name}</span>
                                                    <span className="text-xs text-teal-400 font-mono">{item.referred_user_referral_id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300 text-sm flex items-center gap-1">
                                                    <ShoppingBag className="w-3 h-3 text-gray-500" />
                                                    Product ID: {item.product_id || '-'}
                                                </span>
                                                {item.product_transcation_id && (
                                                    <span className="text-[10px] text-gray-500 font-mono mt-1">
                                                        Ref: {item.product_transcation_id}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-300 flex items-center font-medium">
                                                <FaRupeeSign className="text-sm mr-0.5 text-gray-400" />
                                                {Number(item.amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-yellow-400">
                                                <Percent className="w-3 h-3" />
                                                {item.percentage}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-green-400 font-bold font-mono text-lg flex items-center">
                                                +<FaRupeeSign className="text-sm ml-0.5 mr-0.5 text-green-400" />
                                                {Number(item.referral_amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${item.status === 'credited'
                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                {item.status}
                                            </span>
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