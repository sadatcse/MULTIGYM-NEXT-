"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import ScrollHintX from "@/components/Comon/ScrollHintX";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import useMaintenanceApi from "@/hooks/useMaintenanceApi";
import useBranchApi from "@/hooks/useBranchApi";
import useDebounce from "@/hooks/useDebounce";
import {
  FiSearch,
  FiLoader,
  FiEye,
  FiTool,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiX,
  FiList,
  FiGrid,
  FiCalendar,
  FiPlus,
} from "react-icons/fi";

const CATEGORIES = [
  "AC",
  "Electrical",
  "Plumbing",
  "Equipment",
  "CCTV",
  "Access Control",
  "Interior",
  "Internet",
  "General Maintenance",
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = [
  "OPEN",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

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

export default function AllMaintenanceRequestsPage() {
  const router = useRouter();
  const { getAllRequests } = useMaintenanceApi();
  const { branches } = useBranchApi(100);

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [requests, setRequests] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebounce(searchInput, 400);
  const [branchFilter, setBranchFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState("table");

  // Auto-switch to grid on smaller viewports
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode("grid");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [debouncedSearch, branchFilter, categoryFilter, priorityFilter, statusFilter]);

  const fetchRequests = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setIsFetching(true);
      try {
        const data = await getAllRequests({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          branch: branchFilter,
          category: categoryFilter,
          priority: priorityFilter,
          status: statusFilter,
        });
        setRequests(data.requests || []);
        setTotalItems(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        console.error("Failed to load maintenance requests:", err);
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [getAllRequests, currentPage, itemsPerPage, debouncedSearch, branchFilter, categoryFilter, priorityFilter, statusFilter]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests(requests.length === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRequests]);

  // KPI Calculations
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
        title="All Maintenance Requests"
        subtitle="Review, assign, and manage every maintenance request across all branches."
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
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search issue or description..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white font-bold"
          />
          {isFetching ? (
            <FiLoader className="absolute right-3.5 top-2.5 text-brand-gold text-sm animate-spin" />
          ) : searchInput ? (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-2.5 text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
            >
              <FiX className="text-sm" />
            </button>
          ) : null}
        </div>

        {/* Dropdowns and View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>

          {/* View Switcher */}
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
        <SkeletonLoading variant={viewMode === "table" ? "table" : "shimmer"} rows={6} />
      ) : (
        <>
          {/* Table View */}
          {viewMode === "table" && (
            <div
              className={`bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden transition-opacity ${
                isFetching ? "opacity-60" : ""
              }`}
            >
              <ScrollHintX>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                    <tr>
                      <th className="py-4 px-6 text-center w-16">SL</th>
                      <th className="py-4 px-6">Request</th>
                      <th className="py-4 px-6">Branch</th>
                      <th className="py-4 px-6">Reported By</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6 text-center w-24">Priority</th>
                      <th className="py-4 px-6">Assigned</th>
                      <th className="py-4 px-6">Deadline</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    {requests.length > 0 ? (
                      <AnimatePresence initial={false}>
                        {requests.map((r, idx) => {
                          const statusConfig = STATUS_CONFIG[r.status] || STATUS_CONFIG["OPEN"];
                          const priorityBadge = PRIORITY_BADGES[r.priority] || PRIORITY_BADGES["MEDIUM"];
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
                              onClick={() => router.push(`/dashboard/maintenance/${r._id}`)}
                              className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-150 cursor-pointer"
                            >
                              <td className="py-4 px-6 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gold/10 text-brand-gold font-black text-xs">
                                  #{slNum}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-extrabold text-brand-black dark:text-brand-white text-sm">
                                <Link
                                  href={`/dashboard/maintenance/${r._id}`}
                                  className="hover:text-brand-gold transition-colors block font-black"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {r.issue}
                                </Link>
                                {r.isOverdue && (
                                  <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    Overdue
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light font-bold">
                                {r.branch}
                              </td>
                              <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light font-medium">
                                {r.reportedBy?.name || "—"}
                              </td>
                              <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light font-medium">
                                {r.category}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`text-[10px] uppercase px-2.5 py-1 rounded-full border ${priorityBadge}`}>
                                  {r.priority}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light font-medium">
                                {r.assignedToType === "employee"
                                  ? r.assignedToEmployee?.name
                                  : r.assignedToType === "vendor"
                                  ? r.assignedToVendor?.name
                                  : "—"}
                              </td>
                              <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light font-medium">
                                {r.deadline ? new Date(r.deadline).toLocaleDateString() : "—"}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${statusConfig.color}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                  {r.status?.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                                <Link
                                  href={`/dashboard/maintenance/${r._id}`}
                                  className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all inline-flex items-center justify-center cursor-pointer"
                                  title="View Details"
                                >
                                  <FiEye className="text-sm" />
                                </Link>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-brand-dark-grey dark:text-brand-gold-light text-xs font-semibold">
                          No maintenance requests found matching your filters.
                        </td>
                      </tr>
                    )}
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
                {requests.map((r, idx) => {
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
                      onClick={() => router.push(`/dashboard/maintenance/${r._id}`)}
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

                        <div className="text-xs text-brand-dark-grey dark:text-brand-gold-light/90 font-medium my-3 space-y-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-brand-black dark:text-brand-white">{r.branch}</span>
                            <span>By: {r.reportedBy?.name || "N/A"}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Assigned: {r.assignedToType === "employee" ? r.assignedToEmployee?.name : r.assignedToType === "vendor" ? r.assignedToVendor?.name : "Unassigned"}</span>
                            <span>{r.deadline ? `Due: ${new Date(r.deadline).toLocaleDateString()}` : "No deadline"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${statusConfig.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {r.status?.replace(/_/g, " ")}
                        </span>

                        <Link
                          href={`/dashboard/maintenance/${r._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer"
                          title="View Details"
                        >
                          <FiEye className="text-sm" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
