"use client"

import { useState } from "react"

export default function SystemSettings() {
    const [settings, setSettings] = useState({
        siteName: "Cryptosphere",
        siteEmail: "admin@cryptosphere.com",
        minWithdrawal: "50",
        maxWithdrawal: "100000",
        withdrawalFee: "2.5",
        referralCommission: "5",
        kycRequired: true,
        maintenanceMode: false,
        twoFactorAuth: true,
        emailNotifications: true,
    })

    const handleSave = () => {
        alert("Settings saved successfully!")
    }

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
                    <h2 className="text-3xl font-bold text-white">System Settings</h2>
                    <p className="text-gray-400 mt-1">Configure platform settings and preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-[#f3b232] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#d4941f] transition-all"
                >
                    Save Changes
                </button>
            </div>

            {/* General Settings */}
            <div className="bg-[#1f1f1f] rounded-xl p-6 border border-[#3f3f3f]">
                <h3 className="text-xl font-bold text-white mb-6">General Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Site Name</label>
                        <input
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                            className="w-full px-4 py-3 bg-[#2b2b2b] text-white rounded-lg border border-[#3f3f3f] focus:border-[#f3b232] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Admin Email</label>
                        <input
                            type="email"
                            value={settings.siteEmail}
                            onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                            className="w-full px-4 py-3 bg-[#2b2b2b] text-white rounded-lg border border-[#3f3f3f] focus:border-[#f3b232] focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Financial Settings */}
            <div className="bg-[#1f1f1f] rounded-xl p-6 border border-[#3f3f3f]">
                <h3 className="text-xl font-bold text-white mb-6">Financial Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Min Withdrawal ($)</label>
                        <input
                            type="number"
                            value={settings.minWithdrawal}
                            onChange={(e) => setSettings({ ...settings, minWithdrawal: e.target.value })}
                            className="w-full px-4 py-3 bg-[#2b2b2b] text-white rounded-lg border border-[#3f3f3f] focus:border-[#f3b232] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Max Withdrawal ($)</label>
                        <input
                            type="number"
                            value={settings.maxWithdrawal}
                            onChange={(e) => setSettings({ ...settings, maxWithdrawal: e.target.value })}
                            className="w-full px-4 py-3 bg-[#2b2b2b] text-white rounded-lg border border-[#3f3f3f] focus:border-[#f3b232] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Withdrawal Fee (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={settings.withdrawalFee}
                            onChange={(e) => setSettings({ ...settings, withdrawalFee: e.target.value })}
                            className="w-full px-4 py-3 bg-[#2b2b2b] text-white rounded-lg border border-[#3f3f3f] focus:border-[#f3b232] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Referral Commission (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={settings.referralCommission}
                            onChange={(e) => setSettings({ ...settings, referralCommission: e.target.value })}
                            className="w-full px-4 py-3 bg-[#2b2b2b] text-white rounded-lg border border-[#3f3f3f] focus:border-[#f3b232] focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Security & Features */}
            <div className="bg-[#1f1f1f] rounded-xl p-6 border border-[#3f3f3f]">
                <h3 className="text-xl font-bold text-white mb-6">Security & Features</h3>
                <div className="space-y-4">
                    {[
                        {
                            key: "kycRequired",
                            label: "Require KYC Verification",
                            description: "Users must complete KYC before withdrawals",
                        },
                        { key: "maintenanceMode", label: "Maintenance Mode", description: "Put the platform in maintenance mode" },
                        { key: "twoFactorAuth", label: "Two-Factor Authentication", description: "Enable 2FA for all users" },
                        {
                            key: "emailNotifications",
                            label: "Email Notifications",
                            description: "Send email notifications for important events",
                        },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-[#2b2b2b] rounded-lg">
                            <div>
                                <p className="text-white font-medium">{item.label}</p>
                                <p className="text-gray-400 text-sm">{item.description}</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                                className={`relative w-14 h-7 rounded-full transition-all ${settings[item.key] ? "bg-green-500" : "bg-gray-600"
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${settings[item.key] ? "transform translate-x-7" : ""
                                        }`}
                                ></span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Crypto Addresses */}
            <div className="bg-[#1f1f1f] rounded-xl p-6 border border-[#3f3f3f]">
                <h3 className="text-xl font-bold text-white mb-6">Platform Wallet Addresses</h3>
                <div className="space-y-4">
                    {[
                        { crypto: "Bitcoin (BTC)", address: "0x742d35a8f3e9b2c1d4a6f8e7c9d2b5a4e3f1a8b7" },
                        { crypto: "Ethereum (ETH)", address: "0x9e2c4b1a6f8e3d5c7a9b2e4f6c8d1a3e5b7c9a2d" },
                        { crypto: "Tether (USDT)", address: "0x1f5a7c4e9b2d6a8c3e5f7b9d2a4c6e8f1a3b5c7d" },
                    ].map((wallet, index) => (
                        <div key={index} className="p-4 bg-[#2b2b2b] rounded-lg">
                            <label className="block text-gray-400 text-sm mb-2">{wallet.crypto}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={wallet.address}
                                    readOnly
                                    className="flex-1 px-4 py-2 bg-[#3f3f3f] text-white rounded-lg border border-[#4f4f4f] font-mono text-sm"
                                />
                                <button className="px-4 py-2 bg-[#f3b232] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#d4941f] transition-all">
                                    Copy
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
