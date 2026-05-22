"use client"

import { useState, useEffect } from "react"
import client from "../../api/client"
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Users,
    Download,
    Calendar,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Globe
} from "lucide-react"

export default function Reports() {
    const [reportType, setReportType] = useState("revenue")
    const [dateRange, setDateRange] = useState("30") // days
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        netProfit: 0,
        maxChartValue: 1000
    })
    const [chartData, setChartData] = useState([])
    const [topCountries, setTopCountries] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchReports = async () => {
        try {
            setLoading(true);
            const { data } = await client.get(`/reports?type=${reportType}&range=${dateRange}`);

            if (data.stats) setStats(data.stats);
            if (data.chartData) setChartData(data.chartData);
            if (data.topCountries) setTopCountries(data.topCountries);

            // Re-label to Regions if data found
            if (data.topCountries?.length > 0) {
                // Ensure UI is aware of regions
            }

        } catch (error) {
            console.error("Error fetching reports:", error);
            toast.error("Failed to fetch real-time reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [reportType, dateRange]);

    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .cyber-card {
                    background: linear-gradient(145deg, rgba(20, 184, 166, 0.1), rgba(15, 15, 26, 0.8));
                    border: 1px solid rgba(20, 184, 166, 0.3);
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Analytics & Reports
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-teal-500" />
                        Platform performance and financial insights
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="bg-[#0f0f1a] border border-teal-500/30 text-white text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-2.5 outline-none"
                    >
                        <option value="revenue">Revenue</option>
                        <option value="users">User Growth</option>
                        <option value="transactions">Transactions</option>
                    </select>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-[#0f0f1a] border border-teal-500/30 text-white text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-2.5 outline-none"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 3 Months</option>
                        <option value="365">Last Year</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500 hover:text-white rounded-lg transition-all">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", trend: "+12.5%" },
                    { label: "Total Deposits", value: `₹${stats.totalDeposits.toLocaleString()}`, icon: ArrowDownRight, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", trend: "+8.2%" },
                    { label: "Total Withdrawals", value: `₹${stats.totalWithdrawals.toLocaleString()}`, icon: ArrowUpRight, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", trend: "-2.4%" },
                    { label: "Net Profit", value: `₹${stats.netProfit.toLocaleString()}`, icon: PieChart, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", trend: "+15.3%" },
                ].map((stat, idx) => (
                    <div key={idx} className={`cyber-card p-6 rounded-xl border ${stat.border}`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                            <span className={`text-xs font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {stat.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section (Placeholder for simplified bar chart representation) */}
                <div className="lg:col-span-2 bg-[#0f0f1a]/60 backdrop-blur-md rounded-xl p-6 border border-teal-500/20 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-teal-500" />
                            Revenue Trend
                        </h3>
                    </div>
                    {/* CSS Bar Chart */}
                    <div className="h-64 flex items-end justify-around gap-2 px-4 pb-4 border-b border-white/5">
                        {chartData.map((d, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 group w-full max-w-[40px] h-full justify-end">
                                <div
                                    className="w-full bg-gradient-to-t from-teal-500/80 to-teal-400 rounded-t-lg hover:from-teal-400 hover:to-teal-300 transition-all relative shadow-[0_0_15px_rgba(20,184,166,0.2)] group-hover:shadow-[0_0_20px_rgba(20,184,166,0.6)]"
                                    style={{ height: `${stats.maxChartValue ? Math.max((d.value / stats.maxChartValue) * 100, 5) : 0}%` }}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1a2e] text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap border border-teal-500/30 shadow-2xl z-30 pointer-events-none scale-90 group-hover:scale-100">
                                        <p className="font-bold text-teal-400">{reportType === "revenue" ? `₹${d.value.toLocaleString()}` : d.value.toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter whitespace-nowrap">{d.date}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Countries */}
                <div className="bg-[#0f0f1a]/60 backdrop-blur-md rounded-xl p-6 border border-teal-500/20 shadow-xl">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-400" />
                            Top Regions
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {topCountries.map((country, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{country.name}</p>
                                        <p className="text-gray-500 text-xs">{country.users} Users</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-teal-400 font-bold text-sm">{country.volume}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white border border-dashed border-gray-700 hover:border-teal-500 hover:bg-teal-500/10 rounded-lg transition-all">
                        View All Regions
                    </button>
                </div>
            </div>
        </div>
    )
}
