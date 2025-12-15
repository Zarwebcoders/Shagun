"use client"

import { useState } from "react"
import { useNavigate, Outlet } from "react-router-dom" // Add Outlet import

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeMenu, setActiveMenu] = useState("dashboard")
    const navigate = useNavigate()

    const menuItems = [
        { id: "dashboard", name: "Dashboard", icon: "📊", path: "/admin/dashboard" },
        { id: "users", name: "User Management", icon: "👥", path: "/admin/users" },
        { id: "kyc", name: "KYC Approvals", icon: "✅", path: "/admin/kyc-approvals" },
        { id: "withdrawals", name: "Withdrawal Requests", icon: "💰", path: "/admin/withdrawals" },
        { id: "packages", name: "Package Management", icon: "📦", path: "/admin/packages" },
        { id: "transactions", name: "Transaction Monitor", icon: "💳", path: "/admin/transactions" },
        { id: "settings", name: "System Settings", icon: "⚙️", path: "/admin/settings" },
        { id: "reports", name: "Reports & Analytics", icon: "📈", path: "/admin/reports" },
    ]

    const handleMenuClick = (item) => {
        setActiveMenu(item.id)
        navigate(item.path)
        setSidebarOpen(false)
    }

    return (
        <div className="min-h-screen bg-[#2b2b2b]">
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
            <div className="fixed top-0 left-0 right-0 h-16 bg-[#1f1f1f] border-b border-[#3f3f3f] flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden text-white hover:text-[#f3b232] transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-[#f3b232]">Cryptosphere Admin</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#2b2b2b] rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-white text-sm">System Online</span>
                    </div>
                    <button className="p-2 bg-[#2b2b2b] rounded-lg text-white hover:bg-[#3f3f3f] transition-colors relative">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1f1f1f]"></span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:block text-right">
                            <p className="text-white text-sm font-semibold">Admin User</p>
                            <p className="text-gray-400 text-xs">admin@cryptosphere.com</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-[#f3b232] to-[#d4941f] rounded-full flex items-center justify-center text-white font-bold">
                            A
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar - Desktop */}
            <div className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-[#1f1f1f] border-r border-[#3f3f3f] overflow-y-auto">
                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleMenuClick(item)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeMenu === item.id
                                    ? "bg-[#f3b232] text-[#1f1f1f] font-semibold shadow-lg"
                                    : "text-gray-300 hover:bg-[#2b2b2b] hover:text-white"
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-sm">{item.name}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Sidebar - Mobile */}
            {sidebarOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                    <div className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-[#1f1f1f] border-r border-[#3f3f3f] overflow-y-auto z-50 animate-slideIn">
                        <nav className="p-4 space-y-2">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleMenuClick(item)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeMenu === item.id
                                            ? "bg-[#f3b232] text-[#1f1f1f] font-semibold"
                                            : "text-gray-300 hover:bg-[#2b2b2b] hover:text-white"
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="text-sm">{item.name}</span>
                                </button>
                            ))}
                        </nav>
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