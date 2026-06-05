"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Search, Cpu, Coins, Key, ShieldCheck, Activity, ExternalLink } from "lucide-react"
import REXTokenABI from "../../contracts/REXToken.json"

// ─── Constants ────────────────────────────────────────────────────────────────
const CONTRACT_ADDRESS = "0x8385de2e557A90bc64e22B210ae55F00EFf488d7"

// Free public Polygon RPCs (tried in order)
const RPC_URLS = [
    "https://rpc.ankr.com/polygon",
    "https://polygon-bor-rpc.publicnode.com",
    "https://rpc-mainnet.matic.quiknode.pro",
    "https://polygon.llamarpc.com",
    "https://1rpc.io/matic",
]

// PolygonScan API for reliable event logs (free tier, no key needed for basic calls)
const POLYGONSCAN_API = "https://api.polygonscan.com/api"

// MiningClaimed and MiningSlotLapsed event topics
const MINING_CLAIMED_TOPIC = "0x" + ethers.id("MiningClaimed(address,uint256,uint256)").slice(2)
const MINING_LAPSED_TOPIC = "0x" + ethers.id("MiningSlotLapsed(address,uint256,uint256)").slice(2)

// ─── Helper: get a working provider ──────────────────────────────────────────
async function getWorkingProvider() {
    for (const url of RPC_URLS) {
        try {
            const provider = new ethers.JsonRpcProvider(url)
            // quick health check
            await provider.getBlockNumber()
            return provider
        } catch {
            console.warn(`RPC failed: ${url}`)
        }
    }
    throw new Error("All Polygon RPC endpoints are unavailable. Please try again later.")
}

// ─── Helper: fetch mining events via Blockscout API (fully keyless and free) ───
async function fetchMiningEventsFromScan(walletAddress) {
    // pad wallet address to 32-byte topic
    const paddedAddress = "0x000000000000000000000000" + walletAddress.toLowerCase().replace("0x", "")

    const params = new URLSearchParams({
        module: "logs",
        action: "getLogs",
        address: CONTRACT_ADDRESS,
        topic1: paddedAddress, // query all logs matching this user address in topic1
        fromBlock: "0",
        toBlock: "latest"
    })

    const res = await fetch(`https://polygon.blockscout.com/api?${params}`)
    if (!res.ok) throw new Error(`Blockscout API error: ${res.status}`)
    const json = await res.json()

    if (json.status === "0" && json.message === "No logs found") return []
    if (json.status !== "1" && json.message !== "No logs found") {
        throw new Error(`Blockscout: ${json.message || "Unknown error"}`)
    }

    return json.result || []
}

// ─── Helper: decode raw log ───────────────────────────────────────────────────
function decodeMiningLog(log) {
    // MiningClaimed or MiningSlotLapsed (address indexed user, uint256 slotNumber, uint256 rewardAmount/lapsedAmount)
    // topic[0] = event sig, topic[1] = user (indexed)
    // data = abi.encode(slotNumber, rewardAmount) — two 32-byte words
    const data = log.data.replace("0x", "")
    const slotHex = data.slice(0, 64)
    const rewardHex = data.slice(64, 128)
    
    const slotNumber = BigInt("0x" + (slotHex || "0"))
    const rewardAmount = BigInt("0x" + (rewardHex || "0"))
    return { slotNumber, rewardAmount }
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function WalletInspector() {
    const [address, setAddress] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [stats, setStats] = useState(null)
    const [history, setHistory] = useState([])
    const [rpcStatus, setRpcStatus] = useState("")

    const handleInspect = async (e) => {
        e.preventDefault()
        if (!address) return

        const trimmedAddress = address.trim()
        if (!ethers.isAddress(trimmedAddress)) {
            setError("Invalid Ethereum wallet address format. Please check the address.")
            return
        }

        setLoading(true)
        setError(null)
        setStats(null)
        setHistory([])
        setRpcStatus("Selecting a responsive Polygon RPC node…")

        try {
            // ── 1. Get a working provider ──────────────────────────────────
            const provider = await getWorkingProvider()
            const contract = new ethers.Contract(CONTRACT_ADDRESS, REXTokenABI, provider)
            setRpcStatus("Fetching on-chain balances…")

            // ── 2. Read on-chain stats ────────────────────────────────────
            const [bal, staked, rewards, withdrawn, completed, stakeTime] = await Promise.all([
                contract.balanceOf(trimmedAddress).catch(() => 0n),
                contract.getStakedTokens(trimmedAddress).catch(() => 0n),
                contract.getTotalMiningRewards(trimmedAddress).catch(() => 0n),
                contract.getTotalWithdrawn(trimmedAddress).catch(() => 0n),
                contract.userMiningSlotsCompleted(trimmedAddress).catch(() => 0n),
                contract.userStakeTime(trimmedAddress).catch(() => 0n),
            ])

            const balFmt     = ethers.formatEther(bal)
            const stakedFmt  = ethers.formatEther(staked)
            const rewardsFmt = ethers.formatEther(rewards)
            const wdFmt      = ethers.formatEther(withdrawn)
            const available  = Math.max(0, parseFloat(rewardsFmt) - parseFloat(wdFmt))
            const completedCount = Number(completed)
            const stakeTimeNum   = Number(stakeTime)

            setStats({
                balance:       balFmt,
                staked:        stakedFmt,
                miningRewards: rewardsFmt,
                withdrawn:     wdFmt,
                available,
                completedSlots: completedCount,
                stakeTime: stakeTimeNum
            })

            // ── 3. Fetch Mining Claim and Lapse event logs ─────────────────────────
            setRpcStatus("Loading claim history from Blockscout…")
            let rawLogs = []

            try {
                rawLogs = await fetchMiningEventsFromScan(trimmedAddress)
            } catch (scanErr) {
                console.warn("PolygonScan/Blockscout failed, falling back to RPC event query:", scanErr)

                // Fallback: ethers queryFilter in chunks for both claimed and lapsed
                const filterClaimed = contract.filters.MiningClaimed(trimmedAddress)
                const filterLapsed = contract.filters.MiningSlotLapsed(trimmedAddress)
                try {
                    const [eventsClaimed, eventsLapsed] = await Promise.all([
                        contract.queryFilter(filterClaimed, 0, "latest").catch(() => []),
                        contract.queryFilter(filterLapsed, 0, "latest").catch(() => [])
                    ])
                    rawLogs = [
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
                    ]
                } catch {
                    // chunked fallback
                    const latestBlock = await provider.getBlockNumber()
                    const CHUNK = 50000
                    const MAX_BLOCKS = 2000000
                    let end = latestBlock
                    const limitBlock = Math.max(0, latestBlock - MAX_BLOCKS)
                    const claimedEvents = []
                    const lapsedEvents = []

                    while (end > limitBlock) {
                        const start = Math.max(limitBlock, end - CHUNK)
                        try {
                            const [chunkClaimed, chunkLapsed] = await Promise.all([
                                contract.queryFilter(filterClaimed, start, end).catch(() => []),
                                contract.queryFilter(filterLapsed, start, end).catch(() => [])
                            ])
                            claimedEvents.push(...chunkClaimed)
                            lapsedEvents.push(...chunkLapsed)
                        } catch (chunkErr) {
                            console.error(`Chunk ${start}–${end} failed:`, chunkErr)
                        }
                        end = start - 1
                    }

                    rawLogs = [
                        ...claimedEvents.map(ev => ({
                            _isEthersEvent: true,
                            _isClaimed: true,
                            data: ev.data,
                            topics: ev.topics,
                            transactionHash: ev.transactionHash,
                            blockNumber: ev.blockNumber,
                            timeStamp: null,
                            _event: ev,
                        })),
                        ...lapsedEvents.map(ev => ({
                            _isEthersEvent: true,
                            _isLapsed: true,
                            data: ev.data,
                            topics: ev.topics,
                            transactionHash: ev.transactionHash,
                            blockNumber: ev.blockNumber,
                            timeStamp: null,
                            _event: ev,
                        }))
                    ]
                }
            }

            // ── 4. Format history entries ──────────────────────────────────
            setRpcStatus(`Processing ${rawLogs.length} event(s)…`)

            const formattedHistory = await Promise.all(
                rawLogs.map(async (log) => {
                    let slotNumber = 0n
                    let rewardAmount = 0n
                    let txHash = log.transactionHash || ""
                    let timestamp = Date.now()
                    let isLapsed = false

                    if (log._isEthersEvent) {
                        const ev = log._event
                        slotNumber   = ev.args?.slotNumber  ?? ev.args?.[1] ?? 0n
                        rewardAmount = ev.args?.rewardAmount ?? ev.args?.lapsedAmount ?? ev.args?.[2] ?? 0n
                        isLapsed = !!log._isLapsed
                        try {
                            const block = await ev.getBlock()
                            if (block?.timestamp) timestamp = block.timestamp * 1000
                        } catch { /* ignore */ }
                    } else {
                        // Decode from raw Blockscout log
                        const eventTopic = log.topics[0].toLowerCase()
                        const isClaimedTopic = eventTopic === MINING_CLAIMED_TOPIC.toLowerCase()
                        const isLapsedTopic = eventTopic === MINING_LAPSED_TOPIC.toLowerCase()

                        if (!isClaimedTopic && !isLapsedTopic) {
                            return null; // Ignore other logs like Transfer or TokensStaked
                        }

                        isLapsed = isLapsedTopic

                        try {
                            const decoded = decodeMiningLog(log)
                            slotNumber   = decoded.slotNumber
                            rewardAmount = decoded.rewardAmount
                        } catch (decErr) {
                            console.error("Failed to decode log:", decErr, log)
                        }

                        if (log.timeStamp) {
                            const rawTs = log.timeStamp.toString()
                            const tsDecimal = rawTs.startsWith("0x") ? parseInt(rawTs, 16) : parseInt(rawTs, 10)
                            if (!isNaN(tsDecimal)) {
                                timestamp = tsDecimal * 1000
                            }
                        } else if (log.blockNumber) {
                            try {
                                const bnStr = log.blockNumber.toString()
                                const bn = bnStr.startsWith("0x") ? parseInt(bnStr, 16) : parseInt(bnStr, 10)
                                const block = await provider.getBlock(bn)
                                if (block?.timestamp) timestamp = block.timestamp * 1000
                            } catch { /* ignore */ }
                        }
                    }

                    return {
                        id:     `${txHash}-${slotNumber}-${isLapsed ? 'lapsed' : 'claimed'}`,
                        date:   new Date(timestamp).toLocaleString(),
                        amount: ethers.formatEther(rewardAmount),
                        cycle:  Number(slotNumber),
                        hash:   txHash,
                        status: isLapsed ? "LAPSED" : "SUCCESS"
                    }
                })
            )

            const cleanHistory = formattedHistory.filter(item => item !== null)

            const standardAmountEvent = cleanHistory.find(item => parseFloat(item.amount) > 0)
            const standardAmount = standardAmountEvent ? standardAmountEvent.amount : "20.8333"

            // Build full slot timeline from 1 up to completedCount
            const fullTimeline = []
            const SLOT_DURATION = 15 * 24 * 3600 // 15 days in seconds

            for (let s = 1; s <= completedCount; s++) {
                const claimEvent = cleanHistory.find(item => item.cycle === s && item.status === "SUCCESS")
                
                if (claimEvent) {
                    fullTimeline.push(claimEvent)
                } else {
                    const lapseEvent = cleanHistory.find(item => item.cycle === s && item.status === "LAPSED")
                    if (lapseEvent) {
                        fullTimeline.push(lapseEvent)
                    } else {
                        // Generate virtual lapsed event
                        const estLapseTimestamp = (stakeTimeNum + s * SLOT_DURATION) * 1000
                        fullTimeline.push({
                            id: `virtual-lapsed-${s}`,
                            cycle: s,
                            amount: standardAmount,
                            date: stakeTimeNum > 0 
                                ? new Date(estLapseTimestamp).toLocaleString()
                                : "N/A (Lapsed)",
                            hash: "lapsed-on-chain",
                            status: "LAPSED",
                            isVirtual: true
                        })
                    }
                }
            }

            // Sort newest slot first
            fullTimeline.sort((a, b) => b.cycle - a.cycle)

            // Borrow transaction hash from next successful claim for lapsed slots
            for (let i = 0; i < fullTimeline.length; i++) {
                const item = fullTimeline[i];
                if (item.status === "LAPSED" && (!item.hash || item.hash === "lapsed-on-chain")) {
                    let nextSuccessHash = null;
                    for (let j = i - 1; j >= 0; j--) {
                        if (fullTimeline[j].status === "SUCCESS" && fullTimeline[j].hash && fullTimeline[j].hash !== "lapsed-on-chain") {
                            nextSuccessHash = fullTimeline[j].hash;
                            break;
                        }
                    }
                    if (nextSuccessHash) {
                        item.hash = nextSuccessHash;
                    }
                }
            }

            setHistory(fullTimeline)
            setRpcStatus("")

        } catch (err) {
            console.error("Wallet Inspector Error:", err)
            setError(err.message || "Failed to inspect address. Please verify network status and try again.")
            setRpcStatus("")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full space-y-6 md:space-y-8 animate-fadeIn text-white">
            {/* Header */}
            <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Wallet Inspector</h2>
                <p className="text-[#b0b0b0] text-sm md:text-base">
                    Inspect on-chain SGN balances and mining history for any wallet address on Polygon.
                </p>
                <p className="text-teal-400/70 text-xs mt-1 font-mono">
                    Contract: {CONTRACT_ADDRESS}
                </p>
            </div>

            {/* Input Form Card */}
            <div className="relative bg-gradient-to-br from-[#040408] via-[#0d1a1a] to-[#0d0d1f] rounded-2xl border border-teal-500/30 p-6 shadow-2xl">
                <form onSubmit={handleInspect} className="space-y-4">
                    <label htmlFor="walletAddress" className="block text-sm font-semibold text-gray-300">
                        Paste Wallet Address
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <input
                                id="walletAddress"
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="0x..."
                                className="w-full pl-11 pr-4 py-3 bg-[#111] border-2 border-[#333] text-white rounded-xl focus:outline-none focus:border-teal-500 transition-all font-mono text-sm"
                            />
                            <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !address}
                            className="px-6 py-3 bg-gradient-brand text-white font-bold rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Activity className="w-4 h-4" />
                            )}
                            {loading ? "Inspecting…" : "Inspect Wallet"}
                        </button>
                    </div>
                </form>

                {/* Loading status */}
                {loading && rpcStatus && (
                    <div className="mt-4 flex items-center gap-2 text-teal-400 text-xs">
                        <div className="w-3 h-3 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                        {rpcStatus}
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
                        ⚠️ {error}
                    </div>
                )}
            </div>

            {/* Stats Dashboard */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* SGN Balance */}
                    <div className="bg-gradient-to-br from-[#040408] to-[#121222] p-5 rounded-xl border border-white/5 shadow-xl hover:border-teal-500/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-gray-400 text-xs uppercase font-bold tracking-wider">SGN Balance</h3>
                            <Coins className="w-4 h-4 text-teal-400" />
                        </div>
                        <span className="text-lg font-black text-white">
                            {Number(stats.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </span>
                        <p className="text-[10px] text-gray-500 mt-1">Available in wallet</p>
                    </div>

                    {/* Staked */}
                    <div className="bg-gradient-to-br from-[#040408] to-[#121222] p-5 rounded-xl border border-white/5 shadow-xl hover:border-teal-500/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-gray-400 text-xs uppercase font-bold tracking-wider">Staked SGN</h3>
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-lg font-black text-white">
                            {Number(stats.staked).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </span>
                        <p className="text-[10px] text-gray-500 mt-1">Staked in contract</p>
                    </div>

                    {/* Total Mined */}
                    <div className="bg-gradient-to-br from-[#040408] to-[#121222] p-5 rounded-xl border border-white/5 shadow-xl hover:border-teal-500/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Mined</h3>
                            <Cpu className="w-4 h-4 text-yellow-400" />
                        </div>
                        <span className="text-lg font-black text-white">
                            {Number(stats.miningRewards).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </span>
                        <p className="text-[10px] text-gray-500 mt-1">Total earned rewards</p>
                    </div>

                    {/* Withdrawn */}
                    <div className="bg-gradient-to-br from-[#040408] to-[#121222] p-5 rounded-xl border border-white/5 shadow-xl hover:border-teal-500/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-gray-400 text-xs uppercase font-bold tracking-wider">Withdrawn</h3>
                            <Key className="w-4 h-4 text-red-400" />
                        </div>
                        <span className="text-lg font-black text-white">
                            {Number(stats.withdrawn).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </span>
                        <p className="text-[10px] text-gray-500 mt-1">Processed on-chain</p>
                    </div>
                </div>
            )}

            {/* Mining History Table */}
            {stats && (
                <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] rounded-xl border border-teal-500/20 overflow-hidden shadow-2xl">
                    <div className="p-4 md:p-6 border-b border-teal-500/20 bg-gradient-to-r from-teal-500/5 to-purple-500/5 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-teal-400" />
                                Mining Claim History
                            </h3>
                            <p className="text-gray-400 text-xs mt-1">
                                On-chain <code className="text-teal-400">MiningClaimed</code> &amp; <code className="text-rose-400">MiningSlotLapsed</code> events •&nbsp;
                                {history.length} slot{history.length !== 1 ? "s" : ""} processed
                            </p>
                        </div>
                        {history.length > 0 && (
                            <a
                                href={`https://polygonscan.com/address/${address.trim()}#events`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                            >
                                View on PolygonScan <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-left border-collapse">
                            <thead>
                                <tr className="border-b border-teal-500/20 bg-[#05050f]">
                                    <th className="py-3 px-6 text-gray-400 font-semibold text-xs uppercase">Cycle / Slot</th>
                                    <th className="py-3 px-6 text-gray-400 font-semibold text-xs uppercase">Mined Reward</th>
                                    <th className="py-3 px-6 text-gray-400 font-semibold text-xs uppercase">Date &amp; Time</th>
                                    <th className="py-3 px-6 text-gray-400 font-semibold text-xs uppercase">Transaction Hash</th>
                                    <th className="py-3 px-6 text-gray-400 font-semibold text-xs uppercase text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#444]/20 bg-[#0c0c14]">
                                {history.length > 0 ? (
                                    history.map((item) => (
                                        <tr key={item.id} className="hover:bg-teal-500/5 transition-colors">
                                            <td className="py-4 px-6 text-white font-bold text-sm">
                                                Slot #{item.cycle}
                                            </td>
                                            <td className={`py-4 px-6 font-extrabold text-sm ${item.status === 'SUCCESS' ? 'text-teal-400' : 'text-rose-400/80'}`}>
                                                {item.status === 'SUCCESS' 
                                                    ? `+${Number(item.amount).toLocaleString(undefined, { maximumFractionDigits: 4 })} SGN`
                                                    : `${Number(item.amount).toLocaleString(undefined, { maximumFractionDigits: 4 })} SGN`
                                                }
                                            </td>
                                            <td className="py-4 px-6 text-[#b0b0b0] text-xs">
                                                {item.date}
                                            </td>
                                            <td className="py-4 px-6 font-mono text-xs text-gray-400">
                                                {item.hash && item.hash !== "lapsed-on-chain" ? (
                                                    <a
                                                        href={`https://polygonscan.com/tx/${item.hash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:text-teal-400 hover:underline transition-colors inline-flex items-center gap-1"
                                                    >
                                                        {item.hash.substring(0, 14)}…{item.hash.substring(item.hash.length - 8)}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-600 italic">Lapsed on-chain</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {item.status === "SUCCESS" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                                        SUCCESS
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                        LAPSED
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-gray-500 italic text-sm">
                                            No events found on-chain for this wallet address.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
