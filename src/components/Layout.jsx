"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate, Outlet } from "react-router-dom"
import { IoIosLogOut } from "react-icons/io";
import { useWeb3 } from "../hooks/useWeb3";
import client from "../api/client"
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
    WalletIcon,
    CpuChipIcon,
    BellIcon,
    ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";
import logo from "../../public/removedbg.png"

export default function Layout({ children, setIsAuthenticated }) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const location = useLocation()
    const navigate = useNavigate()
    const { connectWallet, disconnectWallet, account, isConnected } = useWeb3();

    const [notifications, setNotifications] = useState([])
    const [unseenCount, setUnseenCount] = useState(0)
    const [showNotifications, setShowNotifications] = useState(false)

    const fetchNotifications = async () => {
        try {
            const res = await client.get('/notifications');
            if (res.data) {
                setNotifications(res.data);
            }
            const countRes = await client.get('/notifications/unseen-count');
            if (countRes.data) {
                setUnseenCount(countRes.data.count);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 20 seconds for updates
        const interval = setInterval(fetchNotifications, 20000);
        return () => clearInterval(interval);
    }, []);

    const handleToggleNotifications = async () => {
        setShowNotifications(!showNotifications);
        if (!showNotifications) {
            // Dropdown is opening, mark all as seen
            try {
                await client.put('/notifications/mark-seen');
                setUnseenCount(0);
            } catch (error) {
                console.error("Failed to mark notifications as seen:", error);
            }
        }
    };

    const handleNotificationClick = async (notif) => {
        setShowNotifications(false);
        try {
            await client.put(`/notifications/${notif._id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
        if (notif.path) {
            navigate(notif.path);
        }
    };

    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem("user");
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });
    const [kyc, setKyc] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userRes = await client.get('/auth/me');
                if (userRes.data) {
                    setUser(userRes.data);
                    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                    localStorage.setItem("user", JSON.stringify({
                        ...userRes.data,
                        token: storedUser.token
                    }));
                }
            } catch (error) {
                console.error("Error fetching layout user details:", error);
            }

            try {
                const kycRes = await client.get('/kyc/me');
                if (kycRes.data) {
                    setKyc(kycRes.data);
                }
            } catch (error) {
                console.error("Error fetching layout KYC details:", error);
            }
        };
        fetchUserData();
    }, []);

    const menuItems = [
        { label: "Dashboard", path: "/dashboard", icon: <HomeIcon className="w-6 h-6" /> },
        { label: "Products", path: "/packages", icon: <BanknotesIcon className="w-6 h-6" /> },
        { label: "KYC Verification", path: "/kyc", icon: <CheckBadgeIcon className="w-6 h-6" /> },
        { label: "Withdrawal", path: "/withdrawal", icon: <ArrowDownTrayIcon className="w-6 h-6" /> },
        { label: "Downline", path: "/downline", icon: <UsersIcon className="w-6 h-6" /> },
        { label: "Referral Income", path: "/referral-income", icon: <CurrencyDollarIcon className="w-6 h-6" /> },
        { label: "Level Income", path: "/level-income", icon: <ChartBarIcon className="w-6 h-6" /> },
        { label: "Mining History", path: "/mining-history", icon: <CpuChipIcon className="w-6 h-6" /> },
        { label: "Rate History", path: "/token-rate-history", icon: <ArrowTrendingUpIcon className="w-6 h-6" /> },
        { label: "Transactions", path: "/transactions", icon: <ClipboardDocumentListIcon className="w-6 h-6" /> },
        { label: "Profile", path: "/profile", icon: <UserIcon className="w-6 h-6" /> },
    ]

    const handleLogout = () => {
        localStorage.removeItem("user")
        setIsAuthenticated(false)
        navigate("/login")
    }

    return (
        <div className="flex min-h-screen bg-[#040408] text-white font-sans">
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

                {/* User Profile Info Card */}
                {sidebarOpen ? (
                    <div className="px-4 py-3 border-b border-teal-500/10 mb-2">
                        <div 
                            className="flex items-center gap-3 bg-[#131322] p-3 rounded-2xl border border-teal-500/10 hover:border-teal-500/30 transition-all duration-300 group cursor-pointer" 
                            onClick={() => navigate('/profile')}
                        >
                            <div className="relative shrink-0">
                                {kyc?.profile_photo ? (
                                    <img
                                        src={kyc.profile_photo}
                                        alt="Profile"
                                        className="w-12 h-12 rounded-full object-cover border-2 border-teal-500 group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-lg border-2 border-teal-500/30 group-hover:scale-105 transition-transform duration-300">
                                        {(user?.full_name || "U").charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#0a0a0f] rounded-full" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-white truncate group-hover:text-teal-400 transition-colors">
                                    {user?.full_name || "User Name"}
                                </h4>
                                <p className="text-[11px] text-gray-400 font-medium truncate flex items-center gap-1">
                                    Ref ID: <span className="font-mono text-teal-400">{user?.referral_id || "N/A"}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center py-2 border-b border-teal-500/10 mb-2">
                        <button
                            onClick={() => navigate('/profile')}
                            className="relative group focus:outline-none"
                            title={user?.full_name || "Profile"}
                        >
                            {kyc?.profile_photo ? (
                                <img
                                    src={kyc.profile_photo}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover border border-teal-500/30 hover:border-teal-500 transition-colors"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-sm border border-teal-500/30 hover:border-teal-500 transition-colors">
                                    {(user?.full_name || "U").charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0a0a0f] rounded-full" />
                        </button>
                    </div>
                )}

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
                                    onClick={isConnected ? disconnectWallet : connectWallet}
                                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2
                                        ${isConnected
                                            ? "bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white"
                                            : "bg-gradient-brand text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5"
                                        }`}
                                >
                                    <WalletIcon className="w-4 h-4" />
                                    {isConnected
                                        ? "Disconnect"
                                        : "Connect Wallet"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mini Connect Button (Collapsed) */}
                    {!sidebarOpen && (
                        <button
                            onClick={isConnected ? disconnectWallet : connectWallet}
                            className={`w-full p-3 rounded-xl flex items-center justify-center transition-all duration-300
                                ${isConnected
                                    ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white"
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
            <main className="flex-1 flex flex-col min-h-0 bg-[#040408] relative">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-96 bg-teal-600/5 blur-[100px] pointer-events-none" />

                {/* Header Top Bar */}
                <header className="flex items-center justify-between px-6 py-4 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-teal-500/10 sticky top-0 z-20 h-16 select-none">
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden text-gray-400 hover:text-white transition-colors duration-300 p-2 rounded-lg hover:bg-white/5"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg md:text-xl font-bold bg-gradient-brand bg-clip-text text-transparent hidden md:block">
                            ShagunPro Platform
                        </h2>
                        {/* Mobile Logo Brand */}
                        <div className="flex md:hidden items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                                <span className="text-sm font-bold text-white">S</span>
                            </div>
                            <span className="text-sm font-bold text-white">ShagunPro</span>
                        </div>
                    </div>

                    {/* Right side: Notification Bell & Dropdown */}
                    <div className="relative">
                        <button
                            onClick={handleToggleNotifications}
                            className="relative p-2 text-gray-400 hover:text-white transition-colors duration-300 rounded-lg hover:bg-white/5 focus:outline-none"
                            aria-label="Notifications"
                        >
                            <BellIcon className="w-6 h-6" />
                            {unseenCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0a0a0f]">
                                    {unseenCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <>
                                {/* Click outer area to close */}
                                <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-[#0a0a0f] border border-teal-500/20 shadow-2xl rounded-2xl overflow-hidden z-40 transition-all duration-300 transform scale-100 origin-top-right">
                                    <div className="p-4 border-b border-teal-500/10 bg-[#131322] flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-white">Today's Updates</h3>
                                        {notifications.length > 0 && (
                                            <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">
                                                {notifications.length} Today
                                            </span>
                                        )}
                                    </div>
                                    <div className="max-h-[360px] overflow-y-auto divide-y divide-teal-500/5 custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500 text-sm">
                                                No updates today.
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <button
                                                    key={notif._id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`w-full text-left p-4 hover:bg-white/5 transition-all duration-200 flex items-start gap-3 border-l-2 ${
                                                        notif.is_read 
                                                            ? 'border-transparent opacity-60' 
                                                            : 'border-teal-500 bg-teal-500/5'
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs md:text-sm text-white font-medium leading-relaxed">
                                                            {notif.message}
                                                        </p>
                                                        <span className="text-[10px] text-gray-500 mt-1 block">
                                                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                </header>

                <div className="flex-1 overflow-auto md:p-8 p-4 relative z-10 scrollbar-thin scrollbar-thumb-teal-500/20 scrollbar-track-transparent">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    )
}
