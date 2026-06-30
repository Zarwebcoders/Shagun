import { useState, useEffect } from 'react';
import client from '../../api/client';
import { toast } from 'react-hot-toast';
import {
    CommandLineIcon,
    ArrowPathIcon,
    ClockIcon,
    HashtagIcon
} from '@heroicons/react/24/outline';

export default function SystemMigrations() {
    const [migrations, setMigrations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMigrations = async () => {
        try {
            const { data } = await client.get('/migrations');
            setMigrations(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching migrations:", error);
            toast.error("Failed to load migrations");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMigrations();
    }, []);

    const formatTime = (timestamp) => {
        // Assume timestamp is UNIX seconds as per int(11) typical usage
        return new Date(timestamp * 1000).toLocaleString();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">System Migrations</h2>
                    <p className="text-gray-400">View system database migration records.</p>
                </div>

                <button
                    onClick={fetchMigrations}
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
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Version</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Class</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Group</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Namespace</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Time</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Batch</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading records...</td></tr>
                            ) : migrations.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No migration records found</td></tr>
                            ) : (
                                migrations.map((mig) => (
                                    <tr key={mig._id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm text-blue-400 font-mono">{mig.version}</td>
                                        <td className="p-4 text-sm text-white">{mig.class}</td>
                                        <td className="p-4 text-sm text-gray-400">{mig.group}</td>
                                        <td className="p-4 text-sm text-gray-400 font-mono">{mig.namespace}</td>
                                        <td className="p-4 text-sm text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <ClockIcon className="w-4 h-4 text-gray-500" />
                                                {formatTime(mig.time)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-white">
                                            <span className="px-2 py-1 bg-white/5 rounded text-xs border border-white/10">
                                                {mig.batch}
                                            </span>
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
