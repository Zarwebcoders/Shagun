import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalResults,
    itemsPerPage = 10,
    itemName = "results"
}) => {
    // Helper to generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first, last, and pages around current
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalResults);

    if (totalResults === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
            {/* Left Side: Showing X to Y of Z results */}
            <div className="text-gray-400 text-sm">
                Showing <span className="font-bold text-white">{startItem}</span> to <span className="font-bold text-white">{endItem}</span> of <span className="font-bold text-white">{totalResults}</span> {itemName}
            </div>

            {/* Right Side: Pagination Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-white/10 bg-[#0f0f1a] text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <span className="px-2 text-gray-500">...</span>
                            ) : (
                                <button
                                    onClick={() => onPageChange(page)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${currentPage === page
                                        ? 'bg-teal-500 text-white shadow-[0_0_10px_rgba(45,212,191,0.3)]'
                                        : 'border border-white/10 bg-[#0f0f1a] text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-white/10 bg-[#0f0f1a] text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
