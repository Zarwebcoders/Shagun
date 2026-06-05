"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import { useWeb3 } from "../hooks/useWeb3"
import client from "../api/client"

export default function WithdrawalForm({ onSubmit, userData, kycData, bankAccount, savedWallet }) {
    const { isConnected, connectWallet, balance: walletBalance, availableMiningRewards } = useWeb3()

    const [formData, setFormData] = useState({
        source: "level",
        amount: "",
        method: "bank-transfer",
        useKYCAccount: true,
        remark: "",
        bankDetails: {
            accountNumber: "",
            accountHolderName: "",
            ifscCode: "",
            bankName: "",
            branchName: ""
        }
    })

    // PIN modal state
    const [pin, setPin] = useState(["", "", "", "", "", ""])
    const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""])  // for set-pin flow
    const [showPinModal, setShowPinModal] = useState(false)
    const [pinMode, setPinMode] = useState("verify")          // "verify" | "set" | "set_confirm"
    const [pinLoading, setPinLoading] = useState(false)
    const [pendingSubmitData, setPendingSubmitData] = useState(null)
    const pinRefs = useRef([])
    const confirmPinRefs = useRef([])

    // Read pin status from localStorage
    const getPinStatus = () => {
        try {
            const stored = localStorage.getItem("user")
            if (!stored) return false
            const parsed = JSON.parse(stored)
            return parsed.withdrawal_pin_set === true
        } catch { return false }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleBankDetailsChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            bankDetails: { ...prev.bankDetails, [name]: value }
        }))
    }

    useEffect(() => {
        if (savedWallet) setFormData(prev => ({ ...prev, walletAddress: savedWallet }))
        if (bankAccount) {
            setFormData(prev => ({
                ...prev,
                bankDetails: {
                    accountNumber: bankAccount.acc_num || "",
                    accountHolderName: bankAccount.acc_name || "",
                    ifscCode: bankAccount.back_code || "",
                    bankName: bankAccount.back_name || "",
                    branchName: bankAccount.branch || ""
                }
            }))
        }
    }, [bankAccount, savedWallet])

    const getMaxAmount = () => {
        switch (formData.source) {
            case "level": return userData.withdrawableLevelIncome || 0;
            case "mining": return Number(walletBalance) || 0;
            case "annual": return userData.anualBonus || 0;
            default: return 0;
        }
    }

    const handleMaxClick = () => {
        setFormData((prev) => ({ ...prev, amount: getMaxAmount().toString() }))
    }

    // Step 1: Validate form → open PIN modal
    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.amount) return

        const amount = Number.parseFloat(formData.amount)
        if (amount < 10) {
            const unit = formData.source === 'annual' ? '₹' : 'SGN'
            toast.error(`Minimum withdrawal amount is ${unit} 10`)
            return
        }

        if (formData.source === "mining" && !isConnected) {
            toast.error("Please connect your MetaMask wallet first to withdraw Mining Bonus")
            connectWallet()
            return
        }

        let sourceName = "Level Income"
        if (formData.source === "mining") sourceName = "Mining Bonus"
        if (formData.source === "annual") sourceName = "Annual Bonus"

        setPendingSubmitData({
            amount,
            method: "Bank Transfer",
            source: sourceName,
            bankDetails: formData.useKYCAccount ? null : formData.bankDetails,
            remark: formData.remark
        })

        const hasPinSet = getPinStatus()
        setPin(["", "", "", "", "", ""])
        setConfirmPin(["", "", "", "", "", ""])
        setPinMode(hasPinSet ? "verify" : "set")
        setShowPinModal(true)
        setTimeout(() => pinRefs.current[0]?.focus(), 100)
    }

    // PIN digit input handler
    const handlePinInput = (index, value, refs, setter) => {
        if (!/^\d*$/.test(value)) return
        setter(prev => {
            const next = [...prev]
            next[index] = value.slice(-1)
            return next
        })
        if (value && index < 5) refs.current[index + 1]?.focus()
    }

    const handlePinKeyDown = (index, e, refs, current) => {
        if (e.key === "Backspace" && !current[index] && index > 0) {
            refs.current[index - 1]?.focus()
        }
    }

    // Step 2a: Setting PIN for the first time
    const handleSetPin = async () => {
        const enteredPin = pin.join("")
        if (enteredPin.length !== 6) {
            toast.error("Please enter all 6 digits")
            return
        }
        // Move to confirm step
        setPinMode("set_confirm")
        setConfirmPin(["", "", "", "", "", ""])
        setTimeout(() => confirmPinRefs.current[0]?.focus(), 100)
    }

    // Step 2b: Confirm new PIN and save to backend
    const handleConfirmSetPin = async () => {
        const enteredPin = pin.join("")
        const confirmEnteredPin = confirmPin.join("")

        if (confirmEnteredPin.length !== 6) {
            toast.error("Please enter all 6 digits to confirm")
            return
        }
        if (enteredPin !== confirmEnteredPin) {
            toast.error("PINs do not match. Please try again.")
            setConfirmPin(["", "", "", "", "", ""])
            setTimeout(() => confirmPinRefs.current[0]?.focus(), 100)
            return
        }

        setPinLoading(true)
        try {
            await client.post('/auth/set-pin', { pin: enteredPin })

            // Update localStorage so we know PIN is now set
            const stored = localStorage.getItem("user")
            if (stored) {
                const parsed = JSON.parse(stored)
                parsed.withdrawal_pin_set = true
                localStorage.setItem("user", JSON.stringify(parsed))
            }

            toast.success("✅ Withdrawal PIN set successfully!")
            setShowPinModal(false)
            // Now proceed with the actual withdrawal
            onSubmit({ ...pendingSubmitData, pin: enteredPin })
            resetForm()
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to set PIN. Please try again.")
        } finally {
            setPinLoading(false)
        }
    }

    // Step 2c: Verify existing PIN against backend
    const handleVerifyPin = async () => {
        const enteredPin = pin.join("")
        if (enteredPin.length !== 6) {
            toast.error("Please enter complete 6-digit PIN")
            return
        }

        setPinLoading(true)
        try {
            await client.post('/auth/verify-pin', { pin: enteredPin })
            // PIN verified ✅ — proceed with withdrawal
            setShowPinModal(false)
            onSubmit({ ...pendingSubmitData, pin: enteredPin })
            resetForm()
        } catch (err) {
            const data = err?.response?.data
            if (data?.pin_not_set) {
                // Edge case: server says no PIN set but localStorage was stale
                const stored = localStorage.getItem("user")
                if (stored) {
                    const parsed = JSON.parse(stored)
                    parsed.withdrawal_pin_set = false
                    localStorage.setItem("user", JSON.stringify(parsed))
                }
                toast.error("No PIN set yet. Redirecting to set PIN...")
                setPin(["", "", "", "", "", ""])
                setConfirmPin(["", "", "", "", "", ""])
                setPinMode("set")
                setTimeout(() => pinRefs.current[0]?.focus(), 100)
            } else {
                toast.error(data?.message || "Incorrect PIN. Please try again.")
                setPin(["", "", "", "", "", ""])
                setTimeout(() => pinRefs.current[0]?.focus(), 100)
            }
        } finally {
            setPinLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            source: "level",
            amount: "",
            method: "bank-transfer",
            useKYCAccount: true,
            remark: "",
            bankDetails: {
                accountNumber: "",
                accountHolderName: "",
                ifscCode: "",
                bankName: "",
                branchName: ""
            }
        })
        setPendingSubmitData(null)
    }

    const maskAccountNumber = (acc) => {
        if (!acc) return "";
        return acc.slice(0, 4) + " •••• •••• " + acc.slice(-4);
    }

    return (
        <>
            {/* PIN Modal — 3 modes: "set" | "set_confirm" | "verify" */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#0d0d1a] border border-teal-500/40 rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-teal-500/20 mx-4">

                        {/* Icon + Title */}
                        <div className="flex items-center justify-center mb-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${
                                pinMode === "verify"
                                    ? "bg-teal-500/20 border-teal-500/40"
                                    : "bg-orange-500/20 border-orange-500/40"
                            }`}>
                                <svg className={`w-8 h-8 ${pinMode === "verify" ? "text-teal-400" : "text-orange-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>

                        {/* Titles per mode */}
                        {pinMode === "set" && (
                            <>
                                <h3 className="text-xl font-bold text-white text-center mb-1">Set Withdrawal PIN</h3>
                                <p className="text-gray-400 text-sm text-center mb-5">Create a new 6-digit PIN to secure your withdrawals. You will need this PIN every time.</p>
                            </>
                        )}
                        {pinMode === "set_confirm" && (
                            <>
                                <h3 className="text-xl font-bold text-white text-center mb-1">Confirm Your PIN</h3>
                                <p className="text-gray-400 text-sm text-center mb-5">Re-enter the same 6-digit PIN to confirm it.</p>
                            </>
                        )}
                        {pinMode === "verify" && (
                            <>
                                <h3 className="text-xl font-bold text-white text-center mb-1">Security Verification</h3>
                                <p className="text-gray-400 text-sm text-center mb-5">Enter your 6-digit withdrawal PIN to confirm this transaction.</p>
                            </>
                        )}

                        {/* Withdrawal Summary */}
                        <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 mb-5 text-center">
                            <p className="text-gray-400 text-xs">Withdrawing</p>
                            <p className="text-white font-bold text-lg">
                                {pendingSubmitData?.source === "Annual Bonus" ? "₹" : "Level Token "}{pendingSubmitData?.amount?.toLocaleString()}
                            </p>
                            <p className="text-teal-400 text-xs mt-1">{pendingSubmitData?.source}</p>
                        </div>

                        {/* PIN Input — new PIN (used in set + verify modes) */}
                        {(pinMode === "set" || pinMode === "verify") && (
                            <div className="flex justify-center gap-2 mb-5">
                                {pin.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => pinRefs.current[index] = el}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handlePinInput(index, e.target.value, pinRefs, setPin)}
                                        onKeyDown={e => handlePinKeyDown(index, e, pinRefs, pin)}
                                        className={`w-11 h-12 text-center text-xl font-bold bg-[#1a1a2e] border-2 rounded-xl text-white focus:outline-none transition-all
                                            ${digit ? (pinMode === "verify" ? "border-teal-500 bg-teal-500/10" : "border-orange-500 bg-orange-500/10") : "border-[#333] focus:border-teal-500"}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Confirm PIN Input (set_confirm mode) */}
                        {pinMode === "set_confirm" && (
                            <div className="flex justify-center gap-2 mb-5">
                                {confirmPin.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => confirmPinRefs.current[index] = el}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handlePinInput(index, e.target.value, confirmPinRefs, setConfirmPin)}
                                        onKeyDown={e => handlePinKeyDown(index, e, confirmPinRefs, confirmPin)}
                                        className={`w-11 h-12 text-center text-xl font-bold bg-[#1a1a2e] border-2 rounded-xl text-white focus:outline-none transition-all
                                            ${digit ? "border-orange-500 bg-orange-500/10" : "border-[#333] focus:border-orange-500"}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowPinModal(false); setPin(["", "", "", "", "", ""]); setConfirmPin(["", "", "", "", "", ""]) }}
                                disabled={pinLoading}
                                className="flex-1 px-4 py-3 bg-[#1a1a2e] text-gray-300 font-semibold rounded-xl border border-[#333] hover:border-[#555] transition-all disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={pinMode === "set" ? handleSetPin : pinMode === "set_confirm" ? handleConfirmSetPin : handleVerifyPin}
                                disabled={pinLoading || (pinMode !== "set_confirm" ? pin.join("").length !== 6 : confirmPin.join("").length !== 6)}
                                className={`flex-1 px-4 py-3 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 ${
                                    pinMode === "verify"
                                        ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-400 hover:to-teal-500 shadow-teal-500/20"
                                        : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 shadow-orange-500/20"
                                }`}
                            >
                                {pinLoading && (
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                )}
                                {pinLoading ? "Please wait..." : pinMode === "set" ? "Next →" : pinMode === "set_confirm" ? "Save PIN" : "Confirm Withdrawal"}
                            </button>
                        </div>

                        <p className="text-center text-xs text-gray-500 mt-4">
                            {pinMode === "verify"
                                ? "🔒 PIN is verified securely on the server — never stored in browser."
                                : "⚠️ Remember this PIN. It cannot be recovered without admin support."
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Main Form */}
            <div className="relative bg-gradient-to-br from-[#040408] via-[#0d1a1a] to-[#0d0d1f] rounded-2xl border border-teal-500/50 overflow-hidden shadow-2xl shadow-teal-500/10">
                {/* Glow top bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-purple-500 to-teal-500"></div>

                {/* Header */}
                <div className="p-5 md:p-6 border-b border-teal-500/20 bg-gradient-to-r from-teal-500/15 to-purple-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-white">Withdrawal Request</h3>
                            <p className="text-gray-400 text-xs md:text-sm">Withdraw from your available wallets securely</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
                    {/* Source Selection */}
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-white mb-3">
                            Select Withdrawal Source
                        </label>
                        <div className="grid grid-cols-3 gap-2 md:gap-3">
                            {/* Level Income */}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, source: "level" }))}
                                className={`p-3 rounded-xl border-2 transition-all ${formData.source === "level"
                                    ? "border-teal-500 bg-teal-500/15 shadow-lg shadow-teal-500/20"
                                    : "border-[#333] bg-[#111] hover:border-teal-500/40"}`}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${formData.source === "level" ? "bg-teal-500" : "bg-[#333]"}`}>
                                        <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-white text-[10px] md:text-xs font-medium">Level Income</span>
                                    <span className={`text-[10px] font-bold ${formData.source === "level" ? "text-teal-400" : "text-gray-400"}`}>
                                        Level Token {(userData.withdrawableLevelIncome || 0).toLocaleString()}
                                    </span>
                                </div>
                            </button>

                            {/* Mining Bonus */}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, source: "mining" }))}
                                className={`p-3 rounded-xl border-2 transition-all ${formData.source === "mining"
                                    ? "border-purple-500 bg-purple-500/15 shadow-lg shadow-purple-500/20"
                                    : "border-[#333] bg-[#111] hover:border-purple-500/40"}`}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${formData.source === "mining" ? "bg-purple-500" : "bg-[#333]"}`}>
                                        <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <span className="text-white text-[10px] md:text-xs font-medium">Mining Bonus</span>
                                    {isConnected ? (
                                        <span className={`text-[10px] font-bold ${formData.source === "mining" ? "text-purple-400" : "text-gray-400"}`}>
                                            SGN {Number(walletBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-orange-400">Connect Wallet</span>
                                    )}
                                </div>
                            </button>

                            {/* Annual Bonus */}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, source: "annual" }))}
                                className={`p-3 rounded-xl border-2 transition-all ${formData.source === "annual"
                                    ? "border-orange-500 bg-orange-500/15 shadow-lg shadow-orange-500/20"
                                    : "border-[#333] bg-[#111] hover:border-orange-500/40"}`}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${formData.source === "annual" ? "bg-orange-500" : "bg-[#333]"}`}>
                                        <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-white text-[10px] md:text-xs font-medium">Annual Bonus</span>
                                    <span className={`text-[10px] font-bold ${formData.source === "annual" ? "text-orange-400" : "text-gray-400"}`}>
                                        ₹{(userData.anualBonus || 0).toLocaleString()}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Connect Wallet Banner – show only when mining is selected and wallet is not connected */}
                    {formData.source === "mining" && !isConnected && (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <p className="text-orange-300 text-xs font-medium">
                                    Connect your MetaMask wallet to see your available Mining Bonus and withdraw on-chain.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={connectWallet}
                                className="flex-shrink-0 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-400 transition-all"
                            >
                                Connect
                            </button>
                        </div>
                    )}

                    {/* Wallet Info Banner – show when connected and mining is selected */}
                    {formData.source === "mining" && isConnected && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-400">Wallet SGN Balance</p>
                                <p className="text-sm font-bold text-purple-300">SGN {Number(walletBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                            </div>
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="amount" className="block text-xs md:text-sm font-semibold text-white">
                                Withdrawal Amount ({formData.source === 'annual' ? '₹' : 'SGN'})
                            </label>
                            <button
                                type="button"
                                onClick={handleMaxClick}
                                className="text-xs px-2 md:px-3 py-1 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors font-semibold"
                            >
                                MAX: {getMaxAmount().toLocaleString(undefined, { maximumFractionDigits: 4 })}
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
                                min="10"
                                className="w-full px-4 py-3 pl-14 bg-[#111] border-2 border-[#333] text-white rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-base font-mono"
                            />
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-400 text-xs font-bold bg-teal-500/20 px-1.5 py-0.5 rounded">
                                {formData.source === 'annual' ? '₹' : 'SGN'}
                            </div>
                        </div>
                        <div className="flex justify-between mt-1.5">
                            <span className="text-xs text-gray-500">Min: {formData.source === 'annual' ? '₹' : 'SGN '} 10</span>
                            <span className="text-xs text-gray-400">Available: <span className="text-teal-400 font-semibold">{getMaxAmount().toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></span>
                        </div>
                    </div>

                    {/* Payment Details */}
                    {formData.method === "bank-transfer" && (
                        <div>
                            {bankAccount && bankAccount.approve === 1 ? (
                                <div className="bg-teal-500/5 border border-teal-500/30 rounded-2xl p-5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <svg className="w-16 h-16 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/20">
                                            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Withdrawal Destination</p>
                                            <h4 className="text-white font-bold">{bankAccount.back_name}</h4>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-gray-400 text-sm">Account Holder</span>
                                            <span className="text-white font-medium">{bankAccount.acc_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-gray-400 text-sm">Account Number</span>
                                            <span className="text-white font-mono">{maskAccountNumber(bankAccount.acc_num)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-gray-400 text-sm">IFSC Code</span>
                                            <span className="text-white font-mono">{bankAccount.back_code}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-teal-500/20 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <p className="text-xs text-green-400 font-medium tracking-wide uppercase">Verified Bank Account</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                                        <p className="text-yellow-500 text-xs font-medium flex items-center gap-2">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Please ensure your bank details are verified in your profile.
                                        </p>
                                    </div>
                                    <input
                                        id="accountNumber"
                                        type="text"
                                        name="accountNumber"
                                        value={formData.bankDetails.accountNumber}
                                        onChange={handleBankDetailsChange}
                                        placeholder="Enter account number"
                                        className="w-full px-4 py-3 bg-[#111] border-2 border-[#333] text-white rounded-xl focus:outline-none focus:border-teal-500 transition-all text-sm font-mono"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Remark (Optional) */}
                    <div>
                        <label htmlFor="remark" className="block text-xs md:text-sm font-semibold text-white mb-2">
                            Remark (Optional)
                        </label>
                        <input
                            id="remark"
                            type="text"
                            name="remark"
                            value={formData.remark || ""}
                            onChange={handleChange}
                            placeholder="Enter a payment reference, note, or remark..."
                            className="w-full px-4 py-3 bg-[#111] border-2 border-[#333] text-white rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm animate-fadeIn"
                        />
                    </div>

                    {/* PIN Info Note */}
                    <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="text-xs text-gray-300">
                            <span className="text-purple-400 font-semibold">PIN Required:</span> You will be asked to enter your 6-digit security PIN to confirm the withdrawal.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold rounded-xl hover:from-teal-400 hover:to-teal-500 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 text-base flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Submit Withdrawal Request
                    </button>

                    <p className="text-center text-xs text-gray-500">
                        ⚡ Processed within 24–48 hours &nbsp;·&nbsp; 1% processing fee applies
                    </p>
                </form>
            </div>
        </>
    )
}