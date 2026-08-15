"use client";

import React from "react";
import { FaFileExcel, FaFileCsv, FaPrint } from "react-icons/fa";

const ExportButtons = ({ onExportExcel, onExportCsv, onPrint, isLoading = false }) => {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        type="button"
        onClick={onExportExcel}
        disabled={isLoading}
        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl flex items-center gap-2 shadow-sm active:scale-95 transition-all text-xs font-bold cursor-pointer"
        title="Export all filtered data to Excel"
      >
        <FaFileExcel className="text-sm shrink-0" />
        <span>Excel</span>
      </button>

      <button
        type="button"
        onClick={onExportCsv}
        disabled={isLoading}
        className="px-3.5 py-2 bg-brand-gold hover:bg-brand-gold-light text-brand-midnight disabled:opacity-50 rounded-2xl flex items-center gap-2 shadow-sm active:scale-95 transition-all text-xs font-bold cursor-pointer"
        title="Export all filtered data to CSV"
      >
        <FaFileCsv className="text-sm shrink-0 text-brand-midnight" />
        <span>CSV</span>
      </button>

      <button
        type="button"
        onClick={onPrint}
        disabled={isLoading}
        className="px-3.5 py-2 bg-brand-red hover:bg-brand-red-dark disabled:opacity-50 text-white rounded-2xl flex items-center gap-2 shadow-sm active:scale-95 transition-all text-xs font-bold cursor-pointer"
        title="Print or Save as PDF"
      >
        <FaPrint className="text-sm shrink-0" />
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>Print / PDF</span>
        )}
      </button>
    </div>
  );
};

export default ExportButtons;
