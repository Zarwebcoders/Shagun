"use client"
import { useWeb3 } from "../hooks/useWeb3";
import { toast } from "react-hot-toast";

export default function WalletCard({ balance }) {
    const { connectWallet, isConnected, account } = useWeb3();

    const handleCopyAddress = () => {
        if (isConnected && account) {
            navigator.clipboard.writeText(account)
            toast.success("Address copied!")
        }
    }

    return (
        <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-3 rounded-lg border border-teal-500/30">
            <div className="flex items-center justify-between mb-4 md:mb-6 pb-4 md:pb-6 border-b border-teal-500/30">
                <h3 className="text-lg md:text-xl font-bold text-white">Wallet Balance</h3>
                <span className="text-3xl md:text-4xl">💼</span>
            </div>
            <div className="mb-4 md:mb-6">
                <p className="text-[#b0b0b0] text-xs md:text-sm mb-2">Available Balance</p>
                <p className="text-3xl md:text-5xl font-bold text-purle-500">₹{balance.toFixed(2)}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button
                    onClick={isConnected ? () => { } : connectWallet}
                    className={`w-full sm:flex-1 px-4 md:px-6 py-3 ${isConnected ? "bg-green-600/20 border border-green-600/50 text-green-400" : "bg-gradient-brand text-white"} font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 text-sm md:text-base`}
                >
                    {isConnected
                        ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
                        : "Connect Wallet"}
                </button>
                {isConnected && (
                    <button
                        onClick={handleCopyAddress}
                        className="w-full sm:flex-1 px-4 md:px-6 py-3 border-2 border-teal-500 text-teal-400 font-bold rounded-lg hover:bg-teal-500/10 transition-all duration-300 text-sm md:text-base"
                    >
                        Copy Address
                    </button>
                )}
            </div>
        </div>
    )
}