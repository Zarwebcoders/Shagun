"use client"

import { useState } from "react"

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")
    const [selectedUsers, setSelectedUsers] = useState([])

    const users = [
        {
            id: 1,
            name: "John Doe",
            email: "john.doe@email.com",
            wallet: "0x742d...3a8f",
            investment: "$25,400",
            status: "active",
            kycStatus: "verified",
            joinDate: "2024-01-15",
        },
        {
            id: 2,
            name: "Jane Smith",
            email: "jane.smith@email.com",
            wallet: "0x8e3c...9b2d",
            investment: "$18,900",
            status: "active",
            kycStatus: "pending",
            joinDate: "2024-02-20",
        },
        {
            id: 3,
            name: "Mike Wilson",
            email: "mike.wilson@email.com",
            wallet: "0x1f5a...7c4e",
            investment: "$32,100",
            status: "active",
            kycStatus: "verified",
            joinDate: "2024-01-08",
        },
        {
            id: 4,
            name: "Sarah Jones",
            email: "sarah.jones@email.com",
            wallet: "0x9d2b...4f1a",
            investment: "$12,500",
            status: "suspended",
            kycStatus: "rejected",
            joinDate: "2024-03-10",
        },
        {
            id: 5,
            name: "Alex Brown",
            email: "alex.brown@email.com",
            wallet: "0x6c8e...2d9b",
            investment: "$45,800",
            status: "active",
            kycStatus: "verified",
            joinDate: "2023-12-22",
        },
    ]

    const toggleUserSelection = (userId) => {
        setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
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
                    <h2 className="text-3xl font-bold text-white">User Management</h2>
                    <p className="text-gray-400 mt-1">Manage and monitor all platform users</p>
                </div>
                <button className="px-6 py-3 bg-[#f3b232] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#d4941f] transition-all">
                    + Add New User
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-[#1f1f1f] rounded-xl p-6 border border-[#3f3f3f]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            placeholder="Search users by name, email, or wallet..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 bg-[#2b2b2b] text-white rounded-lg border border-[#3f3f3f] focus:border-[#f3b232] focus:outline-none transition-all"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-3 bg-[#2b2b2b] text-white rounded-lg border border-[#3f3f3f] focus:border-[#f3b232] focus:outline-none transition-all"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select className="px-4 py-3 bg-[#2b2b2b] text-white rounded-lg border border-[#3f3f3f] focus:border-[#f3b232] focus:outline-none transition-all">
                        <option>KYC Status</option>
                        <option>Verified</option>
                        <option>Pending</option>
                        <option>Rejected</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#1f1f1f] rounded-xl border border-[#3f3f3f] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#2b2b2b]">
                            <tr>
                                <th className="px-6 py-4 text-left">
                                    <input type="checkbox" className="w-4 h-4 rounded" />
                                </th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">User</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Wallet Address</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Investment</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Status</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">KYC</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Join Date</th>
                                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3f3f3f]">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-[#2b2b2b] transition-colors">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                            className="w-4 h-4 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-[#f3b232] to-[#d4941f] rounded-full flex items-center justify-center text-white font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.name}</p>
                                                <p className="text-gray-400 text-sm">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-[#f3b232] text-sm">{user.wallet}</code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-green-500 font-semibold">{user.investment}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${user.status === "active" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                                                }`}
                                        >
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${user.kycStatus === "verified"
                                                    ? "bg-green-500/20 text-green-500"
                                                    : user.kycStatus === "pending"
                                                        ? "bg-yellow-500/20 text-yellow-500"
                                                        : "bg-red-500/20 text-red-500"
                                                }`}
                                        >
                                            {user.kycStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">{user.joinDate}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-all" title="View">
                                                👁️
                                            </button>
                                            <button
                                                className="p-2 text-green-500 hover:bg-green-500/20 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-all" title="Delete">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#2b2b2b] border-t border-[#3f3f3f]">
                    <p className="text-gray-400 text-sm">Showing 1 to 5 of 12,450 users</p>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 bg-[#3f3f3f] text-white rounded-lg hover:bg-[#4f4f4f] transition-all">
                            Previous
                        </button>
                        <button className="px-4 py-2 bg-[#f3b232] text-[#1f1f1f] rounded-lg font-semibold">1</button>
                        <button className="px-4 py-2 bg-[#3f3f3f] text-white rounded-lg hover:bg-[#4f4f4f] transition-all">
                            2
                        </button>
                        <button className="px-4 py-2 bg-[#3f3f3f] text-white rounded-lg hover:bg-[#4f4f4f] transition-all">
                            3
                        </button>
                        <button className="px-4 py-2 bg-[#3f3f3f] text-white rounded-lg hover:bg-[#4f4f4f] transition-all">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
