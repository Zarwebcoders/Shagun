"use client"
import { useState, useEffect } from "react"
import { ArrowLeft, ShoppingBag, CreditCard, Calendar, Activity } from "lucide-react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { toast } from "react-hot-toast"

export default function Shopping() {
    const navigate = useNavigate()
    const [tokens, setTokens] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalTokens, setTotalTokens] = useState(0)

    useEffect(() => {
        fetchTokens()
    }, [])

    const fetchTokens = async () => {
        try {
            const { data } = await client.get('/api/shopping-token/my-tokens')
            setTokens(data)

            // Calculate total
            const total = data.reduce((acc, curr) => acc + curr.amount, 0)
            setTotalTokens(total)

            setLoading(false)
        } catch (error) {
            console.error("Error fetching tokens:", error)
            toast.error("Failed to load shopping tokens")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                </button>

                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-600 bg-clip-text text-transparent mb-2">
                            Shopping Tokens
                        </h1>
                        <p className="text-gray-400">Manage your shopping wallet and history</p>
                    </div>

                    <div className="bg-[#0f0f1a] border border-pink-500/20 rounded-2xl p-6 flex items-center gap-4 shadow-lg shadow-pink-500/5">
                        <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                            <ShoppingBag className="w-6 h-6 text-pink-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 uppercase tracking-wider">Total Balance</p>
                            <p className="text-3xl font-bold text-white">{totalTokens.toLocaleString()} TKN</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0f0f1a] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/5 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-pink-500" />
                        <h2 className="text-lg font-semibold">Token History</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#1a1a2e]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Source</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">Loading token history...</td></tr>
                                ) : tokens.length === 0 ? (
                                    <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">No shopping tokens found.</td></tr>
                                ) : (
                                    tokens.map((item) => (
                                        <tr key={item._id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                                                <span className="capitalize">{item.source}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-pink-400 font-bold font-mono">+{item.amount}</span>
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
