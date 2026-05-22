import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, Users, Coins, Shield, Zap, BarChart3, ArrowRight } from "lucide-react";

const HowItWorks = () => {
    const [activeTab, setActiveTab] = useState("staking");

    const stakingData = [
        { title: "Daily Rates", value: "5%", icon: TrendingUp, desc: "Per day on weekdays" },
        { title: "Max Rewards", value: "2x", icon: Coins, desc: "Maximum profit potential" },
        { title: "Duration", value: "365", icon: Zap, desc: "Lock period (Days)" },
        { title: "Min Stake", value: "100", icon: BarChart3, desc: "Minimum ShagunPro" }
    ];

    const referralLevels = [
        { level: 1, percentage: "5%", color: "bg-violet-500" },
        { level: 2, percentage: "2%", color: "bg-indigo-500" },
        { level: 3, percentage: "1.5%", color: "bg-blue-500" },
        { level: 4, percentage: "1%", color: "bg-cyan-500" },
        { level: 5, percentage: "1%", color: "bg-teal-500" },
        { level: 6, percentage: "1%", color: "bg-emerald-500" },
        { level: 7, percentage: "0.75%", color: "bg-green-500" },
        { level: 8, percentage: "0.50%", color: "bg-lime-500" },
        { level: 9, percentage: "0.25%", color: "bg-yellow-500" },
        { level: 10, percentage: "0.25%", color: "bg-amber-500" }
    ];

    const steps = [
        {
            number: "01",
            title: "Invest",
            icon: <TrendingUp className="w-6 h-6" />,
            description: "Purchase ShagunPro tokens using BNB. Secure your position in the ecosystem."
        },
        {
            number: "02",
            title: "Stake",
            icon: <Coins className="w-6 h-6" />,
            description: "Lock your tokens in our staking contract to start earning monthly passive income."
        },
        {
            number: "03",
            title: "Earn",
            icon: <Users className="w-6 h-6" />,
            description: "Earn 5% monthly returns and build your referral network across 10 levels."
        }
    ];

    return (
        <div className="py-24 bg-[#050505] relative overflow-hidden">

            {/* Background Orbs */}
            <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-6 relative z-10">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Start Earning in <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">3 Steps</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Our platform makes it incredibly easy to start earning passive income.
                        Follow these three simple steps to begin your journey with ShagunPro.
                    </p>
                </motion.div>

                {/* 3 Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            whileHover={{ y: -10 }}
                            className="relative group p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all duration-300"
                        >
                            <div className="text-6xl font-black text-white/5 mb-6 absolute top-4 right-6 pointer-events-none">
                                {step.number}
                            </div>

                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                                {step.icon}
                            </div>

                            <h3 className="text-2xl font-bold mb-4 text-white">{step.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{step.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Features Tabs Section */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 md:p-12">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Platform <span className="text-violet-400">Features</span>
                        </h2>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {[
                            { id: "staking", label: "Staking Rewards", icon: Zap },
                            { id: "referral", label: "Referral System", icon: Users },
                            { id: "tokenomics", label: "Tokenomics", icon: BarChart3 }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 rounded-full font-medium flex items-center gap-2 transition-all duration-300 ${activeTab === tab.id
                                        ? "bg-white text-black shadow-lg shadow-white/10"
                                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[400px]">
                        {activeTab === "staking" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                            >
                                {stakingData.map((item, index) => (
                                    <div key={index} className="p-6 rounded-2xl bg-black/40 border border-white/5 text-center hover:border-violet-500/30 transition-colors">
                                        <div className="w-12 h-12 mx-auto bg-violet-500/10 rounded-full flex items-center justify-center text-violet-400 mb-4">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div className="text-3xl font-bold text-white mb-2">{item.value}</div>
                                        <div className="text-lg font-medium text-gray-300 mb-1">{item.title}</div>
                                        <div className="text-sm text-gray-500">{item.desc}</div>
                                    </div>
                                ))}

                                <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-8 p-6 rounded-2xl bg-gradient-to-r from-violet-900/20 to-indigo-900/20 border border-violet-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2">Long Term Holding Bonus</h4>
                                        <p className="text-gray-400 text-sm">Earn extra rewards for holding your stake longer.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="px-4 py-2 rounded-lg bg-black/40 border border-white/10">
                                            <span className="text-gray-400 text-sm">12 Months</span>
                                            <div className="text-green-400 font-bold">+6% Bonus</div>
                                        </div>
                                        <div className="px-4 py-2 rounded-lg bg-black/40 border border-white/10">
                                            <span className="text-gray-400 text-sm">24 Months</span>
                                            <div className="text-green-400 font-bold">+12% Bonus</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "referral" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {referralLevels.map((level, index) => (
                                        <div key={index} className="relative group overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.05] p-6 text-center hover:bg-white/[0.08] transition-all">
                                            <div className={`absolute top-0 left-0 w-full h-1 ${level.color}`} />
                                            <div className="text-sm text-gray-500 mb-2">Level {level.level}</div>
                                            <div className="text-2xl font-bold text-white mb-1">{level.percentage}</div>
                                            <div className="text-xs text-violet-400 font-medium">Commission</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "tokenomics" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-12"
                            >
                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex justify-between items-center">
                                        <div>
                                            <div className="text-sm text-gray-400">Total Supply</div>
                                            <div className="text-2xl font-bold text-white">21,000,000</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-400">Symbol</div>
                                            <div className="text-2xl font-bold text-violet-400">SHAGUN</div>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                        <h4 className="font-bold mb-4">Distribution</h4>
                                        {[
                                            { label: "Community", val: 40, color: "bg-violet-500" },
                                            { label: "Liquidity", val: 25, color: "bg-blue-500" },
                                            { label: "Team", val: 20, color: "bg-indigo-500" },
                                            { label: "Marketing", val: 15, color: "bg-pink-500" }
                                        ].map((d, i) => (
                                            <div key={i} className="mb-4 last:mb-0">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-400">{d.label}</span>
                                                    <span className="text-white">{d.val}%</span>
                                                </div>
                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div className={`h-full ${d.color}`} style={{ width: `${d.val}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className="text-2xl font-bold mb-6">Sustainable Growth Model</h3>
                                    <p className="text-gray-400 leading-relaxed mb-6">
                                        ShagunPro is designed with long-term sustainability in mind. Our tokenomics ensure a fair distribution and incentivizes long-term holding through our tiered staking rewards.
                                    </p>
                                    <button className="self-start px-6 py-3 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-600/50 font-bold hover:bg-violet-600 hover:text-white transition-all flex items-center gap-2">
                                        Read Whitepaper <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HowItWorks;
