"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import MaintenanceDetailsModal from "@/components/modals/MaintenanceDetailsModal";
import useMaintenanceApi from "@/hooks/useMaintenanceApi";
import { FiPlus, FiTool, FiEye } from "react-icons/fi";

const STATUS_STYLES = {
  OPEN: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  UNDER_REVIEW: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ASSIGNED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  IN_PROGRESS: "bg-brand-gold/10 text-brand-gold border-brand-gold/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  REJECTED: "bg-brand-red/10 text-brand-red border-brand-red/20",
  CANCELLED: "bg-brand-dark-grey/10 text-brand-dark-grey border-brand-dark-grey/20",
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut", delay: Math.min(i, 8) * 0.035 } }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export default function MyMaintenanceRequestsPage() {
  const { getMyRequests } = useMaintenanceApi();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Details Modal State (opens without buttons as requested)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleOpenDetails = (r) => {
    setSelectedRequest(r);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedRequest(null);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyRequests({ page: currentPage, limit: itemsPerPage, status: statusFilter });
      setRequests(data.requests || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load my maintenance requests:", err);
    } finally {
      setLoading(false);
    }
  }, [getMyRequests, currentPage, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="space-y-6 w-full max-w-[1100px] mx-auto pb-16">
      <Mtitle
        title="My Maintenance Requests"
        subtitle="Track every issue you've reported and its current status."
        rightcontent={
          <Link
            href="/dashboard/maintenance/create"
            className="px-4 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-black shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FiPlus className="text-sm" /> New Request
          </Link>
        }
      />

      <div className="flex items-center gap-1 p-1 bg-brand-white dark:bg-brand-charcoal rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 w-fit">
        {["all", "OPEN", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              statusFilter === st ? "bg-brand-red text-white shadow-sm" : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
            }`}
          >
            {st === "all" ? "All" : st.replace("_", " ").toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonLoading variant="table" rows={5} />
      ) : requests.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            <FiTool />
          </div>
          <h3 className="font-black text-brand-black dark:text-brand-white mb-1">No Maintenance Requests</h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
            You haven&apos;t reported any issues yet. Click &quot;New Request&quot; to submit one.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-extrabold tracking-widest text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                  <tr>
                    <th className="py-4 px-6">Issue</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6 text-center">Priority</th>
                    <th className="py-4 px-6">Submitted</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6">Completed</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs">
                  <AnimatePresence initial={false}>
                    {requests.map((r, idx) => (
                      <motion.tr
                        key={r._id}
                        custom={idx}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-200 cursor-pointer"
                        onClick={() => handleOpenDetails(r)}
                      >
                        <td className="py-4 px-6 font-extrabold text-brand-black dark:text-brand-white">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(r);
                            }}
                            className="hover:text-brand-gold hover:underline transition-colors block text-left cursor-pointer"
                          >
                            {r.issue}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light">{r.category}</td>
                        <td className="py-4 px-6 text-center font-bold">{r.priority}</td>
                        <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light">
                          {new Date(r.reportedDate || r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${STATUS_STYLES[r.status] || ""}`}>
                            {r.status?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light">
                          {r.completedDate ? new Date(r.completedDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold/15 text-brand-gold hover:bg-brand-gold hover:text-brand-midnight text-xs font-black transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <FiEye className="text-xs" /> Details
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Details View Modal (clean view without action buttons as requested) */}
      <MaintenanceDetailsModal
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        requestId={selectedRequest?._id}
        initialData={selectedRequest}
      />
    </div>
  );
}
