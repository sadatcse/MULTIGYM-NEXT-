"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import useMaintenanceApi from "@/hooks/useMaintenanceApi";
import useBranchApi from "@/hooks/useBranchApi";
import useDebounce from "@/hooks/useDebounce";
import { FiSearch, FiLoader, FiEye } from "react-icons/fi";

const CATEGORIES = ["AC", "Electrical", "Plumbing", "Equipment", "CCTV", "Access Control", "Interior", "Internet", "General Maintenance"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = ["OPEN", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"];

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

  return (
    <div className="space-y-6 w-full max-w-[1300px] mx-auto pb-16">
      <Mtitle title="All Maintenance Requests" subtitle="Review, assign, and manage every maintenance request across all branches." />

      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col lg:flex-row items-center gap-3">
        <div className="relative w-full lg:w-64">
          <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search issue or description..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
          />
          {isFetching && <FiLoader className="absolute right-3.5 top-2.5 text-brand-gold text-sm animate-spin" />}
        </div>

        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey outline-none cursor-pointer w-full lg:w-auto">
          <option value="all">All Branches</option>
          {branches.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey outline-none cursor-pointer w-full lg:w-auto">
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey outline-none cursor-pointer w-full lg:w-auto">
          <option value="all">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey outline-none cursor-pointer w-full lg:w-auto">
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      {loading ? (
        <SkeletonLoading variant="table" rows={6} />
      ) : (
        <>
          <div className={`bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-extrabold tracking-widest text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                  <tr>
                    <th className="py-4 px-6">Request</th>
                    <th className="py-4 px-6">Branch</th>
                    <th className="py-4 px-6">Reported By</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6 text-center">Priority</th>
                    <th className="py-4 px-6">Assigned</th>
                    <th className="py-4 px-6">Deadline</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs">
                  {requests.length > 0 ? (
                    <AnimatePresence initial={false}>
                      {requests.map((r, idx) => (
                        <motion.tr
                          key={r._id}
                          custom={idx}
                          variants={rowVariants}
                          initial="hidden"
                          animate="show"
                          exit="exit"
                          onClick={() => router.push(`/dashboard/maintenance/${r._id}`)}
                          className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-200 cursor-pointer"
                        >
                          <td className="py-4 px-6 font-extrabold text-brand-black dark:text-brand-white">
                            <Link
                              href={`/dashboard/maintenance/${r._id}`}
                              className="hover:text-brand-gold hover:underline transition-colors block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {r.issue}
                            </Link>
                            {r.isOverdue && <span className="mt-1 inline-block text-[9px] font-black uppercase text-brand-red">Overdue</span>}
                          </td>
                          <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light">{r.branch}</td>
                          <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light">{r.reportedBy?.name || "—"}</td>
                          <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light">{r.category}</td>
                          <td className="py-4 px-6 text-center font-bold">{r.priority}</td>
                          <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light">
                            {r.assignedToType === "employee" ? r.assignedToEmployee?.name : r.assignedToType === "vendor" ? r.assignedToVendor?.name : "—"}
                          </td>
                          <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light">{r.deadline ? new Date(r.deadline).toLocaleDateString() : "—"}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${STATUS_STYLES[r.status] || ""}`}>
                              {r.status?.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/dashboard/maintenance/${r._id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold/15 text-brand-gold hover:bg-brand-gold hover:text-brand-midnight text-xs font-black transition-colors"
                              title="View Details"
                            >
                              <FiEye className="text-xs" /> Details
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-brand-dark-grey dark:text-brand-gold-light text-xs font-semibold">
                        No maintenance requests found.
                      </td>
                    </tr>
                  )}
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
              onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            />
          )}
        </>
      )}
    </div>
  );
}
