"use client";

import React, { useState, useEffect } from "react";
import {
  FiClock,
  FiSearch,
  FiFileText,
  FiUser,
  FiCheckCircle,
  FiPrinter,
  FiDownload,
  FiRefreshCw,
  FiTrash2,
  FiEye,
  FiLoader,
} from "react-icons/fi";
import Mtitle from "@/components/Comon/Mtitle";
import Pagination from "@/components/Comon/Pagination";
import useHrLetterApi from "@/hooks/useHrLetterApi";

export default function LetterHistoryPage() {
  const { fetchAuditHistory } = useHrLetterApi();

  const [logs, setLogs] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchAuditHistory(page, 20, search);
      if (res?.success) {
        setLogs(res.items || []);
        setTotalItems(res.pagination?.totalItems || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(currentPage);
  }, [currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadHistory(1);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case "generated":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
            <FiCheckCircle /> Generated
          </span>
        );
      case "reissued":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center gap-1">
            <FiRefreshCw /> Reissued
          </span>
        );
      case "printed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/10 text-cyan-600 border border-cyan-500/30 flex items-center gap-1">
            <FiPrinter /> Printed
          </span>
        );
      case "downloaded":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 border border-blue-500/30 flex items-center gap-1">
            <FiDownload /> Downloaded
          </span>
        );
      case "deleted":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-600 border border-rose-500/30 flex items-center gap-1">
            <FiTrash2 /> Deleted
          </span>
        );
      case "created":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/10 text-purple-600 border border-purple-500/30 flex items-center gap-1">
            <FiFileText /> Draft Created
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-500/10 text-slate-600 border border-slate-500/30 flex items-center gap-1">
            <FiEye /> Viewed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <Mtitle
        title="HR Letter Audit History"
        subtitle="Complete audit trail and compliance log of all employee document operations."
      />

      {/* Search Bar */}
      <div className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
            <input
              type="text"
              placeholder="Search audit trail by Letter Number, Employee Name, Action, or Actor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium focus:outline-none focus:border-brand-primary"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-brand-primary text-white font-black text-xs hover:bg-brand-secondary transition-all cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey bg-brand-white dark:bg-brand-charcoal overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-xs text-brand-dark-grey">
            <FiLoader className="animate-spin text-base mr-2" /> Loading audit history...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-brand-dark-grey">
            No audit log records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/80 dark:bg-brand-midnight text-[11px] uppercase font-black text-brand-dark-grey">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Letter Number</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40">
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-brand-offwhite/40 dark:hover:bg-brand-midnight/40 transition-colors"
                  >
                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-black dark:text-brand-white">
                      {log.letterNumber || "—"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-brand-black dark:text-brand-white">
                      {log.employeeName || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-brand-black dark:text-brand-white block">
                        {log.performedBy?.name || "System"}
                      </span>
                      <span className="text-[10px] text-brand-dark-grey uppercase font-semibold">
                        {log.performedBy?.role || "admin"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-brand-dark-grey">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalItems > 20 && (
          <div className="p-4 border-t border-brand-beige/50 dark:border-brand-dark-grey/50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
