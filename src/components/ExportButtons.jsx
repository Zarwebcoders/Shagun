import React from "react";

export default function ExportButtons({ onExport }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onExport("csv")}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-teal-300 border border-teal-500/30 bg-teal-500/10 rounded-xl hover:bg-teal-500/20 transition-all duration-200"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        CSV
      </button>
      <button
        onClick={() => onExport("excel")}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-300 border border-green-500/30 bg-green-500/10 rounded-xl hover:bg-green-500/20 transition-all duration-200"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel
      </button>
    </div>
  );
}
