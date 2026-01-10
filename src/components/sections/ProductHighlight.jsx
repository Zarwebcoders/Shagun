import { motion } from "framer-motion";
import { Check, Leaf, Heart, Zap, Award } from "lucide-react";

const benefits = [
    { title: "Higher Milk Yield", icon: Zap },
    { title: "Better Digestion & Immunity", icon: Heart },
    { title: "Faster Calf Growth", icon: Award },
    { title: "Quick Recovery Post-Calving", icon: Leaf }
];

const goals = [
    { label: "Farmers", emoji: "👨‍🌾" },
    { label: "Animals", emoji: "🐄" },
    { label: "Customers", emoji: "👥" },
    { label: "Nature", emoji: "🌿" }
];

export default function ProductHighlight() {
    return (
        <section className="py-24 relative overflow-hidden bg-emerald-950/20">
            {/* Organic blobs */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-lime-600/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Visual Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex-1 relative"
                    >
                        <div className="relative z-10 bg-gradient-to-br from-emerald-900/40 to-black rounded-3xl p-1 border border-emerald-500/20 backdrop-blur-xl shadow-2xl">
                            {/* Placeholder for Product Image - Using abstract representation */}
                            <div className="h-[400px] w-full bg-gradient-to-br from-emerald-800/20 to-lime-800/10 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                                <Leaf className="w-32 h-32 text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors duration-500" />
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
                                    <div className="text-emerald-400 font-bold text-lg">Milkish Herbal Feed</div>
                                    <div className="text-gray-400 text-sm">Premium Nutrition for Livestock</div>
                                </div>
                            </div>
                        </div>

                        {/* Offer Badge */}
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className="absolute -top-6 -right-6 lg:-right-10 bg-gradient-to-br from-yellow-400 to-orange-500 text-black font-bold p-6 rounded-full shadow-lg shadow-yellow-500/20 rotate-12 z-20 w-32 h-32 flex flex-col items-center justify-center text-center"
                        >
                            <span className="text-xs font-bold uppercase">Mega Offer</span>
                            <span className="text-lg leading-tight">Get ₹1L Free</span>
                        </motion.div>
                    </motion.div>

                    {/* Content Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex-1"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                            <Leaf className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-400">Sustainable Agriculture</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Premium Nutrition, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-400">Maximum Rewards</span>
                        </h2>

                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
                            <p className="text-xl font-medium text-white mb-2">Exclusive Launch Offer</p>
                            <p className="text-gray-300">
                                Purchase products worth <span className="text-emerald-400 font-bold">₹1,10,000</span> and receive FREE bonus tokens worth <span className="text-yellow-400 font-bold">₹1,00,000</span> instantly!
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                            {benefits.map((b, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <b.icon className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <span className="text-gray-300">{b.title}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Empowering 4 Core Pillars</p>
                            <div className="flex gap-4 flex-wrap">
                                {goals.map((g, i) => (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                                        <span className="text-xl">{g.emoji}</span>
                                        <span className="font-medium">{g.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
