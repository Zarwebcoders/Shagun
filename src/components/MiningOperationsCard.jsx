import React, { useState, useEffect, useMemo } from 'react';
import { CpuChipIcon, GiftIcon, ClockIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

export default function MiningOperationsCard({ status, miningPower, earningsToday, lastMinedAt, monthlyCount, onMine, totalMiningCount = 0, stakedBalance = 0, loading = false, isConnected = false }) {
    const currentCycle = ((Number(totalMiningCount || 0) - 1) % 24) + 1;
    const progressPercent = (currentCycle / 24) * 100;

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

                <div className="flex items-center gap-3 justify-between sm:justify-start flex-wrap">
                    <button
                        onClick={onMine}
                        disabled={loading}
                        className="px-6 py-2 rounded-xl border border-teal-500/50 font-bold transition-all duration-300 flex items-center gap-2 text-sm shadow-lg bg-gradient-brand text-white hover:shadow-teal-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CpuChipIcon className={`w-4 h-4 ${loading ? "animate-spin" : "animate-pulse"}`} />
                        {loading ? "Processing..." : "Start Mining"}
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 h-fit">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                            Ready
                        </div>

                        <div className="px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 h-fit">
                            <BriefcaseIcon className="w-3.5 h-3.5" />
                            Staked: {stakedBalance}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cycle Progress Bar */}
            <div className="mb-6 space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                    <span className="text-gray-400">Mining Cycle Progress</span>
                    <span className="text-teal-400">Cycle {currentCycle} / 24</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                        className="h-full bg-gradient-to-r from-teal-500 via-purple-500 to-teal-500 animate-shimmer" 
                        style={{ width: `${progressPercent}%`, backgroundSize: '200% 100%' }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                <div className="bg-[#0f0f1a]/60 p-4 rounded-2xl border border-white/5">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Mined (This Month)</span>
                    <div className="text-2xl font-bold text-white mt-1">{monthlyCount} Sessions</div>
                    <p className="text-[10px] text-teal-500 mt-1">Total Power: {miningPower || "0 TH/s"}</p>
                </div>
                <div className="bg-[#0f0f1a]/60 p-4 rounded-2xl border border-white/5">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Total Mining Bonus</span>
                    <div className="text-2xl font-bold text-purple-500 mt-1">
                        {isConnected ? `SGN ${Number(earningsToday || 0).toFixed(2)}` : "****"}
                    </div>
                    {!isConnected && <p className="text-[10px] text-gray-500 mt-1 italic">Connect wallet to view</p>}
                </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <ClockIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wider">Last Sync Time</p>
                        <p className="text-white text-xs font-mono">
                            {lastMinedAt ? new Date(lastMinedAt).toLocaleString() : "Never Mined"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
