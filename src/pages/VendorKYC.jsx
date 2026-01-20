"use client"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import client from "../api/client"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ShieldCheck, Building2, UploadCloud, FileText } from "lucide-react"

export default function VendorKYC() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        vendor_id: "",
        aadhar: "",
        pan: "",
        aadharcard: null,
        aadhar_back: null,
        pancard: null,
        agreement: null
    })
    const [previews, setPreviews] = useState({
        aadharcard: null,
        aadhar_back: null,
        pancard: null,
        agreement: null
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const userStr = localStorage.getItem("user")
        if (userStr) {
            const user = JSON.parse(userStr)
            setFormData(prev => ({ ...prev, vendor_id: user.user_id || user.email || "" }))
        }
    }, [])

    const handleFileChange = (e, field) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [field]: reader.result }))
                if (field === 'aadharcard') setFormData(prev => ({ ...prev, aadharcard: reader.result }))
                if (field === 'aadhar_back') setFormData(prev => ({ ...prev, aadhar_back: reader.result }))
                if (field === 'pancard') setFormData(prev => ({ ...prev, pancard: reader.result }))
                if (field === 'agreement') setFormData(prev => ({ ...prev, agreement: reader.result }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        if (!formData.vendor_id || !formData.aadhar || !formData.pan) {
            toast.error("Please fill all required fields")
            setLoading(false)
            return
        }

        try {
            await client.post('/api/vendor-kyc', {
                vendor_id: formData.vendor_id,
                aadhar: formData.aadhar,
                pan: formData.pan,
                aadharcard: formData.aadharcard, // Base64 strings
                aadhar_back: formData.aadhar_back,
                pancard: formData.pancard,
                agreement: formData.agreement
            })
            toast.success("KYC Submitted Successfully!")
            navigate('/dashboard')
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || "Failed to submit KYC")
        } finally {
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

                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto border border-teal-500/20">
                        <ShieldCheck className="w-10 h-10 text-teal-500" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent">
                        Vendor KYC Verification
                    </h1>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Submit your identity and agreement documents for verification.
                    </p>
                </div>

                <div className="bg-[#0f0f1a] rounded-2xl border border-teal-500/20 p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Vendor ID</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={formData.vendor_id}
                                        onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                                        className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Aadhar Number</label>
                                <input
                                    type="text"
                                    value={formData.aadhar}
                                    onChange={(e) => setFormData({ ...formData, aadhar: e.target.value })}
                                    placeholder="1234 5678 9012"
                                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-teal-500 transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">PAN Number</label>
                                <input
                                    type="text"
                                    value={formData.pan}
                                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                                    placeholder="ABCDE1234F"
                                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-teal-500 transition-colors uppercase"
                                    required
                                />
                            </div>
                        </div>

                        {/* Document Uploads */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <UploadCard
                                label="Aadhar Front"
                                field="aadharcard"
                                preview={previews.aadharcard}
                                onChange={handleFileChange}
                            />
                            <UploadCard
                                label="Aadhar Back"
                                field="aadhar_back"
                                preview={previews.aadhar_back}
                                onChange={handleFileChange}
                            />
                            <UploadCard
                                label="PAN Card"
                                field="pancard"
                                preview={previews.pancard}
                                onChange={handleFileChange}
                            />
                            <UploadCard
                                label="Signed Agreement"
                                field="agreement"
                                preview={previews.agreement}
                                onChange={handleFileChange}
                                icon={<FileText className="w-8 h-8 text-gray-500 mb-2" />}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-teal-500/25 transition-all
                                ${loading
                                    ? 'bg-teal-500/50 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-500 hover:to-green-500 active:scale-[0.98]'
                                }
                            `}
                        >
                            {loading ? 'Submitting...' : 'Submit Verification'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

function UploadCard({ label, field, preview, onChange, icon }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 pl-1">{label}</label>
            {preview ? (
                <div className="relative h-48 w-full rounded-xl overflow-hidden border border-teal-500 group">
                    <img src={preview} alt={label} className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                        <span className="text-white font-medium">Change File</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => onChange(e, field)} />
                    </label>
                </div>
            ) : (
                <label className="block w-full h-48 border-2 border-dashed border-white/10 rounded-xl hover:bg-teal-500/5 hover:border-teal-500/40 transition-all cursor-pointer group relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {icon || <UploadCloud className="w-8 h-8 text-gray-500 group-hover:text-teal-500 transition-colors mb-2" />}
                        <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Click to upload</span>
                        <span className="text-xs text-gray-600 mt-1">Image (Max 5MB)</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => onChange(e, field)} />
                </label>
            )}
        </div>
    )
}
