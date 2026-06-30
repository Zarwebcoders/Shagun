import { motion } from "framer-motion";
import { useState } from "react";
import {
    ChevronDown,
    ExternalLink,
    Shield,
    FileText,
    Twitter,
    Facebook,
    Instagram,
    Youtube,
    Linkedin,
    Send,
    Globe,
    Lock,
    Zap,
    Users,
    TrendingUp,
    Award
} from "lucide-react";

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: "What is ShagunPro and how does it work?",
            answer: "ShagunPro is a BEP-20 token on Binance Smart Chain that enables users to earn passive income through staking and referral programs. Users can stake tokens to earn 5% returns and build a 10-level referral network."
        },
        {
            question: "How much can I earn monthly with staking?",
            answer: "You can earn 5% monthly returns on weekdays. This translates to consistent passive income. Additionally, you get holding bonuses for locking your stake for longer periods (12-24 months)."
        },
        {
            question: "What is the minimum investment required?",
            answer: "The minimum investment required is 100 ShagunPro tokens. There are no upper limits, and you can stake any amount above the minimum to start earning immediately."
        },
        {
            question: "How does the 10-level referral system work?",
            answer: "Our referral system allows you to earn commissions from 10 levels of your network. Level 1: 5%, Level 2: 2%, and varying percentages down to Level 10, creating a deep income stream."
        },
        {
            question: "Is my investment secure?",
            answer: "Yes, our smart contract has been professionally audited and verified. We use industry-standard security protocols, and funds are stored in secure, multi-signature wallets."
        }
    ];

    const socialIcons = [
        { icon: <Twitter className="w-5 h-5" />, href: "#", label: "Twitter" },
        { icon: <Facebook className="w-5 h-5" />, href: "#", label: "Facebook" },
        { icon: <Instagram className="w-5 h-5" />, href: "#", label: "Instagram" },
        { icon: <Youtube className="w-5 h-5" />, href: "#", label: "YouTube" },
        { icon: <Linkedin className="w-5 h-5" />, href: "#", label: "LinkedIn" }
    ];

    return (
        <div className="py-24 bg-[#050505] relative overflow-hidden text-white font-sans">

            <div className="container mx-auto px-6 relative z-10">

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-32"
                >
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Questions</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Find answers to common questions about ShagunPro staking, referrals, and platform features.
                        </p>
                    </div>

                    {/* FAQ Accordion */}
                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqs.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className={`w-full text-left p-6 rounded-2xl transition-all duration-300 flex flex-col ${openIndex === index
                                        ? 'bg-white/[0.08] border border-violet-500/30 shadow-lg shadow-violet-500/10'
                                        : 'bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05]'
                                        }`}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <h3 className="text-lg font-bold pr-4 text-white">{faq.question}</h3>
                                        <div className={`transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-violet-400' : 'text-gray-500'}`}>
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'
                                            }`}
                                    >
                                        <p className="text-gray-400 leading-relaxed text-sm md:text-base border-t border-white/5 pt-4">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Ready to Start Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative mb-32 rounded-3xl overflow-hidden p-12 text-center bg-gradient-to-br from-violet-900/20 to-indigo-900/20 border border-violet-500/20"
                >
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to Start <span className="text-white">Earning</span>?
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
                            Join thousands of investors who are already earning passive income with ShagunPro.
                            Get started in minutes.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button className="px-8 py-4 rounded-full bg-white text-black font-bold hover:shadow-lg hover:shadow-white/20 transition-all flex items-center justify-center gap-2">
                                <FileText className="w-5 h-5" />
                                View Contract
                            </button>
                            <button className="px-8 py-4 rounded-full bg-white/10 text-white font-bold border border-white/10 hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                <Shield className="w-5 h-5" />
                                Scan Audit
                            </button>
                        </div>
                    </div>

                    {/* Background Glows */}
                    <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-5 pointer-events-none"></div>
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-violet-600/20 blur-[100px] pointer-events-none"></div>
                </motion.div>

                {/* Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-t border-white/5 pt-16">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xl">S</span>
                            </div>
                            <span className="text-2xl font-bold">ShagunPro</span>
                        </div>
                        <p className="text-gray-400 mb-8 max-w-sm">
                            Revolutionizing passive income generation through blockchain technology.
                            Join the future of decentralized finance today.
                        </p>
                        <div className="flex gap-4">
                            {socialIcons.map((social, i) => (
                                <a key={i} href={social.href} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-violet-600 hover:text-white transition-all text-gray-400">
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white">Platform</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-violet-400 transition-colors">Staking</a></li>
                            <li><a href="#" className="hover:text-violet-400 transition-colors">Referral</a></li>
                            <li><a href="#" className="hover:text-violet-400 transition-colors">Tokenomics</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white">Support</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-violet-400 transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-violet-400 transition-colors">Audit Report</a></li>
                            <li><a href="#" className="hover:text-violet-400 transition-colors">Contact Us</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
                    <div>
                        <div>© 2025 ShagunPro. All rights reserved.</div>
                        <p className="text-xs opacity-50">Crypto assets are unregulated & highly risky. Secure your capital.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        BSC Mainnet Operational
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FAQ;