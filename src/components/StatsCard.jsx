import { motion } from "framer-motion";

export default function StatsCard({ title, amount, color, icon: Icon, subValue }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl p-6 rounded-2xl border border-teal-500/20 hover:border-teal-500/50 transition-colors group overflow-hidden"
        >
            {/* Background Glow */}
            <div
                className="absolute -right-10 -top-10 w-32 h-32 blur-[60px] rounded-full transition-opacity duration-500 opacity-20 group-hover:opacity-40"
                style={{ backgroundColor: color }}
            />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="text-gray-400 text-sm font-medium mb-1">{title}</h4>
                        <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">{amount}</p>
                    </div>
                    {Icon && (
                        <div
                            className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300"
                            style={{ color: color }}
                        >
                            <Icon className="w-6 h-6" />
                        </div>
                    )}
                </div>

                {subValue && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-white/5 text-gray-300 border border-white/5">
                            {subValue}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
