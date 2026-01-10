import { motion } from "framer-motion";

const steps = [
    { month: "Month 0", title: "Purchase & Lock", desc: "Buy feed, receive tokens, 12-month lock starts." },
    { month: "Month 1-12", title: "Monthly Mining", desc: "Accumulate mining rewards & commission." },
    { month: "Month 13", title: "Sell Window", desc: "Unlock 20% bonus. Sell tokens back to company." },
    { month: "Month 17", title: "Cycle End", desc: "Unsold tokens lapse. 15% deduction applies on withdrawal." }
];

export default function TimelineSection() {
    return (
        <section className="py-20 bg-[#080808] border-y border-white/5">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Investment <span className="text-white">Timeline</span></h2>
                    <p className="text-gray-400">Clear path from purchase to profit realization.</p>
                </div>

                <div className="relative">
                    {/* Line - Animated */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute top-[115px] left-0 w-full h-1 bg-gradient-to-r from-violet-900 via-white/50 to-violet-900 -translate-y-1/2 hidden md:block origin-left"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.3 }}
                                className="relative z-10 group"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#080808] border-4 border-violet-600 mx-auto mb-6 flex items-center justify-center group-hover:scale-125 transition-transform shadow-[0_0_20px_rgba(124,58,237,0.5)]">
                                    <div className="w-3 h-3 bg-white rounded-full" />
                                </div>

                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center hover:bg-white/10 transition-colors">
                                    <div className="text-violet-400 font-bold mb-2 uppercase text-sm tracking-wider">{step.month}</div>
                                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-gray-400 text-sm">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
