import React from 'react';
import { CpuChipIcon, GiftIcon } from '@heroicons/react/24/outline';

export default function MiningOperationsCard({ status, miningPower, earningsToday, onClaimROI }) {
    return (
        <div className="bg-[#1a1a2e]/40 backdrop-blur-xl border border-teal-500/20 rounded-3xl p-6 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[80px]"></div>

            <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <CpuChipIcon className="w-5 h-5 text-green-400" />
                            Mining Operations
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">System status and performance</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-start">
                    <button
                        onClick={onClaimROI}
                        className="px-6 py-2 bg-gradient-brand text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-105 transition-all duration-300 active:scale-95 text-sm flex items-center gap-2"
                    >
                        <GiftIcon className="w-4 h-4" />
                        Claim ROI
                    </button>
                    <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 h-fit">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        {status || "Active"}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-[#0f0f1a]/60 p-4 rounded-2xl border border-white/5">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Monthly Percentage</span>
                    <div className="text-2xl font-bold text-white mt-1">{miningPower || "0 TH/s"}</div>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-400 to-emerald-600 h-full w-[0%] animate-[width_1s_ease-out_forwards]" style={{ width: '75%' }}></div>
                    </div>
                </div>
                <div className="bg-[#0f0f1a]/60 p-4 rounded-2xl border border-white/5">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Total Income</span>
                    <div className="text-2xl font-bold text-purple-500 mt-1">₹{(earningsToday || 0).toFixed(2)}</div>
                    <button className="text-xs text-teal-400 mt-2 hover:text-teal-300 transition-colors">View History &rarr;</button>
                </div>
            </div>
        </div>
    );
}
