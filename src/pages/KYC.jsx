"use client"

import { useState } from "react"

export default function KYC() {
    const [step, setStep] = useState(1)
    const [isEditingBank, setIsEditingBank] = useState(false)
    
    const [formData, setFormData] = useState({
        // Aadhar Details
        aadharNumber: "",
        aadharFrontFile: null,
        aadharBackFile: null,
        
        // PAN Details
        panNumber: "",
        panFile: null,
        
        // Photos
        profilePhoto: null,
        agreementPhoto: null,
        
        // Bank Details
        accountName: "",
        bankName: "",
        accountNumber: "",
        branch: "",
        ifscCode: "",
    })

    const [previewUrls, setPreviewUrls] = useState({
        aadharFront: null,
        aadharBack: null,
        pan: null,
        profile: null,
        agreement: null,
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleFileChange = (e, field) => {
        const file = e.target.files[0]
        if (file) {
            setFormData((prev) => ({ ...prev, [field]: file }))
            
            // Create preview URL
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewUrls((prev) => ({
                    ...prev,
                    [field.replace('File', '')]: reader.result
                }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleNext = () => {
        if (step < 4) setStep(step + 1)
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        alert("KYC verification submitted successfully!")
    }

    const handleSaveBank = () => {
        setIsEditingBank(false)
        alert("Bank details saved successfully!")
    }

    const handleCancelEdit = () => {
        setIsEditingBank(false)
        // Reset form to original values here if needed
    }

    const removeFile = (field) => {
        setFormData((prev) => ({ ...prev, [field]: null }))
        setPreviewUrls((prev) => ({ ...prev, [field]: null }))
    }

    return (
        <div className="w-full space-y-8">
            <h2 className="text-4xl font-bold text-white mb-2">KYC Verification</h2>
            <p className="text-[#b0b0b0] text-lg">Complete your identity verification to unlock all features</p>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
                {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="flex items-center flex-1">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= num
                                    ? "bg-[#9131e7] text-[#040408] shadow-lg shadow-[#9131e7]/50"
                                    : "bg-[#444] text-white border border-[#666]"
                                }`}
                        >
                            {num}
                        </div>
                        {num < 4 && (
                            <div className={`flex-1 h-1 mx-4 transition-all ${step > num ? "bg-[#9131e7]" : "bg-[#444]"}`}></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Step Labels */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className={`text-center ${step >= 1 ? "text-[#9131e7]" : "text-gray-500"}`}>
                    <div className="font-bold">Profile Photo</div>
                </div>
                <div className={`text-center ${step >= 2 ? "text-[#9131e7]" : "text-gray-500"}`}>
                    <div className="font-bold">Aadhar Details</div>
                </div>
                <div className={`text-center ${step >= 3 ? "text-[#9131e7]" : "text-gray-500"}`}>
                    <div className="font-bold">PAN Details</div>
                </div>
                <div className={`text-center ${step >= 4 ? "text-[#9131e7]" : "text-gray-500"}`}>
                    <div className="font-bold">Bank Details</div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Step 1: Profile Photo */}
                {step === 1 && (
                    <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-8 rounded-xl border border-[#444] animate-fade-in">
                        <h3 className="text-2xl font-bold text-[#9131e7] mb-6">Profile Photo</h3>
                        
                        <div className="space-y-6">
                            {/* Profile Photo Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Upload Your Profile Photo
                                </label>
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative">
                                        {previewUrls.profile ? (
                                            <>
                                                <img
                                                    src={previewUrls.profile}
                                                    alt="Profile Preview"
                                                    className="w-48 h-48 rounded-full object-cover border-4 border-[#9131e7]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile('profile')}
                                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                                                >
                                                    ×
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-48 h-48 rounded-full border-4 border-dashed border-[#444] flex items-center justify-center">
                                                <div className="text-center">
                                                    <svg className="w-16 h-16 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    <span className="text-gray-500">No photo</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            id="profilePhoto"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'profilePhoto')}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="profilePhoto"
                                            className="px-6 py-3 bg-[#9131e7] text-white rounded-lg hover:bg-[#7a27c9] transition-all cursor-pointer text-lg font-bold"
                                        >
                                            {formData.profilePhoto ? "Change Photo" : "Upload Photo"}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center text-gray-400 text-sm">
                                <p>Please upload a clear, recent photo of yourself</p>
                                <p>Max file size: 5MB | Supported formats: JPG, PNG</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Aadhar Details */}
                {step === 2 && (
                    <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-8 rounded-xl border border-[#444] animate-fade-in">
                        <h3 className="text-2xl font-bold text-[#9131e7] mb-6">Aadhar Card Details</h3>
                        
                        <div className="space-y-8">
                            {/* Aadhar Number */}
                            <div>
                                <label htmlFor="aadharNumber" className="block text-sm font-semibold text-white mb-2">
                                    Aadhar Number
                                </label>
                                <input
                                    id="aadharNumber"
                                    type="text"
                                    name="aadharNumber"
                                    value={formData.aadharNumber}
                                    onChange={handleChange}
                                    placeholder="1234 5678 9012"
                                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all"
                                />
                            </div>

                            {/* Aadhar Front */}
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Aadhar Card Front Page
                                </label>
                                <div className="space-y-4">
                                    {previewUrls.aadharFront ? (
                                        <div className="relative">
                                            <img
                                                src={previewUrls.aadharFront}
                                                alt="Aadhar Front Preview"
                                                className="w-full max-w-md rounded-lg border-2 border-[#9131e7]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFile('aadharFront')}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-md h-48 rounded-lg border-2 border-dashed border-[#444] flex flex-col items-center justify-center p-4">
                                            <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <span className="text-gray-500 text-center">Upload Aadhar Front Page</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="aadharFrontFile"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'aadharFrontFile')}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="aadharFrontFile"
                                        className="inline-block px-4 py-2 bg-[#9131e7] text-white rounded-lg hover:bg-[#7a27c9] transition-all cursor-pointer"
                                    >
                                        {formData.aadharFrontFile ? "Change Document" : "Upload Document"}
                                    </label>
                                </div>
                            </div>

                            {/* Aadhar Back */}
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Aadhar Card Back Page
                                </label>
                                <div className="space-y-4">
                                    {previewUrls.aadharBack ? (
                                        <div className="relative">
                                            <img
                                                src={previewUrls.aadharBack}
                                                alt="Aadhar Back Preview"
                                                className="w-full max-w-md rounded-lg border-2 border-[#9131e7]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFile('aadharBack')}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-md h-48 rounded-lg border-2 border-dashed border-[#444] flex flex-col items-center justify-center p-4">
                                            <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <span className="text-gray-500 text-center">Upload Aadhar Back Page</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="aadharBackFile"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'aadharBackFile')}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="aadharBackFile"
                                        className="inline-block px-4 py-2 bg-[#9131e7] text-white rounded-lg hover:bg-[#7a27c9] transition-all cursor-pointer"
                                    >
                                        {formData.aadharBackFile ? "Change Document" : "Upload Document"}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: PAN Details */}
                {step === 3 && (
                    <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-8 rounded-xl border border-[#444] animate-fade-in">
                        <h3 className="text-2xl font-bold text-[#9131e7] mb-6">PAN Card Details</h3>
                        
                        <div className="space-y-8">
                            {/* PAN Number */}
                            <div>
                                <label htmlFor="panNumber" className="block text-sm font-semibold text-white mb-2">
                                    PAN Number
                                </label>
                                <input
                                    id="panNumber"
                                    type="text"
                                    name="panNumber"
                                    value={formData.panNumber}
                                    onChange={handleChange}
                                    placeholder="ABCDE1234F"
                                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all"
                                />
                            </div>

                            {/* PAN Card Photo */}
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    PAN Card Photo
                                </label>
                                <div className="space-y-4">
                                    {previewUrls.pan ? (
                                        <div className="relative">
                                            <img
                                                src={previewUrls.pan}
                                                alt="PAN Card Preview"
                                                className="w-full max-w-md rounded-lg border-2 border-[#9131e7]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFile('pan')}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-md h-48 rounded-lg border-2 border-dashed border-[#444] flex flex-col items-center justify-center p-4">
                                            <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <span className="text-gray-500 text-center">Upload PAN Card Photo</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="panFile"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'panFile')}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="panFile"
                                        className="inline-block px-4 py-2 bg-[#9131e7] text-white rounded-lg hover:bg-[#7a27c9] transition-all cursor-pointer"
                                    >
                                        {formData.panFile ? "Change Document" : "Upload Document"}
                                    </label>
                                </div>
                            </div>

                            {/* Agreement Photo */}
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Agreement Photo
                                </label>
                                <div className="space-y-4">
                                    {previewUrls.agreement ? (
                                        <div className="relative">
                                            <img
                                                src={previewUrls.agreement}
                                                alt="Agreement Preview"
                                                className="w-full max-w-md rounded-lg border-2 border-[#9131e7]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFile('agreement')}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-md h-48 rounded-lg border-2 border-dashed border-[#444] flex flex-col items-center justify-center p-4">
                                            <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <span className="text-gray-500 text-center">Upload Agreement Photo</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="agreementPhoto"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'agreementPhoto')}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="agreementPhoto"
                                        className="inline-block px-4 py-2 bg-[#9131e7] text-white rounded-lg hover:bg-[#7a27c9] transition-all cursor-pointer"
                                    >
                                        {formData.agreementPhoto ? "Change Document" : "Upload Document"}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Bank Details */}
                {step === 4 && (
                    <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-8 rounded-xl border border-[#444] animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-[#9131e7]">Bank Details</h3>
                            {!isEditingBank && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditingBank(true)}
                                    className="px-4 py-2 bg-[#9131e7]/20 text-[#9131e7] font-bold rounded-lg hover:bg-[#9131e7]/30 transition-all"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="accountName" className="block text-sm font-semibold text-white mb-2">
                                        Account Holder Name
                                    </label>
                                    <input
                                        id="accountName"
                                        type="text"
                                        name="accountName"
                                        value={formData.accountName}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        disabled={!isEditingBank}
                                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="bankName" className="block text-sm font-semibold text-white mb-2">
                                        Bank Name
                                    </label>
                                    <input
                                        id="bankName"
                                        type="text"
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleChange}
                                        placeholder="State Bank of India"
                                        disabled={!isEditingBank}
                                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="accountNumber" className="block text-sm font-semibold text-white mb-2">
                                        Account Number
                                    </label>
                                    <input
                                        id="accountNumber"
                                        type="text"
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleChange}
                                        placeholder="1234567890"
                                        disabled={!isEditingBank}
                                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="branch" className="block text-sm font-semibold text-white mb-2">
                                        Branch
                                    </label>
                                    <input
                                        id="branch"
                                        type="text"
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        placeholder="Main Branch"
                                        disabled={!isEditingBank}
                                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="ifscCode" className="block text-sm font-semibold text-white mb-2">
                                    IFSC Code
                                </label>
                                <input
                                    id="ifscCode"
                                    type="text"
                                    name="ifscCode"
                                    value={formData.ifscCode}
                                    onChange={handleChange}
                                    placeholder="SBIN0001234"
                                    disabled={!isEditingBank}
                                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>

                            {isEditingBank && (
                                <div className="flex gap-4 pt-4 border-t border-[#444]">
                                    <button
                                        type="button"
                                        onClick={handleSaveBank}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#9131e7] to-[#e84495] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#9131e7]/50 transition-all"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="flex-1 px-6 py-3 border-2 border-[#9131e7] text-[#9131e7] font-bold rounded-lg hover:bg-[#9131e7]/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-3 border-2 border-[#9131e7] text-[#9131e7] font-bold rounded-lg hover:bg-[#9131e7]/10 transition-all duration-300"
                        >
                            Back
                        </button>
                    )}
                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#9131e7] to-[#e84495] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#9131e7]/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#9131e7] to-[#e84495] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#9131e7]/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
                        >
                            Submit KYC
                        </button>
                    )}
                </div>
            </form>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
            `}</style>
        </div>
    )
}