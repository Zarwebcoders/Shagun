import React, { useState, useEffect, useMemo } from 'react';
import { CpuChipIcon, GiftIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function MiningOperationsCard({ status, miningPower, earningsToday, lastMinedAt, monthlyCount, onMine }) {
    const [timeLeft, setTimeLeft] = useState("");
    const [canMine, setCanMine] = useState(false);

    const nextAvailable = useMemo(() => {
        if (!lastMinedAt) return new Date();
        return new Date(new Date(lastMinedAt).getTime() + 24 * 60 * 60 * 1000);
    }, [lastMinedAt]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const difference = nextAvailable - now;

            if (difference <= 0) {
                setTimeLeft("");
                setCanMine(true);
            } else {
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                setCanMine(false);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [nextAvailable]);
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
                        onClick={onMine}
                        disabled={!canMine}
                        className={`px-6 py-2 rounded-xl border border-teal-500/50 font-bold transition-all duration-300 flex items-center gap-2 text-sm shadow-lg ${
                            canMine 
                            ? "bg-gradient-brand text-white hover:shadow-teal-500/40 hover:-translate-y-0.5 active:translate-y-0" 
                            : "bg-gray-800/50 text-gray-500 border-white/5 cursor-not-allowed"
                        }`}
                    >
                        <CpuChipIcon className={`w-4 h-4 ${canMine ? "animate-pulse" : ""}`} />
                        {canMine ? "Start Mining" : timeLeft || "Processing..."}
                    </button>
                    <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 h-fit">
                        <span className={`w-2 h-2 rounded-full bg-green-500 ${canMine ? "animate-ping" : "opacity-50"}`}></span>
                        {canMine ? "Ready" : "Mining Active"}
                    </div>
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
                    <div className="text-2xl font-bold text-purple-500 mt-1">₹{(earningsToday || 0).toFixed(2)}</div>
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
                {!canMine && (
                    <div className="text-right">
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider">Next Session</p>
                        <p className="text-teal-400 text-xs font-bold">{timeLeft}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
