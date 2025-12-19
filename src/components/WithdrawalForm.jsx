"use client"

import { useState, useEffect } from "react"

export default function WithdrawalForm({ onSubmit, walletPoints, kycData }) {
    const [formData, setFormData] = useState({
        source: "rex",
        amount: "",
        method: "bank-transfer",
        bankAccount: "",
        walletAddress: "",
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    useEffect(() => {
        if (kycData?.status === 'approved' && kycData?.bankDetails?.accountNumber) {
            setFormData(prev => ({
                ...prev,
                bankAccount: kycData.bankDetails.accountNumber
            }))
        }
    }, [kycData])

    const getMaxAmount = () => {
        switch (formData.source) {
            case "rex": return walletPoints.rex;
            case "sos": return walletPoints.shopping;
            default: return 0;
        }
    }

    const handleMaxClick = () => {
        setFormData((prev) => ({ ...prev, amount: getMaxAmount().toString() }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (formData.amount) {
            const amount = Number.parseFloat(formData.amount)
            const maxAmount = getMaxAmount()

            if (amount > maxAmount) {
                alert(`Amount exceeds available balance. Maximum: ${maxAmount}`)
                return
            }

            if (amount < 100) {
                alert("Minimum withdrawal amount is ₹100")
                return
            }

            onSubmit({
                amount: amount,
                method: "Bank Transfer",
                source: formData.source === "rex" ? "REX Token" : "SOS Withdrawal"
            })
            setFormData({
                source: "rex",
                amount: "",
                method: "bank-transfer",
                bankAccount: "",
                walletAddress: ""
            })
            alert("Withdrawal request submitted successfully!")
        }
    }

    return (
        <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] rounded-xl border border-[#9131e7]/30 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-[#9131e7]/30 bg-gradient-to-r from-[#9131e7]/10 to-[#e84495]/10">
                <h3 className="text-xl md:text-2xl font-bold text-white">Initial Withdrawal Request</h3>
                <p className="text-gray-400 text-sm md:text-base">Request withdrawal from your available wallets</p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Source Selection */}
                <div>
                    <label htmlFor="source" className="block text-xs md:text-sm font-semibold text-white mb-2 md:mb-3">
                        Select Source
                    </label>
                    <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, source: "rex" }))}
                            className={`p-2 md:p-3 rounded-lg border transition-all ${formData.source === "rex"
                                ? "border-[#00b894] bg-[#00b894]/20"
                                : "border-[#444] bg-[#1a1a1a] hover:border-[#00b894]/50"}`}
                        >
                            <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full mb-1 md:mb-2 flex items-center justify-center ${formData.source === "rex" ? "bg-[#00b894]" : "bg-[#444]"}`}>
                                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <span className="text-white text-xs md:text-sm font-medium">REX Token</span>
                                <span className="text-gray-400 text-xs mt-1">{walletPoints.rex.toLocaleString()} REX</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, source: "sos" }))}
                            className={`p-2 md:p-3 rounded-lg border transition-all ${formData.source === "sos"
                                ? "border-[#fd79a8] bg-[#fd79a8]/20"
                                : "border-[#444] bg-[#1a1a1a] hover:border-[#fd79a8]/50"}`}
                        >
                            <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full mb-1 md:mb-2 flex items-center justify-center ${formData.source === "sos" ? "bg-[#fd79a8]" : "bg-[#444]"}`}>
                                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <span className="text-white text-xs md:text-sm font-medium">SOS Withdrawal</span>
                                <span className="text-gray-400 text-xs mt-1">{walletPoints.shopping.toLocaleString()} Tokens</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Withdrawal Amount */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="amount" className="block text-xs md:text-sm font-semibold text-white">
                            Withdrawal Amount (₹)
                        </label>
                        <button
                            type="button"
                            onClick={handleMaxClick}
                            className="text-xs px-2 md:px-3 py-1 bg-[#9131e7]/20 text-[#9131e7] rounded hover:bg-[#9131e7]/30 transition-colors"
                        >
                            MAX: {getMaxAmount().toLocaleString()}
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            id="amount"
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="100"
                            max={getMaxAmount()}
                            className="w-full px-3 md:px-4 py-2 md:py-3 pl-10 md:pl-12 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all text-sm md:text-base"
                        />
                        <div className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                            ₹
                        </div>
                    </div>
                    <div className="flex justify-between mt-1 md:mt-2">
                        <span className="text-xs text-gray-400">Minimum: ₹100</span>
                        <span className="text-xs text-gray-400">Available: {getMaxAmount().toLocaleString()}</span>
                    </div>
                </div>

                {/* Withdrawal Method */}
                <div>
                    <label htmlFor="method" className="block text-xs md:text-sm font-semibold text-white mb-2">
                        Withdrawal Method
                    </label>
                    <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, method: "bank-transfer" }))}
                            className={`p-3 md:p-4 rounded-lg border flex items-center justify-center gap-1 md:gap-2 transition-all ${formData.method === "bank-transfer"
                                ? "border-blue-500 bg-blue-500/20"
                                : "border-[#444] bg-[#1a1a1a] hover:border-blue-500/50"}`}
                        >
                            <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <span className="text-white text-xs md:text-sm">Bank Transfer</span>
                        </button>
                    </div>
                </div>

                {/* Payment Details */}
                {formData.method === "bank-transfer" ? (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="bankAccount" className="block text-xs md:text-sm font-semibold text-white">
                                Bank Account Details
                            </label>
                            {kycData?.status === 'approved' && kycData?.bankDetails?.accountNumber === formData.bankAccount && (
                                <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Verified account from KYC
                                </span>
                            )}
                        </div>
                        <input
                            id="bankAccount"
                            type="text"
                            name="bankAccount"
                            value={formData.bankAccount}
                            onChange={handleChange}
                            placeholder="Enter your bank account number"
                            className="w-full px-3 md:px-4 py-2 md:py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all text-sm md:text-base font-mono"
                        />
                        <p className="text-[10px] text-gray-400 mt-2">
                            {kycData?.status === 'approved'
                                ? "Auto-filled from your approved KYC. You can modify it if you want to withdraw to a different account."
                                : "Please enter the bank account number for withdrawal."}
                        </p>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="walletAddress" className="block text-xs md:text-sm font-semibold text-white mb-2">
                            Wallet Address
                        </label>
                        <input
                            id="walletAddress"
                            type="text"
                            name="walletAddress"
                            value={formData.walletAddress}
                            onChange={handleChange}
                            placeholder="Enter your crypto wallet address"
                            className="w-full px-3 md:px-4 py-2 md:py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all text-sm md:text-base"
                        />
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-[#9131e7] to-[#e84495] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#9131e7]/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 text-sm md:text-lg"
                >
                    Submit Withdrawal Request
                </button>

                {/* Info Note */}
                <div className="p-2 md:p-3 bg-[#9131e7]/10 border border-[#9131e7]/30 rounded-lg">
                    <p className="text-xs text-gray-300 text-center">
                        ⚡ Withdrawal requests are processed within 24-48 hours. A 1% processing fee applies.
                    </p>
                </div>
            </form>
        </div>
    )
}