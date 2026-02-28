"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

export default function WithdrawalForm({ onSubmit, userData, kycData, savedWallet }) {
    const [formData, setFormData] = useState({
        source: "level",
        amount: "",
        method: "bank-transfer",
        useKYCAccount: true,
        bankDetails: {
            accountNumber: "",
            accountHolderName: "",
            ifscCode: "",
            bankName: "",
            branchName: ""
        }
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleBankDetailsChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            bankDetails: {
                ...prev.bankDetails,
                [name]: value
            }
        }))
    }

    useEffect(() => {
        if (savedWallet) {
            setFormData(prev => ({ ...prev, walletAddress: savedWallet }))
        }

        if (kycData?.status === 'approved' && kycData?.bankDetails) {
            setFormData(prev => ({
                ...prev,
                bankDetails: {
                    accountNumber: kycData.bankDetails.accountNumber || "",
                    accountHolderName: kycData.bankDetails.accountHolderName || "",
                    ifscCode: kycData.bankDetails.ifscCode || "",
                    bankName: kycData.bankDetails.bankName || "",
                    branchName: kycData.bankDetails.branchName || ""
                }
            }))
        }
    }, [kycData, savedWallet])

    const getMaxAmount = () => {
        switch (formData.source) {
            case "level": return userData.withdrawableLevelIncome || 0;
            case "mining": return userData.monthlyROI || 0;
            case "annual": return userData.anualBonus || 0;
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

            // if (amount > maxAmount) {
            //     alert(`Amount exceeds available balance. Maximum: ${maxAmount}`)
            //     return
            // }

            if (amount < 100) {
                toast.error("Minimum withdrawal amount is ₹100")
                return
            }

            let sourceName = "Level Income";
            if (formData.source === "mining") sourceName = "Mining Bonus";
            if (formData.source === "annual") sourceName = "Annual Bonus";

            onSubmit({
                amount: amount,
                method: "Bank Transfer",
                source: sourceName,
                bankDetails: formData.useKYCAccount ? null : formData.bankDetails
            })
            setFormData({
                source: "level",
                amount: "",
                method: "bank-transfer",
                useKYCAccount: true,
                bankDetails: {
                    accountNumber: "",
                    accountHolderName: "",
                    ifscCode: "",
                    bankName: "",
                    branchName: ""
                }
            })
            toast.success("Withdrawal request submitted successfully!")
        }
    }

    return (
        <div className="bg-gradient-to-br from-[#040408] to-[#1a1a2e] rounded-xl border border-teal-500/30 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-teal-500/30 bg-gradient-to-r from-teal-500/10 to-purple-500/10">
                <h3 className="text-xl md:text-2xl font-bold text-white">Initial Withdrawal Request</h3>
                <p className="text-gray-400 text-sm md:text-base">Request withdrawal from your available wallets</p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Source Selection */}
                <div>
                    <label htmlFor="source" className="block text-xs md:text-sm font-semibold text-white mb-2 md:mb-3">
                        Select Source
                    </label>
                    <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, source: "level" }))}
                            className={`p-2 md:p-3 rounded-lg border transition-all ${formData.source === "level"
                                ? "border-[#00b894] bg-[#00b894]/20"
                                : "border-[#444] bg-[#1a1a2e] hover:border-[#00b894]/50"}`}
                        >
                            <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full mb-1 md:mb-2 flex items-center justify-center ${formData.source === "level" ? "bg-[#00b894]" : "bg-[#444]"}`}>
                                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <span className="text-white text-[10px] md:text-xs font-medium">Level Income</span>
                                <span className="text-gray-400 text-[10px] mt-1">SGN {(userData.withdrawableLevelIncome || 0).toLocaleString()}</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, source: "mining" }))}
                            className={`p-2 md:p-3 rounded-lg border transition-all ${formData.source === "mining"
                                ? "border-purple-500 bg-purple-500/20"
                                : "border-[#444] bg-[#1a1a2e] hover:border-purple-500/50"}`}
                        >
                            <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full mb-1 md:mb-2 flex items-center justify-center ${formData.source === "mining" ? "bg-purple-500" : "bg-[#444]"}`}>
                                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <span className="text-white text-[10px] md:text-xs font-medium">Mining Bonus</span>
                                <span className="text-gray-400 text-[10px] mt-1">₹{(userData.monthlyROI || 0).toLocaleString()}</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, source: "annual" }))}
                            className={`p-2 md:p-3 rounded-lg border transition-all ${formData.source === "annual"
                                ? "border-orange-500 bg-orange-500/20"
                                : "border-[#444] bg-[#1a1a2e] hover:border-orange-500/50"}`}
                        >
                            <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full mb-1 md:mb-2 flex items-center justify-center ${formData.source === "annual" ? "bg-orange-500" : "bg-[#444]"}`}>
                                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-white text-[10px] md:text-xs font-medium">Annual Bonus</span>
                                <span className="text-gray-400 text-[10px] mt-1">₹{(userData.anualBonus || 0).toLocaleString()}</span>
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
                            className="text-xs px-2 md:px-3 py-1 bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30 transition-colors"
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
                            className="w-full px-3 md:px-4 py-2 md:py-3 pl-10 md:pl-12 bg-[#1a1a2e] border border-[#444] text-white rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all text-sm md:text-base"
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
                    <div className="space-y-4">
                        {/* Toggle for using KYC account */}
                        {kycData?.status === 'approved' && kycData?.bankDetails && (
                            <div className="flex items-center justify-between p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs md:text-sm text-white font-medium">Use KYC verified account</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.useKYCAccount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, useKYCAccount: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-[#444] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                </label>
                            </div>
                        )}

                        {/* Bank Details Fields */}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="accountNumber" className="block text-xs md:text-sm font-semibold text-white mb-2">
                                    Account Number
                                </label>
                                <input
                                    id="accountNumber"
                                    type="text"
                                    name="accountNumber"
                                    value={formData.bankDetails.accountNumber}
                                    onChange={handleBankDetailsChange}
                                    placeholder="Enter account number"
                                    disabled={formData.useKYCAccount && kycData?.status === 'approved'}
                                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all text-sm md:text-base font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            {!formData.useKYCAccount && (
                                <>
                                    <div>
                                        <label htmlFor="accountHolderName" className="block text-xs md:text-sm font-semibold text-white mb-2">
                                            Account Holder Name
                                        </label>
                                        <input
                                            id="accountHolderName"
                                            type="text"
                                            name="accountHolderName"
                                            value={formData.bankDetails.accountHolderName}
                                            onChange={handleBankDetailsChange}
                                            placeholder="Enter account holder name"
                                            className="w-full px-3 md:px-4 py-2 md:py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all text-sm md:text-base"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="ifscCode" className="block text-xs md:text-sm font-semibold text-white mb-2">
                                            IFSC Code
                                        </label>
                                        <input
                                            id="ifscCode"
                                            type="text"
                                            name="ifscCode"
                                            value={formData.bankDetails.ifscCode}
                                            onChange={handleBankDetailsChange}
                                            placeholder="Enter IFSC code"
                                            className="w-full px-3 md:px-4 py-2 md:py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all text-sm md:text-base font-mono uppercase"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="bankName" className="block text-xs md:text-sm font-semibold text-white mb-2">
                                            Bank Name
                                        </label>
                                        <input
                                            id="bankName"
                                            type="text"
                                            name="bankName"
                                            value={formData.bankDetails.bankName}
                                            onChange={handleBankDetailsChange}
                                            placeholder="Enter bank name"
                                            className="w-full px-3 md:px-4 py-2 md:py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all text-sm md:text-base"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="branchName" className="block text-xs md:text-sm font-semibold text-white mb-2">
                                            Branch Name
                                        </label>
                                        <input
                                            id="branchName"
                                            type="text"
                                            name="branchName"
                                            value={formData.bankDetails.branchName}
                                            onChange={handleBankDetailsChange}
                                            placeholder="Enter branch name"
                                            className="w-full px-3 md:px-4 py-2 md:py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all text-sm md:text-base"
                                        />
                                    </div>
                                </>
                            )}

                            <p className="text-[10px] text-gray-400">
                                {formData.useKYCAccount && kycData?.status === 'approved'
                                    ? "Using your KYC verified bank account. Toggle off to use a different account."
                                    : "Please provide complete bank details for withdrawal to a different account."}
                            </p>
                        </div>
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
                            value={formData.walletAddress || ""}
                            onChange={handleChange}
                            placeholder="Enter your crypto wallet address"
                            className="w-full px-3 md:px-4 py-2 md:py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all text-sm md:text-base"
                        />
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full px-4 md:px-6 py-3 md:py-4 bg-gradient-brand text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 text-sm md:text-lg"
                >
                    Submit Withdrawal Request
                </button>

                {/* Info Note */}
                <div className="p-2 md:p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                    <p className="text-xs text-gray-300 text-center">
                        ⚡ Withdrawal requests are processed within 24-48 hours. A 1% processing fee applies.
                    </p>
                </div>
            </form>
        </div>
    )
}