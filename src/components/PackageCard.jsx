export default function PackageCard({ package: pkg }) {
    return (
        <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-6 rounded-lg border border-[#444] hover:border-[#9131e7] transition-all hover:shadow-lg hover:shadow-[#9131e7]/20">
            <div className="mb-4 pb-4 border-b border-[#444]">
                <h3 className="text-2xl font-bold text-white">{pkg.name}</h3>
            </div>
            
            <div className="mb-4 p-3 bg-[#9131e7]/10 rounded-lg border border-[#9131e7]/30">
                <p className="text-[#9131e7] font-bold">{pkg.daily_return}% Daily Return</p>
            </div>
            
            {/* Package Details - Added the product and token value text */}
            <div className="mb-4 p-3 bg-[#1a1a2e]/50 rounded-lg border border-[#444]">
                <p className="text-white text-sm leading-relaxed">
                    {pkg.productValue}
                </p>
            </div>
            
            {/* Connect Wallet Button */}
            <button className="w-full px-6 py-3 bg-gradient-to-r from-[#9131e7] to-[#e84495] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#9131e7]/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0">
                Connect Wallet
            </button>
        </div>
    )
}