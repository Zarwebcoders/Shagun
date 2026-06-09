import React from "react";

export default function DateRangePicker({ startDate, endDate, setStartDate, setEndDate }) {
  const hasFilter = startDate || endDate;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 bg-[#0f0f1a] border border-[#333] rounded-xl px-3 py-2 hover:border-teal-500/50 transition-colors">
        <svg className="w-4 h-4 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs text-gray-500 shrink-0">From</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-transparent text-white text-sm outline-none w-[130px] cursor-pointer [color-scheme:dark]"
        />
      </div>

      <div className="flex items-center gap-2 bg-[#0f0f1a] border border-[#333] rounded-xl px-3 py-2 hover:border-teal-500/50 transition-colors">
        <svg className="w-4 h-4 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs text-gray-500 shrink-0">To</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-transparent text-white text-sm outline-none w-[130px] cursor-pointer [color-scheme:dark]"
        />
      </div>

      {hasFilter && (
        <button
          onClick={() => { setStartDate(""); setEndDate(""); }}
          className="flex items-center gap-1 px-3 py-2 text-xs text-red-400 border border-red-500/30 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}
