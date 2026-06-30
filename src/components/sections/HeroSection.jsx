import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import HeroGeometric from "../HeroGeometric";

export default function HeroSection({ navigate }) {
    return (
        <section className="relative z-10 min-h-screen flex items-center pt-20 overflow-hidden">
            {/* Background Accent for Nature Vibe */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-12">
                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 text-center lg:text-left z-10"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-sm font-medium text-emerald-300">New Age Agri-Fintech Ecosystem</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
                            <span className="block text-white">Earn, Shop & Grow</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-violet-500">
                                with ShagunPro
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed font-light">
                            Purchase premium animal feed, mine tokens, shop smarter, and build wealth together. The future of sustainable finance.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full font-bold text-lg shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                Get Started <ArrowRight className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 font-bold text-lg backdrop-blur-sm flex items-center justify-center gap-2 group"
                            >
                                <Users className="w-5 h-5 text-violet-400 group-hover:text-white transition-colors" />
                                Join Community
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="flex-1 w-full flex justify-center lg:justify-end relative"
                    >
                        <HeroGeometric />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
