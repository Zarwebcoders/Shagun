"use client"

import { useState, useEffect } from "react"
import { useNavigate, Outlet } from "react-router-dom"
import { IoIosLogOut } from "react-icons/io"
import client from "../../api/client"

const logo = "/removedbg.png"

export default function AdminLayout({ children, setIsAdminAuthenticated }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeMenu, setActiveMenu] = useState("dashboard")
    const navigate = useNavigate()
    const [pendingCounts, setPendingCounts] = useState({
        kyc: 0,
        withdrawals: 0,
        bankAccounts: 0,
        payments: 0,
        wallets: 0,
        vendorKyc: 0,
        vendorWithdrawals: 0,
        vendorWallets: 0,
        vendorAccounts: 0,
        total: 0
    })

    const [notifications, setNotifications] = useState([])
    const [showNotifications, setShowNotifications] = useState(false)
    const [unseenCount, setUnseenCount] = useState(0)

    const menuGroups = [
        {
            title: "Core Admin",
            items: [
                { id: "dashboard", name: "Dashboard", icon: "📊", path: "/admin/dashboard" },
                { id: "users", name: "User Management", icon: "👥", path: "/admin/users" },
                { id: "packages", name: "Package Management", icon: "📦", path: "/admin/packages" },
                { id: "transactions", name: "Transaction Monitor", icon: "💳", path: "/admin/transactions" },
                { id: "referral-earnings", name: "Referral Earnings", icon: "🤝", path: "/admin/referral-earnings" },
                // { id: "reports", name: "Reports & Analytics", icon: "📈", path: "/admin/reports" },
                { id: "notifications", name: "Send Notifications", icon: "🔔", path: "/admin/notifications" },
                { id: "wallet-inspector", name: "Wallet Inspector", icon: "🔍", path: "/admin/wallet-inspector" },
                { id: "settings", name: "System Settings", icon: "⚙️", path: "/admin/settings" },
            ]
        },
        {
            title: "Token Management",
            items: [
                { id: "token-management", name: "Token Management", icon: "🪙", path: "/admin/token-management" },
                { id: "token-rates", name: "Rate History", icon: "💹", path: "/admin/token-rates" },
            ]
        },
        {
            title: "User Requests",
            items: [
                { id: "kyc", name: "KYC Approvals", icon: "✅", path: "/admin/kyc-approvals", badgeKey: "kyc" },
                { id: "withdrawals", name: "Withdrawal Requests", icon: "💰", path: "/admin/withdrawals", badgeKey: "withdrawals" },
                // { id: "bank-requests", name: "Bank Requests", icon: "🏛️", path: "/admin/bank-requests", badgeKey: "bankAccounts" },
                { id: "bank-accounts", name: "Bank Accounts", icon: "🏢", path: "/admin/bank-accounts" },
            ]
        }
    ]

    const allMenuItems = menuGroups.reduce((acc, group) => [...acc, ...group.items], [])

    const fetchPendingCounts = async () => {
        try {
            const { data } = await client.get('/admin/pending-counts')
            setPendingCounts(data)
        } catch (error) {
            console.error("Error fetching pending counts:", error)
        }
    }

    const fetchNotifications = async () => {
        try {
            const res = await client.get('/notifications')
            if (res.data) {
                setNotifications(res.data)
            }
            const countRes = await client.get('/notifications/unseen-count')
            if (countRes.data) {
                setUnseenCount(countRes.data.count)
            }
        } catch (error) {
            console.error("Error fetching notifications:", error)
        }
    }

    const handleToggleNotifications = async () => {
        setShowNotifications(!showNotifications)
        if (!showNotifications) {
            try {
                await client.put('/notifications/mark-seen')
                setUnseenCount(0)
            } catch (error) {
                console.error("Failed to mark notifications as seen:", error)
            }
        }
    }

    const handleNotificationClick = async (notif) => {
        setShowNotifications(false)
        if (!notif.isSynthesized) {
            try {
                await client.put(`/notifications/${notif._id}/read`)
                fetchNotifications()
            } catch (error) {
                console.error("Failed to mark notification as read:", error)
            }
        }
        if (notif.path) {
            navigate(notif.path)
        }
    }

    useEffect(() => {
        fetchPendingCounts()
        fetchNotifications()
        const interval = setInterval(() => {
            fetchPendingCounts()
            fetchNotifications()
        }, 15000) // Poll every 15s for admin responsiveness
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const path = window.location.pathname
        const currentItem = allMenuItems.find(item => path.startsWith(item.path))
        if (currentItem) {
            setActiveMenu(currentItem.id)
        }
    }, [window.location.pathname])

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
            <style>{`
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
                    {pendingCounts.total > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg animate-pulse">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                            <span className="text-xs font-semibold">{pendingCounts.total} Pending Requests</span>
                        </div>
                    )}
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-white text-sm">System Online</span>
                    </div>

                    {/* Notification Bell & Dropdown */}
                    <div className="relative">
                        <button
                            onClick={handleToggleNotifications}
                            className="p-2 text-gray-400 hover:text-teal-400 hover:bg-[#1a1a2e] rounded-xl transition-colors relative"
                            aria-label="Notifications"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unseenCount > 0 && (
                                <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0f0f1a] animate-pulse">
                                    {unseenCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 mt-2 w-80 bg-[#0f0f1a] border border-teal-500/30 rounded-2xl shadow-2xl p-4 z-40 space-y-4 animate-fadeIn">
                                    <div className="flex items-center justify-between border-b border-teal-500/10 pb-2">
                                        <h3 className="font-bold text-white text-sm">System Notifications</h3>
                                        {notifications.length > 0 && (
                                            <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-medium">
                                                {notifications.length} New
                                            </span>
                                        )}
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 text-xs">
                                                No new notifications
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <button
                                                    key={notif._id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start gap-2 ${
                                                        notif.is_read ? 'bg-[#1a1a2e]/30 text-gray-400' : 'bg-[#1a1a2e]/80 text-white border border-teal-500/10 hover:border-teal-500/30'
                                                    }`}
                                                >
                                                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-1.5 shrink-0" />
                                                    <div className="flex-1 space-y-1">
                                                        <p className="line-clamp-2 leading-relaxed">{notif.message}</p>
                                                        <span className="text-[9px] text-gray-500 block">
                                                            {(() => {
                                                                const date = new Date(notif.createdAt);
                                                                const isToday = date.toDateString() === new Date().toDateString();
                                                                return isToday
                                                                    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                    : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
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
                <nav className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                    {menuGroups.map((group) => (
                        <div key={group.title} className="space-y-1">
                            <h3 className="px-3 text-[10px] font-semibold text-teal-500/60 uppercase tracking-wider mb-2 mt-4 first:mt-0">
                                {group.title}
                            </h3>
                            {group.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleMenuClick(item)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left ${activeMenu === item.id
                                        ? "bg-gradient-brand text-white font-semibold shadow-lg shadow-teal-500/30"
                                        : "text-gray-300 hover:bg-[#1a1a2e] hover:text-white"
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="text-sm flex-1 truncate">{item.name}</span>
                                    {item.badgeKey && pendingCounts[item.badgeKey] > 0 && (
                                        <span className="bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
                                            {pendingCounts[item.badgeKey]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
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
                        <nav className="p-4 space-y-4 flex-1 overflow-y-auto">
                            {menuGroups.map((group) => (
                                <div key={group.title} className="space-y-1">
                                    <h3 className="px-3 text-[10px] font-semibold text-teal-500/60 uppercase tracking-wider mb-2 mt-4 first:mt-0">
                                        {group.title}
                                    </h3>
                                    {group.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleMenuClick(item)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left ${activeMenu === item.id
                                                ? "bg-gradient-brand text-white font-semibold"
                                                : "text-gray-300 hover:bg-[#1a1a2e] hover:text-white"
                                                }`}
                                        >
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="text-sm flex-1 truncate">{item.name}</span>
                                            {item.badgeKey && pendingCounts[item.badgeKey] > 0 && (
                                                <span className="bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
                                                    {pendingCounts[item.badgeKey]}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
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