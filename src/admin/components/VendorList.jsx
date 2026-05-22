"use client"
import { useState, useEffect } from "react"
import { Edit2, Users, Save, X } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../../api/client"

export default function VendorList() {
    const [vendors, setVendors] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({
        acceptance_percentage: 0,
        settlement_cycle: 0
    })

    useEffect(() => {
        fetchVendors()
    }, [])

    const fetchVendors = async () => {
        try {
            const { data } = await client.get('/api/vendors/all');
            setVendors(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching vendors:", error);
            toast.error("Failed to load vendors");
            setLoading(false);
        }
    }

    const startEdit = (vendor) => {
        setEditingId(vendor._id)
        setEditForm({
            acceptance_percentage: vendor.acceptance_percentage,
            settlement_cycle: vendor.settlement_cycle
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
    }

    const handleUpdate = async (id) => {
        try {
            await client.put(`/api/vendors/${id}`, editForm)
            toast.success("Vendor Updated")
            setEditingId(null)
            fetchVendors()
        } catch (error) {
            console.error(error)
            toast.error("Failed to update vendor")
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

            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    All Vendors
                </h2>
                <p className="text-gray-400 mt-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Manage vendor profiles and settings
                </p>
            </div>

            <div className="bg-[#0f0f1a] rounded-xl border border-indigo-500/20 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e] border-b border-indigo-500/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Acceptance %</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cycle (Days)</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-500/10">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading vendors...</td></tr>
                            ) : vendors.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No vendors found</td></tr>
                            ) : (
                                vendors.map((vendor) => (
                                    <tr key={vendor._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-white font-medium font-mono">{vendor.vendor_id}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-300">{vendor.full_name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-300 text-sm">{vendor.email}</span>
                                        </td>

                                        {/* Editable Fields */}
                                        {editingId === vendor._id ? (
                                            <>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        value={editForm.acceptance_percentage}
                                                        onChange={(e) => setEditForm({ ...editForm, acceptance_percentage: e.target.value })}
                                                        className="w-20 bg-[#050505] border border-white/20 rounded px-2 py-1 text-white text-sm"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        value={editForm.settlement_cycle}
                                                        onChange={(e) => setEditForm({ ...editForm, settlement_cycle: e.target.value })}
                                                        className="w-20 bg-[#050505] border border-white/20 rounded px-2 py-1 text-white text-sm"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleUpdate(vendor._id)} className="p-1.5 bg-green-500/20 text-green-500 rounded hover:bg-green-500 hover:text-white">
                                                            <Save className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={cancelEdit} className="p-1.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 font-mono text-indigo-400">
                                                    {vendor.acceptance_percentage}%
                                                </td>
                                                <td className="px-6 py-4 font-mono text-cyan-400">
                                                    {vendor.settlement_cycle} days
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => startEdit(vendor)}
                                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </>
                                        )}
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
