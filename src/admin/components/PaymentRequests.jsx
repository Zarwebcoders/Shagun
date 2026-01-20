import { useState, useEffect } from 'react';
import client from '../../api/client';
import { toast } from 'react-hot-toast';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function PaymentRequests() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPayments = async () => {
        try {
            const { data } = await client.get('/payments');
            setPayments(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching payments:", error);
            toast.error("Failed to fetch payments");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await client.put(`/payments/${id}`, { approve: status });
            toast.success(`Payment ${status === 1 ? 'Approved' : 'Rejected'} Successfully`);
            fetchPayments();
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

        const labels = {
            1: "Approved",
            0: "Rejected",
            2: "Pending"
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles[2]}`}>
                {labels[status] || "Pending"}
            </span>
        );
    };

    const filteredPayments = payments.filter(p =>
        p.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Payment Requests</h2>
                    <p className="text-gray-400">Manage all user payment entries based on schema.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search ID/User..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#1a1a2e] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
                        />
                    </div>
                    <button
                        onClick={fetchPayments}
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
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Created At</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">User ID</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Transaction ID</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Amount</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Vendor ID</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">Loading payments...</td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">No payments found</td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment._id || payment.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                                            {new Date(payment.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-sm text-white font-mono">
                                            {payment.user_id}
                                        </td>
                                        <td className="p-4 text-sm text-blue-400 font-mono">
                                            {payment.transaction_id}
                                        </td>
                                        <td className="p-4 text-sm text-white font-bold">
                                            ₹{payment.amount}
                                        </td>
                                        <td className="p-4 text-sm text-gray-400 font-mono">
                                            {payment.vendor_id || "-"}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={payment.approve} />
                                        </td>
                                        <td className="p-4 text-right">
                                            {payment.approve === 2 && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(payment._id || payment.id, 1)}
                                                        className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(payment._id || payment.id, 0)}
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
