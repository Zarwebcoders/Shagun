"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import client from "../../api/client"

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
        if (!window.confirm(`Are you sure you want to recover ${recoveryData.amount} tokens? This amount will be deducted from the user's balance.`)) {
            return;
        }
        setLoading(true);
        try {
            const { data } = await client.post('/token/recover', recoveryData);
            toast.success(data.message);
            setRecoveryData({
                email: "",
                amount: ""
            });
        } catch (error) {
            console.error("Error recovering tokens:", error);
            toast.error(error.response?.data?.message || "Failed to recover tokens");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <style jsx>{`
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
