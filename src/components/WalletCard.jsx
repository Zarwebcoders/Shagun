"use client"

export default function WalletCard({ balance }) {
    const handleCopyAddress = () => {
        navigator.clipboard.writeText("0x742d35Cc6634C0532925a3b844Bc0e6cEfd0E13f")
        alert("Address copied!")
    }

    return (
        <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-4 rounded-lg border border-[#444]">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#444]">
                <h3 className="text-xl font-bold text-white">Wallet Balance</h3>
                <span className="text-4xl">💼</span>
            </div>
            <div className="mb-6">
                <p className="text-[#b0b0b0] text-sm mb-2">Available Balance</p>
                <p className="text-5xl font-bold text-[#9131e7]">${balance.toFixed(2)}</p>
            </div>
            <div className="flex gap-4">
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-[#9131e7] to-[#e84495] text-[#040408] font-bold rounded-lg hover:shadow-lg hover:shadow-[#9131e7]/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0">
                    Connect Wallet
                </button>
                <button
                    onClick={handleCopyAddress}
                    className="flex-1 px-6 py-3 border-2 border-[#9131e7] text-[#9131e7] font-bold rounded-lg hover:bg-[#9131e7]/10 transition-all duration-300"
                >
                    Copy Address
                </button>
            </div>
        </div>
    )
}
