import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { SparklesIcon, CalendarIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function MiningBonus() {
    const [bonuses, setBonuses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBonuses();
    }, []);

    const fetchBonuses = async () => {
        try {
            const { data } = await client.get('/mining-bonus');
            setBonuses(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching mining bonuses:", error);
            toast.error("Failed to load bonuses");
            setLoading(false);
        }
    };

    const totalBonus = bonuses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-6"
        >
            {/* Header Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <CurrencyRupeeIcon className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="text-amber-400 font-medium">Total Mining Bonus</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">₹{totalBonus.toFixed(2)}</p>
                    </div>
                </div>
            </motion.div>

            {/* History Table */}
            <motion.div variants={itemVariants} className="bg-[#1a1a2e]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <SparklesIcon className="w-6 h-6 text-amber-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Mining History</h2>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Amount</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="3" className="p-8 text-center text-gray-500">Loading history...</td></tr>
                            ) : bonuses.length === 0 ? (
                                <tr><td colSpan="3" className="p-8 text-center text-gray-500">No mining bonuses yet</td></tr>
                            ) : (
                                bonuses.map((bonus) => (
                                    <tr key={bonus._id || bonus.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-800 rounded-lg">
                                                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <span className="text-sm text-gray-300">
                                                    {new Date(bonus.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-green-400">
                                            +₹{bonus.amount}
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                                CREDITED
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
}
