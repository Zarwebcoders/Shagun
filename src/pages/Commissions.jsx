"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import client from "../api/client"
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    UserIcon,
    CalendarIcon,
    HashtagIcon
} from '@heroicons/react/24/outline'

export default function Commissions() {
    const [commissions, setCommissions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCommissions = async () => {
            try {
                const { data } = await client.get('/commissions/my-commissions')
                setCommissions(data)
            } catch (error) {
                console.error("Error fetching commissions:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchCommissions()
    }, [])

    const totalCommission = commissions.reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return (
        <div className="w-full space-y-8 max-w-[1400px] mx-auto min-h-screen pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-8 md:p-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Commission <span className="text-black">History</span>
                    </h2>
                    <p className="text-white/80 text-lg max-w-2xl mb-8">
                        Track your earnings from your team's activity.
                    </p>

                    <div className="inline-flex items-center gap-4 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <BanknotesIcon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-white/70">Total Earnings</p>
                            <p className="text-2xl font-bold text-white">${totalCommission.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Commissions Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-3xl border border-teal-500/20 overflow-hidden"
            >
                <div className="p-6 border-b border-teal-500/10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ArrowTrendingUpIcon className="w-5 h-5 text-teal-400" />
                        Recent Commissions
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">From User</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Level</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Percentage</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Stake Amount</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Create Date</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500 animate-pulse">Loading commissions...</td></tr>
                            ) : commissions.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No commission history found</td></tr>
                            ) : (
                                commissions.map((item) => (
                                    <tr key={item._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                                                    <UserIcon className="w-4 h-4 text-teal-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{item.from_user_id?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500">{item.from_user_id?.email || item.from_user_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-medium">
                                                Lvl {item.level}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-300 font-mono">
                                            {item.percentage}%
                                        </td>
                                        <td className="p-4 text-sm text-gray-300 font-mono">
                                            ${Number(item.stake_amount || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <CalendarIcon className="w-4 h-4" />
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-emerald-400 font-bold font-mono text-lg">
                                                +${Number(item.amount).toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}
