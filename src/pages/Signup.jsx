"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { motion } from "framer-motion"
import logo from "../../public/removedbg.png"
import { User, Mail, Lock, Hash, ArrowRight, Loader2, Phone } from "lucide-react"

export default function Signup({ setIsAuthenticated }) {
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
        referral_id: "",
    })
    const [sponsorName, setSponsorName] = useState("")
    const [isFetchingSponsor, setIsFetchingSponsor] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        
        // Reset sponsor name if referral ID is cleared
        if (name === 'referral_id' && !value) {
            setSponsorName("");
        }
    }

    // Effect to fetch sponsor name
    useEffect(() => {
        const fetchSponsor = async () => {
            if (formData.referral_id && formData.referral_id.length >= 3) {
                setIsFetchingSponsor(true);
                try {
                    const { data } = await client.get(`/users/check-sponsor/${formData.referral_id}`);
                    setSponsorName(data.name);
                } catch (err) {
                    setSponsorName(""); // Don't show name if not found
                } finally {
                    setIsFetchingSponsor(false);
                }
            } else {
                setSponsorName("");
            }
        };

        const timeoutId = setTimeout(fetchSponsor, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [formData.referral_id]);

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            return
        }
        
        // Validation for all required fields
        if (formData.full_name && formData.email && formData.password && formData.mobile && formData.referral_id) {
            setIsLoading(true)
            try {
                const { confirmPassword, ...registerData } = formData;
                const { data } = await client.post('/auth/register', registerData);

                // Store user data
                localStorage.setItem('user', JSON.stringify(data));

                setIsAuthenticated(true)
                navigate("/dashboard")
            } catch (err) {
                setError(err.response?.data?.message || "Registration failed");
            } finally {
                setIsLoading(false)
            }
        } else {
            setError("Please fill all required fields including Mobile and Sponsor Referral ID")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden py-10">
            {/* Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10 px-4"
            >
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/5">
                    {/* Header */}
                    <div className="flex justify-center">
                                            <img className="w-32 h-32" src={logo} alt="" />
                                        </div>
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {/* <h1 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-3 drop-shadow-sm">
                                ShagunPro
                            </h1> */}
                        </motion.div>
                        <p className="text-gray-400 font-light tracking-wide">Join the Revolution</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label htmlFor="full_name" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                                Full Name
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-400 text-gray-500">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    id="full_name"
                                    type="text"
                                    name="full_name"
                                    placeholder="John Doe"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 hover:border-white/20"
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-400 text-gray-500">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 hover:border-white/20"
                                />
                            </div>
                        </div>

                        {/* Mobile Input */}
                        <div className="space-y-2">
                            <label htmlFor="mobile" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                                Mobile Number
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-400 text-gray-500">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <input
                                    id="mobile"
                                    type="tel"
                                    name="mobile"
                                    placeholder="1234567890"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 hover:border-white/20"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-400 text-gray-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 hover:border-white/20"
                                />
                            </div>
                        </div>

                        {/* Confirm Password Input */}
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-400 text-gray-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 hover:border-white/20"
                                />
                            </div>
                        </div>

                        {/* Sponsor Referral ID Input */}
                        <div className="space-y-2">
                            <label htmlFor="referral_id" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                                Sponsor Referral ID
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-400 text-gray-500">
                                    <Hash className="w-5 h-5" />
                                </div>
                                <input
                                    id="referral_id"
                                    type="text"
                                    name="referral_id"
                                    placeholder="Enter Sponsor Referral ID"
                                    value={formData.referral_id}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 hover:border-white/20"
                                />
                            </div>
                            
                            {/* Sponsor Name Display */}
                            {isFetchingSponsor && (
                                <div className="flex items-center gap-2 mt-1 ml-1">
                                    <Loader2 className="w-3 h-3 text-teal-400 animate-spin" />
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Verifying Sponsor...</span>
                                </div>
                            )}
                            {sponsorName && !isFetchingSponsor && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mt-1.5 ml-1 px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 rounded-lg inline-flex items-center gap-2 shadow-inner"
                                >
                                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                                    <span className="text-[11px] text-teal-300 font-bold tracking-wide uppercase">
                                        Sponsor: <span className="text-white">{sponsorName}</span>
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            className="w-full mt-4 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-900/40 hover:shadow-teal-900/60 hover:brightness-110 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-gray-400">
                            Already have an account?{" "}
                            <button
                                onClick={() => navigate("/login")}
                                className="text-teal-400 font-semibold hover:text-purple-400 transition-colors duration-300 ml-1 hover:underline decoration-2 underline-offset-4"
                            >
                                Login Here
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
