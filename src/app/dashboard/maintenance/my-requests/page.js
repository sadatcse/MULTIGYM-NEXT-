"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import ScrollHintX from "@/components/Comon/ScrollHintX";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import MaintenanceDetailsModal from "@/components/modals/MaintenanceDetailsModal";
import useMaintenanceApi from "@/hooks/useMaintenanceApi";
import {
  FiPlus,
  FiTool,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiSearch,
  FiX,
  FiList,
  FiGrid,
  FiCalendar,
} from "react-icons/fi";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut", delay: Math.min(i, 8) * 0.035 },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const STATUS_CONFIG = {
  OPEN: {
    color: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    dot: "bg-sky-500",
  },
  UNDER_REVIEW: {
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dot: "bg-amber-500",
  },
  ASSIGNED: {
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    dot: "bg-purple-500",
  },
  IN_PROGRESS: {
    color: "bg-brand-gold/10 text-brand-gold border-brand-gold/20",
    dot: "bg-brand-gold",
  },
  COMPLETED: {
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    color: "bg-brand-red/10 text-brand-red border-brand-red/20",
    dot: "bg-brand-red",
  },
  CANCELLED: {
    color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
    dot: "bg-zinc-500",
  },
};

const PRIORITY_BADGES = {
  URGENT: "bg-rose-500/10 text-rose-500 border-rose-500/30 font-black",
  HIGH: "bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold",
  MEDIUM: "bg-blue-500/10 text-blue-500 border-blue-500/30 font-bold",
  LOW: "bg-slate-500/10 text-slate-500 border-slate-500/30 font-bold",
};

export default function MyMaintenanceRequestsPage() {
  const { getMyRequests } = useMaintenanceApi();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState("table");
  const itemsPerPage = 10;

  // Responsive switch to grid
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode("grid");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Details Modal State
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
      const data = await getMyRequests({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter,
      });
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

  // Client-side search filtering
  const displayedRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter(
      (r) =>
        r.issue?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [requests, searchQuery]);

  // KPI stats calculations
  const stats = useMemo(() => {
    const total = totalItems || requests.length;
    const open = requests.filter((r) => r.status === "OPEN" || r.status === "UNDER_REVIEW").length;
    const inProgress = requests.filter((r) => r.status === "IN_PROGRESS" || r.status === "ASSIGNED").length;
    const completed = requests.filter((r) => r.status === "COMPLETED").length;
    return { total, open, inProgress, completed };
  }, [requests, totalItems]);

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      <Mtitle
        title="My Maintenance Requests"
        subtitle="Track every issue you've reported and inspect real-time technician status."
        rightcontent={
          <Link
            href="/dashboard/maintenance/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <FiPlus className="text-base" />
            <span>New Request</span>
          </Link>
        }
      />

      {/* KPI Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Total Requests
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {stats.total}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiTool />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-sky-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Open / Review
              </span>
              <span className="text-2xl font-black text-sky-500 mt-1 block">
                {stats.open}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiAlertCircle />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                In Progress
              </span>
              <span className="text-2xl font-black text-brand-gold mt-1 block">
                {stats.inProgress}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiClock />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Completed
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {stats.completed}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filter and Search Bar */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issue or category..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white font-bold"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
            >
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        {/* Filter Pills & Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1 flex-wrap">
            {["all", "OPEN", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-brand-gold text-brand-midnight shadow-xs font-black"
                    : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
                }`}
              >
                {st === "all" ? "All" : st.replace("_", " ").toLowerCase()}
              </button>
            ))}
          </div>

          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-brand-gold text-brand-midnight shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light"
              }`}
              title="Table View"
            >
              <FiList className="text-sm" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-brand-gold text-brand-midnight shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light"
              }`}
              title="Grid Card View"
            >
              <FiGrid className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonLoading variant={viewMode === "table" ? "table" : "shimmer"} rows={5} />
      ) : displayedRequests.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center text-2xl mx-auto mb-4 font-bold">
            <FiTool />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">
            No Maintenance Requests
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            {searchQuery || statusFilter !== "all"
              ? "No maintenance requests match your active filters."
              : "You haven't reported any issues yet. Click 'New Request' to submit one."}
          </p>
          <Link
            href="/dashboard/maintenance/create"
            className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-2xl shadow-md hover:bg-brand-red-dark transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <FiPlus /> New Request
          </Link>
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === "table" && (
            <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
              <ScrollHintX>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                    <tr>
                      <th className="py-4 px-6 text-center w-16">SL</th>
                      <th className="py-4 px-6">Issue</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6 text-center w-24">Priority</th>
                      <th className="py-4 px-6">Submitted</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6">Completed</th>
                      <th className="py-4 px-6 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    <AnimatePresence initial={false}>
                      {displayedRequests.map((r, idx) => {
                        const statusConfig =
                          STATUS_CONFIG[r.status] || STATUS_CONFIG["OPEN"];
                        const priorityBadge =
                          PRIORITY_BADGES[r.priority] || PRIORITY_BADGES["MEDIUM"];
                        const slNum = (currentPage - 1) * itemsPerPage + idx + 1;

                        return (
                          <motion.tr
                            key={r._id}
                            custom={idx}
                            variants={rowVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            layout
                            className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-150 cursor-pointer"
                            onClick={() => handleOpenDetails(r)}
                          >
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gold/10 text-brand-gold font-black text-xs">
                                #{slNum}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-extrabold text-brand-black dark:text-brand-white text-sm">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetails(r);
                                }}
                                className="hover:text-brand-gold transition-colors block text-left cursor-pointer font-black"
                              >
                                {r.issue}
                              </button>
                            </td>
                            <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light font-medium">
                              {r.category}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`text-[10px] uppercase px-2.5 py-1 rounded-full border ${priorityBadge}`}>
                                {r.priority}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light/90 font-medium">
                              {new Date(r.reportedDate || r.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${statusConfig.color}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                {r.status?.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light font-medium">
                              {r.completedDate ? new Date(r.completedDate).toLocaleDateString() : "—"}
                            </td>
                            <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleOpenDetails(r)}
                                className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer inline-flex items-center justify-center"
                                title="View Details"
                              >
                                <FiEye className="text-sm" />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </ScrollHintX>
            </div>
          )}

          {/* Grid View */}
          {viewMode === "grid" && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence initial={false}>
                {displayedRequests.map((r, idx) => {
                  const statusConfig = STATUS_CONFIG[r.status] || STATUS_CONFIG["OPEN"];
                  const priorityBadge = PRIORITY_BADGES[r.priority] || PRIORITY_BADGES["MEDIUM"];
                  const slNum = (currentPage - 1) * itemsPerPage + idx + 1;

                  return (
                    <motion.div
                      key={r._id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      layout
                      onClick={() => handleOpenDetails(r)}
                      className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-lg bg-brand-gold/10 text-brand-gold">
                              {r.category}
                            </span>
                            <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-full border ${priorityBadge}`}>
                              {r.priority}
                            </span>
                          </div>
                          <span className="shrink-0 w-8 h-8 rounded-2xl bg-brand-gold/10 text-brand-gold font-black text-xs flex items-center justify-center">
                            #{slNum}
                          </span>
                        </div>

                        <h3 className="font-black text-base text-brand-black dark:text-brand-white group-hover:text-brand-gold transition-colors line-clamp-2">
                          {r.issue}
                        </h3>

                        <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light/90 font-medium leading-relaxed my-3 line-clamp-2">
                          {r.description || "No further details provided."}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-brand-dark-grey dark:text-brand-gold-light py-2 border-y border-brand-beige/40 dark:border-brand-dark-grey/40 my-3">
                          <span className="flex items-center gap-1 font-medium">
                            <FiCalendar className="text-brand-gold" />
                            Submitted: {new Date(r.reportedDate || r.createdAt).toLocaleDateString()}
                          </span>
                          <span>
                            {r.completedDate ? `Done: ${new Date(r.completedDate).toLocaleDateString()}` : "Pending"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${statusConfig.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {r.status?.replace(/_/g, " ")}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(r);
                          }}
                          className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer"
                          title="View Details"
                        >
                          <FiEye className="text-sm" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Details View Modal */}
      <MaintenanceDetailsModal
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        requestId={selectedRequest?._id}
        initialData={selectedRequest}
      />
    </div>
  );
}
