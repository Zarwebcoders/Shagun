import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { BuildingLibraryIcon, CreditCardIcon, UserIcon, MapPinIcon, IdentificationIcon } from '@heroicons/react/24/outline';

export default function BankDetails() {
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState(null);
    const [formData, setFormData] = useState({
        back_name: '',
        acc_name: '',
        branch: '',
        back_code: '',
        acc_num: ''
    });

    useEffect(() => {
        fetchDetails();
    }, []);

    const fetchDetails = async () => {
        try {
            const { data } = await client.get('/my-account');
            if (data) {
                setAccount(data);
                setFormData({
                    back_name: data.back_name,
                    acc_name: data.acc_name,
                    branch: data.branch,
                    back_code: data.back_code,
                    acc_num: data.acc_num
                });
            }
            setLoading(false);
        } catch (error) {
            // Ignore 404
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await client.post('/my-account', formData);
            setAccount(data);
            toast.success("Bank details submitted successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save bank details");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full max-w-4xl mx-auto space-y-8"
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                    <BuildingLibraryIcon className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Bank Details</h1>
                    <p className="text-gray-400">Manage your bank account for payouts</p>
                </div>
            </div>

            <div className="bg-[#1a1a2e]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
                {account && (
                    <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Current Status</p>
                            <span className={`text-sm font-bold ${account.approve === 1 ? 'text-green-400' :
                                    account.approve === 0 ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                {account.approve === 1 ? 'APPROVED' : account.approve === 0 ? 'REJECTED' : 'PENDING APPROVAL'}
                            </span>
                        </div>
                        {account.approve === 1 && (
                            <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full font-bold">
                                VERIFIED
                            </span>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bank Name (back_name) */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 font-medium ml-1">Bank Name</label>
                            <div className="relative group">
                                <BuildingLibraryIcon className="w-5 h-5 absolute left-3 top-3.5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    name="back_name"
                                    value={formData.back_name}
                                    onChange={handleChange}
                                    className="w-full bg-[#0f0f1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="e.g. State Bank of India"
                                    required
                                />
                            </div>
                        </div>

                        {/* Account Name (acc_name) */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 font-medium ml-1">Account Holder Name</label>
                            <div className="relative group">
                                <UserIcon className="w-5 h-5 absolute left-3 top-3.5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    name="acc_name"
                                    value={formData.acc_name}
                                    onChange={handleChange}
                                    className="w-full bg-[#0f0f1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="Name as per bank records"
                                    required
                                />
                            </div>
                        </div>

                        {/* Account Number (acc_num) */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 font-medium ml-1">Account Number</label>
                            <div className="relative group">
                                <CreditCardIcon className="w-5 h-5 absolute left-3 top-3.5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    name="acc_num"
                                    value={formData.acc_num}
                                    onChange={handleChange}
                                    className="w-full bg-[#0f0f1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="XXXXXXXXXXXXXXXX"
                                    required
                                />
                            </div>
                        </div>

                        {/* Bank Code / IFSC (back_code) */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 font-medium ml-1">IFSC / Set Code</label>
                            <div className="relative group">
                                <IdentificationIcon className="w-5 h-5 absolute left-3 top-3.5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    name="back_code"
                                    value={formData.back_code}
                                    onChange={handleChange}
                                    className="w-full bg-[#0f0f1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="e.g. SBIN0001234"
                                    required
                                />
                            </div>
                        </div>

                        {/* Branch */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm text-gray-400 font-medium ml-1">Branch Name</label>
                            <div className="relative group">
                                <MapPinIcon className="w-5 h-5 absolute left-3 top-3.5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    className="w-full bg-[#0f0f1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="e.g. Main Branch, New Delhi"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-1 active:scale-95"
                        >
                            {account ? "Update Bank Details" : "Save Bank Details"}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
