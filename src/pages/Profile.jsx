"use client"

import { useState } from "react"

export default function Profile() {
    const [profile, setProfile] = useState({
        name: "John Doe",
        email: "john@email.com",
        phone: "+1 234 567 8900",
        wallet: "0x742d35Cc6634C0532925a3b844Bc0e6cEfd0E13f",
        joined: "2024-01-01",
        kyc_status: "Verified",
        referral_code: "CS12345JOHN",
    })

    const handleCopyReferralCode = () => {
        navigator.clipboard.writeText(profile.referral_code)
        alert("Referral code copied to clipboard!")
    }

    const handleCopyWallet = () => {
        navigator.clipboard.writeText(profile.wallet)
        alert("Wallet address copied!")
    }

    return (
        <div className="w-full space-y-6 md:space-y-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-8">Profile</h2>

            <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-4 md:p-6 lg:p-8 rounded-xl border border-[#444]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 mb-6 md:mb-8 pb-6 md:pb-8 border-b border-[#444]">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#9131e7] to-[#e84495] flex items-center justify-center text-2xl md:text-3xl font-bold text-[#040408] flex-shrink-0">
                        {profile.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white truncate">{profile.name}</h3>
                        <p className="inline-block mt-1 md:mt-2 px-2 md:px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs md:text-sm font-semibold">
                            {profile.kyc_status}
                        </p>
                    </div>
                </div>

                <div className="space-y-6 md:space-y-8">
                    <div>
                        <h4 className="text-lg md:text-xl font-bold text-[#9131e7] mb-3 md:mb-4">Personal Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-[#1a1a1a] p-3 md:p-4 rounded-lg border border-[#444]">
                                <label className="text-xs md:text-sm text-[#b0b0b0] mb-1 md:mb-2 block">Full Name</label>
                                <p className="text-base md:text-lg text-white font-semibold truncate">{profile.name}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-3 md:p-4 rounded-lg border border-[#444]">
                                <label className="text-xs md:text-sm text-[#b0b0b0] mb-1 md:mb-2 block">Email</label>
                                <p className="text-base md:text-lg text-white font-semibold truncate">{profile.email}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-3 md:p-4 rounded-lg border border-[#444]">
                                <label className="text-xs md:text-sm text-[#b0b0b0] mb-1 md:mb-2 block">Phone</label>
                                <p className="text-base md:text-lg text-white font-semibold truncate">{profile.phone}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-3 md:p-4 rounded-lg border border-[#444]">
                                <label className="text-xs md:text-sm text-[#b0b0b0] mb-1 md:mb-2 block">Member Since</label>
                                <p className="text-base md:text-lg text-white font-semibold">{profile.joined}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg md:text-xl font-bold text-[#9131e7] mb-3 md:mb-4">Wallet Information</h4>
                        <div className="bg-[#1a1a1a] p-3 md:p-4 rounded-lg border border-[#444] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <label className="text-xs md:text-sm text-[#b0b0b0] mb-1 md:mb-2 block">Wallet Address</label>
                                <code className="text-white font-mono text-xs md:text-sm break-all">{profile.wallet}</code>
                            </div>
                            <button
                                onClick={handleCopyWallet}
                                className="px-3 md:px-4 py-2 bg-[#9131e7] text-[#040408] font-bold rounded-lg hover:bg-[#e84495] transition-all flex-shrink-0 text-sm md:text-base w-full sm:w-auto"
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg md:text-xl font-bold text-[#9131e7] mb-3 md:mb-4">Referral Code</h4>
                        <div className="bg-[#1a1a1a] p-3 md:p-4 rounded-lg border border-[#444] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <input
                                type="text"
                                value={profile.referral_code}
                                readOnly
                                className="flex-1 min-w-0 bg-transparent text-white font-mono text-base md:text-lg outline-none text-center sm:text-left"
                            />
                            <button
                                onClick={handleCopyReferralCode}
                                className="px-3 md:px-4 py-2 bg-[#9131e7] text-[#040408] font-bold rounded-lg hover:bg-[#e84495] transition-all flex-shrink-0 text-sm md:text-base w-full sm:w-auto"
                            >
                                Copy Code
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-3 md:pt-4">
                        <button className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-[#9131e7] to-[#e84495] text-[#040408] font-bold rounded-lg hover:shadow-lg hover:shadow-[#9131e7]/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 text-sm md:text-base">
                            Change Password
                        </button>
                        <button className="flex-1 px-4 md:px-6 py-2 md:py-3 border border-[#9131e7] text-[#9131e7] font-bold rounded-lg hover:bg-[#9131e7]/10 transition-all duration-300 text-sm md:text-base">
                            Two-Factor Authentication
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}