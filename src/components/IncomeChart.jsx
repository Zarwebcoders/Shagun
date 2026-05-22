export default function IncomeChart({ data }) {
    const maxValue = Math.max(...data.map((d) => d.income))

    return (
        <div className="bg-gradient-to-br from-[#040408] to-[#1f1f1f] p-8 rounded-lg border border-teal-500/30">
            <div className="flex items-end justify-around h-80 gap-4">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                        <div className="relative w-full h-64 flex items-end justify-center mb-2">
                            <div
                                className="w-full bg-gradient-to-t from-teal-500 to-purple-500 rounded-t-lg transition-all hover:shadow-lg hover:shadow-teal-500/50 group relative"
                                style={{ height: `${(item.income / maxValue) * 100}%` }}
                            >
                                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    ${item.income}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-[#b0b0b0] font-semibold">{item.date}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
