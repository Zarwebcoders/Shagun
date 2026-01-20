"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import client from "../../api/client"

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [selectedUser, setSelectedUser] = useState(null)
    const [showUserModal, setShowUserModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editFormData, setEditFormData] = useState({})

    // Pagination State
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // Debounce search term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on search change
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);



    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearch]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 10,
                search: debouncedSearch,
                search: debouncedSearch
            };
            const { data } = await client.get('/users', { params });

            // Backend now returns { users, page, pages, total }
            setUsers(data.users || []);
            setPages(data.pages || 1);
            setTotalUsers(data.total || 0);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    // const toggleUserSelection = (userId) => {
    //     setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
    // }

    const [userWallet, setUserWallet] = useState(null)

    const handleViewUser = async (user) => {
        setSelectedUser(user);
        setEditFormData({});
        setIsEditing(false);
        setUserWallet(null); // Reset
        setShowUserModal(true);

        // Fetch wallet
        try {
            const { data } = await client.get(`/wallet/user/${user._id}`);
            setUserWallet(data);
        } catch (error) {
            console.error("Error fetching user wallet:", error);
        }
    }

    const handleEditUser = () => {
        setIsEditing(true);
    }

    const handleSaveUser = async () => {
        try {
            await client.put(`/users/${selectedUser._id}`, editFormData);
            // Refresh users
            fetchUsers();
            setShowUserModal(false);
            setIsEditing(false);
            toast.success("User updated successfully");
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Failed to update user");
        }
    }

    // Client-side filtering is no longer needed as backend handles it
    const filteredUsers = users;

    if (loading && users.length === 0) return <div className="text-white p-8 text-center">Loading users...</div>;

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
            </div>

            {/* Filters and Search */}
            <div className="bg-[#0f0f1a] rounded-xl p-3 border border-teal-500/30">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-teal-500/30 focus:border-teal-500 focus:outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#0f0f1a] rounded-xl border border-teal-500/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1a2e] text-center">
                            <tr>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">User</th>

                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Join Date</th>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-500/30 text-center">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                                        No users found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-[#1a1a2e] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 text-left">
                                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{user.name || 'Unknown'}</p>
                                                    <p className="text-gray-400 text-sm">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            {new Date(user.joinedDate || user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewUser(user)}
                                                    className="p-2 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-all"
                                                    title="View"
                                                >
                                                    👁️
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setEditFormData({
                                                            // Removed edited fields
                                                        });
                                                        setShowUserModal(true);
                                                        setIsEditing(true);
                                                    }}
                                                    className="p-2 text-green-500 hover:bg-green-500/20 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-[#1a1a2e] border-t border-teal-500/30 gap-4">
                        <p className="text-gray-400 text-sm">
                            Showing {users.length} of {totalUsers} users
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-[#0f0f1a] text-white rounded-lg hover:bg-[#2a2a3e] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            {[...Array(pages)].map((_, i) => {
                                // Show first, last, current, and adjacent pages
                                if (
                                    i + 1 === 1 ||
                                    i + 1 === pages ||
                                    (i + 1 >= page - 1 && i + 1 <= page + 1)
                                ) {
                                    return (
                                        <button
                                            key={i + 1}
                                            onClick={() => setPage(i + 1)}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${page === i + 1
                                                ? "bg-teal-500 text-white font-bold"
                                                : "bg-[#0f0f1a] text-gray-400 hover:bg-[#2a2a3e]"
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    );
                                } else if (
                                    (i + 1 === page - 2 && page > 3) ||
                                    (i + 1 === page + 2 && page < pages - 2)
                                ) {
                                    return <span key={i} className="text-gray-500">...</span>;
                                }
                                return null;
                            })}

                            <button
                                onClick={() => setPage(p => Math.min(pages, p + 1))}
                                disabled={page === pages}
                                className="px-4 py-2 bg-[#0f0f1a] text-white rounded-lg hover:bg-[#2a2a3e] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-[#0f0f1a] rounded-xl p-6 max-w-3xl w-full border border-teal-500/30 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white">{isEditing ? 'Edit User' : 'User Details'}</h3>
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="text-gray-400 hover:text-white transition-all text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* User Profile */}
                            <div className="flex items-center gap-4 pb-6 border-b border-teal-500/30">
                                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                    {selectedUser.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-white">{selectedUser.name}</h4>
                                    <p className="text-gray-400">{selectedUser.email}</p>

                                </div>
                            </div>

                            {/* User Information Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                    <p className="text-gray-400 text-sm mb-1">Phone</p>
                                    <p className="text-white font-semibold">{selectedUser.phone || 'Not provided'}</p>
                                </div>
                                <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                    <p className="text-gray-400 text-sm mb-1">User ID</p>
                                    <p className="text-white font-semibold">{selectedUser._id.substring(selectedUser._id.length - 8).toUpperCase()}</p>
                                </div>
                                <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                    <p className="text-gray-400 text-sm mb-1">Referral Code</p>
                                    <p className="text-white font-semibold">{selectedUser.referralCode || 'N/A'}</p>
                                </div>
                                <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                    <p className="text-gray-400 text-sm mb-1">Sponsor ID</p>
                                    <p className="text-white font-semibold">{selectedUser.sponsorId || 'N/A'}</p>
                                </div>
                                <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                    <p className="text-gray-400 text-sm mb-1">Join Date</p>
                                    <p className="text-white font-semibold">{new Date(selectedUser.joinedDate || selectedUser.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                    <p className="text-gray-400 text-sm mb-1">Total Investment</p>
                                    <p className="text-green-500 font-bold text-lg">₹{(selectedUser.totalInvestment || 0).toLocaleString()}</p>
                                </div>
                            </div>



                            {/* Wallet Info */}
                            <div className="bg-[#1a1a2e] p-4 rounded-lg border border-teal-500/30">
                                <h5 className="text-lg font-bold text-white mb-3">Crypto Wallet</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Wallet Address</p>
                                        <p className="text-white font-mono break-all text-sm">{userWallet?.wallet_add || 'Not Linked'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Status</p>
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${userWallet?.approve === 1 ? 'bg-green-500/20 text-green-500' :
                                                userWallet?.approve === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                    'bg-red-500/20 text-red-500'
                                            }`}>
                                            {userWallet?.approve === 1 ? 'Approved' : userWallet?.approve === 0 ? 'Pending' : 'Not Approved'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Wallet Balances */}
                            <div>
                                <h5 className="text-lg font-bold text-white mb-3">Wallet Balances</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-[#1a1a2e] p-3 rounded-lg">
                                        <p className="text-gray-400 text-xs mb-1">Monthly ROI</p>
                                        <p className="text-white font-semibold">₹{(selectedUser.mining_bonus || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-[#1a1a2e] p-3 rounded-lg">
                                        <p className="text-gray-400 text-xs mb-1">Level Income</p>
                                        <p className="text-white font-semibold">₹{(selectedUser.level_income || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-[#1a1a2e] p-3 rounded-lg">
                                        <p className="text-gray-400 text-xs mb-1">Total Income</p>
                                        <p className="text-white font-semibold">₹{(selectedUser.total_income || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-[#1a1a2e] p-3 rounded-lg">
                                        <p className="text-gray-400 text-xs mb-1">SOS Withdrawal</p>
                                        <p className="text-white font-semibold">₹{(selectedUser.shopping_tokens || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    className="flex-1 px-6 py-3 bg-[#1a1a2e] text-white rounded-lg font-semibold hover:bg-[#3f3f3f] transition-all"
                                >
                                    Close
                                </button>
                                {isEditing ? (
                                    <button
                                        onClick={handleSaveUser}
                                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                                    >
                                        Save Changes
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleEditUser}
                                        className="flex-1 px-6 py-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-all"
                                    >
                                        Edit User
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
