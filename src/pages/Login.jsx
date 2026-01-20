"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { motion } from "framer-motion"
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import logo from "../../public/removedbg.png"

export default function Login({ setIsAuthenticated, setIsAdminAuthenticated }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (email && password) {
            setIsLoading(true)
            try {
                const { data } = await client.post('/auth/login', { email, password });

                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data));

                if (data.is_admin === 1) {
                    setIsAdminAuthenticated(true)
                    navigate("/admin/dashboard")
                } else {
                    setIsAuthenticated(true)
                    navigate("/dashboard")
                }
            } catch (err) {
                setError(err.response?.data?.message || "Login failed");
            } finally {
                setIsLoading(false)
            }
        } else {
            setError("Please fill all fields")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10 px-4"
            >
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/5">
                    {/* Header */}
                    <div className="flex justify-center">
                        <img className="w-32 h-32" src={logo} alt="" />
                    </div>
                    <div className="text-center mb-5">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {/* <h1 className="text-5xl font-black italic tracking-tighter bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-3 drop-shadow-sm">
                                ShagunPro
                            </h1> */}
                        </motion.div>
                        <p className="text-gray-400 text-lg font-light tracking-wide">Welcome Back Commander</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-400 text-gray-500">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 hover:border-white/20"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-400 text-gray-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 hover:border-white/20"
                                />
                            </div>
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
                            className="w-full mt-2 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-900/40 hover:shadow-teal-900/60 hover:brightness-110 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Login
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-gray-400">
                            Don't have an account?{" "}
                            <button
                                onClick={() => navigate("/signup")}
                                className="text-teal-400 font-semibold hover:text-purple-400 transition-colors duration-300 ml-1 hover:underline decoration-2 underline-offset-4"
                            >
                                Sign Up Here
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
