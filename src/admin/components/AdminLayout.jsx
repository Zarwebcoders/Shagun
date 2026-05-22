"use client"

import { useState } from "react"
import { useNavigate, Outlet } from "react-router-dom"
import { IoIosLogOut } from "react-icons/io";
import logo from "../../../public/removedbg.png"

export default function AdminLayout({ children, setIsAdminAuthenticated }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeMenu, setActiveMenu] = useState("dashboard")
    const navigate = useNavigate()

    const menuItems = [
        { id: "dashboard", name: "Dashboard", icon: "📊", path: "/admin/dashboard" },
        { id: "users", name: "User Management", icon: "👥", path: "/admin/users" },
        { id: "kyc", name: "KYC Approvals", icon: "✅", path: "/admin/kyc-approvals" },
        { id: "withdrawals", name: "Withdrawal Requests", icon: "💰", path: "/admin/withdrawals" },
        { id: "bank-accounts", name: "Bank Accounts", icon: "🏛️", path: "/admin/bank-accounts" },
        { id: "manage-wallet", name: "Manage Wallet", icon: "💼", path: "/admin/manage-wallet" },
        { id: "packages", name: "Package Management", icon: "📦", path: "/admin/packages" },
        { id: "transactions", name: "Transaction Monitor", icon: "💳", path: "/admin/transactions" },
        { id: "settings", name: "System Settings", icon: "⚙️", path: "/admin/settings" },
        { id: "token-management", name: "Token Management", icon: "🪙", path: "/admin/token-management" },
        { id: "reports", name: "Reports & Analytics", icon: "📈", path: "/admin/reports" },
    ]

    const handleLogout = () => {
        localStorage.removeItem("user")
        setIsAdminAuthenticated(false)
        navigate("/login")
    }

    const handleMenuClick = (item) => {
        setActiveMenu(item.id)
        navigate(item.path)
        setSidebarOpen(false)
    }

    return (
        <div className="min-h-screen bg-[#1a1a2e]">
            <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>

            {/* Top Header */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-[#0f0f1a] border-b border-teal-500/30 flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden text-white hover:text-teal-400 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <img className="w-14 h-14" src={logo} alt="" />
                    <h1 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">Admin</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-white text-sm">System Online</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:block text-right">
                            <p className="text-white text-sm font-semibold">Admin User</p>
                            <p className="text-gray-400 text-xs">admin@shagun.com</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-brand rounded-full flex items-center justify-center text-white font-bold">
                            A
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar - Desktop */}
            <div className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-[#0f0f1a] border-r border-teal-500/30 flex-col">
                <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleMenuClick(item)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeMenu === item.id
                                ? "bg-gradient-brand text-white font-semibold shadow-lg shadow-teal-500/30"
                                : "text-gray-300 hover:bg-[#1a1a2e] hover:text-white"
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-sm">{item.name}</span>
                        </button>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-teal-500/30">
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 rounded-lg transition-all duration-300 font-semibold border border-red-600/20"
                        onClick={handleLogout}
                    >
                        <span className="text-xl"><IoIosLogOut /></span>
                        <span className="text-sm">Logout</span>
                    </button>
                </div>
            </div>

            {/* Sidebar - Mobile */}
            {sidebarOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                    <div className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-[#0f0f1a] border-r border-teal-500/30 z-50 animate-slideIn flex flex-col">
                        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleMenuClick(item)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeMenu === item.id
                                        ? "bg-gradient-brand text-white font-semibold"
                                        : "text-gray-300 hover:bg-[#1a1a2e] hover:text-white"
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="text-sm">{item.name}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Logout Button Mobile */}
                        <div className="p-4 border-t border-teal-500/30">
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 rounded-lg transition-all duration-300 font-semibold border border-red-600/20"
                                onClick={handleLogout}
                            >
                                <span className="text-xl"><IoIosLogOut /></span>
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Main Content - Use Outlet instead of children */}
            <div className="lg:ml-64 mt-16 p-6">
                <Outlet /> {/* This will render the nested routes */}
            </div>
        </div>
    )
}