"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Clock, Users, ShieldCheck } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../../api/client"
import Pagination from "../../components/common/Pagination"

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [selectedUser, setSelectedUser] = useState(null)
    const [showUserModal, setShowUserModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editFormData, setEditFormData] = useState({})

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

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



    const [userStats, setUserStats] = useState({ totalUsers: 0, activeUsers: 0, totalAdmins: 0 });

    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearch]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 10,
                search: debouncedSearch
            };
            const { data } = await client.get('/users', { params });

            setUsers(data.users || []);
            setPages(data.pages || 1);
            setTotalUsers(data.total || 0);
            if (data.stats) {
                setUserStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    // ... (rest of methods)

    // Layout changes


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
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">User Management</h2>
                    <p className="text-gray-400 mt-1">Manage and monitor all platform users</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-[#0f0f1a] rounded-xl p-3 border border-teal-500/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Stats Cards */}
                    <div className="flex flex-wrap gap-4">
                        {/* Total Users */}
                        <div className="flex items-center gap-3 bg-[#0f0f1a] border border-blue-500/20 px-4 py-2 rounded-lg min-w-[160px]">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs">Total Users</p>
                                <p className="text-white text-xl font-bold">{userStats.totalUsers}</p>
                            </div>
                        </div>
                        {/* Active Users */}
                        <div className="flex items-center gap-3 bg-[#0f0f1a] border border-green-500/20 px-4 py-2 rounded-lg min-w-[160px]">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs">Active Users</p>
                                <p className="text-white text-xl font-bold">{userStats.activeUsers}</p>
                            </div>
                        </div>
                        {/* Total Admin */}
                        <div className="flex items-center gap-3 bg-[#0f0f1a] border border-purple-500/20 px-4 py-2 rounded-lg min-w-[160px]">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs">Total Admin</p>
                                <p className="text-white text-xl font-bold">{userStats.totalAdmins}</p>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="w-full md:w-1/3">
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
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-[#1a1a2e] text-center">
                            <tr>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm text-left">User Details</th>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Identity</th>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Password</th>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Tokens</th>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Incomes (₹)</th>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Total Income</th>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Mining Stats</th>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Settings</th>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Timestamps</th>
                                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-500/30 text-center">
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-8 text-center text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-8 text-center text-gray-400">
                                        No users found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-[#1a1a2e] transition-colors">
                                        {/* User Details */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 text-left">
                                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{user.full_name || 'Unknown'}</p>
                                                    <p className="text-gray-400 text-xs">{user.email}</p>
                                                    <p className="text-gray-500 text-xs">{user.mobile || 'No Mobile'}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Identity */}
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="text-teal-400 font-mono text-xs bg-teal-500/10 px-1 rounded">UID: {user.user_id || 'N/A'}</span>
                                                <span className="text-gray-400 text-xs">Ref: {user.referral_id || 'N/A'}</span>
                                                <span className="text-gray-500 text-xs">Spon: {user.sponsor_id || 'N/A'}</span>
                                            </div>
                                        </td>

                                        {/* Password */}
                                        <td className="px-6 py-4 text-sm">
                                            <div className="group relative">
                                                <span className="text-gray-400 text-xs font-mono cursor-pointer hover:text-white transition-colors">
                                                    {user.password ? '••••••' : 'No Password'}
                                                </span>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                    {user.password || 'N/A'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Tokens */}
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex justify-between w-full gap-2">
                                                    <span className="text-gray-500 text-xs">Airdrop:</span>
                                                    <span className="text-white text-xs">{Number(user.airdrop_tokons || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between w-full gap-2">
                                                    <span className="text-gray-500 text-xs">Real:</span>
                                                    <span className="text-white text-xs">{Number(user.real_tokens || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between w-full gap-2">
                                                    <span className="text-gray-500 text-xs">Shop:</span>
                                                    <span className="text-white text-xs">{Number(user.shopping_tokons || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Incomes */}
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex justify-between w-full gap-2">
                                                    <span className="text-gray-500 text-xs">Mining:</span>
                                                    <span className="text-white text-xs">{Number(user.mining_bonus || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between w-full gap-2">
                                                    <span className="text-gray-500 text-xs">Sponsor:</span>
                                                    <span className="text-white text-xs">{Number(user.sponsor_income || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between w-full gap-2">
                                                    <span className="text-gray-500 text-xs">Level:</span>
                                                    <span className="text-white text-xs">{Number(user.level_income || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between w-full gap-2">
                                                    <span className="text-gray-500 text-xs">Annual:</span>
                                                    <span className="text-white text-xs">{Number(user.anual_bonus || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Total Income */}
                                        <td className="px-6 py-4 text-green-500 font-bold text-sm">
                                            ₹{Number(user.total_income || 0).toLocaleString()}
                                        </td>

                                        {/* Mining Stats */}
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col items-center gap-1">
                                                {user.last_mining_data ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-white text-xs">
                                                            {new Date(user.last_mining_data).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-gray-500 text-[10px]">
                                                            {new Date(user.last_mining_data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-white text-xs">-</span>
                                                )}
                                                <span className="text-gray-500 text-xs mt-1">Count: {user.mining_count_thismounth || 0}</span>
                                            </div>
                                        </td>

                                        {/* Settings (Admin/Deleted) */}
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col gap-2 bg-[#0f0f1a] p-2 rounded-lg border border-teal-500/20">
                                                <label className="flex items-center justify-between gap-2 cursor-pointer">
                                                    <span className="text-xs text-gray-400">Admin</span>
                                                    <div className="relative inline-block w-8 h-4 align-middle select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={user.is_admin === 1}
                                                            onChange={async (e) => {
                                                                try {
                                                                    const newVal = e.target.checked ? 1 : 0;
                                                                    await client.put(`/users/${user._id}`, { is_admin: newVal });
                                                                    fetchUsers();
                                                                    toast.success(`User ${newVal ? 'promoted to Admin' : 'demoted from Admin'}`);
                                                                } catch (err) {
                                                                    toast.error("Update failed");
                                                                }
                                                            }}
                                                            className="sr-only"
                                                        />
                                                        <div className={`block w-8 h-4 rounded-full transition-colors ${user.is_admin === 1 ? 'bg-teal-500' : 'bg-gray-600'}`}></div>
                                                        <div className={`absolute left-0 bottom-0 top-0 w-4 h-4 rounded-full bg-white transition-transform transform ${user.is_admin === 1 ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between gap-2 cursor-pointer">
                                                    <span className="text-xs text-gray-400">Active</span>
                                                    <div className="relative inline-block w-8 h-4 align-middle select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={user.is_deleted === 0}
                                                            onChange={async (e) => {
                                                                try {
                                                                    // If checked (Active), is_deleted = 0. If unchecked (Inactive), is_deleted = 1
                                                                    const newVal = e.target.checked ? 0 : 1;
                                                                    await client.put(`/users/${user._id}`, { is_deleted: newVal });
                                                                    fetchUsers();
                                                                    toast.success(`User marked as ${newVal === 0 ? 'Active' : 'Deleted'}`);
                                                                } catch (err) {
                                                                    toast.error("Update failed");
                                                                }
                                                            }}
                                                            className="sr-only"
                                                        />
                                                        <div className={`block w-8 h-4 rounded-full transition-colors ${user.is_deleted === 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                        <div className={`absolute left-0 bottom-0 top-0 w-4 h-4 rounded-full bg-white transition-transform transform ${user.is_deleted === 0 ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                    </div>
                                                </label>
                                            </div>
                                        </td>

                                        {/* Timestamps */}
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col items-center">
                                                <span className="text-gray-400 text-xs" title="Joined">{new Date(user.create_at).toLocaleDateString()}</span>
                                                <span className="text-gray-600 text-[10px]" title="Updated">{new Date(user.update_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewUser(user)}
                                                    className="p-2 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-all"
                                                    title="View Full Details"
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
                    <Pagination
                        currentPage={page}
                        totalPages={pages}
                        onPageChange={setPage}
                        totalResults={totalUsers}
                        itemsPerPage={10}
                        itemName="users"
                    />
                )}
            </div>

            {/* User Details Modal */}
            {
                showUserModal && selectedUser && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
                        <div className="bg-[#0f0f1a] rounded-xl p-6 max-w-4xl w-full border border-teal-500/30 max-h-[90vh] overflow-y-auto">
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
                                        {selectedUser.full_name ? selectedUser.full_name.charAt(0) : '?'}
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-bold text-white">{selectedUser.full_name}</h4>
                                        <p className="text-gray-400">{selectedUser.email}</p>
                                        <p className="text-teal-500 text-sm font-mono mt-1">{selectedUser.user_id}</p>
                                    </div>
                                </div>

                                {/* User Information Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                        <p className="text-gray-400 text-sm mb-1">Mobile</p>
                                        <p className="text-white font-semibold">{selectedUser.mobile || 'Not provided'}</p>
                                    </div>
                                    <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                        <p className="text-gray-400 text-sm mb-1">Referral ID</p>
                                        <p className="text-white font-semibold">{selectedUser.referral_id || 'N/A'}</p>
                                    </div>
                                    <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                        <p className="text-gray-400 text-sm mb-1">Sponsor ID</p>
                                        <p className="text-white font-semibold">{selectedUser.sponsor_id || 'N/A'}</p>
                                    </div>
                                    <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                        <p className="text-gray-400 text-sm mb-1">Join Date</p>
                                        <p className="text-white font-semibold">{selectedUser.create_at ? new Date(selectedUser.create_at).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                        <p className="text-gray-400 text-sm mb-1">Last Mining</p>
                                        <p className="text-white font-semibold">{selectedUser.last_mining_data || 'Never'}</p>
                                    </div>
                                    <div className="bg-[#1a1a2e] p-4 rounded-lg">
                                        <p className="text-gray-400 text-sm mb-1">Mining Count (Month)</p>
                                        <p className="text-white font-semibold">{selectedUser.mining_count_thismounth || '0'}</p>
                                    </div>
                                </div>

                                {/* Financial Info */}
                                <div>
                                    <h5 className="text-lg font-bold text-white mb-3">Financial Overview</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-[#1a1a2e] p-3 rounded-lg border border-teal-500/10">
                                            <p className="text-gray-400 text-xs mb-1">Airdrop Tokens</p>
                                            <p className="text-teal-400 font-bold">{Number(selectedUser.airdrop_tokons || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-[#1a1a2e] p-3 rounded-lg border border-teal-500/10">
                                            <p className="text-gray-400 text-xs mb-1">Real Tokens</p>
                                            <p className="text-white font-bold">{Number(selectedUser.real_tokens || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-[#1a1a2e] p-3 rounded-lg border border-teal-500/10">
                                            <p className="text-gray-400 text-xs mb-1">Shopping Tokens</p>
                                            <p className="text-white font-bold">{Number(selectedUser.shopping_tokons || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-[#1a1a2e] p-3 rounded-lg border border-teal-500/10">
                                            <p className="text-gray-400 text-xs mb-1">Total Income</p>
                                            <p className="text-green-500 font-bold">₹{Number(selectedUser.total_income || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Income Breakdown */}
                                <div>
                                    <h5 className="text-lg font-bold text-white mb-3">Income Breakdown</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-[#1a1a2e] p-3 rounded-lg">
                                            <p className="text-gray-400 text-xs mb-1">Mining Bonus</p>
                                            <p className="text-white font-semibold">₹{Number(selectedUser.mining_bonus || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-[#1a1a2e] p-3 rounded-lg">
                                            <p className="text-gray-400 text-xs mb-1">Sponsor Income</p>
                                            <p className="text-white font-semibold">₹{Number(selectedUser.sponsor_income || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-[#1a1a2e] p-3 rounded-lg">
                                            <p className="text-gray-400 text-xs mb-1">Level Income</p>
                                            <p className="text-white font-semibold">₹{Number(selectedUser.level_income || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-[#1a1a2e] p-3 rounded-lg">
                                            <p className="text-gray-400 text-xs mb-1">Annual Bonus</p>
                                            <p className="text-white font-semibold">₹{Number(selectedUser.anual_bonus || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Wallet Info (External) */}
                                <div className="bg-[#1a1a2e] p-4 rounded-lg border border-teal-500/30">
                                    <h5 className="text-lg font-bold text-white mb-3">Linked Crypto Wallet</h5>
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
                )
            }
        </div >
    )
}
