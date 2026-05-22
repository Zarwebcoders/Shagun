"use client"
import { useState, useEffect } from "react"
import { TrendingUp, Save, Clock } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../../api/client"

export default function TokenRateManagement() {
    const [rates, setRates] = useState([])
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        phase: "",
        rate: "",
        phase_number: "",
        source: "Admin Manual"
    })

    useEffect(() => {
        fetchRates()
    }, [])

    const fetchRates = async () => {
        try {
            const { data } = await client.get('/api/token-rate/all');
            setRates(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching rates:", error);
            toast.error("Failed to load rates");
            setLoading(false);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.phase || !formData.rate) {
            toast.error("Phase and Rate are required")
            return
        }

        try {
            await client.post('/api/token-rate', {
                ...formData,
                phase: Number(formData.phase),
                rate: Number(formData.rate),
                phase_number: formData.phase_number ? Number(formData.phase_number) : null
            })
            toast.success("Token Rate Added")
            setFormData({ phase: "", rate: "", phase_number: "", source: "Admin Manual" }) // Reset form
            fetchRates() // Refresh list
        } catch (error) {
            console.error(error)
            toast.error("Failed to add rate")
        }
    }

    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
            `}</style>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Token Rate Management
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Manage token price history and updates
                    </p>
                </div>
            </div>

            {/* Add New Rate Form */}
            <div className="bg-[#0f0f1a] rounded-xl border border-emerald-500/20 p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Add New Rate Update</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 uppercase">Phase ID</label>
                        <input
                            type="number"
                            value={formData.phase}
                            onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                            placeholder="e.g. 1"
                            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 uppercase">Rate (USD)</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={formData.rate}
                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                            placeholder="e.g. 0.05"
                            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 uppercase">Phase # (Optional)</label>
                        <input
                            type="number"
                            value={formData.phase_number}
                            onChange={(e) => setFormData({ ...formData, phase_number: e.target.value })}
                            placeholder="e.g. 1"
                            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 uppercase">Source</label>
                        <input
                            type="text"
                            value={formData.source}
                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                            placeholder="Source info"
                            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 h-[42px]"
                    >
                        <Save className="w-4 h-4" /> Add
                    </button>
                </form>
            </div>

            {/* Rate History Table */}
            <div className="bg-[#0f0f1a] rounded-xl border border-emerald-500/20 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e] border-b border-emerald-500/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phase</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phase #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rate</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-500/10">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading rates...</td></tr>
                            ) : rates.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No rate history found</td></tr>
                            ) : (
                                rates.map((item) => (
                                    <tr key={item._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-emerald-500/50" />
                                            {new Date(item.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-white font-medium">{item.phase}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-400 font-mono">{item.phase_number || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-emerald-400 font-bold font-mono">${item.rate}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-500 text-xs uppercase tracking-wider border border-white/10 px-2 py-1 rounded">{item.source}</span>
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
