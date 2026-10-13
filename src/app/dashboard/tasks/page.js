/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import ScrollHintX from "@/components/Comon/ScrollHintX";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import useTaskApi from "@/hooks/useTaskApi";
import useManagementPersonApi from "@/hooks/useManagementPersonApi";
import { AuthContext } from "@/providers/AuthProvider";
import { exportToExcel, exportToCsv, printHtmlReport } from "@/lib/exportHelper";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiPlus,
  FiSearch,
  FiDownload,
  FiPrinter,
  FiEye,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiUsers,
  FiCalendar,
  FiTrash2,
  FiAward,
  FiGrid,
  FiList,
  FiX,
  FiLayers,
} from "react-icons/fi";
import { MdAssignment } from "react-icons/md";

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

const SOURCE_COLORS = {
  "MD Sir": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  "Director Sir": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  Management: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  "Admin & HR": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
};

const PRIORITY_BADGES = {
  CRITICAL: "bg-red-500/10 text-red-500 border border-red-500/30 font-black",
  URGENT: "bg-orange-500/10 text-orange-500 border border-orange-500/30 font-black",
  HIGH: "bg-amber-500/10 text-amber-500 border border-amber-500/30 font-bold",
  MEDIUM: "bg-blue-500/10 text-blue-500 border border-blue-500/30 font-bold",
  LOW: "bg-slate-500/10 text-slate-500 border border-slate-500/30 font-bold",
};

const STATUS_CONFIG = {
  PENDING: {
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    dot: "bg-gray-500",
  },
  IN_PROGRESS: {
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dot: "bg-blue-500",
  },
  WAITING_FOR_APPROVAL: {
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dot: "bg-amber-500",
  },
  COMPLETED: {
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  OVERDUE: {
    color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    dot: "bg-rose-500",
  },
  CANCELLED: {
    color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
    dot: "bg-zinc-500",
  },
};

export default function TaskDirectoryPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { getTasks, deleteTask } = useTaskApi();
  const { getActiveManagementPersons } = useManagementPersonApi();
  const [managementAuthorities, setManagementAuthorities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [viewMode, setViewMode] = useState("table");

  // Auto-switch to grid view on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode("grid");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load active management authorities for dynamic source filtering
  useEffect(() => {
    let isMounted = true;
    const loadAuths = async () => {
      try {
        const list = await getActiveManagementPersons();
        if (isMounted && list && list.length > 0) {
          setManagementAuthorities(list);
        }
      } catch (err) {
        console.error("Failed to load management authorities:", err);
      }
    };
    loadAuths();
    return () => {
      isMounted = false;
    };
  }, [getActiveManagementPersons]);

  // Filters
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [branch, setBranch] = useState("all");

  const isSuperadminOrAdmin =
    user?.role === "superadmin" || user?.role === "admin" || user?.role === "manager";

  const fetchTaskList = useCallback(
    async (pageToLoad = 1, limitToUse = pagination.limit) => {
      setLoading(true);
      try {
        const res = await getTasks({
          page: pageToLoad,
          limit: limitToUse,
          search,
          source,
          priority,
          status,
          branch,
        });
        setTasks(res.tasks || []);
        setPagination(res.pagination || { page: 1, limit: limitToUse, total: 0, totalPages: 1 });
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    },
    [getTasks, search, source, priority, status, branch, pagination.limit]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTaskList(1);
  }, [fetchTaskList]);

  const handleDeleteTask = async (id, title) => {
    const confirm = await Swal.fire({
      title: "Delete Instruction Task?",
      text: `Are you sure you want to permanently remove "${title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#3F3F46",
      confirmButtonText: "Yes, delete it",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteTask(id);
        toast.success("Task deleted successfully");
        fetchTaskList(pagination.page);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to delete task");
      }
    }
  };

  const handleExport = (type) => {
    if (!tasks || tasks.length === 0) {
      toast.warning("No tasks to export");
      return;
    }

    const exportData = tasks.map((t, idx) => ({
      SL: idx + 1,
      Title: t.title,
      InstructionSource: t.instructionSource,
      IssuedBy: t.issuedBy?.name || "N/A",
      Branch: t.branch,
      Department: t.department,
      Priority: t.priority,
      Status: t.status,
      Progress: `${t.progress}%`,
      Deadline: new Date(t.deadline).toLocaleDateString(),
      TotalAssignees: t.totalAssignees,
      CompletedAssignees: t.completedAssignees,
    }));

    if (type === "excel") {
      exportToExcel(exportData, "Management_Instructions_Report");
    } else if (type === "csv") {
      exportToCsv(exportData, "Management_Instructions_Report");
    } else if (type === "print") {
      const headers = ["SL", "Title", "Source", "Branch", "Priority", "Status", "Progress", "Deadline"];
      const rows = tasks.map((t, idx) => [
        idx + 1,
        t.title,
        t.instructionSource,
        t.branch,
        t.priority,
        t.status,
        `${t.progress}%`,
        new Date(t.deadline).toLocaleDateString(),
      ]);
      printHtmlReport({
        title: "Management Instructions & Task Report",
        preparedBy: user?.name || "Administrator",
        headers,
        rows,
      });
    }
  };

  // KPI Calculations
  const stats = {
    total: pagination.total || tasks.length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
    overdueOrCritical: tasks.filter(
      (t) =>
        t.status === "OVERDUE" ||
        t.priority === "CRITICAL" ||
        (t.deadline && new Date(t.deadline) < new Date() && t.status !== "COMPLETED")
    ).length,
  };

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      {/* Top Banner & Header */}
      <Mtitle
        title="Task & Instruction Directory"
        subtitle="Manage official instructions issued by MD Sir, Director Sir, Management, and HR with end-to-end status and proof tracking."
        rightcontent={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleExport("excel")}
              className="px-3.5 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FiDownload className="text-brand-gold" /> Excel
            </button>

            <button
              onClick={() => handleExport("print")}
              className="px-3.5 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FiPrinter className="text-brand-gold" /> Print
            </button>

            <Link
              href="/dashboard/tasks/employee-performance"
              className="px-4 py-2.5 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/40 text-xs font-black hover:bg-brand-gold hover:text-brand-midnight transition-all flex items-center gap-1.5"
            >
              <FiAward className="text-sm" /> Staff Analytics
            </Link>

            <Link
              href="/dashboard/tasks/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <FiPlus className="text-base" />
              <span>New Instruction</span>
            </Link>
          </div>
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
                Total Directives
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {stats.total}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiLayers />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-blue-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                In Progress
              </span>
              <span className="text-2xl font-black text-blue-500 mt-1 block">
                {stats.inProgress}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
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

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-rose-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Overdue / Critical
              </span>
              <span className="text-2xl font-black text-rose-500 mt-1 block">
                {stats.overdueOrCritical}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiAlertTriangle />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filter and Search Bar */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, instruction detail..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white font-bold"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
            >
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        {/* Filter Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Pills */}
          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            {[
              { label: "All", val: "all" },
              { label: "In Progress", val: "IN_PROGRESS" },
              { label: "Completed", val: "COMPLETED" },
              { label: "Overdue", val: "OVERDUE" },
            ].map((tab) => (
              <button
                key={tab.val}
                onClick={() => setStatus(tab.val)}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  status === tab.val
                    ? "bg-brand-gold text-brand-midnight shadow-xs"
                    : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Source Dropdown */}
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="all">All Sources</option>
            {managementAuthorities.length > 0 ? (
              managementAuthorities.map((auth) => (
                <option key={auth._id} value={auth.title}>
                  {auth.title} {auth.employeeName ? `(${auth.employeeName})` : ""}
                </option>
              ))
            ) : (
              <>
                <option value="MD Sir">MD Sir</option>
                <option value="Director Sir">Director Sir</option>
                <option value="Management">Management</option>
                <option value="Admin & HR">Admin & HR</option>
              </>
            )}
          </select>

          {/* Priority Dropdown */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Page Limit Selector */}
          <select
            value={pagination.limit}
            onChange={(e) => {
              const newLimit = Number(e.target.value);
              setPagination((prev) => ({ ...prev, limit: newLimit }));
              fetchTaskList(1, newLimit);
            }}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={15}>15 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>

          {/* Table / Grid Switcher */}
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

      {/* Main Content Area */}
      {loading ? (
        <SkeletonLoading variant={viewMode === "table" ? "table" : "shimmer"} rows={6} />
      ) : tasks.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <MdAssignment />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">
            No Tasks or Instructions Found
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            {search || source !== "all" || priority !== "all" || status !== "all"
              ? "No tasks match your active filter settings."
              : "No management instruction tasks have been created yet."}
          </p>
          <Link
            href="/dashboard/tasks/create"
            className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-2xl shadow-md hover:bg-brand-red-dark transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <FiPlus /> New Instruction
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
                      <th className="py-4 px-6">Instruction & Source</th>
                      <th className="py-4 px-6">Branch / Dept</th>
                      <th className="py-4 px-6 text-center w-24">Priority</th>
                      <th className="py-4 px-6">Assignees</th>
                      <th className="py-4 px-6 text-center">Deadline</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-center w-28">Progress</th>
                      <th className="py-4 px-6 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    <AnimatePresence initial={false}>
                      {tasks.map((task, idx) => {
                        const sourceStyle =
                          SOURCE_COLORS[task.instructionSource] || SOURCE_COLORS["Management"];
                        const priorityBadge =
                          PRIORITY_BADGES[task.priority] || PRIORITY_BADGES["MEDIUM"];
                        const statusConfig =
                          STATUS_CONFIG[task.status] || STATUS_CONFIG["PENDING"];
                        const now = new Date();
                        const deadlineDate = new Date(task.deadline);
                        const diffDays = Math.ceil(
                          (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        const slNum = (pagination.page - 1) * pagination.limit + idx + 1;

                        return (
                          <motion.tr
                            key={task._id}
                            custom={idx}
                            variants={rowVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            layout
                            className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-150"
                          >
                            {/* SL */}
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gold/10 text-brand-gold font-black text-xs">
                                #{slNum}
                              </span>
                            </td>

                            {/* Title & Source */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${sourceStyle}`}
                                >
                                  {task.instructionSource}
                                </span>
                                {task.category && (
                                  <span className="text-[9px] font-bold text-brand-dark-grey bg-brand-beige/30 dark:bg-brand-midnight px-2 py-0.5 rounded-lg border border-brand-beige/40 dark:border-brand-dark-grey/40">
                                    {task.category}
                                  </span>
                                )}
                              </div>
                              <Link
                                href={`/dashboard/tasks/${task._id}`}
                                className="font-extrabold text-sm text-brand-black dark:text-brand-white hover:text-brand-gold transition-colors block"
                              >
                                {task.title}
                              </Link>
                              <span className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light/80 line-clamp-1 mt-0.5 font-medium">
                                {task.description}
                              </span>
                            </td>

                            {/* Branch & Dept */}
                            <td className="py-4 px-6">
                              <div className="font-extrabold text-brand-black dark:text-brand-white text-xs">
                                {task.branch}
                              </div>
                              <div className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light font-semibold">
                                {task.department}
                              </div>
                            </td>

                            {/* Priority */}
                            <td className="py-4 px-6 text-center">
                              <span className={`text-[10px] uppercase px-2.5 py-1 rounded-full ${priorityBadge}`}>
                                {task.priority}
                              </span>
                            </td>

                            {/* Assignees */}
                            <td className="py-4 px-6">
                              <div className="flex items-center -space-x-2">
                                {task.assignees?.slice(0, 3).map((a) => (
                                  <div
                                    key={a._id}
                                    title={`${a.employee?.name} (${a.status})`}
                                    className="w-7 h-7 rounded-full border-2 border-brand-white dark:border-brand-charcoal bg-brand-gold text-brand-midnight font-black text-[10px] flex items-center justify-center overflow-hidden shadow-xs"
                                  >
                                    {a.employee?.photo ? (
                                      <img
                                        src={a.employee.photo}
                                        alt={a.employee.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span>{a.employee?.name?.charAt(0) || "U"}</span>
                                    )}
                                  </div>
                                ))}
                                {task.assignees?.length > 3 && (
                                  <div className="w-7 h-7 rounded-full border-2 border-brand-white dark:border-brand-charcoal bg-brand-charcoal dark:bg-brand-midnight text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                                    +{task.assignees.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light block mt-1">
                                {task.completedAssignees || 0} / {task.totalAssignees || 0} completed
                              </span>
                            </td>

                            {/* Deadline */}
                            <td className="py-4 px-6 text-center">
                              <div className="font-extrabold text-xs text-brand-black dark:text-brand-white">
                                {deadlineDate.toLocaleDateString()}
                              </div>
                              <span
                                className={`text-[10px] font-bold block mt-0.5 ${
                                  diffDays < 0
                                    ? "text-rose-500 font-black"
                                    : diffDays === 0
                                    ? "text-amber-500 font-bold"
                                    : "text-emerald-500"
                                }`}
                              >
                                {diffDays < 0
                                  ? `Overdue by ${Math.abs(diffDays)}d`
                                  : diffDays === 0
                                  ? "Due Today"
                                  : `${diffDays}d left`}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-6 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize border ${statusConfig.color}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                {task.status.replace(/_/g, " ")}
                              </span>
                            </td>

                            {/* Progress */}
                            <td className="py-4 px-6 text-center">
                              <div className="w-full bg-brand-beige/30 dark:bg-brand-midnight rounded-full h-2 overflow-hidden mb-1">
                                <div
                                  className="bg-brand-gold h-full rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress || 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-black text-brand-dark-grey dark:text-brand-gold-light">
                                {task.progress || 0}%
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Link
                                  href={`/dashboard/tasks/${task._id}`}
                                  className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer"
                                  title="View Detail & Timeline"
                                >
                                  <FiEye className="text-sm" />
                                </Link>

                                {isSuperadminOrAdmin && (
                                  <button
                                    onClick={() => handleDeleteTask(task._id, task.title)}
                                    className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer"
                                    title="Delete Task"
                                  >
                                    <FiTrash2 className="text-sm" />
                                  </button>
                                )}
                              </div>
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

          {/* Grid Card View */}
          {viewMode === "grid" && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence initial={false}>
                {tasks.map((task, idx) => {
                  const sourceStyle =
                    SOURCE_COLORS[task.instructionSource] || SOURCE_COLORS["Management"];
                  const priorityBadge =
                    PRIORITY_BADGES[task.priority] || PRIORITY_BADGES["MEDIUM"];
                  const statusConfig =
                    STATUS_CONFIG[task.status] || STATUS_CONFIG["PENDING"];
                  const deadlineDate = new Date(task.deadline);
                  const now = new Date();
                  const diffDays = Math.ceil(
                    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const slNum = (pagination.page - 1) * pagination.limit + idx + 1;

                  return (
                    <motion.div
                      key={task._id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      layout
                      className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top row with badges and SL */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${sourceStyle}`}
                            >
                              {task.instructionSource}
                            </span>
                            <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full ${priorityBadge}`}>
                              {task.priority}
                            </span>
                          </div>
                          <span className="shrink-0 w-8 h-8 rounded-2xl bg-brand-gold/10 text-brand-gold font-black text-xs flex items-center justify-center">
                            #{slNum}
                          </span>
                        </div>

                        {/* Title & description */}
                        <Link
                          href={`/dashboard/tasks/${task._id}`}
                          className="font-black text-base text-brand-black dark:text-brand-white hover:text-brand-gold transition-colors block line-clamp-1"
                        >
                          {task.title}
                        </Link>
                        <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light/90 font-medium leading-relaxed my-2 line-clamp-2">
                          {task.description || "No description provided."}
                        </p>

                        {/* Branch / Dept */}
                        <div className="flex items-center justify-between text-[11px] text-brand-dark-grey dark:text-brand-gold-light py-2 border-y border-brand-beige/40 dark:border-brand-dark-grey/40 my-3">
                          <span className="font-bold">{task.branch}</span>
                          <span className="font-medium">{task.department}</span>
                        </div>

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center text-[10px] font-black mb-1">
                            <span className="text-brand-dark-grey dark:text-brand-gold-light">Progress</span>
                            <span className="text-brand-gold">{task.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-brand-beige/30 dark:bg-brand-midnight rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-brand-gold h-full rounded-full transition-all duration-300"
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Assignees & Deadline */}
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center -space-x-2">
                            {task.assignees?.slice(0, 3).map((a) => (
                              <div
                                key={a._id}
                                title={`${a.employee?.name}`}
                                className="w-6 h-6 rounded-full border border-brand-white dark:border-brand-charcoal bg-brand-gold text-brand-midnight font-black text-[9px] flex items-center justify-center overflow-hidden"
                              >
                                {a.employee?.photo ? (
                                  <img
                                    src={a.employee.photo}
                                    alt={a.employee.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{a.employee?.name?.charAt(0) || "U"}</span>
                                )}
                              </div>
                            ))}
                            {task.assignees?.length > 3 && (
                              <div className="w-6 h-6 rounded-full border border-brand-white dark:border-brand-charcoal bg-brand-charcoal text-white text-[8px] font-bold flex items-center justify-center">
                                +{task.assignees.length - 3}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-extrabold text-brand-black dark:text-brand-white block">
                              {deadlineDate.toLocaleDateString()}
                            </span>
                            <span
                              className={`text-[9px] font-bold ${
                                diffDays < 0
                                  ? "text-rose-500 font-black"
                                  : diffDays === 0
                                  ? "text-amber-500 font-bold"
                                  : "text-emerald-500"
                              }`}
                            >
                              {diffDays < 0
                                ? `Overdue by ${Math.abs(diffDays)}d`
                                : diffDays === 0
                                ? "Due Today"
                                : `${diffDays}d left`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize border ${statusConfig.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {task.status.replace(/_/g, " ")}
                        </span>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/tasks/${task._id}`}
                            className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer"
                            title="View Detail"
                          >
                            <FiEye className="text-sm" />
                          </Link>
                          {isSuperadminOrAdmin && (
                            <button
                              onClick={() => handleDeleteTask(task._id, task.title)}
                              className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer"
                              title="Delete Task"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Unified Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(newPage) => fetchTaskList(newPage)}
          />
        </>
      )}
    </div>
  );
}
