"use client"
import { useState, useEffect } from "react"
import { TrendingUp, Clock } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../api/client"

export default function TokenRateHistory() {
    const [rates, setRates] = useState([])
    const [loading, setLoading] = useState(true)

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }).replace(',', '');
        } catch (e) {
            return dateStr;
        }
    };

    const formatPhase = (item) => {
        if (item.phase === undefined || item.phase === null) return '-';
        if (typeof item.phase === 'number' || !isNaN(item.phase)) {
            return (item.phase_number && Number(item.phase_number) !== Number(item.phase)) ? `Phase ${item.phase}.${item.phase_number}` : `Phase ${item.phase}`;
        }
        return item.phase;
    };

    useEffect(() => {
        fetchRates()
    }, [])

    const fetchRates = async () => {
        try {
            const { data } = await client.get('/token-rate/all');
            setRates(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching rates:", error);
            toast.error("Failed to load rates");
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8 animate-fadeIn text-white max-w-[1200px] mx-auto min-h-screen pb-20">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .glass-panel {
                    background: rgba(15, 15, 26, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(20, 184, 166, 0.2);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                }
            `}</style>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl md:text-5xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                        Token Rate History
                    </h2>
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-teal-400" />
                        Historical tracking of token rates and phases
                    </p>
                </div>
            </div>

            {/* Rate History Table */}
            <div className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-3xl border border-teal-500/20 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#131322] border-b border-teal-500/20 text-xs uppercase text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Phase</th>
                                <th className="px-6 py-4">Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-500/10">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                                            <span>Loading rates...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : rates.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                                        No rate history found
                                    </td>
                                </tr>
                            ) : (
                                rates.map((item) => (
                                    <tr key={item._id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-teal-500/50" />
                                            {formatDate(item.created_at || item.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-white font-medium">
                                                {formatPhase(item)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-teal-400 font-bold font-mono">₹{item.rate}</span>
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
