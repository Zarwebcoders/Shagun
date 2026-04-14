"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { motion } from "framer-motion"
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"

export default function ForgotPassword() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (email) {
            setIsLoading(true)
            setError("")
            try {
                await client.post('/auth/forgot-password', { email });
                setIsSent(true)
            } catch (err) {
                setError(err.response?.data?.message || "Failed to send reset link");
            } finally {
                setIsLoading(false)
            }
        } else {
            setError("Please enter your email address")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden px-4">
            {/* Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Back Button */}
                <button
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition-colors mb-6 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium tracking-wide">Back to Login</span>
                </button>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/5">
                    {!isSent ? (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-white mb-3">Forgot Password?</h2>
                                <p className="text-gray-400 font-light leading-relaxed">
                                    Enter your registered email address and we'll send you a link to reset your password.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-400 text-gray-500">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 hover:border-white/20"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-red-400 text-sm text-center font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                        {error}
                                    </p>
                                )}

                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-900/40 hover:shadow-teal-900/60 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </motion.button>
                            </form>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-4"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-teal-500/20 rounded-full">
                                    <CheckCircle2 className="w-12 h-12 text-teal-400" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Email Sent!</h2>
                            <p className="text-gray-400 leading-relaxed mb-8">
                                Check your inbox at <span className="text-teal-400 font-medium">{email}</span> for the password reset link.
                            </p>
                            <p className="text-xs text-purple-400/80 italic">
                                Note: The link will expire in 5 minutes.
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
