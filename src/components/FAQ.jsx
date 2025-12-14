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
    Zap,
    Users,
    TrendingUp,
    Award,
    Lock,
    CheckCircle
} from "lucide-react";

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: "What is REX Token and how does it work?",
            answer: "REX Token is a BEP-20 token on Binance Smart Chain that enables users to earn passive income through staking and referral programs. Users can stake tokens to earn 5% returns and build a 10-level referral network for additional earnings."
        },
        {
            question: "How much can I earn monthly with staking?",
            answer: "You can earn 5% monthly returns on weekdays. This translates to approximately 3.885% weekly and 16.65% monthly on your staked amount. Additionally, you get a 6% holding bonus after 12 months."
        },
        {
            question: "What is the minimum investment required?",
            answer: "The minimum investment required is 100 REX tokens. There are no upper limits, and you can stake any amount above the minimum to start earning."
        },
        {
            question: "How does the 10-level referral system work?",
            answer: "Our referral system allows you to earn commissions from 10 levels of your network. Level 1: 5%, Level 2: 2%, Level 3: 1.5%, Levels 4-6: 1% each, Level 7: 0.75%, Level 8: 0.50%, Levels 9-10: 0.25% each."
        },
        {
            question: "When can I withdraw my earnings?",
            answer: "You can withdraw your staking rewards after 30 days. The principal amount can be withdrawn after the staking period completes (minimum 30 days). Referral earnings are available for withdrawal immediately."
        },
        {
            question: "Is my investment secure?",
            answer: "Yes, our smart contract has been professionally audited and verified. We use industry-standard security protocols, and funds are stored in secure, multi-signature wallets with regular security updates."
        }
    ];

    const stats = [
        {
            label: "ROI (Up to 1L)",
            value: "1% Monthly",
            icon: <TrendingUp className="w-5 h-5" />,
            desc: "For investments ≤ ₹1,00,000"
        },
        {
            label: "ROI (Above 1L)",
            value: "1.5% Monthly",
            icon: <Zap className="w-5 h-5" />,
            desc: "For investments > ₹1,00,000"
        },
        {
            label: "Holding Bonus",
            value: "+6%",
            icon: <Award className="w-5 h-5" />,
            desc: "After 12 months staking"
        },
        {
            label: "Minimum Stake",
            value: "100 REX",
            icon: <CheckCircle className="w-5 h-5" />,
            desc: "Minimum investment required"
        }
    ];

    const footerLinks = {
        features: [
            { name: "Staking Platform", href: "#" },
            { name: "Referral System", href: "#" },
            { name: "Token Analytics", href: "#" },
            { name: "Security Audit", href: "#" }
        ],
        resources: [
            { name: "Whitepaper", href: "#" },
            { name: "Documentation", href: "#" },
            { name: "API Docs", href: "#" },
            { name: "Community", href: "#" }
        ],
        company: [
            { name: "About Us", href: "#" },
            { name: "Careers", href: "#" },
            { name: "Press", href: "#" },
            { name: "Contact", href: "#" }
        ]
    };

    const socialIcons = [
        { icon: <Twitter className="w-5 h-5" />, href: "#", label: "Twitter" },
        { icon: <Facebook className="w-5 h-5" />, href: "#", label: "Facebook" },
        { icon: <Instagram className="w-5 h-5" />, href: "#", label: "Instagram" },
        { icon: <Youtube className="w-5 h-5" />, href: "#", label: "YouTube" },
        { icon: <Linkedin className="w-5 h-5" />, href: "#", label: "LinkedIn" }
    ];

    return (
        <div className=" pt-20 pb-0">
            <div className="container mx-auto px-6 max-w-7xl">

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-20"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Frequently Asked <span className="bg-gradient-to-r from-[#9131e7] to-[#ffcc4d] bg-clip-text text-transparent">Questions</span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Find answers to common questions about REX Token staking, referrals, and platform features.
                        </p>
                    </div>

                    {/* FAQ Accordion */}
                    <div className="max-w-4xl mx-auto">
                        {faqs.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="mb-4"
                            >
                                <motion.button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${openIndex === index
                                        ? 'bg-gradient-to-r from-[#9131e7]/20 to-[#ffcc4d]/20 border border-[#9131e7]/30'
                                        : 'bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-[#9131e7]/40'
                                        }`}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold pr-4">{faq.question}</h3>
                                        <motion.div
                                            animate={{ rotate: openIndex === index ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex-shrink-0"
                                        >
                                            <ChevronDown className="w-6 h-6" />
                                        </motion.div>
                                    </div>

                                    <motion.div
                                        initial={false}
                                        animate={{
                                            height: openIndex === index ? 'auto' : 0,
                                            opacity: openIndex === index ? 1 : 0,
                                            marginTop: openIndex === index ? '1rem' : 0
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                                    </motion.div>
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Ready to Start Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative mb-20"
                >
                    {/* Animated Rings */}
                    <div className="absolute top-60 -right-40 w-96 h-96">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-2 border-[#9131e7]/20 rounded-full"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-10 border-2 border-[#ffcc4d]/20 rounded-full"
                        />
                    </div>
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#9131e7]/10 via-[#ffcc4d]/5 to-[#9131e7]/10 rounded-3xl blur-3xl"></div>

                    <div className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-[#9131e7]/30 rounded-3xl p-8 md:p-12">
                        <div className="text-center mb-10">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                Ready to Start <span className="text-[#ffcc4d]">Earning</span>?
                            </h2>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                                Join thousands of investors who are already earning passive income with REX Token.
                                Get started in minutes with our easy-to-use platform.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-center gap-4 mb-12">
                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative px-8 py-4 bg-gradient-to-r from-[#9131e7] to-[#a855f7] text-white font-bold rounded-full flex items-center space-x-3"
                            >
                                <FileText className="w-5 h-5" />
                                <span>View Contract</span>
                                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </motion.a>

                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative px-8 py-4 bg-gradient-to-r from-[#ffcc4d] to-[#fbbf24] text-black font-bold rounded-full flex items-center space-x-3"
                            >
                                <Shield className="w-5 h-5" />
                                <span>Scan Audit</span>
                                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </motion.a>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 text-center"
                                >
                                    <div className="inline-flex p-3 bg-gradient-to-br from-[#9131e7]/20 to-[#ffcc4d]/20 rounded-xl mb-4">
                                        <div className="text-[#9131e7]">
                                            {stat.icon}
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-[#ffcc4d] mb-2">{stat.value}</div>
                                    <div className="text-lg font-bold">{stat.label}</div>
                                    <div className="">{stat.desc}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-800 pt-12 pb-8">
                <div className="container mx-auto px-6 max-w-7xl">

                    {/* Main Footer Content */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

                        {/* Brand Section */}
                        <div>
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#9131e7] to-[#ffcc4d] rounded-lg flex items-center justify-center">
                                    <span className="text-black font-bold text-xl">R</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-[#9131e7] to-[#ffcc4d] bg-clip-text text-transparent">
                                        REX TOKEN
                                    </h3>
                                    <p className="text-sm text-gray-400">Powered by BSC</p>
                                </div>
                            </div>

                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Revolutionizing passive income generation through blockchain technology.
                                Join the future of decentralized finance today.
                            </p>

                            {/* Social Icons */}
                            <div className="flex space-x-4">
                                {socialIcons.map((social, index) => (
                                    <motion.a
                                        key={index}
                                        href={social.href}
                                        whileHover={{ scale: 1.2, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-10 h-10 bg-gray-800 hover:bg-[#9131e7] rounded-full flex items-center justify-center transition-colors group"
                                        aria-label={social.label}
                                    >
                                        <div className="text-gray-400 group-hover:text-white">
                                            {social.icon}
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        {/* Features Links */}
                        <div>
                            <h4 className="text-xl font-bold mb-6 flex items-center">
                                <Zap className="w-5 h-5 mr-2 text-[#9131e7]" />
                                Features
                            </h4>
                            <ul className="space-y-3">
                                {footerLinks.features.map((link, index) => (
                                    <motion.li
                                        key={index}
                                        whileHover={{ x: 5 }}
                                    >
                                        <a
                                            href={link.href}
                                            className="text-gray-400 hover:text-[#ffcc4d] transition-colors flex items-center group"
                                        >
                                            <span className="w-1 h-1 bg-[#9131e7] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                            {link.name}
                                        </a>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        {/* Resources Links */}
                        <div>
                            <h4 className="text-xl font-bold mb-6 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-[#9131e7]" />
                                Resources
                            </h4>
                            <ul className="space-y-3">
                                {footerLinks.resources.map((link, index) => (
                                    <motion.li
                                        key={index}
                                        whileHover={{ x: 5 }}
                                    >
                                        <a
                                            href={link.href}
                                            className="text-gray-400 hover:text-[#ffcc4d] transition-colors flex items-center group"
                                        >
                                            <span className="w-1 h-1 bg-[#9131e7] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                            {link.name}
                                        </a>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        {/* Follow Us Section */}
                        <div>
                            <h4 className="text-xl font-bold mb-6 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-[#9131e7]" />
                                Follow Us
                            </h4>
                            <p className="text-gray-400 mb-6">
                                Stay updated with the latest news, updates, and announcements.
                            </p>

                            {/* Newsletter Subscription */}
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#9131e7]"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="absolute right-2 top-2 px-4 py-2 bg-gradient-to-r from-[#9131e7] to-[#ffcc4d] text-black font-bold rounded-md flex items-center space-x-2"
                                >
                                    <span>Subscribe</span>
                                    <Send className="w-4 h-4" />
                                </motion.button>
                            </div>

                            {/* Contact Info */}
                            <div className="mt-6 space-y-2">
                                <div className="flex items-center text-gray-400">
                                    <Globe className="w-4 h-4 mr-3" />
                                    <span>support@rextoken.com</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <Lock className="w-4 h-4 mr-3" />
                                    <span>Audited & Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="pt-8 border-t border-gray-800">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-gray-500 text-sm">
                                © 2024 REX Token. All rights reserved.
                            </div>

                            <div className="flex flex-wrap gap-6">
                                <a href="#" className="text-gray-400 hover:text-[#ffcc4d] text-sm transition-colors">
                                    Privacy Policy
                                </a>
                                <a href="#" className="text-gray-400 hover:text-[#ffcc4d] text-sm transition-colors">
                                    Terms of Service
                                </a>
                                <a href="#" className="text-gray-400 hover:text-[#ffcc4d] text-sm transition-colors">
                                    Cookie Policy
                                </a>
                                <a href="#" className="text-gray-400 hover:text-[#ffcc4d] text-sm transition-colors">
                                    Disclaimer
                                </a>
                            </div>

                            <div className="flex items-center text-gray-500 text-sm">
                                <span className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                    Live on BSC Network
                                </span>
                            </div>
                        </div>

                        {/* Security Badges */}
                        <div className="flex flex-wrap justify-center gap-4 mt-8">
                            {[
                                { text: "SSL Secured", icon: "🔒" },
                                { text: "Contract Verified", icon: "✅" },
                                { text: "2FA Enabled", icon: "🛡️" },
                                { text: "KYC Ready", icon: "📋" }
                            ].map((badge, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ scale: 1.05 }}
                                    className="px-4 py-2 bg-gray-800 rounded-full flex items-center space-x-2"
                                >
                                    <span>{badge.icon}</span>
                                    <span className="text-sm text-gray-300">{badge.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default FAQ;