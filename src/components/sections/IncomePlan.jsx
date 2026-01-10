import { motion } from "framer-motion";

export default function IncomePlan() {
    return (
        <section className="py-24 bg-[#0a0a0a]">
            <div className="container mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-black p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl"
                >
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-bold mb-8"
                    >
                        Income Potential <span className="text-gray-500 text-base font-normal block mt-2">(Illustration Example)</span>
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {[
                            { label: "Daily Sales Volume", val: "₹1 Cr", color: "text-white", delay: 0.1 },
                            { label: "Profit Pool (1%)", val: "₹10 Lakh", color: "text-green-400", delay: 0.2 },
                            { label: "Achiever's Share (35%)", val: "₹3.5 Lakh", color: "text-violet-400", delay: 0.3 }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: item.delay }}
                                viewport={{ once: true }}
                                className={`p-6 bg-white/5 rounded-2xl ${i === 2 ? "border border-violet-500/30" : ""}`}
                            >
                                <div className={`${i === 2 ? "text-violet-300" : "text-gray-400"} text-sm mb-2`}>{item.label}</div>
                                <div className={`text-2xl font-bold ${item.color}`}>{item.val}</div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            viewport={{ once: true }}
                            className="text-left"
                        >
                            <div className="text-5xl font-bold text-white mb-2">₹3,500</div>
                            <div className="text-gray-500 uppercase tracking-widest text-xs">Est. Monthly Income</div>
                        </motion.div>
                        <div className="h-16 w-px bg-white/10 hidden md:block"></div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            viewport={{ once: true }}
                            className="text-left"
                        >
                            <div className="text-5xl font-bold text-white mb-2">₹42,000</div>
                            <div className="text-gray-500 uppercase tracking-widest text-xs">Est. Yearly Income</div>
                        </motion.div>
                    </div>

                    <p className="text-xs text-gray-600 italic">
                        * Disclaimer: This is a mathematical illustration based on hypothetical sales data. Actual income may vary based on company performance and individual achievement levels.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
