"use client"

import { useState, useEffect } from "react"
import client from "../../api/client"

export default function PackageManagement() {
    const [showAddModal, setShowAddModal] = useState(false)

    const [packages, setPackages] = useState([])
    const [loading, setLoading] = useState(true)
    const [newPackage, setNewPackage] = useState({
        name: "",
        minInvestment: "",
        maxInvestment: "",
        dailyReturn: "",
        duration: "",
        description: ""
    })

    const fetchPackages = async () => {
        try {
            const { data } = await client.get('/packages');
            setPackages(data);
        } catch (error) {
            console.error("Error fetching packages:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleCreatePackage = async () => {
        try {
            await client.post('/packages', newPackage);
            setShowAddModal(false);
            fetchPackages(); // Refresh list
            setNewPackage({
                name: "",
                minInvestment: "",
                maxInvestment: "",
                dailyReturn: "",
                duration: "",
                description: ""
            });
        } catch (error) {
            console.error("Error creating package:", error);
            alert("Failed to create package");
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Package Management</h2>
                    <p className="text-gray-400 mt-1">Create and manage investment packages</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-[#9131e7] text-white rounded-lg font-semibold hover:bg-[#d4941f] transition-all"
                >
                    + Create New Package
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Active Packages", value: "6" },
                    { label: "Total Subscribers", value: "8,140" },
                    { label: "Total Invested", value: "$12.4M" },
                    { label: "Daily Payouts", value: "$34.2K" },
                ].map((stat, index) => (
                    <div key={index} className="bg-[#0f0f1a] rounded-xl p-6 border border-[#9131e7]/30">
                        <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                    <div
                        key={pkg._id}
                        className="bg-[#0f0f1a] rounded-xl p-6 border border-[#9131e7]/30 hover:border-[#9131e7] transition-all hover:shadow-lg hover:shadow-[#9131e7]/20"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-[#9131e7]">{pkg.name}</h3>
                            <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-semibold">
                                {pkg.status}
                            </span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Min Investment</span>
                                <span className="text-white font-semibold">{pkg.minInvestment}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Max Investment</span>
                                <span className="text-white font-semibold">{pkg.maxInvestment}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Daily Return</span>
                                <span className="text-green-500 font-bold">{pkg.dailyReturn}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Duration</span>
                                <span className="text-white font-semibold">{pkg.duration}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-[#9131e7]/30">
                                <span className="text-gray-400">Total Subscribers</span>
                                <span className="text-[#9131e7] font-bold">{(pkg.totalSubscribers || 0).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 px-4 py-2 bg-[#1a1a2e] text-white rounded-lg hover:bg-[#3f3f3f] transition-all text-sm font-semibold">
                                Edit
                            </button>
                            <button className="flex-1 px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-all text-sm font-semibold">
                                Disable
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Package Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-[#0f0f1a] rounded-xl p-6 max-w-2xl w-full border border-[#9131e7]/30">
                        <h3 className="text-2xl font-bold text-white mb-6">Create New Package</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Package Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-[#9131e7]/30 focus:border-[#f3b232] focus:outline-none"
                                    placeholder="e.g., Elite"
                                    value={newPackage.name}
                                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Status</label>
                                <select className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-[#9131e7]/30 focus:border-[#f3b232] focus:outline-none">
                                    <option>Active</option>
                                    <option>Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Min Investment</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-[#9131e7]/30 focus:border-[#f3b232] focus:outline-none"
                                    placeholder="1000"
                                    value={newPackage.minInvestment}
                                    onChange={(e) => setNewPackage({ ...newPackage, minInvestment: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Max Investment</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-[#9131e7]/30 focus:border-[#f3b232] focus:outline-none"
                                    placeholder="5000"
                                    value={newPackage.maxInvestment}
                                    onChange={(e) => setNewPackage({ ...newPackage, maxInvestment: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Daily Return %</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-[#9131e7]/30 focus:border-[#f3b232] focus:outline-none"
                                    placeholder="4.5"
                                    value={newPackage.dailyReturn}
                                    onChange={(e) => setNewPackage({ ...newPackage, dailyReturn: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Duration (days)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-[#9131e7]/30 focus:border-[#f3b232] focus:outline-none"
                                    placeholder="365"
                                    value={newPackage.duration}
                                    onChange={(e) => setNewPackage({ ...newPackage, duration: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-gray-400 text-sm mb-2">Description</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-[#9131e7]/30 focus:border-[#f3b232] focus:outline-none resize-none"
                                    rows={3}
                                    placeholder="Enter package description..."
                                    value={newPackage.description}
                                    onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-6 py-3 bg-[#1a1a2e] text-white rounded-lg font-semibold hover:bg-[#3f3f3f] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePackage}
                                className="flex-1 px-6 py-3 bg-[#9131e7] text-white rounded-lg font-semibold hover:bg-[#d4941f] transition-all"
                            >
                                Create Package
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
