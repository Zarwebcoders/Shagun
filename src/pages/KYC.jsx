"use client"

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import client from "../api/client"
import {
    CheckCircleIcon,
    CloudArrowUpIcon,
    IdentificationIcon,
    BuildingLibraryIcon,
    UserCircleIcon,
    DocumentCheckIcon,
    ArrowRightIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline'

export default function KYC() {
    const [step, setStep] = useState(1)
    const [showSuccess, setShowSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [existingKYC, setExistingKYC] = useState(null)
    const [fetchingExisting, setFetchingExisting] = useState(true)

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

    const [fetchTrigger, setFetchTrigger] = useState(0)

    useEffect(() => {
        const fetchKYCStatus = async () => {
            try {
                const res = await client.get('/kyc/me');
                if (res.data) {
                    setExistingKYC(res.data);
                }
            } catch (error) {
                console.error("Error fetching KYC status:", error);
            } finally {
                setFetchingExisting(false);
            }
        };

        fetchKYCStatus();
    }, [fetchTrigger]);

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleFileChange = (e, field) => {
        const file = e.target.files[0]
        if (file) {
            setFormData((prev) => ({ ...prev, [field]: file }))

            const reader = new FileReader()
            reader.onloadend = () => {
                const previewFieldMap = {
                    'profilePhoto': 'profile',
                    'aadharFrontFile': 'aadharFront',
                    'aadharBackFile': 'aadharBack',
                    'panFile': 'pan',
                    'agreementPhoto': 'agreement'
                }

                const previewField = previewFieldMap[field] || field

                setPreviewUrls((prev) => ({
                    ...prev,
                    [previewField]: reader.result
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

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (step !== 4) return;

        setIsSubmitting(true)

        try {
            await client.post('/kyc', {
                aadharNumber: formData.aadharNumber,
                panNumber: formData.panNumber,
                bankDetails: {
                    accountName: formData.accountName,
                    bankName: formData.bankName,
                    accountNumber: formData.accountNumber,
                    branch: formData.branch,
                    ifscCode: formData.ifscCode
                },
                documents: {
                    profilePhoto: previewUrls.profile,
                    aadharFront: previewUrls.aadharFront,
                    aadharBack: previewUrls.aadharBack,
                    panCard: previewUrls.pan,
                    agreement: previewUrls.agreement
                }
            });

            setShowSuccess(true)
            setFetchTrigger(prev => prev + 1)

            setTimeout(() => {
                setShowSuccess(false)
                setFormData({
                    aadharNumber: "",
                    aadharFrontFile: null,
                    aadharBackFile: null,
                    panNumber: "",
                    panFile: null,
                    profilePhoto: null,
                    agreementPhoto: null,
                    accountName: "",
                    bankName: "",
                    accountNumber: "",
                    branch: "",
                    ifscCode: "",
                })
                setPreviewUrls({
                    aadharFront: null,
                    aadharBack: null,
                    pan: null,
                    profile: null,
                    agreement: null,
                })
                setStep(1)
            }, 3000)

        } catch (error) {
            console.error("Error submitting KYC:", error);
            toast.error(error.response?.data?.message || "Failed to submit KYC");
        } finally {
            setIsSubmitting(false)
        }
    }

    const removeFile = (field) => {
        const formDataFieldMap = {
            'profile': 'profilePhoto',
            'aadharFront': 'aadharFrontFile',
            'aadharBack': 'aadharBackFile',
            'pan': 'panFile',
            'agreement': 'agreementPhoto'
        }

        const formDataField = formDataFieldMap[field] || field;

        setFormData((prev) => ({ ...prev, [formDataField]: null }))
        setPreviewUrls((prev) => ({ ...prev, [field]: null }))
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    }

    const steps = [
        { id: 1, title: "Profile", icon: UserCircleIcon },
        { id: 2, title: "Aadhar", icon: IdentificationIcon },
        { id: 3, title: "PAN Card", icon: DocumentCheckIcon },
        { id: 4, title: "Bank Details", icon: BuildingLibraryIcon },
    ]

    return (
        <div className="w-full space-y-8 max-w-[1200px] mx-auto min-h-screen pb-20">
            {/* Header Section */}
            <div className="space-y-4 relative">
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px] -z-10"></div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
                    KYC <span className="bg-gradient-brand bg-clip-text text-transparent">Verification</span>
                </h2>
                <p className="text-[#b0b0b0] text-lg max-w-2xl">
                    Complete your identity verification to unlock full platform access and secure your account.
                </p>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-[#1a1a2e] p-8 rounded-3xl border border-teal-500/50 max-w-md w-full shadow-[0_0_50px_rgba(45,212,191,0.3)] text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand"></div>
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/20">
                                <CheckCircleIcon className="w-10 h-10 text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Verification Submitted!</h3>
                            <p className="text-gray-400 mb-8">
                                Your documents have been securely uploaded and are pending review. We will notify you shortly.
                            </p>
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="w-full py-3 bg-gradient-brand text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all"
                            >
                                Continue to Dashboard
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Existing KYC View or Form */}
            {fetchingExisting ? (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400">Verifying your status...</p>
                </div>
            ) : existingKYC && existingKYC.approval !== 0 ? (
                /* Detail View for Pending/Approved */
                <KYCDetailsView kyc={existingKYC} />
            ) : (
                /* Form View (New or Rejected) */
                <>
                    {existingKYC && existingKYC.approval === 0 && (
                        <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl mb-8 flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-red-500 mb-1">KYC Rejected</h4>
                                <p className="text-gray-400 mb-4">
                                    Your previous submission was rejected. Please review your details and resubmit the correct information.
                                </p>
                                <button
                                    onClick={() => setExistingKYC(null)}
                                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold"
                                >
                                    Start New Submission
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Modern Stepper */}
                    <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto mb-12 px-4">
                        <div className="absolute top-8 left-0 w-full h-1 bg-[#2a2a3e] -z-10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-brand"
                                initial={{ width: "0%" }}
                                animate={{ width: `${((step - 1) / 3) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                            />
                        </div>

                        {steps.map((s, i) => (
                            <div key={s.id} className="flex flex-col items-center gap-3 px-2 py-1 relative z-10">
                                <motion.div
                                    animate={{
                                        backgroundColor: step >= s.id ? "#1a1a2e" : "#0f0f1a",
                                        borderColor: step >= s.id ? "#2dd4bf" : "#333",
                                        scale: step === s.id ? 1.1 : 1
                                    }}
                                    className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'shadow-[0_0_20px_rgba(45,212,191,0.3)]' : ''
                                        }`}
                                >
                                    <s.icon className={`w-6 h-6 md:w-7 md:h-7 ${step >= s.id ? 'text-teal-400' : 'text-gray-600'}`} />
                                </motion.div>
                                <span className={`text-xs md:text-sm font-medium ${step >= s.id ? 'text-white' : 'text-gray-600'}`}>
                                    {s.title}
                                </span>
                            </div>
                        ))}
                    </div>
                    {/* Content Container */}
                    <motion.div
                        layout
                        className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-3xl border border-teal-500/20 overflow-hidden relative shadow-2xl min-h-[500px]"
                    >
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Profile Photo */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="p-6 md:p-12 max-w-3xl mx-auto"
                        >
                            <div className="text-center mb-10">
                                <h3 className="text-2xl font-bold text-white mb-2">Upload Profile Photo</h3>
                                <p className="text-gray-400">Please provide a clear, recent photo of yourself for your profile.</p>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-8">
                                <div className="relative group">
                                    {previewUrls.profile ? (
                                        <div className="relative">
                                            <img
                                                src={previewUrls.profile}
                                                alt="Profile Preview"
                                                className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover border-4 border-teal-500 shadow-[0_0_30px_rgba(45,212,191,0.3)]"
                                            />
                                            <button
                                                onClick={() => removeFile('profile')}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-dashed border-[#9131e7]/40 flex flex-col items-center justify-center cursor-pointer hover:bg-[#9131e7]/5 hover:border-[#9131e7] transition-all group bg-[#0f0f1a]">
                                            <CloudArrowUpIcon className="w-12 h-12 text-gray-500 group-hover:text-[#9131e7] transition-colors mb-2" />
                                            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Upload Photo</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePhoto')} />
                                        </label>
                                    )}
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1a1a2e] border border-[#333] rounded-full text-xs text-gray-400">
                                        JPG, PNG • Max 5MB
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Aadhar Details */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="p-6 md:p-12"
                        >
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2">Aadhar Verification</h3>
                                <p className="text-gray-400">Enter your government ID details securely.</p>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2 pl-1">Aadhar Number</label>
                                    <input
                                        type="text"
                                        name="aadharNumber"
                                        value={formData.aadharNumber}
                                        onChange={handleChange}
                                        placeholder="1234 5678 9012"
                                        className="w-full px-4 py-4 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-lg tracking-wide"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <UploadBox
                                        label="Front Side"
                                        file={formData.aadharFrontFile}
                                        preview={previewUrls.aadharFront}
                                        onChange={(e) => handleFileChange(e, 'aadharFrontFile')}
                                        onRemove={() => removeFile('aadharFront')}
                                    />
                                    <UploadBox
                                        label="Back Side"
                                        file={formData.aadharBackFile}
                                        preview={previewUrls.aadharBack}
                                        onChange={(e) => handleFileChange(e, 'aadharBackFile')}
                                        onRemove={() => removeFile('aadharBack')}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: PAN Details */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="p-6 md:p-12"
                        >
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2">PAN Verification</h3>
                                <p className="text-gray-400">Tax identification details.</p>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2 pl-1">PAN Number</label>
                                    <input
                                        type="text"
                                        name="panNumber"
                                        value={formData.panNumber}
                                        onChange={handleChange}
                                        placeholder="ABCDE1234F"
                                        className="w-full px-4 py-4 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-lg tracking-wide uppercase"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <UploadBox
                                        label="PAN Card Photo"
                                        file={formData.panFile}
                                        preview={previewUrls.pan}
                                        onChange={(e) => handleFileChange(e, 'panFile')}
                                        onRemove={() => removeFile('pan')}
                                    />
                                    <UploadBox
                                        label="Signed Agreement"
                                        file={formData.agreementPhoto}
                                        preview={previewUrls.agreement}
                                        onChange={(e) => handleFileChange(e, 'agreementPhoto')}
                                        onRemove={() => removeFile('agreement')}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}


                    {/* Step 4: Bank Details */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="p-6 md:p-12"
                        >
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2">Bank Account Details</h3>
                                <p className="text-gray-400">Provide bank details for your future withdrawals.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputBox
                                    label="Account Holder Name"
                                    name="accountName"
                                    value={formData.accountName}
                                    onChange={handleChange}
                                    placeholder="Name as per Bank"
                                />
                                <InputBox
                                    label="Bank Name"
                                    name="bankName"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    placeholder="e.g. State Bank of India"
                                />
                                <InputBox
                                    label="Account Number"
                                    name="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={handleChange}
                                    placeholder="Enter Account Number"
                                />
                                <InputBox
                                    label="IFSC Code"
                                    name="ifscCode"
                                    value={formData.ifscCode}
                                    onChange={handleChange}
                                    placeholder="SBIN0001234"
                                />
                                <div className="md:col-span-2">
                                    <InputBox
                                        label="Branch Name"
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        placeholder="Enter Branch Name"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}


                </AnimatePresence>

                {/* Footer Navigation */}
                <div className="p-6 md:p-8 border-t border-white/5 bg-[#0f0f1a]/50 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        Back
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            Next Step
                            <ArrowRightIcon className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`flex items-center gap-2 px-8 py-3 bg-gradient-brand text-white font-bold rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.4)] hover:shadow-[0_0_30px_rgba(45,212,191,0.6)] hover:scale-105 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {isSubmitting ? 'Processing...' : 'Submit Verification'}
                            {!isSubmitting && <CheckCircleIcon className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </motion.div>
            </>
            )}
        </div>
    )
}

function KYCDetailsView({ kyc }) {
    const statusInfo = {
        1: { label: 'Verified', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
        2: { label: 'Pending Review', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
        0: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' }
    }

    const currentStatus = statusInfo[kyc.approval] || statusInfo[2];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-3xl border border-teal-500/20 overflow-hidden shadow-2xl p-6 md:p-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-white/5">
                <div className="flex items-center gap-6">
                    {kyc.profile_photo && (
                        <div className="shrink-0 relative group">
                            <div className="absolute -inset-1 bg-gradient-brand rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                            <img
                                src={kyc.profile_photo}
                                alt="Profile"
                                className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-2 border-white/10 shadow-2xl"
                            />
                        </div>
                    )}
                    <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">KYC Verification Status</h3>
                        <p className="text-gray-400">Security and identification details submitted on {new Date(kyc.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl ${currentStatus.bg} ${currentStatus.border} border shadow-lg`}>
                    <div className={`w-3 h-3 rounded-full ${kyc.approval === 2 ? 'animate-pulse' : ''}`} style={{ backgroundColor: 'currentColor' }}></div>
                    <span className={`text-lg font-bold ${currentStatus.color}`}>{currentStatus.label}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-[#0f0f1a] p-8 rounded-3xl border border-white/5 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <IdentificationIcon className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-gray-500 text-sm mb-4 uppercase tracking-wider font-bold">Aadhar Card Number</p>
                    <p className="text-2xl md:text-3xl text-white font-mono tracking-[0.2em]">
                        {kyc.aadhar || 'XXXXXXXXXXXX'}
                    </p>
                </div>
                <div className="bg-[#0f0f1a] p-8 rounded-3xl border border-white/5 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DocumentCheckIcon className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-gray-500 text-sm mb-4 uppercase tracking-wider font-bold">PAN Card Number</p>
                    <p className="text-2xl md:text-3xl text-white font-mono tracking-[0.2em]">
                        {kyc.pan || 'XXXXXXXXXX'}
                    </p>
                </div>
            </div>

            <h4 className="text-xl font-bold text-white mb-6">Bank Account Details</h4>
            <div className="bg-[#1a1a2e]/60 border border-teal-500/20 rounded-3xl p-8 mb-12 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2">Account Holder</p>
                        <p className="text-white font-semibold text-lg">{kyc.acc_name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2">Bank Name</p>
                        <p className="text-white font-semibold text-lg">{kyc.bank_name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2">Account Number</p>
                        <p className="text-white font-mono text-lg">{kyc.acc_num || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2">IFSC Code</p>
                        <p className="text-white font-mono text-lg">{kyc.ifsc_code || 'N/A'}</p>
                    </div>
                    <div className="lg:col-span-2">
                        <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2">Branch</p>
                        <p className="text-white font-semibold text-lg">{kyc.branch || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <h4 className="text-xl font-bold text-white mb-6">Submitted Documents</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { label: 'Aadhar Front', url: kyc.aadharcard },
                    { label: 'Aadhar Back', url: kyc.aadhar_back },
                    { label: 'PAN Card', url: kyc.pancard },
                    { label: 'Agreement', url: kyc.agreement },
                    { label: 'Profile Photo', url: kyc.profile_photo }
                ].map((doc, idx) => (
                    doc.url && (
                        <div key={idx} className="group relative bg-[#0f0f1a] rounded-2xl overflow-hidden border border-white/5 aspect-video">
                            <img src={doc.url} alt={doc.label} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-white text-sm font-semibold">{doc.label}</p>
                            </div>
                        </div>
                    )
                ))}
            </div>
            
            {kyc.approval === 1 && (
                <div className="mt-12 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4">
                    <CheckCircleIcon className="w-8 h-8 text-green-400 shrink-0" />
                    <p className="text-gray-300">
                        Your identity has been fully verified. You now have full access to all platform features, including withdrawals and investments.
                    </p>
                </div>
            )}
        </motion.div>
    )
}

// Helper Components
function InputBox({ label, name, value, onChange, placeholder }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 pl-1">{label}</label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
            />
        </div>
    )
}

function UploadBox({ label, file, preview, onChange, onRemove }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 pl-1">{label}</label>
            {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-teal-500 group h-48 w-full">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            onClick={onRemove}
                            type="button"
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#white]/10 rounded-xl cursor-pointer hover:bg-teal-500/5 hover:border-teal-500/40 transition-all group bg-[#0f0f1a]">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <CloudArrowUpIcon className="w-8 h-8 text-gray-500 group-hover:text-teal-400 transition-colors mb-2" />
                        <p className="text-sm text-gray-400"><span className="font-semibold text-teal-400">Click to upload</span></p>
                        <p className="text-xs text-gray-600 mt-1">SVG, PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={onChange} />
                </label>
            )}
        </div>
    )
}