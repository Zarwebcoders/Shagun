"use client"

import { useState, useEffect } from "react"
import { Send, Users, User, Bell, Trash2, Calendar, AlertCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import client from "../../api/client"

export default function NotificationManagement() {
    const [target, setTarget] = useState("all") // all | user
    const [userId, setUserId] = useState("")
    const [message, setMessage] = useState("")
    const [type, setType] = useState("general")
    const [sending, setSending] = useState(false)
    const [recentNotifications, setRecentNotifications] = useState([])
    const [loadingRecent, setLoadingRecent] = useState(true)

    const fetchRecentNotifications = async () => {
        try {
            setLoadingRecent(true)
            // Get general list of notifications
            const { data } = await client.get('/notifications')
            setRecentNotifications(data || [])
        } catch (error) {
            console.error("Error fetching notifications:", error)
        } finally {
            setLoadingRecent(false)
        }
    }

    useEffect(() => {
        fetchRecentNotifications()
    }, [])

    const handleSend = async (e) => {
        e.preventDefault()
        if (!message.trim()) {
            return toast.error("Please enter a message")
        }
        if (target === "user" && !userId.trim()) {
            return toast.error("Please enter a Name, Email, or Referral ID")
        }

        try {
            setSending(true)
            const payload = {
                target,
                userId: target === "user" ? userId.trim() : undefined,
                message: message.trim(),
                type
            }

            await client.post('/notifications/send', payload)
            toast.success("Notification sent successfully!")
            
            // Reset form
            setMessage("")
            setUserId("")
            
            // Refresh recent
            fetchRecentNotifications()
        } catch (error) {
            console.error("Error sending notification:", error)
            toast.error(error.response?.data?.message || "Failed to send notification")
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="space-y-8 animate-fadeIn text-white max-w-5xl mx-auto">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .glass-panel {
                    background: rgba(15, 15, 26, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(20, 184, 166, 0.2);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                }
            `}</style>

            {/* Header Section */}
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                    Send Notifications
                </h2>
                <p className="text-gray-400 mt-1 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-teal-400" />
                    Dispatch updates, alerts, and system-wide announcements to users.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Panel */}
                <div className="lg:col-span-7 glass-panel rounded-2xl p-6 space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-teal-500/10 pb-3 flex items-center gap-2">
                        <Send className="w-5 h-5 text-teal-400" /> New Broadcast
                    </h3>

                    <form onSubmit={handleSend} className="space-y-6">
                        {/* Target Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Recipient Target</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setTarget("all")}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        target === "all"
                                            ? "bg-teal-500/10 border-teal-500 text-white"
                                            : "bg-[#1a1a2e]/40 border-white/5 text-gray-400 hover:bg-[#1a1a2e]/60"
                                    }`}
                                >
                                    <Users className="w-6 h-6" />
                                    <span className="text-sm font-semibold">All Users</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTarget("user")}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        target === "user"
                                            ? "bg-teal-500/10 border-teal-500 text-white"
                                            : "bg-[#1a1a2e]/40 border-white/5 text-gray-400 hover:bg-[#1a1a2e]/60"
                                    }`}
                                >
                                    <User className="w-6 h-6" />
                                    <span className="text-sm font-semibold">Specific User</span>
                                </button>
                            </div>
                        </div>

                        {/* Specific User ID input */}
                        {target === "user" && (
                            <div className="space-y-2 animate-fadeIn">
                                <label className="block text-sm font-medium text-gray-300">User Identification</label>
                                <input
                                    type="text"
                                    placeholder="Enter Name, Email, or Referral ID..."
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    className="w-full bg-[#131322] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600 text-sm"
                                />
                            </div>
                        )}

                        {/* Message content */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Notification Message</label>
                            <textarea
                                rows={4}
                                placeholder="Write the announcement or alert message here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full bg-[#131322] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500/50 transition-colors placeholder:text-gray-600 text-sm resize-none"
                            />
                        </div>

                        {/* Action Buttons */}
                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-3 bg-gradient-brand text-white font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {sending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Sending Broadcast...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" /> Send Notification
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* History/Recent Panel */}
                <div className="lg:col-span-5 glass-panel rounded-2xl p-6 flex flex-col h-[600px]">
                    <h3 className="text-xl font-bold text-white border-b border-teal-500/10 pb-3 flex items-center gap-2 mb-4 shrink-0">
                        <Calendar className="w-5 h-5 text-teal-400" /> Recent Alerts
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                        {loadingRecent ? (
                            <div className="text-center py-12 text-gray-500 animate-pulse">Loading recent notifications...</div>
                        ) : recentNotifications.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
                                <AlertCircle className="w-8 h-8 opacity-20" />
                                <p className="text-sm">No recent notifications</p>
                            </div>
                        ) : (
                            recentNotifications.map((notif) => (
                                <div key={notif._id} className="p-3 bg-[#1a1a2e]/40 rounded-xl border border-white/5 space-y-2 hover:bg-[#1a1a2e]/80 transition-colors">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                                            {notif.type}
                                        </span>
                                        <span className="text-[10px] text-gray-500">
                                            {new Date(notif.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-200 line-clamp-3">{notif.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
