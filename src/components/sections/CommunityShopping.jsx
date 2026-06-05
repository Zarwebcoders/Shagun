import { motion } from "framer-motion";
import { Repeat, ShoppingCart, QrCode } from "lucide-react";

export default function CommunityShopping() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#050505] via-[#0f0f1a] to-[#050505] -z-10" />

            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Text Content */}
                    <div className="flex-1">
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl md:text-5xl font-bold mb-6"
                        >
                            We are building a <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">Shopping Community</span> where everyone grows together.
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-gray-400 text-lg mb-10 leading-relaxed"
                        >
                            Our unique points system empowers you to shop at partner vendors, save money, and contribute to the ecosystem's growth cycle.
                        </motion.p>

                        <div className="space-y-6">
                            {[
                                { title: "Earn Monthly Points", desc: "Get shopping points every month based on your mining activity." },
                                { title: "Smart Redemption", desc: "Pay 80% Cash + 20% Shopping Points at vendors." },
                                { title: "QR Code Easy Scan", desc: "Instantly redeem points at any partner store." }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
                                    className="flex gap-4"
                                >
                                    <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                                        <ShoppingCart className="w-5 h-5 text-rose-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                                        <p className="text-gray-500">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Cycle Visual */}
                    <div className="flex-1 relative flex justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full pointer-events-none"
                        />

                        <div className="relative z-10 w-80 h-80 bg-gradient-to-br from-rose-900/20 to-black rounded-full border border-rose-500/20 flex flex-col items-center justify-center text-center p-8 backdrop-blur-md shadow-2xl">
                            <Repeat className="w-12 h-12 text-rose-500 mb-4 animate-spin-slow" />
                            <h3 className="text-2xl font-bold mb-2">3-Month Cycle</h3>
                            <p className="text-sm text-gray-400">Points are valid for 3 months. Use them or they lapse, keeping the economy dynamic.</p>

                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-600 px-4 py-1 rounded-full text-xs font-bold uppercase">
                                Cycle Active
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute top-0 right-10 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-md"
                        >
                            <QrCode className="w-8 h-8 text-white" />
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
