"use client"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import client from "../api/client"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, UserCircle, Briefcase, Mail, Percent, Clock, Save } from "lucide-react"

export default function VendorProfile() {
    const navigate = useNavigate()
    const [vendorId, setVendorId] = useState("")
    const [vendorData, setVendorData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    // Form inputs for creation
    const [formData, setFormData] = useState({
        vendor_id: "",
        full_name: "",
        email: "",
        password: ""
    })

    useEffect(() => {
        const userStr = localStorage.getItem("user")
        if (userStr) {
            const user = JSON.parse(userStr)
            const vId = user.user_id || user.email || ""
            setVendorId(vId)
            setFormData(prev => ({ ...prev, vendor_id: vId, email: user.email || "" }))
            fetchVendorProfile(vId)
        }
    }, [])

    const fetchVendorProfile = async (id) => {
        try {
            setLoading(true)
            const { data } = await client.get(`/api/vendors/${id}`)
            setVendorData(data)
        } catch (error) {
            // If not found, show create form
            if (error.response && error.response.status === 404) {
                setVendorData(null)
                setIsCreating(true)
            } else {
                console.error("Error fetching vendor:", error)
                toast.error("Failed to load vendor profile")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            await client.post('/api/vendors', formData)
            toast.success("Vendor Profile Created!")
            setIsCreating(false)
            fetchVendorProfile(formData.vendor_id)
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || "Failed to create profile")
        } finally {
            setLoading(false)
        }
    }

    if (loading && !vendorData && !isCreating) {
        return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                </button>

                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                        <UserCircle className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Vendor Profile
                    </h1>
                </div>

                {isCreating ? (
                    <div className="bg-[#0f0f1a] rounded-2xl border border-indigo-500/20 p-8 shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-white">Create Vendor Profile</h2>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Vendor ID</label>
                                <input
                                    type="text"
                                    value={formData.vendor_id}
                                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg shadow-lg"
                            >
                                {loading ? 'Creating...' : 'Create Profile'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-[#0f0f1a] rounded-2xl border border-indigo-500/20 p-8 shadow-2xl space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Vendor ID
                                </label>
                                <p className="text-xl font-mono text-white bg-[#1a1a2e] p-4 rounded-xl border border-white/5">
                                    {vendorData?.vendor_id}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <UserCircle className="w-4 h-4" /> Full Name
                                </label>
                                <p className="text-xl font-medium text-white bg-[#1a1a2e] p-4 rounded-xl border border-white/5">
                                    {vendorData?.full_name}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> Email
                                </label>
                                <p className="text-xl font-medium text-white bg-[#1a1a2e] p-4 rounded-xl border border-white/5">
                                    {vendorData?.email}
                                </p>
                            </div>
                            <div className="space-y-2 opacity-75">
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    Password
                                </label>
                                <p className="text-xl font-medium text-gray-400 bg-[#1a1a2e] p-4 rounded-xl border border-white/5">
                                    ••••••••
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-indigo-500/20 pt-8">
                            <h3 className="text-lg font-bold text-white mb-6">Agreement & Settlement</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-indigo-500/10 p-6 rounded-xl border border-indigo-500/20 flex flex-col items-center text-center">
                                    <Percent className="w-8 h-8 text-indigo-400 mb-2" />
                                    <span className="text-sm text-gray-400 uppercase tracking-wider">Acceptance Rate</span>
                                    <span className="text-3xl font-bold text-white mt-1">
                                        {vendorData?.acceptance_percentage}%
                                    </span>
                                </div>
                                <div className="bg-cyan-500/10 p-6 rounded-xl border border-cyan-500/20 flex flex-col items-center text-center">
                                    <Clock className="w-8 h-8 text-cyan-400 mb-2" />
                                    <span className="text-sm text-gray-400 uppercase tracking-wider">Settlement Cycle</span>
                                    <span className="text-3xl font-bold text-white mt-1">
                                        {vendorData?.settlement_cycle} <span className="text-sm font-normal text-gray-400">Days</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
