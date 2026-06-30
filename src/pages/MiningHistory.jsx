"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import client from "../api/client"
import MiningHistoryTable from "../components/MiningHistoryTable"
import { CpuChipIcon } from '@heroicons/react/24/outline'
import { useWeb3 } from "../hooks/useWeb3"
import { ethers } from "ethers"
import DateRangePicker from "../components/DateRangePicker.jsx"
import ExportButtons from "../components/ExportButtons.jsx"

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


const CONTRACT_ADDRESS = "0x8385de2e557A90bc64e22B210ae55F00EFf488d7"
const MINING_CLAIMED_TOPIC = "0x" + ethers.id("MiningClaimed(address,uint256,uint256)").slice(2)
const MINING_LAPSED_TOPIC = "0x" + ethers.id("MiningSlotLapsed(address,uint256,uint256)").slice(2)

async function fetchMiningEventsFromScan(walletAddress) {
    const paddedAddress = "0x000000000000000000000000" + walletAddress.toLowerCase().replace("0x", "")

    const fetchForTopic = async (topic0) => {
        const params = new URLSearchParams({
            module: "logs",
            action: "getLogs",
            address: CONTRACT_ADDRESS,
            topic0: topic0,
            topic1: paddedAddress,
            topic0_1_opr: "and",
            fromBlock: "0",
            toBlock: "latest"
        })
        const res = await fetch(`https://polygon.blockscout.com/api?${params}`)
        if (!res.ok) return [];
        const json = await res.json()
        if (json.status === "1" && json.result) return json.result;
        return [];
    }

    try {
        const [claimedLogs, lapsedLogs] = await Promise.all([
            fetchForTopic(MINING_CLAIMED_TOPIC),
            fetchForTopic(MINING_LAPSED_TOPIC)
        ]);
        return [...claimedLogs, ...lapsedLogs];
    } catch (err) {
        console.error("Blockscout fetch error:", err);
        return [];
    }
}

function decodeMiningLog(log) {
    const data = log.data.replace("0x", "")
    const slotHex = data.slice(0, 64)
    const rewardHex = data.slice(64, 128)
    
    const slotNumber = BigInt("0x" + (slotHex || "0"))
    const rewardAmount = BigInt("0x" + (rewardHex || "0"))
    return { slotNumber, rewardAmount }
}

export default function MiningHistory() {
    const [miningHistory, setMiningHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const { isConnected, account, contract, provider } = useWeb3();

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const { data } = await client.get('/users/mining-history');
                let finalHistory = data || [];

                if (isConnected && contract && account) {
                    try {
                        const [completed, stakeTime] = await Promise.all([
                            contract.userMiningSlotsCompleted(account).catch(() => 0n),
                            contract.userStakeTime(account).catch(() => 0n),
                        ]);

                        const completedCount = Number(completed);
                        const stakeTimeNum = Number(stakeTime);

                        let scanLogs = [];
                        try {
                            scanLogs = await fetchMiningEventsFromScan(account);
                        } catch (scanErr) {
                            console.warn("Blockscout logs fetch failed:", scanErr);
                        }

                        // Always query RPC to ensure no missing events (including lapsed ones)
                        const filterClaimed = contract.filters.MiningClaimed(account);
                        const filterLapsed = contract.filters.MiningSlotLapsed(account);
                        
                        let eventsClaimed = [];
                        let eventsLapsed = [];
                        try {
                            [eventsClaimed, eventsLapsed] = await Promise.all([
                                contract.queryFilter(filterClaimed, 0, 'latest').catch(() => []),
                                contract.queryFilter(filterLapsed, 0, 'latest').catch(() => [])
                            ]);
                        } catch (rpcErr) {
                            console.warn("RPC queryFilter failed:", rpcErr);
                        }

                        const rpcLogs = [
                            ...eventsClaimed.map(ev => ({
                                _isEthersEvent: true,
                                _isClaimed: true,
                                data: ev.data,
                                topics: ev.topics,
                                transactionHash: ev.transactionHash,
                                blockNumber: ev.blockNumber,
                                timeStamp: null,
                                _event: ev,
                            })),
                            ...eventsLapsed.map(ev => ({
                                _isEthersEvent: true,
                                _isLapsed: true,
                                data: ev.data,
                                topics: ev.topics,
                                transactionHash: ev.transactionHash,
                                blockNumber: ev.blockNumber,
                                timeStamp: null,
                                _event: ev,
                            }))
                        ];

                        // Merge scan logs and RPC logs to ensure maximum coverage
                        const logMap = new Map();

                        // Add scan logs
                        scanLogs.forEach(log => {
                            if (log.topics && log.topics.length > 0) {
                                const eventTopic = log.topics[0].toLowerCase();
                                const isClaimedTopic = eventTopic === MINING_CLAIMED_TOPIC.toLowerCase();
                                const isLapsedTopic = eventTopic === MINING_LAPSED_TOPIC.toLowerCase();
                                
                                if (isClaimedTopic || isLapsedTopic) {
                                    const key = `${log.transactionHash}-${log.logIndex || log.topics[1] || ''}-${isLapsedTopic ? 'lapsed' : 'claimed'}`;
                                    logMap.set(key, {
                                        ...log,
                                        _isLapsed: isLapsedTopic
                                    });
                                }
                            }
                        });

                        // Add RPC logs (overwriting or adding missing ones)
                        rpcLogs.forEach(log => {
                            const key = `${log.transactionHash}-${log.topics[1] || ''}-${log._isLapsed ? 'lapsed' : 'claimed'}`;
                            if (!logMap.has(key)) {
                                logMap.set(key, log);
                            } else {
                                const existing = logMap.get(key);
                                existing._isEthersEvent = true;
                                existing._isLapsed = log._isLapsed;
                                existing._event = log._event;
                            }
                        });

                        const rawLogs = Array.from(logMap.values());

                        const decodedHistory = await Promise.all(
                            rawLogs.map(async (log) => {
                                try {
                                    let slotNumber = 0n;
                                    let rewardAmount = 0n;
                                    let txHash = log.transactionHash || "";
                                    let timestamp = Date.now();
                                    let isLapsed = false;

                                    if (log._isEthersEvent) {
                                        const ev = log._event;
                                        slotNumber = ev.args?.slotNumber ?? ev.args?.[1] ?? 0n;
                                        rewardAmount = ev.args?.rewardAmount ?? ev.args?.lapsedAmount ?? ev.args?.[2] ?? 0n;
                                        isLapsed = !!log._isLapsed;
                                        try {
                                            const block = await ev.getBlock();
                                            if (block && block.timestamp) {
                                                timestamp = block.timestamp * 1000;
                                            }
                                        } catch {}
                                    } else {
                                        if (!log.topics || log.topics.length === 0) return null;
                                        const eventTopic = log.topics[0].toLowerCase();
                                        const isClaimedTopic = eventTopic === MINING_CLAIMED_TOPIC.toLowerCase();
                                        const isLapsedTopic = eventTopic === MINING_LAPSED_TOPIC.toLowerCase();

                                        if (!isClaimedTopic && !isLapsedTopic) return null;
                                        isLapsed = isLapsedTopic || !!log._isLapsed;

                                        try {
                                            const decoded = decodeMiningLog(log);
                                            slotNumber = decoded.slotNumber;
                                            rewardAmount = decoded.rewardAmount;
                                        } catch {}

                                        if (log.timeStamp) {
                                            const rawTs = log.timeStamp.toString();
                                            const tsDecimal = rawTs.startsWith("0x") ? parseInt(rawTs, 16) : parseInt(rawTs, 10);
                                            if (!isNaN(tsDecimal)) {
                                                timestamp = tsDecimal * 1000;
                                            }
                                        } else if (log.blockNumber) {
                                            try {
                                                const bnStr = log.blockNumber.toString();
                                                const bn = bnStr.startsWith("0x") ? parseInt(bnStr, 16) : parseInt(bnStr, 10);
                                                const block = await provider.getBlock(bn);
                                                if (block && block.timestamp) timestamp = block.timestamp * 1000;
                                            } catch {}
                                        }
                                    }

                                    return {
                                        _id: `${txHash}-${slotNumber}-${isLapsed ? 'lapsed' : 'claimed'}`,
                                        created_at: new Date(timestamp).toISOString(),
                                        wallet_address: account,
                                        amount: ethers.formatEther(rewardAmount),
                                        cycle_number: Number(slotNumber),
                                        hash: txHash,
                                        status: isLapsed ? "LAPSED" : "SUCCESS"
                                    };
                                } catch (itemErr) {
                                    console.warn("Error decoding log item:", itemErr);
                                    return null;
                                }
                            })
                        );

                        const cleanHistory = decodedHistory.filter(item => item !== null);

                        const lapsedEvents = cleanHistory.filter(item => item.status === "LAPSED").sort((a, b) => a.cycle_number - b.cycle_number);
                        const firstSuccess = cleanHistory.find(item => item.status === "SUCCESS" && parseFloat(item.amount) > 0) ||
                                             (data || []).find(item => (item.status === "SUCCESS" || !item.status) && parseFloat(item.amount) > 0);
                        const standardAmount = firstSuccess ? firstSuccess.amount : "655.5316";

                        const maxCycle = Math.max(
                            completedCount,
                            ...(data || []).map(item => item.cycle_number || 0),
                            ...cleanHistory.map(item => item.cycle_number || 0)
                        );

                        const finalHistoryList = [];

                        for (let s = 1; s <= maxCycle; s++) {
                            const successEvent = cleanHistory.find(item => item.cycle_number === s && item.status === "SUCCESS");
                            const dbRecord = (data || []).find(item => item.cycle_number === s);

                            if (successEvent) {
                                finalHistoryList.push(successEvent);
                            } else if (dbRecord && dbRecord.status !== "LAPSED") {
                                finalHistoryList.push({
                                    ...dbRecord,
                                    status: "SUCCESS"
                                });
                            } else {
                                let hash = "lapsed-on-chain";
                                let timestamp = (stakeTimeNum + s * 15 * 24 * 3600) * 1000;
                                let created_at = new Date(timestamp).toISOString();

                                const correspondingLapse = lapsedEvents.find(item => item.cycle_number >= s);
                                if (correspondingLapse) {
                                    hash = correspondingLapse.hash;
                                    created_at = correspondingLapse.created_at;
                                } else {
                                    const nextSuccess = cleanHistory
                                        .filter(item => item.cycle_number > s && item.status === "SUCCESS")
                                        .sort((a, b) => a.cycle_number - b.cycle_number)[0];
                                    if (nextSuccess) {
                                        hash = nextSuccess.hash;
                                        created_at = nextSuccess.created_at;
                                    }
                                }

                                finalHistoryList.push({
                                    _id: `lapsed-${s}`,
                                    created_at,
                                    wallet_address: account,
                                    amount: dbRecord ? dbRecord.amount : standardAmount,
                                    cycle_number: s,
                                    hash,
                                    status: "LAPSED"
                                });
                            }
                        }

                        finalHistoryList.sort((a, b) => b.cycle_number - a.cycle_number);
                        finalHistory = finalHistoryList;
                    } catch (blockchainErr) {
                        console.error("Error fetching blockchain history, falling back to server db:", blockchainErr);
                    }
                }
                setMiningHistory(finalHistory);
            } catch (error) {
                console.error("Error fetching mining history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [isConnected, account, contract, provider]);

    // ── Client-side date filter ───────────────────────────────────────────────
    const filteredHistory = useMemo(() => {
        return miningHistory.filter(item => {
            const d = new Date(item.created_at)
            if (startDate && d < new Date(startDate)) return false
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                if (d > end) return false
            }
            return true
        })
    }, [miningHistory, startDate, endDate])

    const handleExport = (format) => {
        const params = new URLSearchParams({
            format,
            ...(startDate && { startDate }),
            ...(endDate && { endDate })
        })
        window.open(`/api/export/mining-history?${params.toString()}`, '_blank')
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full space-y-8 max-w-[1600px] mx-auto"
        >
            {/* Header + filter bar */}
            <motion.div variants={itemVariants} className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                            <CpuChipIcon className="w-8 h-8 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Mining History</h1>
                            <p className="text-gray-400 text-sm">Detailed logs of all your mining sessions</p>
                        </div>
                    </div>
                    <ExportButtons onExport={handleExport} />
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0a12] border border-[#2a2a3a] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Filter by date</span>
                        {(startDate || endDate) && (
                            <span className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-2 py-0.5">
                                {filteredHistory.length} results
                            </span>
                        )}
                    </div>
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                    />
                </div>
            </motion.div>

            <motion.section variants={itemVariants} className="w-full">
                <MiningHistoryTable
                    history={filteredHistory}
                    loading={loading}
                />
            </motion.section>
        </motion.div>
    )
}
