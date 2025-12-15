"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Login({ setIsAuthenticated, setIsAdminAuthenticated }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loginType, setLoginType] = useState("user") // "user" or "admin"
    const navigate = useNavigate()

    const handleSubmit = (e) => {
        e.preventDefault()
        if (email && password) {
            if (loginType === "user") {
                // User login logic
                // यहाँ आप API call कर सकते हैं
                setIsAuthenticated(true)
                navigate("/dashboard")
            } else if (loginType === "admin") {
                // Admin login logic
                // यहाँ आप admin authentication की logic add करें
                // उदाहरण के लिए:
                if (email === "admin@example.com" && password === "admin123") {
                    setIsAdminAuthenticated(true)
                    navigate("/admin/dashboard")
                } else {
                    setError("Invalid admin credentials")
                }
            }
        } else {
            setError("Please fill all fields")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#040408] to-[#1a1a1a] animate-fade-in">
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.6s ease-out; }
        .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
        .animate-slide-up:nth-child(1) { animation-delay: 0.1s; }
        .animate-slide-up:nth-child(2) { animation-delay: 0.2s; }
        .animate-slide-up:nth-child(3) { animation-delay: 0.3s; }
        .animate-slide-up:nth-child(4) { animation-delay: 0.4s; }
        .animate-slide-up:nth-child(5) { animation-delay: 0.5s; }
      `}</style>

            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-8 rounded-xl shadow-2xl border border-[#444] backdrop-blur-xl">
                    {/* Header */}
                    <div className="text-center mb-8 animate-slide-up">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#9131e7] to-[#e84495] bg-clip-text text-transparent mb-2">
                            REX TOKEN
                        </h1>
                        <p className="text-[#b0b0b0] text-lg">Welcome Back</p>
                    </div>

                    {/* Login Type Selection */}
                    <div className="animate-slide-up mb-6">
                        <label className="block text-sm font-semibold text-white mb-2">
                            Login As
                        </label>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => setLoginType("user")}
                                className={`flex-1 py-3 rounded-lg font-bold transition-all duration-300 ${loginType === "user"
                                        ? "bg-gradient-to-r from-[#9131e7] to-[#e84495] text-[#040408]"
                                        : "bg-[#1a1a1a] border border-[#444] text-white hover:border-[#9131e7]"
                                    }`}
                            >
                                User
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginType("admin")}
                                className={`flex-1 py-3 rounded-lg font-bold transition-all duration-300 ${loginType === "admin"
                                        ? "bg-gradient-to-r from-[#9131e7] to-[#e84495] text-[#040408]"
                                        : "bg-[#1a1a1a] border border-[#444] text-white hover:border-[#9131e7]"
                                    }`}
                            >
                                Admin
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Input */}
                        <div className="animate-slide-up">
                            <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder={loginType === "admin" ? "admin@example.com" : "your@email.com"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all duration-300 placeholder-[#666]"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="animate-slide-up">
                            <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#444] text-white rounded-lg focus:outline-none focus:border-[#9131e7] focus:ring-2 focus:ring-[#9131e7]/30 transition-all duration-300 placeholder-[#666]"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="px-4 py-3 bg-red-600/20 border border-red-500/50 text-red-300 rounded-lg text-sm animate-slide-up">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-[#9131e7] to-[#e84495] text-[#040408] font-bold rounded-lg hover:shadow-lg hover:shadow-[#9131e7]/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 animate-slide-up"
                        >
                            {loginType === "admin" ? "Login as Admin" : "Login to Account"}
                        </button>
                    </form>

                    {/* Footer */}
                    {loginType === "user" && (
                        <p className="text-center text-[#b0b0b0] mt-6 animate-slide-up">
                            Don't have an account?{" "}
                            <button
                                onClick={() => navigate("/signup")}
                                className="text-[#9131e7] font-bold hover:text-[#e84495] transition-colors duration-300"
                            >
                                Sign Up Here
                            </button>
                        </p>
                    )}

                    {loginType === "admin" && (
                        <p className="text-center text-[#b0b0b0] mt-6 animate-slide-up">
                            Admin portal for system management
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}