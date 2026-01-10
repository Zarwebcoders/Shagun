"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import client from "../../api/client"
import {
    ShieldCheck,
    UserCheck,
    Clock,
    XCircle,
    Search,
    FileText,
    Smartphone,
    Building,
    ChevronRight,
    CheckCircle2,
    AlertCircle
} from "lucide-react"

export default function KYCApprovals() {
    const [selectedKYC, setSelectedKYC] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [kycRequests, setKycRequests] = useState([])
    const [stats, setStats] = useState({
        pendingReview: 0,
        approvedToday: 0,
        rejectedToday: 0,
        totalVerified: 0
    })
    const [loading, setLoading] = useState(true)

    // ... existing fetch logic ...
    const fetchKYCRequests = async () => {
        try {
            const { data } = await client.get('/kyc/pending');
            setKycRequests(data);
        } catch (error) {
            console.error("Error fetching KYC requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await client.get('/kyc/stats');
            setStats(data);
        } catch (error) {
            console.error("Error fetching KYC stats:", error);
        }
    };

    useEffect(() => {
        fetchKYCRequests();
        fetchStats();
    }, []);

    const handleApprove = async (id) => {
        try {
            await client.put(`/kyc/${id}`, { status: 'approved' });
            fetchKYCRequests();
            setSelectedKYC(null);
            toast.success(`KYC approved successfully`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to approve");
        }
    }

    const handleReject = async (id) => {
        try {
            await client.put(`/kyc/${id}`, { status: 'rejected' });
            fetchKYCRequests();
            setSelectedKYC(null);
            toast.success(`KYC rejected`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to reject");
        }
    }

    const filteredRequests = kycRequests.filter(req =>
        (req.user?.name || req.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.user?.email || req.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <style jsx>{`
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
                .cyber-card {
                    background: linear-gradient(145deg, rgba(20, 184, 166, 0.1), rgba(15, 15, 26, 0.8));
                    border: 1px solid rgba(20, 184, 166, 0.3);
                }
            `}</style>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        KYC Management
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                        Verify and manage user identities securely
                    </p>
                </div>
                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#0f0f1a] border border-teal-500/20 rounded-lg text-sm text-white focus:border-teal-500 focus:outline-none transition-all"
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Pending Review", value: stats.pendingReview, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
                    { label: "Approved Today", value: stats.approvedToday, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
                    { label: "Rejected Today", value: stats.rejectedToday, icon: XCircle, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
                    { label: "Total Verified", value: stats.totalVerified.toLocaleString(), icon: UserCheck, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
                ].map((stat, idx) => (
                    <div key={idx} className={`cyber-card p-4 rounded-xl border ${stat.border}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[600px]">

                {/* Left Panel: Request List */}
                <div className="lg:col-span-4 glass-panel rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-teal-500/20 bg-[#1a1a2e]/50">
                        <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider">
                            Pending Requests ({kycRequests.length})
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500 animate-pulse">Loading requests...</div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
                                <Search className="w-8 h-8 opacity-20" />
                                <p>No matching requests</p>
                            </div>
                        ) : (
                            filteredRequests.map((request) => (
                                <button
                                    key={request._id}
                                    onClick={() => setSelectedKYC(request)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative overflow-hidden ${selectedKYC?._id === request._id
                                            ? "bg-teal-500/10 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                                            : "bg-[#1a1a2e]/40 border-transparent hover:bg-[#1a1a2e]/80 hover:border-teal-500/30"
                                        }`}
                                >
                                    {selectedKYC?._id === request._id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 shadow-[0_0_10px_#14b8a6]"></div>
                                    )}
                                    <div className="flex items-center gap-3 pl-2">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2a2a3e] to-[#1a1a2e] border border-teal-500/20 flex items-center justify-center shrink-0">
                                            <span className="text-teal-500 font-bold text-lg">
                                                {(request.user?.name || request.name || "U").charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`font-medium truncate ${selectedKYC?._id === request._id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                {request.user?.name || request.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{request.user?.email || request.email}</p>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${selectedKYC?._id === request._id ? 'text-teal-500 translate-x-1' : ''}`} />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between pl-2">
                                        <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">
                                            {request.documentType || "ID Verification"}
                                        </span>
                                        <span className="text-[10px] text-gray-500">
                                            {new Date(request.createdAt || request.submittedDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Details View */}
                <div className="lg:col-span-8 glass-panel rounded-xl overflow-hidden flex flex-col relative">
                    {!selectedKYC ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
                            <div className="w-20 h-20 rounded-full bg-[#1a1a2e] flex items-center justify-center border border-teal-500/10">
                                <FileText className="w-8 h-8 opacity-40" />
                            </div>
                            <p className="text-sm">Select a request to view details</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Toolbar */}
                            <div className="p-4 border-b border-teal-500/20 bg-[#1a1a2e]/80 flex justify-between items-center backdrop-blur-md sticky top-0 z-10">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{selectedKYC.user?.name || selectedKYC.name}</h3>
                                    <p className="text-xs text-teal-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Awaiting Action
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleReject(selectedKYC._id)}
                                        className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/50 rounded-lg hover:bg-rose-500 hover:text-white transition-all text-sm font-medium flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedKYC._id)}
                                        className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/50 rounded-lg hover:bg-emerald-500 hover:text-white transition-all text-sm font-medium flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Approve
                                    </button>
                                </div>
                            </div>

                            {/* Content Scroll Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                                {/* Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Personal Info Module */}
                                    <div className="bg-[#1a1a2e]/60 p-4 rounded-xl border border-teal-500/10">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-teal-400 mb-4 border-b border-white/5 pb-2">
                                            <UserCheck className="w-4 h-4" /> Identity Info
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Full Name</p>
                                                <p className="text-sm font-medium text-white">{selectedKYC.user?.name || selectedKYC.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Email Address</p>
                                                <p className="text-sm font-medium text-white">{selectedKYC.user?.email || selectedKYC.email}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <p className="text-xs text-gray-500">Aadhar Number</p>
                                                    <p className="text-sm font-medium text-white font-mono tracking-wide">{selectedKYC.aadharNumber || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">PAN Number</p>
                                                    <p className="text-sm font-medium text-white font-mono tracking-wide">{selectedKYC.panNumber || "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bank Info Module */}
                                    <div className="bg-[#1a1a2e]/60 p-4 rounded-xl border border-teal-500/10">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-purple-400 mb-4 border-b border-white/5 pb-2">
                                            <Building className="w-4 h-4" /> Banking Details
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500">Bank Name</p>
                                                <p className="text-sm font-medium text-white">{selectedKYC.bankDetails?.bankName || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Account No.</p>
                                                <p className="text-sm font-medium text-white font-mono">{selectedKYC.bankDetails?.accountNumber || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">IFSC Code</p>
                                                <p className="text-sm font-medium text-white font-mono">{selectedKYC.bankDetails?.ifscCode || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents Gallery */}
                                <div>
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-400 mb-4">
                                        <FileText className="w-4 h-4" /> Document Evidence
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { title: "Aadhar Front", src: selectedKYC.documents.aadharFront },
                                            { title: "Aadhar Back", src: selectedKYC.documents.aadharBack },
                                            { title: "PAN Card", src: selectedKYC.documents.panCard },
                                            { title: "Selfie", src: selectedKYC.documents.profilePhoto },
                                        ].map((doc, i) => (
                                            <div key={i} className="group relative aspect-[4/3] bg-[#0f0f1a] rounded-lg border border-white/10 overflow-hidden cursor-zoom-in">
                                                <img
                                                    src={doc.src || "/placeholder.svg"}
                                                    alt={doc.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                    <span className="text-xs font-medium text-white">{doc.title}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Admin Notes</h4>
                                    <textarea
                                        className="w-full px-4 py-3 bg-[#0f0f1a] text-white rounded-lg border border-teal-500/20 focus:border-teal-500 focus:outline-none resize-none text-sm placeholder-gray-600"
                                        rows={2}
                                        placeholder="Add internal notes about this verification..."
                                    ></textarea>
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
