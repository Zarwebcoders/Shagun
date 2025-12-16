"use client"

import { useState, useEffect } from "react"
import client from "../../api/client"

export default function KYCApprovals() {
    const [selectedKYC, setSelectedKYC] = useState(null)

    const [kycRequests, setKycRequests] = useState([])
    const [loading, setLoading] = useState(true)

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

    useEffect(() => {
        fetchKYCRequests();
    }, []);

    const handleApprove = async (id) => {
        try {
            await client.put(`/kyc/${id}`, { status: 'approved' });
            fetchKYCRequests();
            setSelectedKYC(null);
            alert(`KYC approved`);
        } catch (err) {
            console.error(err);
            alert("Failed to approve");
        }
    }

    const handleReject = async (id) => {
        try {
            await client.put(`/kyc/${id}`, { status: 'rejected' });
            fetchKYCRequests();
            setSelectedKYC(null);
            alert(`KYC rejected`);
        } catch (err) {
            console.error(err);
            alert("Failed to reject");
        }
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>

            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white">KYC Approvals</h2>
                <p className="text-gray-400 mt-1">Review and approve user verification requests</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Pending Review", value: "145", color: "yellow" },
                    { label: "Approved Today", value: "89", color: "green" },
                    { label: "Rejected Today", value: "12", color: "red" },
                    { label: "Total Verified", value: "8,234", color: "blue" },
                ].map((stat, index) => (
                    <div key={index} className="bg-[#0f0f1a] rounded-xl p-6 border border-[#9131e7]/30">
                        <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* KYC Requests List */}
                <div className="lg:col-span-1 bg-[#1f1f1f] rounded-xl p-6 border border-[#9131e7]/30">
                    <h3 className="text-xl font-bold text-white mb-4">Pending Requests</h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {kycRequests.map((request) => (
                            <button
                                key={request._id}
                                onClick={() => setSelectedKYC(request)}
                                className={`w-full text-left p-4 rounded-lg transition-all ${selectedKYC?._id === request._id
                                    ? "bg-[#9131e7] text-white"
                                    : "bg-[#1a1a2e] text-white hover:bg-[#3f3f3f]"
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#9131e7] to-[#e3459b] rounded-full flex items-center justify-center text-white font-bold">
                                        {request.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{request.user?.name || request.name}</p>
                                        <p className={`text-xs ${selectedKYC?._id === request._id ? "text-[#1f1f1f]" : "text-gray-400"}`}>
                                            {request.user?.email || request.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className={selectedKYC?._id === request._id ? "text-[#1f1f1f]" : "text-gray-400"}>
                                        {request.documentType}
                                    </span>
                                    <span className={selectedKYC?._id === request._id ? "text-[#1f1f1f]" : "text-gray-500"}>
                                        {new Date(request.createdAt || request.submittedDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* KYC Details */}
                <div className="lg:col-span-2 bg-[#1f1f1f] rounded-xl p-6 border border-[#9131e7]/30">
                    {selectedKYC ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-white">KYC Review</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleReject(selectedKYC._id)}
                                        className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedKYC._id)}
                                        className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="bg-[#1a1a2e] rounded-lg p-4">
                                <h4 className="text-white font-semibold mb-3">Personal Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-400 text-sm">Full Name</p>
                                        <p className="text-white font-medium">{selectedKYC.user?.name || selectedKYC.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Email</p>
                                        <p className="text-white font-medium">{selectedKYC.user?.email || selectedKYC.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Date of Birth</p>
                                        <p className="text-white font-medium">{selectedKYC.personalInfo.dob}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Phone</p>
                                        <p className="text-white font-medium">{selectedKYC.personalInfo.phone}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-400 text-sm">Address</p>
                                        <p className="text-white font-medium">{selectedKYC.personalInfo.address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div>
                                <h4 className="text-white font-semibold mb-3">Uploaded Documents</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-[#1a1a2e] rounded-lg p-4">
                                        <p className="text-gray-400 text-sm mb-2">ID Front</p>
                                        <div className="aspect-video bg-[#3f3f3f] rounded-lg overflow-hidden">
                                            <img
                                                src={selectedKYC.documents.idFront || "/placeholder.svg"}
                                                alt="ID Front"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button className="w-full mt-2 px-3 py-2 bg-[#9131e7] text-white rounded-lg text-sm font-semibold hover:bg-[#d4941f] transition-all">
                                            View Full Size
                                        </button>
                                    </div>
                                    <div className="bg-[#1a1a2e] rounded-lg p-4">
                                        <p className="text-gray-400 text-sm mb-2">ID Back</p>
                                        <div className="aspect-video bg-[#3f3f3f] rounded-lg overflow-hidden">
                                            <img
                                                src={selectedKYC.documents.idBack || "/placeholder.svg"}
                                                alt="ID Back"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button className="w-full mt-2 px-3 py-2 bg-[#9131e7] text-white rounded-lg text-sm font-semibold hover:bg-[#d4941f] transition-all">
                                            View Full Size
                                        </button>
                                    </div>
                                    <div className="bg-[#1a1a2e] rounded-lg p-4">
                                        <p className="text-gray-400 text-sm mb-2">Selfie Verification</p>
                                        <div className="aspect-video bg-[#3f3f3f] rounded-lg overflow-hidden">
                                            <img
                                                src={selectedKYC.documents.selfie || "/placeholder.svg"}
                                                alt="Selfie"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button className="w-full mt-2 px-3 py-2 bg-[#9131e7] text-white rounded-lg text-sm font-semibold hover:bg-[#d4941f] transition-all">
                                            View Full Size
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Rejection Reason (Optional) */}
                            <div className="bg-[#1a1a2e] rounded-lg p-4">
                                <h4 className="text-white font-semibold mb-2">Admin Notes / Rejection Reason</h4>
                                <textarea
                                    className="w-full px-4 py-3 bg-[#9131e7]/30 text-white rounded-lg border border-[#4f4f4f] focus:border-[#9131e7] focus:outline-none resize-none"
                                    rows={3}
                                    placeholder="Enter notes or rejection reason..."
                                ></textarea>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                            <div className="text-6xl mb-4">📋</div>
                            <h3 className="text-xl font-bold text-white mb-2">No KYC Selected</h3>
                            <p className="text-gray-400">Select a KYC request from the list to review</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
