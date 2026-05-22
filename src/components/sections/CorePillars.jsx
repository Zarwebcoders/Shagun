import { motion } from "framer-motion";
import { ShoppingBag, Pickaxe, Sprout } from "lucide-react";

const pillars = [
    {
        title: "Purchase",
        desc: "Buy premium Milkish Herbal Animal Feed and other essential products.",
        icon: ShoppingBag,
        color: "from-blue-500 to-cyan-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20"
    },
    {
        title: "Mining",
        desc: "Lock your purchase to mine ShagunPro tokens with up to 20% commission.",
        icon: Pickaxe,
        color: "from-violet-500 to-fuchsia-500",
        bg: "bg-violet-500/10",
        border: "border-violet-500/20"
    },
    {
        title: "Shopping",
        desc: "Use earned points to shop at partner vendors across our ecosystem.",
        icon: Sprout, // Using Sprout as a placeholder for ecosystem growth/shopping
        color: "from-emerald-500 to-green-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20"
    }
];

export default function CorePillars() {
    return (
        <section className="py-20 relative z-10">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">Core Pillars</span></h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">The foundation of the ShagunPro ecosystem designed for sustainable growth.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pillars.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2, duration: 0.5 }}
                            whileHover={{ y: -10 }}
                            className={`p-8 rounded-3xl backdrop-blur-md border ${item.border} ${item.bg} hover:bg-white/5 transition-all duration-300 group relative overflow-hidden`}
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br from-white/10 to-transparent" />

                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                                <item.icon className="w-8 h-8 text-white" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
