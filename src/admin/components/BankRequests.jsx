import { useState, useEffect } from 'react';
import client from '../../api/client';
import { toast } from 'react-hot-toast';
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function BankRequests() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAccounts = async () => {
        try {
            const { data } = await client.get('/my-account/all');
            setAccounts(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching accounts:", error);
            toast.error("Failed to fetch bank requests");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await client.put(`/my-account/${id}`, { approve: status });
            toast.success(`Account ${status === 1 ? 'Approved' : 'Rejected'} Successfully`);
            fetchAccounts();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            1: "bg-green-500/10 text-green-400 border-green-500/20",
            0: "bg-red-500/10 text-red-400 border-red-500/20",
            2: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        };
        const labels = { 1: "Verified", 0: "Rejected", 2: "Pending" };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const filteredAccounts = accounts.filter(acc =>
        (acc.acc_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (acc.updated_at && acc.user_id?.toString().includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Bank Requests</h2>
                    <p className="text-gray-400">Manage user bank account approvals.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#1a1a2e] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 w-64"
                        />
                    </div>
                    <button
                        onClick={fetchAccounts}
                        className="p-2 bg-[#1a1a2e] border border-white/10 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="bg-[#1a1a2e]/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">User</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Bank Name</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Account Holder</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Account No</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">IFSC</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading...</td></tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No requests found</td></tr>
                            ) : (
                                filteredAccounts.map((acc) => (
                                    <tr key={acc._id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm text-gray-300">
                                            {acc.user_id ? acc.user_id : "User"}
                                        </td>
                                        <td className="p-4 text-sm text-white font-medium">{acc.back_name}</td>
                                        <td className="p-4 text-sm text-gray-300">{acc.acc_name}</td>
                                        <td className="p-4 text-sm text-white font-mono">{acc.acc_num}</td>
                                        <td className="p-4 text-sm text-gray-400 font-mono">{acc.back_code}</td>
                                        <td className="p-4"><StatusBadge status={acc.approve} /></td>
                                        <td className="p-4 text-right">
                                            {acc.approve === 2 && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(acc._id, 1)}
                                                        className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(acc._id, 0)}
                                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircleIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
