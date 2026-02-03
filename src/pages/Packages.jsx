"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"
import client from "../api/client"
import { useWeb3 } from "../hooks/useWeb3"
import {
    CloudArrowUpIcon,
    DocumentTextIcon,
    CurrencyRupeeIcon,
    CreditCardIcon,
    UserIcon,
    BanknotesIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import Pagination from "../components/common/Pagination"; // Import Pagination


export default function Packages() {
    const [packages, setPackages] = useState([])
    const [investments, setInvestments] = useState([])
    const [loading, setLoading] = useState(true)
    const [userSponsorId, setUserSponsorId] = useState("")
    const { connectWallet, isConnected, account } = useWeb3()

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0); // Add totalResults state
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [formData, setFormData] = useState({
        amount: "11000",
        transactionId: "",
        paymentSlip: null,
        product: "Milkish Herbal Animal Feed", // Default product
        quantity: 1 // Default quantity
    });

    const PRODUCTS = [
        {
            id: "milkish",
            name: "Milkish Herbal Animal Feed",
            image: "/products/milkish-feed.jpg",
            minAmount: 11000,
            description: "Natural herbal supplement for dairy animals"
        },
        {
            id: "petro",
            name: "Petro",
            image: "/products/petro.jpg",
            minAmount: 12500,
            description: "High-quality petroleum products"
        },
        {
            id: "smarthome",
            name: "Smart Home Automation",
            image: "/products/smart-home.jpg",
            minAmount: 20000,
            description: "Next-gen touch panels and control systems"
        },
        {
            id: "shagunev",
            name: "Shagun EV",
            image: "/products/shagun-ev.jpg",
            minAmount: 85000,
            description: "Eco-friendly electric scooters"
        }
    ];

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on search change
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Investments (Purchase History)
    useEffect(() => {
        const fetchInvestments = async () => {
            try {
                const { data } = await client.get('/products', {
                    params: {
                        page,
                        search: debouncedSearch,
                        limit: 10
                    }
                });
                setInvestments(data.products || []);
                setTotalPages(data.pages || 1);
                setTotalResults(data.total || 0); // Capture total
            } catch (error) {
                console.error("Error fetching investments:", error);
            }
        };
        fetchInvestments();
    }, [page, debouncedSearch]);

    // Initial Data Load (Packages & User)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [packagesRes, userRes] = await Promise.all([
                    client.get('/packages'),
                    client.get('/auth/me')
                ]);
                setPackages(packagesRes.data);

                // Set sponsor ID from user data
                if (userRes.data) {
                    if (userRes.data.sponsor_id) {
                        const sponsor = userRes.data.sponsor_id;
                        setUserSponsorId(sponsor.referral_id || sponsor._id || sponsor);
                    } else if (userRes.data.sponsorId) {
                        setUserSponsorId(userRes.data.sponsorId);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // handle input
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData({
            ...formData,
            [name]: files ? files[0] : value
        });
    };

    // Convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // submit form
    const handleSubmit = async () => {
        try {
            if (!formData.amount) {
                toast.error("Please enter amount");
                return;
            }

            if (!formData.quantity || formData.quantity < 1) {
                toast.error("Please select at least 1 quantity");
                return;
            }

            const selectedProduct = PRODUCTS.find(p => p.name === formData.product);
            const minAmt = selectedProduct ? selectedProduct.minAmount : 500;

            if (formData.amount < minAmt) {
                toast.error(`Minimum amount for ${formData.product} is ₹${minAmt}`);
                return;
            }

            let paymentSlipBase64 = "";
            if (formData.paymentSlip) {
                paymentSlipBase64 = await fileToBase64(formData.paymentSlip);
            }

            await client.post('/products', {
                amount: formData.amount,
                transactionId: formData.transactionId || `TXN${Date.now()}`,
                sponsorId: userSponsorId,
                paymentSlip: paymentSlipBase64,
                product: formData.product,
                quantity: formData.quantity,
                walletAddress: account || "" // Connect with contract/wallet
            });

            toast.success("Product purchased successfully!");

            toast.success("Product purchased successfully!");

            // Refresh products
            // const { data } = await client.get('/products');
            // setInvestments(data);
            // Trigger re-fetch via dependency update if logic allows, or manually call fetch
            // For now, let's just reset page to 1 to trigger refresh
            setPage(1);

            // Reset form
            setFormData({
                amount: "11000",
                transactionId: "",
                paymentSlip: null,
                product: PRODUCTS[0].name,
                quantity: 1
            });

        } catch (error) {
            console.error("Error creating product:", error);
            toast.error(error.response?.data?.message || "Failed to submit product");
        }
    };

    const handleConnect = async () => {
        try {
            console.log("Connect Wallet clicked");
            console.log("window.ethereum exists:", !!window.ethereum);

            // Check if MetaMask is installed
            if (!window.ethereum) {
                toast.error("MetaMask is not detected. Please install MetaMask extension!");
                return;
            }

            const loadingToast = toast.loading("Connecting to MetaMask...");

            console.log("Calling connectWallet()...");
            await connectWallet();

            console.log("Connected! Account:", account);
            toast.dismiss(loadingToast);
            toast.success("Wallet connected successfully! ✅");

        } catch (error) {
            console.error("Error connecting wallet:", error);

            if (error.code === 4001) {
                toast.error("Connection rejected. Please approve in MetaMask.");
            } else if (error.code === -32002) {
                toast.error("Connection request pending. Please check MetaMask.");
            } else {
                toast.error(error?.message || "Failed to connect. Please try again.");
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full space-y-8 max-w-[1600px] mx-auto"
        >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="space-y-4 relative">
                <div className="absolute -top-10 -left-10 w-64 h-64 bg-teal-500/20 rounded-full blur-[100px] -z-10"></div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
                    Product <span className="bg-gradient-brand bg-clip-text text-transparent">Purchases</span>
                </h2>
                <p className="text-[#b0b0b0] text-lg max-w-2xl">
                    Secure your future with our strategic product packages. Start earning daily rewards and exclusive bonuses.
                </p>
            </motion.div>

            {/* Investment Form Section */}
            <motion.div variants={itemVariants} className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-3xl border border-teal-500/20 overflow-hidden relative shadow-xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="p-6 md:p-8 border-b border-teal-500/20 flex items-center justify-between bg-white/5">
                    <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <BanknotesIcon className="w-7 h-7 text-teal-400" />
                            New Global Product
                        </h3>
                        <p className="text-gray-400 mt-1">Submit your request to purchase a new product</p>
                    </div>
                    {!isConnected && (
                        <button
                            onClick={handleConnect}
                            className="px-4 sm:px-6 py-2 bg-teal-500/10 border border-teal-500/50 text-teal-300 rounded-xl hover:bg-teal-500 hover:text-white transition-all text-xs sm:text-sm font-bold"
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>

                <div className="p-6 md:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column - Amount & Sponsor */}
                        <div className="space-y-6">

                            {/* Product Selection */}
                            <div>
                                <label className="block text-sm font-bold text-transparent bg-gradient-brand bg-clip-text mb-3 pl-1 text-base">📦 Select Product</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {PRODUCTS.map((prod) => (
                                        <div
                                            key={prod.id}
                                            onClick={() => setFormData({
                                                ...formData,
                                                product: prod.name,
                                                amount: prod.minAmount * formData.quantity
                                            })}
                                            className={`relative rounded-xl border-2 p-3 cursor-pointer transition-all duration-300 group overflow-hidden ${formData.product === prod.name
                                                ? 'border-teal-500 bg-teal-500/10'
                                                : 'border-white/5 bg-[#0f0f1a] hover:border-teal-500/30'
                                                }`}
                                        >
                                            <div className="aspect-video w-full rounded-lg overflow-hidden mb-2 relative">
                                                <img
                                                    src={prod.image}
                                                    alt={prod.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                            </div>
                                            <p className="font-bold text-white text-xs sm:text-sm truncate">{prod.name}</p>

                                            {/* Checkmark for selected */}
                                            {formData.product === prod.name && (
                                                <div className="absolute top-2 right-2 bg-teal-500 rounded-full p-0.5 shadow-lg shadow-teal-500/50">
                                                    <CheckCircleIcon className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity and Total Amount in one row */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                                {/* Quantity Selector */}
                                <div>
                                    <label className="block text-sm font-bold text-transparent bg-gradient-brand bg-clip-text mb-3 pl-1 text-base">🔢 Quantity</label>
                                    <div className="relative group">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newQty = Math.max(1, formData.quantity - 1);
                                                    const selectedProduct = PRODUCTS.find(p => p.name === formData.product);
                                                    setFormData({
                                                        ...formData,
                                                        quantity: newQty,
                                                        amount: selectedProduct ? selectedProduct.minAmount * newQty : formData.amount
                                                    });
                                                }}
                                                className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0f0f1a] border border-white/10 rounded-xl text-white font-bold text-xl hover:bg-teal-500/10 hover:border-teal-500 transition-all active:scale-95 flex-shrink-0"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                name="quantity"
                                                value={formData.quantity}
                                                onChange={(e) => {
                                                    const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                                    const selectedProduct = PRODUCTS.find(p => p.name === formData.product);
                                                    setFormData({
                                                        ...formData,
                                                        quantity: newQty,
                                                        amount: selectedProduct ? selectedProduct.minAmount * newQty : formData.amount
                                                    });
                                                }}
                                                min="1"
                                                className="w-14 sm:w-20 text-center py-3 sm:py-4 bg-[#0f0f1a] border border-white/10 rounded-xl text-white text-base sm:text-lg font-bold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newQty = formData.quantity + 1;
                                                    const selectedProduct = PRODUCTS.find(p => p.name === formData.product);
                                                    setFormData({
                                                        ...formData,
                                                        quantity: newQty,
                                                        amount: selectedProduct ? selectedProduct.minAmount * newQty : formData.amount
                                                    });
                                                }}
                                                className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0f0f1a] border border-white/10 rounded-xl text-white font-bold text-xl hover:bg-teal-500/10 hover:border-teal-500 transition-all active:scale-95 flex-shrink-0"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-xs mt-2 pl-1 hidden sm:block">Select how many units to purchase</p>
                                </div>

                                {/* Total Amount */}
                                <div>
                                    <label className="block text-sm font-bold text-transparent bg-gradient-brand bg-clip-text mb-3 pl-1 text-base">💰 Total Amount</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <CurrencyRupeeIcon className="h-5 w-5 text-teal-400" />
                                        </div>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={formData.amount}
                                            readOnly
                                            className="w-full pl-11 pr-4 py-4 bg-gradient-to-r from-teal-500/10 to-purple-500/10 border border-teal-500/30 rounded-xl text-white text-xl font-bold placeholder-gray-600 focus:outline-none cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-teal-400 text-xs mt-2 pl-1 font-medium">
                                        ₹{PRODUCTS.find(p => p.name === formData.product)?.minAmount || 0} × {formData.quantity} = ₹{formData.amount}
                                    </p>
                                </div>
                            </div>

                            {/* Wallet Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 pl-1">Wallet Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="walletAddress"
                                        value={account || ""}
                                        readOnly
                                        placeholder="Connect wallet to see address"
                                        className="w-full pl-11 pr-4 py-4 bg-[#0f0f1a] border border-white/10 rounded-xl text-gray-400 placeholder-gray-600 focus:outline-none cursor-not-allowed"
                                    />
                                    {account && (
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                            <span className="text-xs font-bold text-green-500/80 bg-green-500/10 px-2 py-1 rounded">Connected</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 pl-1">Sponsor ID</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        value={userSponsorId}
                                        readOnly
                                        className="w-full pl-11 pr-4 py-4 bg-[#0f0f1a]/50 border border-white/5 rounded-xl text-gray-400 cursor-not-allowed"
                                        placeholder={loading ? "Loading..." : "No Sponsor"}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                        <span className="text-xs font-bold text-green-500/80 bg-green-500/10 px-2 py-1 rounded">Verified</span>
                                    </div>
                                </div>
                            </div> */}
                        </div>

                        {/* Right Column - Transaction & Proof */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 pl-1">Transaction ID</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <CreditCardIcon className="h-5 w-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="transactionId"
                                        value={formData.transactionId}
                                        onChange={handleChange}
                                        placeholder="UTR / Transaction Ref No."
                                        className="w-full pl-11 pr-4 py-4 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 pl-1">Payment Proof</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="paymentSlip"
                                        name="paymentSlip"
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="paymentSlip"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-teal-500/30 rounded-xl cursor-pointer hover:bg-teal-500/5 hover:border-teal-500/60 transition-all group bg-[#0f0f1a]"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <CloudArrowUpIcon className="w-8 h-8 text-gray-500 group-hover:text-teal-400 transition-colors mb-2" />
                                            <p className="text-sm text-gray-400"><span className="font-semibold text-teal-400">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formData.paymentSlip ? formData.paymentSlip.name : "SVG, PNG, JPG (MAX. 2MB)"}
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-gray-400 text-sm">
                            <span className="text-purple-500 font-bold">*</span> Processing time: Up to 24 hours
                        </p>
                        <button
                            onClick={handleSubmit}
                            className="w-full sm:w-auto px-12 py-4 bg-gradient-brand text-white font-bold rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-lg"
                        >
                            BUY NOW
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* History Section */}
            <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white">Purchase History</h3>
                        <p className="text-gray-400 text-sm">Track your past purchases</p>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a2e] border border-teal-500/30 text-white rounded-xl hover:bg-teal-500/10 transition-colors">
                        <ArrowDownTrayIcon className="w-5 h-5 text-teal-400" />
                        Export CSV
                    </button>
                </div>

                <div className="bg-[#1a1a2e]/40 backdrop-blur-md rounded-2xl border border-teal-500/20 overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-white/10">
                        <input
                            type="text"
                            placeholder="Search by Transaction ID, Product Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full max-w-md px-4 py-2 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors"
                        />
                    </div>

                    {investments.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-white/10">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Token</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {investments.map((item) => (
                                            <tr key={item._id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {new Date(item.cereate_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                                    {item.packag_type || "Standard"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold">₹{item.amount}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-teal-400">
                                                    {item.token_amount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-xs text-gray-400 font-mono py-1 px-2 rounded bg-black/30 border border-white/5">
                                                        {item.transcation_id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.approve === 1
                                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                        : item.approve === 2 // Assuming 2 is rejected
                                                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                        }`}>
                                                        {item.approve === 1 ? 'APPROVED' : item.approve === 2 ? 'REJECTED' : 'PENDING'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button className="text-teal-400 hover:text-white hover:underline text-sm font-medium flex items-center justify-end gap-1 w-full">
                                                        <DocumentTextIcon className="w-4 h-4" />
                                                        Invoice
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                    totalResults={totalResults} // Pass actual total
                                    itemsPerPage={10}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mb-6">
                                <BanknotesIcon className="w-10 h-10 text-teal-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Investments Found</h3>
                            <p className="text-gray-400 max-w-sm mx-auto mb-6">
                                {searchTerm ? "No results match your search." : "Start your journey by making your first investment above."}
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}