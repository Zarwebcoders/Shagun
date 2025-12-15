"use client"

import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { IoIosLogOut } from "react-icons/io";

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const location = useLocation()
    const navigate = useNavigate()

    const menuItems = [
        { label: "Dashboard", path: "/dashboard", icon: "📊" },
        { label: "Packages", path: "/packages", icon: "📦" },
        { label: "KYC Verification", path: "/kyc", icon: "✓" },
        // { label: "Shopping", path: "/shopping", icon: "🛍️" },
        { label: "Withdrawal", path: "/withdrawal", icon: "💸" },
        { label: "Downline", path: "/downline", icon: "👥" },
        { label: "Referral Income", path: "/referral-income", icon: "💰" },
        { label: "Level Income", path: "/level-income", icon: "📈" },
        { label: "Transactions", path: "/transactions", icon: "📋" },
        { label: "Profile", path: "/profile", icon: "👤" },
    ]

    const handleLogout = () => {
        navigate("/login")
    }

    return (
        <div className="flex h-screen bg-[#040408] text-white font-sans">
            {/* Sidebar */}
            <aside
                className={`transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"} bg-gradient-to-b from-[#1a1a1a] to-[#040408] border-r border-[#444] flex flex-col`}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-3 border-b border-[#444]">
                    <h1
                        className={`text-2xl font-bold text-[#9131e7] transition-all duration-300 ${sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}
                    >
                        REX TOKEN
                    </h1>
                    <button
                        className="text-xl hover:text-[#9131e7] transition-colors duration-300 p-2 hover:bg-[#333] rounded-lg flex-shrink-0"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? "◀" : "☰"}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg my-2 transition-all duration-300 ${location.pathname === item.path
                                    ? "bg-[#9131e7] text-[#040408] font-bold shadow-lg shadow-[#9131e7]/50"
                                    : "text-white hover:bg-[#333] hover:text-[#9131e7]"
                                }`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="text-xl flex-shrink-0">{item.icon}</span>
                            <span className={`transition-all duration-300 ${sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="border-t border-[#444] p-4">
                    <button
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-300 font-semibold"
                        onClick={handleLogout}
                    >
                        <span className="text-lg md:ml-0 ml-2"><IoIosLogOut /></span>
                        <span className={`transition-all duration-300 ${sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gradient-to-br from-[#040408] to-[#1a1a1a]">
                <div className="md:p-6 p-2">{children}</div>
            </main>
        </div>
    )
}