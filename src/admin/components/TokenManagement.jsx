"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import client from "../../api/client"
import { useWeb3 } from "../../hooks/useWeb3"
import { ethers } from "ethers"

export default function TokenManagement() {
    const [priceData, setPriceData] = useState({
        price: "",
        phase: ""
    })
    const [recoveryData, setRecoveryData] = useState({
        email: "",
        amount: ""
    })
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [products, setProducts] = useState([])
    const [pvLoading, setPvLoading] = useState(true)

    const { contract, isConnected, connectWallet, account } = useWeb3()

    const fetchProducts = async () => {
        try {
            setPvLoading(true);
            const { data } = await client.get('/products/all?limit=all');
            const productsList = Array.isArray(data) ? data : (data.products || []);
            setProducts(productsList);
        } catch (error) {
            console.error("Error fetching products for PV calculation:", error);
        } finally {
            setPvLoading(false);
        }
    };

    useEffect(() => {
        const fetchTokenPrice = async () => {
            try {
                const { data } = await client.get('/token/price');
                setPriceData({
                    price: data.price.toString(),
                    phase: data.phase
                });
            } catch (error) {
                console.error("Error fetching token price:", error);
            } finally {
                setFetching(false);
            }
        };
        fetchTokenPrice();
        fetchProducts();
    }, []);

    const handleUpdatePrice = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await client.post('/token/price', {
                price: parseFloat(priceData.price),
                phase: priceData.phase
            });
            toast.success("Token price and phase updated successfully!");
        } catch (error) {
            console.error("Error updating price:", error);
            toast.error(error.response?.data?.message || "Failed to update price");
        } finally {
            setLoading(false);
        }
    };

    const handleRecoverTokens = async (e) => {
        e.preventDefault();

        if (!isConnected) {
            toast.error("Please connect your admin wallet first!");
            connectWallet();
            return;
        }

        if (!contract) {
            toast.error("Wallet contract not ready. Please reconnect your wallet.");
            return;
        }

        const loadingToast = toast.loading("Checking user wallet details...");
        setLoading(true);
        try {
            // 1. Fetch user's registered wallet address from backend
            const { data: userDetails } = await client.get(`/token/user-wallet?email=${recoveryData.email}`);
            
            const userWalletAddress = userDetails.wallet_address;
            const userName = userDetails.full_name;

            toast.dismiss(loadingToast);

            // 2. Ask for final confirmation showing exact wallet addresses
            if (!window.confirm(`Are you sure you want to recover ${recoveryData.amount} REX tokens?\n\nFrom User: ${userName} (${userWalletAddress})\nTo Admin: (${account})\n\nThis will trigger an on-chain transferFrom transaction.`)) {
                setLoading(false);
                return;
            }

            toast.loading("Initiating on-chain recovery transferFrom transaction...", { id: loadingToast });

            // 3. Perform transferFrom on smart contract
            // Convert to 18 decimal places (standard ERC20 decimals in the app)
            const amountWei = ethers.parseEther(parseFloat(recoveryData.amount).toFixed(8));
            
            const tx = await contract.transferFrom(userWalletAddress, account, amountWei);

            toast.loading("Waiting for blockchain confirmation (this may take 30–60 seconds)...", { id: loadingToast });
            const receipt = await tx.wait();

            // 4. Update balance in database
            toast.loading("Syncing recovery record with database...", { id: loadingToast });
            const { data } = await client.post('/token/recover', {
                email: recoveryData.email,
                amount: recoveryData.amount,
                onchain_tx_hash: receipt.hash
            });

            toast.success(`Success! Recovered ${recoveryData.amount} REX tokens. Tx Hash: ${receipt.hash.slice(0, 10)}...`, { id: loadingToast, duration: 6000 });
            
            setRecoveryData({
                email: "",
                amount: ""
            });
        } catch (error) {
            console.error("Error recovering tokens:", error);
            const msg = error.response?.data?.message || error.reason || error.message || "Failed to recover tokens";
            toast.toast ? toast.error(`Error: ${msg}`, { id: loadingToast, duration: 6000 }) : toast.error(`Error: ${msg}`, { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    // Group products by month and calculate total quantity (PV)
    const getMonthlyPVStats = () => {
        const monthlyStats = {};
        
        products.forEach(p => {
            const qty = p.quantity !== undefined && p.quantity !== null ? Number(p.quantity) : 1;
            const date = new Date(p.cereate_at || p.create_at || p.createdAt || Date.now());
            
            if (isNaN(date.getTime())) return;
            
            const year = date.getFullYear();
            const month = date.getMonth(); // 0-11
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = {
                    key: monthKey,
                    name: monthName,
                    totalPV: 0,
                    approvedPV: 0,
                    pendingPV: 0,
                    purchaseCount: 0
                };
            }
            
            monthlyStats[monthKey].totalPV += qty;
            monthlyStats[monthKey].purchaseCount += 1;
            
            if (p.approve == 1 || p.approve == "1") {
                monthlyStats[monthKey].approvedPV += qty;
            } else if (p.approve == 0 || p.approve == "0") {
                monthlyStats[monthKey].pendingPV += qty;
            }
        });
        
        // Convert to array and sort by year-month descending (newest first)
        return Object.values(monthlyStats).sort((a, b) => b.key.localeCompare(a.key));
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Token Management</h2>
                    <p className="text-gray-400 mt-1">Manage ShagunPro price, phases, and asset recovery</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Phase Change / Price Update Section */}
                <div className="bg-[#0f0f1a] rounded-xl p-6 border border-teal-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                            🪙
                        </div>
                        <h3 className="text-xl font-bold text-white">Phase Change & Price</h3>
                    </div>

                    {fetching ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePrice} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Token Price (INR)</label>
                                <input
                                    type="number"
                                    step="0.00001"
                                    value={priceData.price}
                                    onChange={(e) => setPriceData({ ...priceData, price: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-teal-500/30 focus:border-teal-500 focus:outline-none"
                                    placeholder="e.g. 0.10"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Current Phase Name</label>
                                <input
                                    type="text"
                                    value={priceData.phase}
                                    onChange={(e) => setPriceData({ ...priceData, phase: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-teal-500/30 focus:border-teal-500 focus:outline-none"
                                    placeholder="e.g. Phase 1"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-brand text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all disabled:opacity-50"
                            >
                                {loading ? "Updating..." : "Update Price & Phase"}
                            </button>
                        </form>
                    )}
                </div>

                {/* Recover Tokens Section */}
                <div className="bg-[#0f0f1a] rounded-xl p-6 border border-teal-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                            🔄
                        </div>
                        <h3 className="text-xl font-bold text-white">Recover Tokens</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Recover a specific amount of REX tokens from a user account.
                        The recovered tokens will be deducted from the user's balance.
                    </p>

                    <form onSubmit={handleRecoverTokens} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">User Email</label>
                            <input
                                type="email"
                                value={recoveryData.email}
                                onChange={(e) => setRecoveryData({ ...recoveryData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-teal-500/30 focus:border-teal-500 focus:outline-none"
                                placeholder="user@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Amount to Recover</label>
                            <input
                                type="number"
                                value={recoveryData.amount}
                                onChange={(e) => setRecoveryData({ ...recoveryData, amount: e.target.value })}
                                className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-teal-500/30 focus:border-teal-500 focus:outline-none"
                                placeholder="e.g. 1000"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-red-600/20 text-red-500 border border-red-600/50 rounded-lg font-semibold hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                        >
                            {loading ? "Processing..." : "Recover Tokens"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Monthly Purchase Volume (PV) Report */}
            <div className="bg-[#0f0f1a] rounded-xl p-6 border border-teal-500/30">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
                        📊
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white font-sans">Monthly Purchase Volume (PV)</h3>
                        <p className="text-gray-400 text-xs">Total package quantity (PV) sold per calendar month</p>
                    </div>
                </div>

                {pvLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                ) : getMonthlyPVStats().length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm">
                        No product purchases found to calculate volume history.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Summary Cards */}
                        <div className="xl:col-span-1 space-y-4">
                            {/* Current Month PV Card */}
                            {(() => {
                                const stats = getMonthlyPVStats();
                                const currentMonthStats = stats[0] || { name: "Current Month", totalPV: 0, approvedPV: 0, pendingPV: 0 };
                                return (
                                    <div className="bg-[#1a1a2e] rounded-xl p-5 border border-teal-500/10">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active Month Volume</p>
                                        <h4 className="text-teal-400 text-sm font-bold mt-1">{currentMonthStats.name}</h4>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <span className="text-[10px] text-gray-500 block uppercase font-bold">Total PV (Qty)</span>
                                                <span className="text-2xl font-black text-white">{currentMonthStats.totalPV}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-500 block uppercase font-bold">Approved PV</span>
                                                <span className="text-2xl font-black text-emerald-400">{currentMonthStats.approvedPV}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Lifetime PV Card */}
                            <div className="bg-[#1a1a2e] rounded-xl p-5 border border-teal-500/10">
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Platform Lifetime Volume</p>
                                <h4 className="text-purple-400 text-sm font-bold mt-1">Accumulated Sales</h4>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <span className="text-[10px] text-gray-500 block uppercase font-bold">Total PV (Qty)</span>
                                        <span className="text-2xl font-black text-white">
                                            {getMonthlyPVStats().reduce((sum, item) => sum + item.totalPV, 0)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-500 block uppercase font-bold">Approved PV</span>
                                        <span className="text-2xl font-black text-emerald-400">
                                            {getMonthlyPVStats().reduce((sum, item) => sum + item.approvedPV, 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Table */}
                        <div className="xl:col-span-2 overflow-x-auto bg-[#1a1a2e] rounded-xl border border-white/5">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/5">
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase">Month</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Purchases</th>
                                        <th className="p-4 text-xs font-bold text-teal-400 uppercase text-center">Total Qty (PV)</th>
                                        <th className="p-4 text-xs font-bold text-emerald-400 uppercase text-center">Approved PV</th>
                                        <th className="p-4 text-xs font-bold text-yellow-500 uppercase text-center">Pending PV</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {getMonthlyPVStats().map((item) => (
                                        <tr key={item.key} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4 font-bold text-sm text-white">{item.name}</td>
                                            <td className="p-4 text-sm text-gray-300 text-center font-mono">{item.purchaseCount}</td>
                                            <td className="p-4 text-sm text-white text-center font-extrabold font-mono">{item.totalPV}</td>
                                            <td className="p-4 text-sm text-emerald-400 text-center font-bold font-mono">{item.approvedPV}</td>
                                            <td className="p-4 text-sm text-yellow-500 text-center font-bold font-mono">{item.pendingPV}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <div className="flex gap-4">
                    <div className="text-blue-500 text-2xl pt-1">ℹ️</div>
                    <div className="space-y-2">
                        <h4 className="text-white font-bold text-lg">Important Information</h4>
                        <ul className="text-gray-300 text-sm list-disc pl-4 space-y-1">
                            <li>Updating the price will instantly reflect on the dashboard for all users.</li>
                            <li>Phase changes are usually accompanied by a price increase or decrease.</li>
                            <li>Token recovery is permanent and irreversible. Ensure identifiers are correct.</li>
                            <li>The suspended old account can be re-activated from User Management if needed.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
