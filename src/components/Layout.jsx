"use client"

import { useState } from "react"
import { useLocation, useNavigate, Outlet } from "react-router-dom"
import { IoIosLogOut } from "react-icons/io";
import { useWeb3 } from "../hooks/useWeb3";
import {
    HomeIcon,
    BanknotesIcon,
    CheckBadgeIcon,
    ArrowDownTrayIcon,
    UsersIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    UserIcon,
    Bars3Icon,
    XMarkIcon,
    WalletIcon
} from "@heroicons/react/24/outline";
import logo from "../../public/removedbg.png"

export default function Layout({ children, setIsAuthenticated }) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const location = useLocation()
    const navigate = useNavigate()
    const { connectWallet, account, isConnected } = useWeb3();

    const menuItems = [
        { label: "Dashboard", path: "/dashboard", icon: <HomeIcon className="w-6 h-6" /> },
        { label: "Products", path: "/packages", icon: <BanknotesIcon className="w-6 h-6" /> },
        { label: "KYC Verification", path: "/kyc", icon: <CheckBadgeIcon className="w-6 h-6" /> },
        { label: "Withdrawal", path: "/withdrawal", icon: <ArrowDownTrayIcon className="w-6 h-6" /> },
        { label: "Downline", path: "/downline", icon: <UsersIcon className="w-6 h-6" /> },
        { label: "Referral Income", path: "/referral-income", icon: <CurrencyDollarIcon className="w-6 h-6" /> },
        { label: "Level Income", path: "/level-income", icon: <ChartBarIcon className="w-6 h-6" /> },
        { label: "Transactions", path: "/transactions", icon: <ClipboardDocumentListIcon className="w-6 h-6" /> },
        { label: "Profile", path: "/profile", icon: <UserIcon className="w-6 h-6" /> },
    ]

    const handleLogout = () => {
        localStorage.removeItem("user")
        setIsAuthenticated(false)
        navigate("/login")
    }

    return (
        <div className="flex h-screen bg-[#040408] text-white font-sans overflow-hidden">
            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden transition-all duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:relative z-40 transition-all duration-500 ease-in-out
                    ${sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 md:w-20"} 
                    bg-[#0a0a0f] border-r border-teal-500/20 flex flex-col h-full shadow-[4px_0_24px_-2px_rgba(45,212,191,0.1)]`}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-2">
                    {/* Container that always takes space */}
                    <div className="flex-1 flex items-center justify-center min-w-0">
                        <div className={`transition-all duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0"}`}>
                            <img className="w-24 h-24" src={logo} alt="" />
                        </div>
                    </div>
                    <button
                        className="text-gray-400 hover:text-white transition-colors duration-300 p-2 rounded-lg hover:bg-white/5 ml-2"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-thin scrollbar-thumb-teal-500/20 scrollbar-track-transparent">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
                                    ${isActive
                                        ? "bg-gradient-brand text-white shadow-lg shadow-teal-500/25"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                                onClick={() => {
                                    navigate(item.path)
                                    if (window.innerWidth < 768) setSidebarOpen(false)
                                }}
                            >
                                {/* Active Indicator Glow */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                )}

                                <span className={`flex-shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                                    {item.icon}
                                </span>

                                <span className={`font-medium whitespace-nowrap transition-all duration-300 ${sidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0 overflow-hidden"}`}>
                                    {item.label}
                                </span>

                                {!sidebarOpen && isActive && (
                                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-teal-400" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 space-y-4">
                    {/* Connect Wallet Card */}
                    <div className={`transition-all duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>
                        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-xl p-4 border border-teal-500/20 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

                            <div className="relative z-10">
                                <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Wallet Status</p>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                                    <span className={`text-sm font-semibold ${isConnected ? "text-green-400" : "text-gray-300"}`}>
                                        {isConnected ? "Connected" : "Disconnected"}
                                    </span>
                                </div>
                                <button
                                    onClick={isConnected ? () => { } : connectWallet}
                                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2
                                        ${isConnected
                                            ? "bg-teal-500/10 text-teal-400 border border-teal-500/50"
                                            : "bg-gradient-brand text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5"
                                        }`}
                                >
                                    <WalletIcon className="w-4 h-4" />
                                    {isConnected
                                        ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
                                        : "Connect Wallet"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mini Connect Button (Collapsed) */}
                    {!sidebarOpen && (
                        <button
                            onClick={isConnected ? () => { } : connectWallet}
                            className={`w-full p-3 rounded-xl flex items-center justify-center transition-all duration-300
                                ${isConnected
                                    ? "bg-[#9131e7]/10 text-green-400 border border-green-500/30"
                                    : "bg-gradient-to-r from-[#9131e7] to-[#e84495] text-white"
                                }`}
                        >
                            <WalletIcon className="w-6 h-6" />
                        </button>
                    )}

                    {/* Logout Button */}
                    <button
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                            ${sidebarOpen ? "justify-start" : "justify-center"}
                            text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-red-500/30`}
                        onClick={handleLogout}
                    >
                        <IoIosLogOut className="w-6 h-6 group-hover:text-red-500 transition-colors duration-300" />
                        <span className={`font-medium transition-all duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-[#040408] relative">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-96 bg-teal-600/5 blur-[100px] pointer-events-none" />

                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#9131e7]/20 sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                            <span className="text-lg font-bold text-white">R</span>
                        </div>
                        <h1 className="text-lg font-bold text-white">ShagunPro</h1>
                    </div>
                    <button
                        className="text-white p-2"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto md:p-8 p-4 relative z-10 scrollbar-thin scrollbar-thumb-teal-500/20 scrollbar-track-transparent">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    )
}
