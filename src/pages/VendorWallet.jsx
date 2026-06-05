"use client"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import client from "../api/client"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Wallet, Building2, Save } from "lucide-react"

export default function VendorWallet() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        vendor_id: "",
        wallet_add: ""
    })
    const [loading, setLoading] = useState(false)

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

        if (!formData.vendor_id || !formData.wallet_add) {
            toast.error("Please fill all fields")
            setLoading(false)
            return
        }

        try {
            await client.post('/api/vendor-wallet', {
                vendor_id: formData.vendor_id,
                wallet_add: formData.wallet_add
            })
            toast.success("Wallet Added Successfully!")
            setFormData(prev => ({ ...prev, wallet_add: "" }))
        } catch (error) {
            console.error(error)
            toast.error("Failed to add wallet")
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
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                        <Wallet className="w-10 h-10 text-blue-500" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                        Vendor Wallet
                    </h1>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Add your wallet address to receive payments.
                    </p>
                </div>

                <div className="bg-[#0f0f1a] rounded-2xl border border-blue-500/20 p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Vendor ID</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={formData.vendor_id}
                                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                                    placeholder="Enter Vendor ID"
                                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Wallet Address</label>
                            <div className="relative">
                                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={formData.wallet_add}
                                    onChange={(e) => setFormData({ ...formData, wallet_add: e.target.value })}
                                    placeholder="0x..."
                                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2
                                ${loading
                                    ? 'bg-blue-500/50 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 active:scale-[0.98]'
                                }
                            `}
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Saving...' : 'Save Wallet'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
