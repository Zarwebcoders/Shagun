import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Wallet, Gem, ChevronRight } from 'lucide-react';

export default function MiningHistoryTable({ history, loading }) {
    if (loading) {
        return (
            <div className="w-full h-48 flex items-center justify-center bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl border border-teal-500/20">
                <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!history || history.length === 0) {
        return (
            <div className="w-full p-12 flex flex-col items-center justify-center bg-[#1a1a2e]/50 backdrop-blur-xl rounded-2xl border border-teal-500/20 text-gray-500">
                <Gem className="w-12 h-12 mb-4 opacity-20" />
                <p>No mining history found. Start your first session today!</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#1a1a2e]/40 backdrop-blur-xl rounded-2xl border border-teal-500/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    < Gem className="w-5 h-5 text-teal-400" />
                    Mining Session History
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Wallet Address</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">SGN Reward</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cycle Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {history.map((record, index) => (
                            <motion.tr 
                                key={record._id || index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group hover:bg-white/5 transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 text-white font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-teal-500" />
                                            {record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <span className="text-[10px] text-gray-500 ml-5">
                                            {record.created_at ? new Date(record.created_at).toLocaleTimeString() : ''}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-gray-300 font-mono text-xs">
                                        <Wallet className="w-3.5 h-3.5 text-purple-500" />
                                        {record.wallet_address ? 
                                            `${record.wallet_address.substring(0, 8)}...${record.wallet_address.substring(record.wallet_address.length - 8)}` 
                                            : 'N/A'
                                        }
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-teal-400 font-bold">
                                    +{Number(record.amount || 0).toFixed(2)} SGN
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-full max-w-[80px] bg-white/10 rounded-full h-1.5">
                                            <div 
                                                className="bg-gradient-to-r from-teal-500 to-purple-500 h-1.5 rounded-full" 
                                                style={{ width: `${((record.cycle_number || 0) / 24) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {record.cycle_number || '?'}/24
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold border border-green-500/20">
                                        SUCCESS
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-white/5 text-center">
                <button className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium flex items-center gap-1 mx-auto">
                    View Full Archive <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
