"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import client from "../api/client"
import MiningHistoryTable from "../components/MiningHistoryTable"
import { CpuChipIcon } from '@heroicons/react/24/outline'

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function MiningHistory() {
    const [miningHistory, setMiningHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await client.get('/users/mining-history');
                setMiningHistory(data || []);
            } catch (error) {
                console.error("Error fetching mining history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full space-y-8 max-w-[1600px] mx-auto"
        >
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                    <CpuChipIcon className="w-8 h-8 text-teal-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Mining History</h1>
                    <p className="text-gray-400 text-sm">Detailed logs of all your mining sessions</p>
                </div>
            </motion.div>

            <motion.section variants={itemVariants} className="w-full">
                <MiningHistoryTable 
                    history={miningHistory} 
                    loading={loading} 
                />
            </motion.section>
        </motion.div>
    )
}
