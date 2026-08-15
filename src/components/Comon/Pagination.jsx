"use client";

import React, { useState } from 'react';
import {
  HiChevronLeft,
  HiChevronRight,
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiArrowLeft,
  HiArrowRight,
  HiCheck
} from 'react-icons/hi2';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  itemsPerPage = 10,
  onPageChange = () => {},
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50],
  variant = 'classic', // classic | pills | dots | bordered | track | compact | progress | steps
  showSummary = true,
  showVariantPicker = false,
  className = "",
}) => {
  const [activeVariant, setActiveVariant] = useState(variant);

  const current = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startItem = totalItems ? (current - 1) * itemsPerPage + 1 : 0;
  const endItem = totalItems ? Math.min(current * itemsPerPage, totalItems) : current * itemsPerPage;

  const getPageNumbers = (curr, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (curr <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (curr >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', curr - 1, curr, curr + 1, '...', total];
  };

  const pageNumbers = getPageNumbers(current, totalPages);

  const handlePrev = () => {
    if (current > 1) onPageChange(current - 1);
  };

  const handleNext = () => {
    if (current < totalPages) onPageChange(current + 1);
  };

  // Renderers for Pagination Styles
  const renderPagination = () => {
    switch (activeVariant) {
      /* ════ 1. CLASSIC ════ */
      case 'classic':
        return (
          <nav aria-label="Classic Pagination" className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={current === 1}
              className="p-2 text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer hover:bg-brand-beige/30 dark:hover:bg-brand-dark-grey"
              aria-label="Previous Page"
            >
              <HiChevronLeft className="w-4 h-4" />
            </button>

            {pageNumbers.map((num, idx) => (
              <React.Fragment key={idx}>
                {num === '...' ? (
                  <span className="px-2 py-1 text-brand-dark-grey dark:text-brand-gold-light text-xs font-semibold select-none">...</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onPageChange(num)}
                    className={`min-w-[34px] h-[34px] px-2 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer ${
                      current === num
                        ? 'bg-gradient-to-r from-brand-red to-brand-gold text-white shadow-md shadow-brand-red/20 scale-105'
                        : 'bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white hover:bg-brand-gold/10 border border-brand-beige/60 dark:border-brand-dark-grey/60'
                    }`}
                  >
                    {num}
                  </button>
                )}
              </React.Fragment>
            ))}

            <button
              type="button"
              onClick={handleNext}
              disabled={current === totalPages}
              className="p-2 text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer hover:bg-brand-beige/30 dark:hover:bg-brand-dark-grey"
              aria-label="Next Page"
            >
              <HiChevronRight className="w-4 h-4" />
            </button>
          </nav>
        );

      /* ════ 2. PILLS ════ */
      case 'pills':
        return (
          <nav aria-label="Pills Pagination" className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={current === 1}
              className="px-3 py-1.5 text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light disabled:opacity-30 rounded-full border border-brand-beige/60 dark:border-brand-dark-grey/60 hover:border-brand-red transition-all cursor-pointer"
            >
              Prev
            </button>

            {pageNumbers.map((num, idx) => (
              <React.Fragment key={idx}>
                {num === '...' ? (
                  <span className="px-2 text-brand-dark-grey text-xs select-none">...</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onPageChange(num)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      current === num
                        ? 'bg-brand-red text-white shadow-md shadow-brand-red/25 font-extrabold'
                        : 'bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white hover:bg-brand-gold/10'
                    }`}
                  >
                    {num}
                  </button>
                )}
              </React.Fragment>
            ))}

            <button
              type="button"
              onClick={handleNext}
              disabled={current === totalPages}
              className="px-3 py-1.5 text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light disabled:opacity-30 rounded-full border border-brand-beige/60 dark:border-brand-dark-grey/60 hover:border-brand-red transition-all cursor-pointer"
            >
              Next
            </button>
          </nav>
        );

      /* ════ 3. COMPACT ════ */
      case 'compact':
        return (
          <nav aria-label="Compact Pagination" className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={current === 1}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 text-brand-black dark:text-brand-white disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-brand-black dark:text-brand-white px-2">
              {current} / {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={current === totalPages}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 text-brand-black dark:text-brand-white disabled:opacity-30 cursor-pointer"
            >
              Next
            </button>
          </nav>
        );

      default:
        return (
          <nav aria-label="Default Pagination" className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={current === 1}
              className="p-2 text-brand-dark-grey dark:text-brand-gold-light disabled:opacity-30 rounded-xl hover:bg-brand-beige/30 cursor-pointer"
            >
              <HiChevronLeft className="w-4 h-4" />
            </button>
            {pageNumbers.map((num, idx) => (
              <React.Fragment key={idx}>
                {num === '...' ? (
                  <span className="px-2 text-xs">...</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onPageChange(num)}
                    className={`w-8 h-8 text-xs font-bold rounded-xl ${
                      current === num ? 'bg-brand-red text-white font-black' : 'hover:bg-brand-gold/10'
                    }`}
                  >
                    {num}
                  </button>
                )}
              </React.Fragment>
            ))}
            <button
              type="button"
              onClick={handleNext}
              disabled={current === totalPages}
              className="p-2 text-brand-dark-grey dark:text-brand-gold-light disabled:opacity-30 rounded-xl hover:bg-brand-beige/30 cursor-pointer"
            >
              <HiChevronRight className="w-4 h-4" />
            </button>
          </nav>
        );
    }
  };

  return (
    <div className={`flex flex-col space-y-4 my-4 ${className}`}>
      {/* Optional Style Picker */}
      {showVariantPicker && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-[11px] mb-2">
          <span className="text-brand-dark-grey dark:text-brand-gold-light font-bold px-2">Style:</span>
          {['classic', 'pills', 'compact'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setActiveVariant(v)}
              className={`px-2.5 py-1 rounded-xl capitalize font-bold transition-all cursor-pointer ${
                activeVariant === v
                  ? 'bg-brand-red text-white shadow-sm font-extrabold'
                  : 'text-brand-dark-grey hover:text-brand-black dark:hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Pagination Bar, Items Per Page & Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Side: Summary & Items Per Page Selector */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {showSummary && totalItems ? (
            <div className="text-brand-dark-grey dark:text-brand-gold-light font-bold">
              Showing <span className="font-black text-brand-black dark:text-brand-white">{startItem}</span> to{' '}
              <span className="font-black text-brand-black dark:text-brand-white">{endItem}</span> of{' '}
              <span className="font-black text-brand-red">{totalItems}</span> entries
            </div>
          ) : null}

          {/* Dynamic Items Per Page Dropdown */}
          {onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <span className="text-brand-dark-grey dark:text-brand-gold-light font-extrabold uppercase tracking-wider text-[10px]">
                Show:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 rounded-xl px-2.5 py-1 text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer shadow-xs"
              >
                {itemsPerPageOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} per page
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Page Navigation Controls */}
        {renderPagination()}
      </div>
    </div>
  );
};

export default Pagination;