"use client"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import client from "../api/client"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Wallet, Building2 } from "lucide-react"

export default function VendorWithdrawal() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        vendor_id: "",
        amount: ""
    })
    const [loading, setLoading] = useState(false)
    const [recentRequests, setRecentRequests] = useState([]) // Optional: Store in local state if not fetching from somewhere

    // Try to pre-fill vendor_id with user ID/email if logged in
    useEffect(() => {
        const userStr = localStorage.getItem("user")
        if (userStr) {
            const user = JSON.parse(userStr)
            setFormData(prev => ({ ...prev, vendor_id: user.user_id || user.email || "" }))
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        if (!formData.vendor_id || !formData.amount) {
            toast.error("Please fill all fields")
            setLoading(false)
            return
        }

        try {
            await client.post('/api/vendor-withdraw', {
                vendor_id: formData.vendor_id,
                amount: Number(formData.amount)
            })
            toast.success("Withdrawal Request Submitted!")
            setFormData(prev => ({ ...prev, amount: "" })) // Clear amount only
            // Ideally fetch latest status, but we don't have a user API for this yet as per plan
        } catch (error) {
            console.error(error)
            toast.error("Failed to submit request")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
            <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                </button>

                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto border border-purple-500/20">
                        <Building2 className="w-10 h-10 text-purple-500" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Vendor Withdrawal
                    </h1>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Submit your payout request. Approved funds will be transferred to your registered account.
                    </p>
                </div>

                <div className="bg-[#0f0f1a] rounded-2xl border border-purple-500/20 p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Vendor ID</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={formData.vendor_id}
                                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                                    placeholder="Enter your Vendor ID"
                                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Withdrawal Amount (₹)</label>
                            <div className="relative">
                                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    min="1"
                                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-lg"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/25 transition-all
                                ${loading
                                    ? 'bg-purple-500/50 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-[0.98]'
                                }
                            `}
                        >
                            {loading ? 'Processing...' : 'Submit Request'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
