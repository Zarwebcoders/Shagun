"use client"
import { useState, useEffect } from "react"
import { ArrowLeft, DollarSign, TrendingUp, Calendar, User, ShoppingBag, Percent } from "lucide-react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { toast } from "react-hot-toast"
import { FaRupeeSign } from "react-icons/fa";

export default function ReferralIncome() {
    const navigate = useNavigate()
    const [incomes, setIncomes] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalIncome, setTotalIncome] = useState(0)

    useEffect(() => {
        fetchIncome()
    }, [])

    const fetchIncome = async () => {
        try {
            // Using the new detailed endpoint
            const { data } = await client.get('/referral-incomes/my-referrals')
            setIncomes(data)

            // Calculate total referral_amount
            const total = data.reduce((acc, curr) => acc + Number(curr.referral_amount || 0), 0)
            setTotalIncome(total)

            setLoading(false)
        } catch (error) {
            console.error("Error fetching referral income:", error)
            toast.error("Failed to load referral income")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">
            <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                </button>

                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent mb-2">
                            Referral Income
                        </h1>
                        <p className="text-gray-400">Detailed breakdown of earnings from your network</p>
                    </div>

                    <div className="bg-[#0f0f1a] border border-yellow-500/20 rounded-2xl p-6 flex items-center gap-4 shadow-lg shadow-yellow-500/5">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                            <FaRupeeSign className="text-yellow-400 text-xl" />                        </div>
                        <div>

                            <p className="text-sm text-gray-400 uppercase tracking-wider">Total Referral Earnings</p>
                            <p className="text-3xl font-bold text-white">{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0f0f1a] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/5 flex items-center gap-2">
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
                                    <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">Loading income history...</td></tr>
                                ) : incomes.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No referral income found yet.</td></tr>
                                ) : (
                                    incomes.map((item) => (
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
                                                        <span className="text-xs text-gray-400">{item.referred_user_official_id}</span>
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
                                                <span className="text-gray-400">${item.amount}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1 text-yellow-400">
                                                    <Percent className="w-3 h-3" />
                                                    {item.percentage}%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-green-400 font-bold font-mono text-lg">+<FaRupeeSign className="text-green-400 text-xl" />{item.referral_amount}</span>
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
        </div>
    )
}