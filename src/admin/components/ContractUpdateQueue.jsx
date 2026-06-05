import { useState, useEffect } from 'react';
import client from '../../api/client';
import { toast } from 'react-hot-toast';
import {
    QueueListIcon,
    ArrowPathIcon,
    ClockIcon,
    CodeBracketIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function ContractUpdateQueue() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        try {
            const { data } = await client.get('/contract-queue');
            setQueue(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching queue:", error);
            toast.error("Failed to load queue");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'processing': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Contract Update Queue</h2>
                    <p className="text-gray-400">Monitor smart contract update operations.</p>
                </div>

                <button
                    onClick={fetchQueue}
                    className="p-2 bg-[#1a1a2e] border border-white/10 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="bg-[#1a1a2e]/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Rate</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Phase</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Target Contract</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">TX Hash</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading queue...</td></tr>
                            ) : queue.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No items in queue</td></tr>
                            ) : (
                                queue.map((item) => (
                                    <tr key={item._id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm text-white font-mono">{item.rate}</td>
                                        <td className="p-4 text-sm text-gray-300">{item.phase || '-'}</td>
                                        <td className="p-4 text-sm text-gray-400 font-mono truncate max-w-[150px]" title={item.target_contract}>
                                            {item.target_contract || '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                                                {item.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-blue-400 font-mono truncate max-w-[150px]">
                                            {item.tx_hash ? (
                                                <a href={`https://bscscan.com/tx/${item.tx_hash}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    {item.tx_hash.substring(0, 10)}...
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(item.created_at).toLocaleString()}
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
