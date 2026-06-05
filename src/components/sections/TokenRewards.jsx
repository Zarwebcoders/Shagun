import { motion } from "framer-motion";
import { Lock, TrendingUp, Gift, Coins } from "lucide-react";

export default function TokenRewards() {
    return (
        <section className="py-24 relative z-10 bg-black/40 backdrop-blur-sm">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Tokenomics</span></h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">A transparent rewards system designed for long-term holders.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left: Mining Rules */}
                    <div className="space-y-6">
                        {[
                            { title: "12-Month Mining Lock", desc: "Tokens are locked for mining to ensure ecosystem stability. Earn consistent monthly rewards while your assets grow.", icon: Lock, color: "text-violet-400", bg: "bg-violet-600/20", border: "border-violet-500/10", hover: "hover:border-violet-500/30", grad: "from-violet-900/20" },
                            { title: "20% Mining Commission", desc: "Receive approx. 5,000 tokens as mining commission distributed over the mining period.", icon: Coins, color: "text-fuchsia-400", bg: "bg-fuchsia-600/20", border: "border-fuchsia-500/10", hover: "hover:border-fuchsia-500/30", grad: "from-fuchsia-900/20" },
                            { title: "Loyalty Bonus", desc: "Get an additional 20% holding bonus after 12 months completion.", icon: Gift, color: "text-emerald-400", bg: "bg-emerald-600/20", border: "border-emerald-500/10", hover: "hover:border-emerald-500/30", grad: "from-emerald-900/20" }
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className={`p-6 rounded-2xl bg-gradient-to-br ${card.grad} to-black border ${card.border} ${card.hover} transition-colors`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 ${card.bg} rounded-xl`}>
                                        <card.icon className={`w-6 h-6 ${card.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                                        <p className="text-gray-400">{card.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Right: Growth Visual (Phase System) */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-violet-600/10 blur-3xl rounded-full" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative z-10 bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10"
                        >
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <TrendingUp className="text-green-400" /> Phase Growth Model
                            </h3>

                            <div className="space-y-8">
                                {[
                                    { phase: "Phase 1", growth: "Base Price", status: "Completed", color: "text-gray-400" },
                                    { phase: "Phase 2", growth: "1.2x Growth", status: "Active Now", color: "text-green-400 font-bold" },
                                    { phase: "Phase 3", growth: "1.44x Growth", status: "Upcoming", color: "text-gray-500" },
                                ].map((p, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.4 + (i * 0.2) }}
                                        className="flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${i === 1 ? "bg-green-500/20 border-green-500 text-green-400" : "bg-white/5 border-white/10 text-gray-500"}`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className={`text-lg ${p.color}`}>{p.phase}</div>
                                                <div className="text-sm text-gray-400">{p.growth}</div>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs border ${i === 1 ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/5 text-gray-600"}`}>
                                            {p.status}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Total Projected Tokens (16 Months)</span>
                                    <span className="text-2xl font-bold text-white">6,000+</span>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 leading-relaxed">
                                    * Phase growth is subject to company performance targets being met.
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section >
    );
}
