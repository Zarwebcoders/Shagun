"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import client from "../api/client" // Import API Client
import { toast } from "react-hot-toast"
import {
    ShoppingCart, Star, Leaf, Zap, ShieldCheck,
    ChevronDown, ChevronUp, Droplets, Heart,
    Activity, Award, CheckCircle2, XCircle,
    Smartphone, Wallet, TrendingUp, Lock, Gift,
    PieChart, Calendar, AlertCircle, Clock, Ban,
    Users, Store, MessageCircle, ArrowRight
} from "lucide-react"

// --- Mock Data ---
const products = [
    {
        id: 1,
        name: "Milkish Herbal Feed",
        price: 3500, // Display Price per unit? Or Package Price?
        // Note: Controller calculates based on amount. 
        // Logic: Frontend should perhaps allow selecting a "Package" or amount. 
        // For simplicity, we keep the UI but make the button action open a Purchase Modal or Trigger API.
        rating: 4.8,
        reviews: 128,
        image: "/feed-product.png",
        description: "Premium herbal feed supplement for cattle to boost milk production and immunity.",
        popular: true,
        pkgType: "Standard"
    },
    {
        id: 2,
        name: "Growth Booster Premix",
        price: 2100,
        rating: 4.6,
        reviews: 85,
        image: "/growth-booster.png",
        description: "Essential minerals and vitamins premix for faster growth.",
        popular: false,
        pkgType: "Silver"
    },
    {
        id: 3,
        name: "Immuno-Care Tonic",
        price: 1200,
        rating: 4.9,
        reviews: 210,
        image: "/tonic.png",
        description: "Advanced immunity booster tonic.",
        popular: false,
        pkgType: "Gold"
    }
]

const faqs = [
    { q: "How does the free token offer work?", a: "When you purchase the Milkish Herbal Feed pack worth ₹1,10,000, you instantly receive tokens worth ₹1,00,000 in your wallet. These tokens can be used for mining to earn daily returns." },
    { q: "Is the commission rate fixed?", a: "Yes, we offer a guaranteed 20% commission rate on your mining activities, ensuring predictable and steady earnings." },
    { q: "Can I sell the tokens?", a: "Yes, the tokens you earn from mining can be sold or withdrawn anytime after the lock-in period, giving you complete flexibility." },
    { q: "Is the product organic?", a: "Absolutely. Milkish Herbal Feed is 100% organic, composed of natural herbs and minerals safe for all livestock." }
]

// --- Components ---

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5 shadow-2xl">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/removedbg.png" alt="logo" className="h-10 w-10 md:h-16 md:w-16 transition-transform hover:scale-105" />
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all text-sm font-medium hidden sm:block"
                    >
                        Login
                    </button>
                </div>
            </div>
        </header>
    )
}

const HeroSection = () => (
    <section className="relative pt-40 pb-20 overflow-hidden bg-[#050505]">
        {/* Animated Background */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -z-10 animate-pulse-slow delay-700" />

        <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-20">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex-1 text-center lg:text-left z-10"
                >
                    <div className="inline-block px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium text-sm mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        🚀 Smart Farming Revolution
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                        Earn, Shop & <br />
                        Grow <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400 animate-gradient">
                            with Shagun
                        </span>
                    </h1>

                    {/* Offer Box */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-10 text-left max-w-xl hover:border-white/20 transition-colors shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <p className="text-lg text-gray-200 leading-relaxed relative z-10">
                            Buy premium herbal animal feed worth <span className="font-bold text-white text-xl">₹1,10,000</span> and get <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold text-xl">FREE tokens worth ₹1,00,000</span> to mine, earn 20% commission.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                        <button className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_25px_rgba(37,99,235,0.6)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                            <Wallet className="w-5 h-5" />
                            JOIN SHAGUN NOW
                        </button>
                        <button className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium group px-6 py-4">
                            See How It Works <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>

                {/* Product Cards Visual */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="flex-1 relative perspective-1000"
                >
                    <div className="relative z-10 grid grid-cols-2 gap-6 transform lg:rotate-y-12 lg:rotate-6 hover:rotate-0 transition-all duration-700 ease-out">
                        {products.slice(0, 2).map((product, i) => (
                            <ProductCard key={product.id} product={product} i={i} />
                        ))}
                    </div>

                    {/* Decorative Elements around products */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/5 rounded-full blur-3xl -z-10" />
                </motion.div>
            </div>
        </div>
    </section>
)

const PromisesSection = () => (
    <section className="py-24 bg-[#08080c] relative z-10">
        <div className="container mx-auto px-6">
            <div className="text-center mb-20 animate-on-scroll">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Our Four <span className="text-blue-500 relative">
                        Promises
                        <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-500/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor" />
                        </svg>
                    </span>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Farmer", subtitle: "(किसान)", icon: Award, desc: "Increase income and savings through higher milk yield and healthier livestock.", color: "text-amber-400", bg: "bg-amber-400/10", border: "hover:border-amber-400/50" },
                    { title: "Animals", subtitle: "(पशु)", icon: Heart, desc: "Healthier, disease-free, long-living animals with herbal nutrition.", color: "text-orange-300", bg: "bg-orange-300/10", border: "hover:border-orange-300/50" },
                    { title: "Customer", subtitle: "(ग्राहक)", icon: Star, desc: "Herbal, medicinal, highly nutritious milk for families.", color: "text-orange-400", bg: "bg-orange-400/10", border: "hover:border-orange-400/50" },
                    { title: "Nature", subtitle: "(प्रकृति)", icon: Leaf, desc: "Better soil fertility and environment through organic farming practices.", color: "text-green-500", bg: "bg-green-500/10", border: "hover:border-green-500/50" }
                ].map((item, i) => (
                    <div key={i} className={`bg-[#0f0f13] border border-white/5 rounded-[2rem] p-8 text-center hover:-translate-y-2 transition-all duration-300 group ${item.border} hover:shadow-2xl`}>
                        <div className={`w-20 h-20 rounded-2xl ${item.bg} mx-auto mb-8 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <item.icon className={`w-10 h-10 ${item.color.replace('text-', 'stroke-current text-')}`} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white">{item.title} <span className="font-normal text-lg text-gray-400 block mt-1">{item.subtitle}</span></h3>
                        <p className="text-gray-400 mt-6 leading-relaxed text-sm">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
)

const ProductSpotlight = () => (
    <section className="py-32 container mx-auto px-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
            {/* Image Side */}
            <div className="flex-1 relative w-full group">
                <div className="aspect-square rounded-[2.5rem] bg-gradient-to-br from-gray-800 to-black p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform -rotate-[3deg] group-hover:rotate-0 transition-all duration-700">
                    <div className="w-full h-full rounded-[2.3rem] overflow-hidden relative">
                        <img src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80" alt="Milkish" className="object-cover w-full h-full opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                        <div className="absolute bottom-10 left-10 right-10">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold uppercase tracking-wider">Bestseller</span>
                                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">Trusted by 50k+</span>
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-2 leading-tight">Milkish Herbal Feed</h3>
                            <p className="text-gray-300 text-lg">Premium Nutrition for Healthy Livestock</p>
                        </div>
                    </div>
                </div>
                {/* Floating Badge */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-center leading-tight shadow-xl animate-bounce-slow">
                    100%<br />Organic
                </div>
            </div>

            {/* Content Side */}
            <div className="flex-1">
                {/* Pricing Breakdown */}
                <div className="flex flex-wrap gap-8 mb-10 border-b border-white/10 pb-10">
                    <div className="shrink-0 group">
                        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 transition-all group-hover:scale-110 origin-left">₹1,10,000</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-2 font-bold">Product Cost</p>
                    </div>
                    <div className="w-px h-16 bg-white/10 hidden sm:block" />
                    <div className="shrink-0 group">
                        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 transition-all group-hover:scale-110 origin-left">₹1,00,000</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-2 font-bold">Free Tokens</p>
                    </div>
                    <div className="w-px h-16 bg-white/10 hidden sm:block" />
                    <div className="shrink-0 group">
                        <p className="text-4xl font-bold text-emerald-500 transition-all group-hover:scale-110 origin-left">20%</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-2 font-bold">Commission</p>
                    </div>
                </div>

                <div className="inline-block px-5 py-2 rounded-full border border-purple-500/30 text-purple-300 text-sm font-semibold mb-6 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    ✨ Real Products. Real Value.
                </div>

                <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                    Milkish – <br /><span className="text-blue-500">Herbal Animal Feed</span>
                </h2>
                <p className="text-gray-400 mb-10 leading-relaxed text-lg">
                    A pure herbal and nutrient-rich formulation designed for the total well-being of your livestock. Scientifically proven to enhance yield while maintaining natural balance.
                </p>

                <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Premium Benefits
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        "Increases milk yield & quality",
                        "Superior Digestive Health",
                        "Enhances immunity & overall health",
                        "Supports faster growth in calves"
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span className="text-gray-300 font-medium text-sm">{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
)

const TokenWorkflow = () => (
    <section className="py-24 bg-[#050505] text-white relative">
        <div className="container mx-auto px-6">
            <div className="text-center mb-20">
                <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                    How Your <span className="text-cyan-600">Free Tokens</span> Work
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">Simple, transparent, and rewarding. Here is how you can maximize your benefits.</p>
            </div>

            <div className="bg-[#121218] border border-white/5 rounded-[2rem] p-10 mb-20 text-center max-w-5xl mx-auto shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
                <h3 className="text-2xl font-bold text-blue-400 mb-4 tracking-tight">WE SELL PRODUCTS, NOT TOKENS!</h3>
                <p className="text-gray-400 leading-relaxed max-w-3xl mx-auto text-lg">
                    Our company is purely product-based. We do not sell tokens. Tokens are given <span className="font-bold text-white">absolutely free</span> with every product purchase. With these free tokens, you can participate in mining and earn mining commission.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { id: 1, title: "Guaranteed Growth", icon: TrendingUp, desc: "Fixed 20% commission rate ensures predictable earnings on your mining.", color: "from-blue-400 to-blue-600" },
                    { id: 2, title: "Easy Mobile Mining", icon: Smartphone, desc: "Simple button press every 15 days - no complex hardware required.", color: "from-purple-400 to-purple-600" },
                    { id: 3, title: "Flexible Withdrawal", icon: Wallet, desc: "Sell your earned tokens anytime within 17 months at market rates.", color: "from-emerald-400 to-emerald-600" },
                    { id: 4, title: "Free Token Reward", icon: Gift, desc: "Get FREE tokens worth ₹1,00,000 as a bonus with your product.", color: "from-amber-400 to-amber-600" }
                ].map((step, i) => (
                    <div key={i} className="bg-[#121218] p-8 rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative group border border-white/5">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center font-bold absolute -top-7 left-8 shadow-lg group-hover:scale-110 transition-transform`}>
                            <step.icon className="w-7 h-7" />
                        </div>
                        <div className="mt-8 mb-4">
                            <span className="text-6xl font-bold text-white/5 absolute top-4 right-4 -z-10">{step.id}</span>
                        </div>
                        <h4 className="text-xl font-bold mb-3 text-white">{step.title}</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
)

const TokenEconomics = () => (
    <section className="py-24 bg-[#08080c] relative overflow-hidden">
        {/* Ambient Backgrounds */}
        <div className="absolute top-1/4 left-0 w-full h-[500px] bg-purple-900/10 blur-[100px] -z-10" />

        <div className="container mx-auto px-6">

            {/* 1. simple Calculation */}
            <div className="mb-32">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">Token Calculation <span className="text-purple-400">Simple Math</span></h2>
                    <p className="text-gray-400">Transparent and easy to understand value proposition.</p>
                </div>

                <div className="bg-[#121218] rounded-[2.5rem] p-10 md:p-16 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-600/20 blur-[100px]" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-16 relative z-10">
                        <div className="text-center flex-1">
                            <h3 className="text-7xl font-bold text-white mb-4">₹4</h3>
                            <p className="text-purple-400 font-bold uppercase tracking-widest text-sm mb-2">Current Rate</p>
                            <p className="text-gray-500 text-xs">Phase 1 Token Value</p>
                        </div>

                        <div className="hidden md:flex flex-col items-center justify-center opacity-30">
                            <div className="w-px h-12 bg-white mb-4" />
                            <span className="text-2xl font-bold text-white">÷</span>
                            <div className="w-px h-12 bg-white mt-4" />
                        </div>

                        <div className="text-center flex-1">
                            <h3 className="text-7xl font-bold text-white mb-4">25k</h3>
                            <p className="text-purple-400 font-bold uppercase tracking-widest text-sm mb-2">Total Tokens</p>
                            <p className="text-gray-500 text-xs">₹1,00,000 Investment Value</p>
                        </div>

                        <div className="flex-1 bg-gradient-to-br from-amber-500/10 to-amber-900/10 rounded-3xl p-8 border border-amber-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4 text-amber-400 font-bold text-lg">
                                <Gift className="w-6 h-6" /> The Formula:
                            </div>
                            <p className="text-amber-100/80 leading-relaxed text-lg">
                                Current Rate <span className="font-bold text-amber-400">₹4</span> <br />
                                Inv. Value <span className="font-bold text-amber-400">₹1,00,000</span> <br />
                                ----------------------- <br />
                                = <span className="font-bold text-white text-xl">25,000 Tokens</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Mining Lock & Distribution */}
            <div className="grid md:grid-cols-2 gap-8 mb-32">
                <div className="bg-[#121218] rounded-[2rem] p-10 border border-white/5 hover:border-blue-500/30 transition-colors">
                    <h4 className="text-blue-400 font-bold text-xl mb-6 flex items-center gap-3">
                        <Lock className="w-6 h-6" /> 12-Month Lock
                    </h4>
                    <p className="text-gray-400 leading-relaxed text-lg mb-8">
                        Tokens are securely locked for 12 months to ensure ecosystem stability. During this time, you earn consistent mining rewards.
                    </p>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className="w-1/3 bg-blue-500 h-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                    <p className="text-right text-xs text-blue-400 mt-2 font-mono">Lock Active</p>
                </div>

                <div className="bg-[#121218] rounded-[2rem] p-10 border border-white/5 hover:border-purple-500/30 transition-colors">
                    <h4 className="text-purple-400 font-bold text-xl mb-6 flex items-center gap-3">
                        <PieChart className="w-6 h-6" /> Token Split
                    </h4>
                    <div className="flex gap-6 items-end h-32">
                        <div className="w-1/2 bg-gradient-to-t from-blue-900 to-blue-600 rounded-t-2xl relative group flex items-end justify-center pb-4 transition-all hover:h-full h-[80%]">
                            <span className="absolute -top-8 text-white font-bold">20,000</span>
                            <span className="text-xs text-blue-200 font-bold uppercase">Company</span>
                        </div>
                        <div className="w-1/2 bg-gradient-to-t from-purple-900 to-purple-600 rounded-t-2xl relative group flex items-end justify-center pb-4 transition-all hover:h-full h-[20%]">
                            <span className="absolute -top-8 text-white font-bold">5,000</span>
                            <span className="text-xs text-purple-200 font-bold uppercase">You</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Monthly Table - Premium UI */}
            <div className="mb-32">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                        Monthly <span className="text-white">Mining Commission</span>
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
                </div>

                <div className="bg-[#121218] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 relative">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-white/5 text-white font-bold text-xs uppercase tracking-wider border-b border-white/10">
                                <tr>
                                    <th className="px-8 py-6">Month</th>
                                    <th className="px-8 py-6 text-right text-gray-400">Tokens Mined</th>
                                    <th className="px-8 py-6 text-right text-blue-400">Your Commission (20%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[...Array(12)].map((_, i) => {
                                    const month = i + 1;
                                    const monthlyAmount = 416.63;
                                    return (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-5 font-bold text-white">Month {month}</td>
                                            <td className="px-8 py-5 text-right font-mono text-gray-500">2083.33</td>
                                            <td className="px-8 py-5 text-right font-bold font-mono text-blue-400">{monthlyAmount}</td>
                                        </tr>
                                    )
                                })}
                                <tr className="bg-blue-600/20 text-white">
                                    <td className="px-8 py-6 font-bold text-lg text-blue-200">Total (12 Months)</td>
                                    <td className="px-8 py-6 text-right font-bold text-blue-200 opacity-80">25,000.00</td>
                                    <td className="px-8 py-6 text-right font-bold text-2xl font-mono text-blue-400 shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]">5,000.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 5. Holding Bonus - Glass Card */}
            <div className="mb-32">
                <div className="bg-[#121218] p-12 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] -z-10" />

                    <div className="text-center mb-12">
                        <h3 className="text-4xl font-bold text-amber-400 mb-4">20% Holding Bonus</h3>
                        <p className="text-gray-400 font-medium">For Unsold Tokens (Months 13-16)</p>
                    </div>

                    <div className="bg-amber-500/10 p-6 rounded-2xl border border-amber-500/20 text-center mb-12 text-amber-200 font-bold flex items-center justify-center gap-3">
                        <Gift className="w-5 h-5" />
                        Example: 5,000 unsold tokens = 1,000 bonus tokens
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a0f]">
                        <table className="w-full text-gray-300">
                            <thead className="bg-white/5 text-xs font-bold uppercase tracking-wider text-purple-400">
                                <tr>
                                    <th className="px-8 py-5 text-left">Period</th>
                                    <th className="px-8 py-5 text-right">Tokens Earned</th>
                                    <th className="px-8 py-5 text-right">Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {[13, 14, 15, 16].map((m) => (
                                    <tr key={m}>
                                        <td className="px-8 py-5 font-bold text-white">Month {m}</td>
                                        <td className="px-8 py-5 text-right font-mono text-gray-400">250</td>
                                        <td className="px-8 py-5 text-right font-mono text-purple-400 bg-purple-500/10 rounded-l-lg">5%</td>
                                    </tr>
                                ))}
                                <tr className="bg-white/5 text-white font-bold">
                                    <td className="px-8 py-5">Grand Total</td>
                                    <td className="px-8 py-5 text-right text-purple-300">1,000</td>
                                    <td className="px-8 py-5 text-right text-amber-400">20%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    </section>
)

const CommunityRewards = () => (
    <section className="py-32 bg-[#050505] text-white relative">
        <div className="container mx-auto px-6">
            {/* Shopping Points */}
            <div className="mb-32 text-center">
                <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8 border border-blue-500/20">
                    Community Rewards
                </div>
                <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
                    Shopping Points <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Spend While You Earn</span>
                </h2>
                <p className="text-gray-400 font-medium text-lg max-w-2xl mx-auto mb-20">
                    We are building a shopping community where everyone grows together. Unlock exclusive benefits as you participate.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "Earn Automatically", text: "Every month, get free Shopping Points equal to your mining commission.", icon: ShoppingCart, bg: "bg-blue-500/10", color: "text-blue-500" },
                        { title: "3-Month Validity", text: "Points are valid for 3 months. Use them before they lapse.", icon: Clock, bg: "bg-purple-500/10", color: "text-purple-500" },
                        { title: "Exclusive Access", text: "Redeem with authorized vendors only. Not cashable/transferable.", icon: Lock, bg: "bg-emerald-500/10", color: "text-emerald-500" }
                    ].map((item, i) => (
                        <div key={i} className="bg-[#121218] p-10 rounded-[2.5rem] shadow-xl border border-white/5 hover:-translate-y-2 transition-transform duration-300 text-left group">
                            <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                                <item.icon className={`w-8 h-8 ${item.color}`} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-lg">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Shopping Bonanza - Dark Card */}
            <div className="bg-[#121218] rounded-[3rem] p-12 md:p-20 text-center max-w-6xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

                <h2 className="text-3xl md:text-5xl font-bold text-white mb-16 relative z-10">Shopping Bonanza Income <span className="text-gray-500 text-2xl block mt-2">(Illustration)</span></h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 relative z-10 ">
                    <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
                        <p className="text-gray-400 text-sm mb-3 uppercase tracking-wider font-bold">Daily Global Sales</p>
                        <h3 className="text-4xl font-bold text-white">₹1 Crore</h3>
                    </div>
                    <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
                        <p className="text-gray-400 text-sm mb-3 uppercase tracking-wider font-bold">Company Profit (10%)</p>
                        <h3 className="text-4xl font-bold text-blue-400">₹10 Lakh</h3>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-3xl shadow-[0_10px_40px_rgba(79,70,229,0.4)] transform md:scale-110">
                        <p className="text-blue-100 text-sm mb-3 uppercase tracking-wider font-bold">Achievers Share (35%)</p>
                        <h3 className="text-5xl font-bold text-white">₹3.5 Lakh</h3>
                    </div>
                </div>

                <div className="relative z-10 bg-white/5 rounded-2xl p-6 inline-block border border-white/10">
                    <p className="text-gray-300 text-lg">
                        ~ <span className="font-bold text-white">₹3,500/month</span> per achiever (estimate)
                    </p>
                </div>
            </div>
        </div>
    </section>
)

const TimelineSection = () => (
    <section className="py-32 bg-[#08080c] text-white overflow-hidden">
        <div className="container mx-auto px-6">
            <div className="text-center mb-24">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Your Journey <span className="text-blue-600">Timeline</span></h2>
                <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto space-y-16 relative mb-32 group">
                {/* Vertical Line */}
                <div className="absolute left-[35px] top-6 bottom-6 w-1 bg-gray-800 md:left-1/2 md:-ml-0.5" />

                {[
                    { id: 1, title: "Purchase & Start", desc: "Purchase Milkish product packages. Your 12-month lock-in begins.", color: "bg-blue-600" },
                    { id: 2, title: "Mine & Earn (M 1-12)", desc: "Log in every 15 days. Withdraw 20% reward monthly.", color: "bg-purple-600" },
                    { id: 3, title: "Withdraw (M 13-17)", desc: "Sell back to company or hold for bonuses at current rates.", color: "bg-teal-500" },
                    { id: 4, title: "Completion", desc: "Unsold tokens lapse. Restart cycle with new purchase.", color: "bg-slate-700" }
                ].map((step, i) => (
                    <div key={i} className={`flex flex-col md:flex-row gap-10 items-center relative ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse text-right'}`}>
                        <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center font-bold text-white text-2xl shrink-0 z-10 shadow-[0_0_0_8px_white] hover:scale-110 transition-transform duration-300`}>
                            {step.id}
                        </div>
                        <div className={`flex-1 ${i % 2 !== 0 ? 'md:text-right text-left' : 'text-left'}`}>
                            <div className="bg-[#121218] p-8 rounded-3xl shadow-lg border border-white/5 hover:shadow-2xl transition-all duration-300">
                                <h4 className="text-2xl font-bold text-white mb-2">{step.title}</h4>
                                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                        {/* Empty Spacer */}
                        <div className="flex-1 hidden md:block" />
                    </div>
                ))}
            </div>

            {/* Get Started Steps */}
            <div className="bg-[#121218] rounded-[3rem] p-16 md:p-24 text-center">
                <h3 className="text-3xl font-bold text-white mb-16">Get Started in 3 Simple Steps</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[
                        { id: "01", title: "Talk to Partner", desc: "Contact an authorized distributor." },
                        { id: "02", title: "Choose Product", desc: "Select your Milkish feed package." },
                        { id: "03", title: "App & Mine", desc: "Install app, activate mining, and shop." }
                    ].map((step, i) => (
                        <div key={i} className="group cursor-pointer">
                            <div className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center text-3xl font-bold text-gray-600 mb-8 mx-auto group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300">
                                {step.id}
                            </div>
                            <h5 className="text-2xl font-bold text-white mb-2">{step.title}</h5>
                            <p className="text-gray-500">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
)

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(0);
    return (
        <section className="py-32 bg-[#050505]">
            <div className="container mx-auto px-6 max-w-3xl">
                <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center text-white">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0f] hover:border-white/20 transition-colors">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                                className="w-full flex items-center justify-between p-6 text-left"
                            >
                                <span className={`font-bold text-lg ${openIndex === i ? 'text-blue-400' : 'text-white'} transition-colors`}>{faq.q}</span>
                                {openIndex === i ? <ChevronUp className="text-blue-400" /> : <ChevronDown className="text-gray-500" />}
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: "auto" }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

const Footer = () => (
    <footer className="bg-[#050505] text-white pt-24 border-t border-white/5">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                {/* Brand */}
                <div className="space-y-6">
                    <h2 className="text-4xl font-bold text-white">Shagun</h2>
                    <p className="text-gray-400 leading-relaxed text-lg">
                        Smart Shopping. Smart Farming.<br />Smart Future.
                    </p>
                    <button className="w-full px-6 py-4 rounded-xl bg-[#25D366] text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                        <MessageCircle className="w-6 h-6" />
                        Chat on WhatsApp
                    </button>
                </div>

                {/* Links */}
                <div>
                    <h4 className="font-bold text-lg mb-8 uppercase tracking-wider text-amber-500">Quick Links</h4>
                    <ul className="space-y-4 text-gray-400 font-medium">
                        <li><a href="#" className="hover:text-blue-500 transition-colors block hover:pl-2">About Us</a></li>
                        <li><a href="#" className="hover:text-blue-500 transition-colors block hover:pl-2">Milkish Feed</a></li>
                        <li><a href="#" className="hover:text-blue-500 transition-colors block hover:pl-2">Token & Mining</a></li>
                        <li><a href="#" className="hover:text-blue-500 transition-colors block hover:pl-2">Rewards Policy</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-8 uppercase tracking-wider text-amber-500">Legal</h4>
                    <ul className="space-y-4 text-gray-400 font-medium">
                        <li><a href="#" className="hover:text-blue-500 transition-colors block hover:pl-2">Terms of Service</a></li>
                        <li><a href="#" className="hover:text-blue-500 transition-colors block hover:pl-2">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-blue-500 transition-colors block hover:pl-2">Disclaimer</a></li>
                    </ul>
                </div>

                {/* Trust Note */}
                <div>
                    <h4 className="font-bold text-lg mb-8 uppercase tracking-wider text-amber-500">Important Note</h4>
                    <div className="bg-[#121218] p-8 rounded-3xl border border-amber-500/20 text-sm leading-relaxed text-gray-400">
                        <AlertCircle className="w-6 h-6 text-amber-500 mb-3" />
                        Tokens are <span className="font-bold text-white">free rewards</span> linked to genuine product purchases. This is not an investment scheme.
                    </div>
                </div>
            </div>

            <div className="border-t border-white/5 py-10 text-center text-gray-500 font-medium bg-[#121218] rounded-t-[3rem] mx-4">
                <p>&copy; {new Date().getFullYear()} Shagun Ecosystem. All rights reserved.</p>
            </div>
        </div>
    </footer>
)

// Product Card Component with Purchase Logic
const ProductCard = ({ product, i }) => {
    const [isBuying, setIsBuying] = useState(false);

    const handleBuy = async () => {
        const user = localStorage.getItem('user');
        if (!user) {
            toast.error("Please login to purchase");
            return;
        }

        setIsBuying(true);
        try {
            await client.post('/api/products', {
                amount: product.price,
                product: product.name,
                packag_type: product.pkgType || "Standard",
                quantity: 1
            });
            toast.success("Purchase Successful!");
        } catch (error) {
            console.error("Purchase Error", error);
            toast.error(error.response?.data?.message || "Purchase Failed");
        } finally {
            setIsBuying(false);
        }
    };

    return (
        <div className={`bg-[#0a0a0f] p-3 rounded-3xl shadow-2xl border border-white/10 relative group hover:-translate-y-4 transition-transform duration-500 ${i === 1 ? 'mt-12' : ''}`}>
            <div className="bg-gradient-to-b from-gray-800/50 to-black rounded-2xl p-6 h-[22rem] flex flex-col relative overflow-hidden">
                <div className="flex-1 flex items-center justify-center mb-4 relative z-10 group-hover:scale-110 transition-transform duration-500">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center ${i === 0 ? 'bg-amber-500/20' : 'bg-purple-500/20'} blur-2xl absolute`} />
                    {i === 0 ? <Leaf className="w-20 h-20 text-amber-500" /> : <ShieldCheck className="w-20 h-20 text-purple-500" />}
                </div>

                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">{product.name}</h3>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Premium Series</p>
                    <div className="flex justify-between items-end border-t border-white/10 pt-4">
                        <span className="text-xl font-bold text-white">₹{product.price.toLocaleString()}</span>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={handleBuy}
                                disabled={isBuying}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-full transition-colors"
                            >
                                {isBuying ? "..." : "BUY"}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            </div>
        </div>
    );
};

export default function Products() {
    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
            <Navbar />
            <HeroSection />
            <PromisesSection />
            <ProductSpotlight />
            <TokenWorkflow />
            <TokenEconomics />
            <CommunityRewards />
            <TimelineSection />
            <FAQ />
            <Footer />
        </div>
    )
}
