"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import useTaskApi from "@/hooks/useTaskApi";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import { toast } from "react-toastify";
import {
  FiUser,
  FiAward,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiSearch,
  FiLayers,
  FiExternalLink,
  FiPaperclip,
  FiRefreshCw,
  FiEye,
  FiFileText,
  FiArrowRight,
  FiFilter,
} from "react-icons/fi";
import { MdAssignment, MdPendingActions, MdSpeed } from "react-icons/md";

const STATUS_BADGES = {
  PENDING: "bg-gray-500/10 text-gray-500 border border-gray-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  SUBMITTED: "bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold",
  UNDER_REVIEW: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold",
  WAITING_FOR_APPROVAL: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black",
  COMPLETED: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border border-red-500/20 font-bold",
  OVERDUE: "bg-red-500/10 text-red-500 border border-red-500/20 font-black",
  CANCELLED: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 line-through",
};

function EmployeePerformanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialEmpId = searchParams.get("employeeId") || "";

  const { getEmployeePerformance } = useTaskApi();
  const { employees } = useEmployeeApi(200);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmpId);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // Table Filters & Pagination
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Sync with URL query
  useEffect(() => {
    if (initialEmpId && initialEmpId !== selectedEmployeeId) {
      setSelectedEmployeeId(initialEmpId);
    }
  }, [initialEmpId]);

  // Load performance data when an employee is selected
  const fetchPerformance = useCallback(async (empId) => {
    if (!empId) return;
    setLoading(true);
    try {
      const res = await getEmployeePerformance(empId);
      setData(res);
    } catch (err) {
      console.error("Failed to load employee performance:", err);
      toast.error(err?.response?.data?.message || "Failed to load employee performance");
    } finally {
      setLoading(false);
    }
  }, [getEmployeePerformance]);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchPerformance(selectedEmployeeId);
    }
  }, [selectedEmployeeId, fetchPerformance]);

  // Handle employee selection
  const handleSelectEmployee = (emp) => {
    setSelectedEmployeeId(emp._id);
    setShowDropdown(false);
    setEmployeeSearch("");
    router.push(`/dashboard/tasks/employee-performance?employeeId=${emp._id}`);
  };

  const filteredEmployeesList = useMemo(() => {
    if (!employeeSearch.trim()) return (employees || []).slice(0, 10);
    const q = employeeSearch.toLowerCase();
    return (employees || []).filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.employeeId?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [employees, employeeSearch]);

  const selectedEmployeeDoc = useMemo(() => {
    if (data?.employee) return data.employee;
    return (employees || []).find((e) => e._id === selectedEmployeeId);
  }, [data, employees, selectedEmployeeId]);

  const formatOrdinal = (num) => {
    if (!num) return "—";
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;
    return `${num}th`;
  };

  // Filter task history
  const filteredHistory = useMemo(() => {
    if (!data?.taskHistory) return [];
    return data.taskHistory.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const titleMatch = (item.taskTitle || "").toLowerCase().includes(q);
        const sourceMatch = (item.instructionSource || "").toLowerCase().includes(q);
        if (!titleMatch && !sourceMatch) return false;
      }
      return true;
    });
  }, [data?.taskHistory, statusFilter, tableSearch]);

  const totalItems = filteredHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const paginatedHistory = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredHistory.slice(start, start + limit);
  }, [filteredHistory, page, limit]);

  const summary = data?.summary || {
    totalAssigned: 0,
    completedCount: 0,
    pendingCount: 0,
    inProgressCount: 0,
    submittedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    averageRating: 0,
    ratedCount: 0,
    onTimeCount: 0,
    lateCount: 0,
    onTimePercentage: 0,
    latePercentage: 0,
    averageSubmissionRank: 1.0,
    averageCompletionDays: 0,
  };

  return (
    <div className="max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-16 font-sans space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Mtitle
          title="Employee Task Performance & Analytics"
          subtitle="In-depth task lifecycle tracking, work quality ratings, submission speed rankings, and timeliness metrics."
        />

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          {selectedEmployeeId && (
            <button
              onClick={() => fetchPerformance(selectedEmployeeId)}
              className="p-3 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 text-brand-dark-grey hover:text-brand-gold shadow-sm transition-all cursor-pointer inline-flex items-center justify-center"
              title="Refresh Stats"
            >
              <FiRefreshCw className={`text-base ${loading ? "animate-spin text-brand-gold" : ""}`} />
            </button>
          )}

          <Link
            href="/dashboard/tasks"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-black text-brand-black dark:text-brand-white hover:border-brand-gold shadow-sm transition-all cursor-pointer"
          >
            <FiLayers />
            <span>All Tasks</span>
          </Link>
        </div>
      </div>

      {/* EMPLOYEE SELECTOR BAR */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center text-xl shrink-0 overflow-hidden">
              {selectedEmployeeDoc?.photo ? (
                <img
                  src={selectedEmployeeDoc.photo}
                  alt={selectedEmployeeDoc.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser />
              )}
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
                Selected Employee
              </span>
              <div className="text-base font-black text-brand-black dark:text-brand-white truncate">
                {selectedEmployeeDoc ? selectedEmployeeDoc.name : "Select an Employee to View Performance"}
              </div>
              {selectedEmployeeDoc && (
                <div className="text-xs text-brand-dark-grey font-mono truncate">
                  {selectedEmployeeDoc.employeeId || "Staff"} • {selectedEmployeeDoc.designation || selectedEmployeeDoc.role || "Employee"} • {selectedEmployeeDoc.department || "General"}
                </div>
              )}
            </div>
          </div>

          {/* Search Dropdown Input */}
          <div className="relative w-full md:w-80">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-xs" />
              <input
                type="text"
                value={employeeSearch}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder="Search staff to switch..."
                className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:border-brand-gold transition-colors"
              />
              {employeeSearch && (
                <button
                  onClick={() => setEmployeeSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark-grey hover:text-brand-red text-xs"
                >
                  <FiXCircle />
                </button>
              )}
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-brand-white dark:bg-brand-charcoal rounded-2xl border border-brand-beige dark:border-brand-dark-grey shadow-2xl z-40 max-h-64 overflow-y-auto p-1.5 space-y-1">
                {filteredEmployeesList.length > 0 ? (
                  filteredEmployeesList.map((emp) => (
                    <div
                      key={emp._id}
                      onClick={() => handleSelectEmployee(emp)}
                      className={`p-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors text-xs ${
                        emp._id === selectedEmployeeId
                          ? "bg-brand-gold/15 text-brand-gold font-black"
                          : "hover:bg-brand-offwhite dark:hover:bg-brand-midnight text-brand-black dark:text-brand-white font-semibold"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-gold/20 text-brand-gold font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {emp.photo ? (
                          <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{emp.name?.charAt(0) || "U"}</span>
                        )}
                      </div>
                      <div className="truncate">
                        <div className="truncate">{emp.name}</div>
                        <div className="text-[10px] text-brand-dark-grey font-mono truncate">
                          {emp.employeeId || "Staff"} • {emp.department || "General"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-brand-dark-grey">
                    No matching staff found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!selectedEmployeeId ? (
        <div className="bg-brand-white dark:bg-brand-charcoal p-12 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-brand-gold/15 text-brand-gold flex items-center justify-center text-3xl mx-auto">
            <FiUser />
          </div>
          <h3 className="text-base font-black text-brand-black dark:text-brand-white">
            Please Select an Employee
          </h3>
          <p className="text-xs text-brand-dark-grey max-w-md mx-auto">
            Use the search bar above to choose any employee in your organization to review their end-to-end task history, speed rankings, work quality ratings, and performance analytics.
          </p>
        </div>
      ) : loading ? (
        <div className="space-y-6">
          <SkeletonLoading count={4} />
        </div>
      ) : (
        <>
          {/* ANALYTICS KPI CARDS (Requirement 9) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Assigned */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey">
                  Total Assigned
                </span>
                <FiLayers className="text-brand-gold text-sm" />
              </div>
              <div className="text-2xl font-black text-brand-black dark:text-brand-white font-mono">
                {summary.totalAssigned}
              </div>
              <span className="text-[10px] text-brand-dark-grey block">All assigned directives</span>
            </motion.div>

            {/* Completed / Approved */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                  Completed / Done
                </span>
                <FiCheckCircle className="text-emerald-500 text-sm" />
              </div>
              <div className="text-2xl font-black text-emerald-500 font-mono">
                {summary.completedCount}
              </div>
              <span className="text-[10px] text-brand-dark-grey block">
                {summary.approvedCount} officially approved
              </span>
            </motion.div>

            {/* In Progress */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                  In Progress
                </span>
                <FiClock className="text-blue-500 text-sm" />
              </div>
              <div className="text-2xl font-black text-blue-500 font-mono">
                {summary.inProgressCount}
              </div>
              <span className="text-[10px] text-brand-dark-grey block">Actively being worked</span>
            </motion.div>

            {/* Submitted / Under Review */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                  Submitted / Review
                </span>
                <FiAward className="text-amber-500 text-sm" />
              </div>
              <div className="text-2xl font-black text-amber-500 font-mono">
                {summary.submittedCount}
              </div>
              <span className="text-[10px] text-brand-dark-grey block">Awaiting manager review</span>
            </motion.div>

            {/* Average Rating */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold">
                  Avg Quality Rating
                </span>
                <FiAward className="text-brand-gold text-sm" />
              </div>
              <div className="text-2xl font-black text-brand-gold font-mono">
                {summary.averageRating}%
              </div>
              <span className="text-[10px] text-brand-dark-grey block">
                Across {summary.ratedCount} rated tasks
              </span>
            </motion.div>

            {/* Average Submission Rank */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-500">
                  Avg Submission Rank
                </span>
                <MdSpeed className="text-purple-500 text-base" />
              </div>
              <div className="text-2xl font-black text-purple-500 font-mono">
                #{summary.averageSubmissionRank}
              </div>
              <span className="text-[10px] text-brand-dark-grey block">
                Average completion speed
              </span>
            </motion.div>
          </div>

          {/* PERFORMANCE GAUGES (On-time % & Rating %) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timeliness Breakdown Card */}
            <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiClock className="text-brand-gold" /> On-Time vs Late Completion
                </h4>
                <span className="text-xs font-mono font-black text-emerald-500">
                  {summary.onTimePercentage}% On-Time
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-red-500/20 rounded-full h-3 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${summary.onTimePercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-brand-dark-grey font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>On-Time: {summary.onTimeCount} tasks ({summary.onTimePercentage}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Late: {summary.lateCount} tasks ({summary.latePercentage}%)</span>
                </span>
              </div>
            </div>

            {/* Work Quality Meter Card */}
            <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiAward className="text-brand-gold" /> Work Quality Performance
                </h4>
                <span className="text-xs font-mono font-black text-brand-gold">
                  {summary.averageRating}% Average
                </span>
              </div>

              {/* Quality Progress Bar */}
              <div className="w-full bg-brand-offwhite dark:bg-brand-midnight rounded-full h-3 overflow-hidden">
                <div
                  className="bg-brand-gold h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.averageRating}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-brand-dark-grey">
                <span>Avg Turnaround: {summary.averageCompletionDays} days</span>
                <span className="font-bold text-red-500">Revisions / Rejected: {summary.rejectedCount}</span>
              </div>
            </div>
          </div>

          {/* COMPLETE TASK HISTORY TABLE (Requirement 8) */}
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiFileText className="text-brand-gold text-lg" /> Complete Task History ({filteredHistory.length})
                </h3>
                <p className="text-[11px] text-brand-dark-grey mt-0.5">
                  Chronological record of every instruction, assignment dates, submission order, manager reviews, and quality ratings.
                </p>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark-grey text-xs" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search by title..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="APPROVED">Approved</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/70 dark:bg-brand-midnight/70 text-[10px] font-black uppercase tracking-wider text-brand-dark-grey">
                    <th className="py-3 px-4">Task / Directive</th>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-4">Submission Rank</th>
                    <th className="py-3 px-4">Timeliness</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Work Quality</th>
                    <th className="py-3 px-4">Reviewer / Remarks</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
                  {paginatedHistory.length > 0 ? (
                    paginatedHistory.map((item, idx) => {
                      const statusBadge = STATUS_BADGES[item.status] || STATUS_BADGES["PENDING"];
                      return (
                        <tr
                          key={item.assignmentId || idx}
                          className="hover:bg-brand-offwhite/40 dark:hover:bg-brand-midnight/40 transition-colors"
                        >
                          {/* Title & Directive Source */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <Link
                              href={`/dashboard/tasks/${item.taskId}`}
                              className="font-black text-brand-black dark:text-brand-white hover:text-brand-gold transition-colors line-clamp-1 block"
                            >
                              {item.taskTitle}
                            </Link>
                            <span className="text-[10px] text-brand-dark-grey font-mono block">
                              Source: {item.instructionSource} • {item.priority}
                            </span>
                            {item.taskDescription && (
                              <p className="text-[11px] text-brand-dark-grey line-clamp-1 mt-0.5">
                                {item.taskDescription}
                              </p>
                            )}
                          </td>

                          {/* Dates Timeline */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[10px] text-brand-dark-grey space-y-0.5">
                            <div>
                              Deadline:{" "}
                              <span className="font-bold text-brand-black dark:text-brand-white">
                                {item.deadline ? new Date(item.deadline).toLocaleDateString() : "—"}
                              </span>
                            </div>
                            {item.submittedAt && (
                              <div>
                                Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                                {item.submissionCount > 1 && (
                                  <span className="ml-1 text-brand-gold font-bold">
                                    (Round #{item.submissionCount})
                                  </span>
                                )}
                              </div>
                            )}
                            {item.completedAt && (
                              <div className="text-emerald-500 font-bold">
                                Done: {new Date(item.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </td>

                          {/* Submission Rank */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.submissionRank ? (
                              <span className="px-2.5 py-1 rounded-xl font-mono text-xs font-black bg-amber-500/15 text-amber-600 border border-amber-500/30 inline-flex items-center gap-1">
                                <FiAward className="text-xs" />
                                <span>{formatOrdinal(item.submissionRank)} to Submit</span>
                              </span>
                            ) : (
                              <span className="text-brand-dark-grey text-[10px] font-mono">—</span>
                            )}
                          </td>

                          {/* Timeliness */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                item.isLate
                                  ? "bg-red-500/10 text-red-500"
                                  : item.isOnTime
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-gray-500/10 text-gray-500"
                              }`}
                            >
                              {item.isLate ? "Late" : item.isOnTime ? "On-Time" : "—"}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${statusBadge}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span>{item.status.replace(/_/g, " ")}</span>
                            </span>
                          </td>

                          {/* Work Quality Rating */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black">
                            {item.rating !== undefined && item.rating !== null ? (
                              <span className="text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                <FiAward className="text-xs" /> {item.rating}%
                              </span>
                            ) : (
                              <span className="text-brand-dark-grey text-[10px] font-normal">
                                {item.status === "APPROVED" || item.status === "COMPLETED"
                                  ? "Unrated"
                                  : "Pending Review"}
                              </span>
                            )}
                          </td>

                          {/* Reviewer / Remarks */}
                          <td className="py-3.5 px-4 text-[11px] text-brand-dark-grey max-w-xs">
                            {item.approvalComment ? (
                              <div className="italic text-emerald-600 line-clamp-2">
                                &ldquo;{item.approvalComment}&rdquo;
                              </div>
                            ) : item.latestRemark ? (
                              <div className="italic line-clamp-2">
                                &ldquo;{item.latestRemark}&rdquo;
                              </div>
                            ) : item.proofsCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-brand-gold font-bold">
                                <FiPaperclip /> {item.proofsCount} proof(s) attached
                              </span>
                            ) : (
                              <span className="text-brand-dark-grey text-[10px]">—</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <Link
                              href={`/dashboard/tasks/${item.taskId}`}
                              className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey hover:text-brand-gold transition-colors inline-flex items-center gap-1 text-xs font-bold"
                              title="Inspect Task Details"
                            >
                              <span>Inspect</span>
                              <FiExternalLink className="text-xs" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-brand-dark-grey">
                        No task records found for this employee.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-2 flex justify-end">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function EmployeePerformancePage() {
  return (
    <Suspense fallback={<div className="p-8"><SkeletonLoading count={4} /></div>}>
      <EmployeePerformanceContent />
    </Suspense>
  );
}
