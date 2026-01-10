"use client"
import { useState } from "react"
import { Package, Plus, Edit2, Trash2 } from "lucide-react"

export default function PackageManagement() {
    const [packages, setPackages] = useState([
        { id: 1, name: "Starter", price: "100 G4X", roi: "0.6%", duration: "365 Days" },
        { id: 2, name: "Pro", price: "500 G4X", roi: "0.6%", duration: "365 Days" },
        { id: 3, name: "Elite", price: "1000 G4X", roi: "0.6%", duration: "365 Days" },
        { id: 4, name: "Master", price: "5000 G4X", roi: "0.6%", duration: "365 Days" },
        { id: 5, name: "Grand", price: "10000 G4X", roi: "0.6%", duration: "365 Days" },
    ])

    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .cyber-card {
                    background: linear-gradient(145deg, rgba(20, 184, 166, 0.1), rgba(15, 15, 26, 0.8));
                    border: 1px solid rgba(20, 184, 166, 0.3);
                }
            `}</style>
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Package Management
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <Package className="w-4 h-4 text-teal-500" />
                        Manage investment packages and ROI settings
                    </p>
                </div>
                <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(20,184,166,0.5)]">
                    <Plus className="w-4 h-4" /> Add Package
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                    <div key={pkg.id} className="cyber-card p-6 rounded-xl relative group hover:border-teal-500 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                            <span className="bg-teal-500/10 text-teal-400 px-2 py-1 rounded text-xs border border-teal-500/20">Active</span>
                        </div>
                        <div className="space-y-2 text-gray-400 text-sm">
                            <div className="flex justify-between">
                                <span>Price</span>
                                <span className="text-white font-mono">{pkg.price}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Daily ROI</span>
                                <span className="text-teal-400 font-bold">{pkg.roi}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Duration</span>
                                <span className="text-white">{pkg.duration}</span>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-2">
                            <button className="flex-1 py-2 bg-[#0f0f1a] border border-gray-700 hover:border-teal-500 text-gray-300 hover:text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm">
                                <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button className="p-2 bg-[#0f0f1a] border border-gray-700 hover:border-rose-500 text-gray-300 hover:text-rose-500 rounded-lg transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
