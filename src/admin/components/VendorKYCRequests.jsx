"use client"
import { useState, useEffect } from "react"
import { Check, X, ShieldCheck, Eye, FileText } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../../api/client"
import { motion, AnimatePresence } from "framer-motion"

export default function VendorKYCRequests() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedDoc, setSelectedDoc] = useState(null) // For modal preview
    const [filter, setFilter] = useState('all') // all, pending, approved, rejected

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const { data } = await client.get('/api/vendor-kyc/all');
            setRequests(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching vendor kyc:", error);
            toast.error("Failed to load requests");
            setLoading(false);
        }
    }

    const handleStatusUpdate = async (id, status) => {
        try {
            await client.put(`/api/vendor-kyc/${id}`, { approval: status });
            toast.success(status === 1 ? "KYC Approved" : "KYC Rejected");
            fetchRequests();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    }

    const filteredRequests = requests.filter(req => {
        if (filter === 'all') return true;
        if (filter === 'pending') return req.approval === 2;
        if (filter === 'approved') return req.approval === 1;
        if (filter === 'rejected') return req.approval === 0;
        return true;
    });

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
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent">
                        Vendor KYC Requests
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                        Verify vendor identities and agreements
                    </p>
                </div>

                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                    : 'bg-[#1a1a2e] text-gray-400 hover:text-white border border-teal-500/20'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading requests...</div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No requests found</div>
                ) : (
                    filteredRequests.map((req) => (
                        <div key={req._id} className="bg-[#0f0f1a] rounded-xl border border-teal-500/20 p-6 flex flex-col lg:flex-row gap-6 hover:bg-[#0f0f1a]/80 transition-colors">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        Vendor: <span className="text-teal-400 font-mono">{req.vendor_id}</span>
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${req.approval === 1 ? 'bg-green-500/20 text-green-500' :
                                            req.approval === 0 ? 'bg-red-500/20 text-red-500' :
                                                'bg-yellow-500/20 text-yellow-500'
                                        }`}>
                                        {req.approval === 1 ? 'Approved' : req.approval === 0 ? 'Rejected' : 'Pending'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
                                    <div className="bg-[#1a1a2e] p-3 rounded-lg border border-white/5">
                                        <label className="block text-xs uppercase text-gray-500 mb-1">Aadhar Number</label>
                                        <span className="text-white font-mono text-base">{req.aadhar}</span>
                                    </div>
                                    <div className="bg-[#1a1a2e] p-3 rounded-lg border border-white/5">
                                        <label className="block text-xs uppercase text-gray-500 mb-1">PAN Number</label>
                                        <span className="text-white font-mono text-base">{req.pan}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    {req.aadharcard && (
                                        <button onClick={() => setSelectedDoc({ url: req.aadharcard, title: 'Aadhar Front' })} className="flex items-center gap-2 text-xs bg-[#1a1a2e] px-3 py-2 rounded-lg hover:bg-[#252538] transition-colors text-teal-400">
                                            <Eye className="w-3 h-3" /> Aadhar Front
                                        </button>
                                    )}
                                    {req.aadhar_back && (
                                        <button onClick={() => setSelectedDoc({ url: req.aadhar_back, title: 'Aadhar Back' })} className="flex items-center gap-2 text-xs bg-[#1a1a2e] px-3 py-2 rounded-lg hover:bg-[#252538] transition-colors text-teal-400">
                                            <Eye className="w-3 h-3" /> Aadhar Back
                                        </button>
                                    )}
                                    {req.pancard && (
                                        <button onClick={() => setSelectedDoc({ url: req.pancard, title: 'PAN Card' })} className="flex items-center gap-2 text-xs bg-[#1a1a2e] px-3 py-2 rounded-lg hover:bg-[#252538] transition-colors text-teal-400">
                                            <Eye className="w-3 h-3" /> PAN Card
                                        </button>
                                    )}
                                    {req.agreement && (
                                        <button onClick={() => setSelectedDoc({ url: req.agreement, title: 'Agreement' })} className="flex items-center gap-2 text-xs bg-[#1a1a2e] px-3 py-2 rounded-lg hover:bg-[#252538] transition-colors text-purple-400">
                                            <FileText className="w-3 h-3" /> Agreement
                                        </button>
                                    )}
                                </div>
                            </div>

                            {req.approval === 2 && (
                                <div className="flex lg:flex-col gap-2 justify-center border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
                                    <button
                                        onClick={() => handleStatusUpdate(req._id, 1)}
                                        className="flex-1 lg:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20"
                                    >
                                        <Check className="w-4 h-4" /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(req._id, 0)}
                                        className="flex-1 lg:flex-none px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/20"
                                    >
                                        <X className="w-4 h-4" /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Document Modal */}
            <AnimatePresence>
                {selectedDoc && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
                        onClick={() => setSelectedDoc(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-[#1a1a2e] p-4 rounded-xl max-w-4xl max-h-[90vh] overflow-auto relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedDoc(null)}
                                className="absolute top-4 right-4 bg-red-500 p-1 rounded-full text-white hover:bg-red-600 z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-xl font-bold text-white mb-4">{selectedDoc.title}</h3>
                            <img src={selectedDoc.url} alt={selectedDoc.title} className="w-full h-auto rounded-lg shadow-2xl" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
