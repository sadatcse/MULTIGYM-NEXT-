"use client";

import React from "react";
import { FaFileExcel, FaFileCsv, FaPrint, FaCopy } from "react-icons/fa";

const ExportButtons = ({ onCopy, onExportExcel, onExportCsv, onPrint, isLoading = false }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onCopy && (
        <button
          onClick={onCopy}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-sm active:scale-95 transition-all cursor-pointer"
          title="Copy formatted table data to clipboard"
        >
          <FaCopy className="text-xs shrink-0" />
          <span>Copy</span>
        </button>
      )}

      {onExportExcel && (
        <button
          onClick={onExportExcel}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-sm active:scale-95 transition-all cursor-pointer"
          title="Export all filtered data to Excel (.xlsx)"
        >
          <FaFileExcel className="text-xs shrink-0" />
          <span>Excel</span>
        </button>
      )}

      {onExportCsv && (
        <button
          onClick={onExportCsv}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-sm active:scale-95 transition-all cursor-pointer"
          title="Export all filtered data to CSV (.csv)"
        >
          <FaFileCsv className="text-xs shrink-0" />
          <span>CSV</span>
        </button>
      )}

      {onPrint && (
        <button
          onClick={onPrint}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-red-dark disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 active:scale-95 transition-all cursor-pointer"
          title="Print or Save as A4 PDF"
        >
          <FaPrint className="text-xs shrink-0" />
          <span>Print / PDF</span>
        </button>
      )}
    </div>
  );
};

export default ExportButtons;
