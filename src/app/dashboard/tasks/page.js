"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useTaskApi from "@/hooks/useTaskApi";
import useManagementPersonApi from "@/hooks/useManagementPersonApi";
import { AuthContext } from "@/providers/AuthProvider";
import { exportToExcel, exportToCsv, printHtmlReport } from "@/lib/exportHelper";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiDownload,
  FiPrinter,
  FiEye,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiUsers,
  FiRefreshCw,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiAward,
} from "react-icons/fi";
import { MdAssignment, MdFlag } from "react-icons/md";

const SOURCE_COLORS = {
  "MD Sir": "bg-purple-500/10 text-purple-600 border-purple-500/30",
  "Director Sir": "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  Management: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "Admin & HR": "bg-amber-500/10 text-amber-600 border-amber-500/30",
};

const PRIORITY_BADGES = {
  CRITICAL: "bg-red-500 text-white animate-pulse",
  URGENT: "bg-orange-500 text-white",
  HIGH: "bg-amber-500 text-white",
  MEDIUM: "bg-blue-500 text-white",
  LOW: "bg-slate-500 text-white",
};

const STATUS_BADGES = {
  PENDING: "bg-gray-500/10 text-gray-500 border border-gray-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  WAITING_FOR_APPROVAL: "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse",
  COMPLETED: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  OVERDUE: "bg-red-500/10 text-red-500 border border-red-500/20 font-black",
  CANCELLED: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 line-through",
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
    async (pageToLoad = 1) => {
      setLoading(true);
      try {
        const res = await getTasks({
          page: pageToLoad,
          limit: 15,
          search,
          source,
          priority,
          status,
          branch,
        });
        setTasks(res.tasks || []);
        setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    },
    [getTasks, search, source, priority, status, branch]
  );

  useEffect(() => {
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

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto pb-16">
      {/* Top Banner & Header */}
      <Mtitle
        title="Task & Instruction Directory"
        subtitle="Manage official instructions issued by MD Sir, Director Sir, Management, and HR with end-to-end status and proof tracking."
        rightcontent={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleExport("excel")}
              className="px-3.5 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold hover:border-brand-gold transition-colors flex items-center gap-1.5"
            >
              <FiDownload className="text-brand-gold" /> Excel
            </button>

            <button
              onClick={() => handleExport("print")}
              className="px-3.5 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold hover:border-brand-gold transition-colors flex items-center gap-1.5"
            >
              <FiPrinter className="text-brand-gold" /> Print
            </button>

            <Link
              href="/dashboard/tasks/employee-performance"
              className="px-3.5 py-2 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/40 text-xs font-black hover:bg-brand-gold hover:text-brand-black transition-all flex items-center gap-1.5"
            >
              <FiAward className="text-sm" /> Staff Analytics
            </Link>

            <Link
              href="/dashboard/tasks/create"
              className="px-5 py-2 rounded-2xl bg-brand-red text-white text-xs font-extrabold shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all flex items-center gap-1.5"
            >
              <FiPlus className="text-sm" /> New Instruction
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, instruction detail..."
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
            />
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
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
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
            >
              <option value="all">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_APPROVAL">Waiting Approval</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Task Table */}
      {loading ? (
        <SkeletonLoading count={6} />
      ) : (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                <tr>
                  <th className="py-4 px-5 text-center w-12">SL</th>
                  <th className="py-4 px-5">Instruction & Source</th>
                  <th className="py-4 px-5">Branch / Dept</th>
                  <th className="py-4 px-5 text-center">Priority</th>
                  <th className="py-4 px-5">Assignees</th>
                  <th className="py-4 px-5 text-center">Deadline</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-center w-28">Progress</th>
                  <th className="py-4 px-5 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs">
                {tasks.length > 0 ? (
                  tasks.map((task, idx) => {
                    const sourceStyle = SOURCE_COLORS[task.instructionSource] || SOURCE_COLORS["Management"];
                    const priorityBadge = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES["MEDIUM"];
                    const statusBadge = STATUS_BADGES[task.status] || STATUS_BADGES["PENDING"];
                    const now = new Date();
                    const deadlineDate = new Date(task.deadline);
                    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <tr
                        key={task._id}
                        className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/50 transition-colors"
                      >
                        {/* SL */}
                        <td className="py-4 px-5 text-center font-bold text-brand-dark-grey">
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </td>

                        {/* Title & Instruction Source */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${sourceStyle}`}
                            >
                              {task.instructionSource}
                            </span>
                            {task.category && (
                              <span className="text-[9px] font-bold text-brand-dark-grey bg-brand-beige/20 dark:bg-brand-midnight px-2 py-0.5 rounded-md">
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
                          <span className="text-[11px] text-brand-dark-grey line-clamp-1 mt-0.5">
                            {task.description}
                          </span>
                        </td>

                        {/* Branch & Dept */}
                        <td className="py-4 px-5">
                          <div className="font-extrabold text-brand-black dark:text-brand-white text-xs">
                            {task.branch}
                          </div>
                          <div className="text-[10px] text-brand-dark-grey font-semibold">
                            {task.department}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-4 px-5 text-center">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${priorityBadge}`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        {/* Assignees */}
                        <td className="py-4 px-5">
                          <div className="flex items-center -space-x-2">
                            {task.assignees?.slice(0, 3).map((a) => (
                              <div
                                key={a._id}
                                title={`${a.employee?.name} (${a.status})`}
                                className="w-7 h-7 rounded-full border-2 border-brand-white dark:border-brand-charcoal bg-brand-gold text-brand-black font-black text-[10px] flex items-center justify-center overflow-hidden"
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
                              <div className="w-7 h-7 rounded-full border-2 border-brand-white dark:border-brand-charcoal bg-brand-charcoal text-white text-[9px] font-bold flex items-center justify-center">
                                +{task.assignees.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-brand-dark-grey block mt-1">
                            {task.completedAssignees || 0} / {task.totalAssignees || 0} completed
                          </span>
                        </td>

                        {/* Deadline & Smart Tag */}
                        <td className="py-4 px-5 text-center">
                          <div className="font-extrabold text-xs text-brand-black dark:text-brand-white">
                            {deadlineDate.toLocaleDateString()}
                          </div>
                          <span
                            className={`text-[9px] font-bold block mt-0.5 ${
                              diffDays < 0
                                ? "text-red-500 font-black"
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
                        <td className="py-4 px-5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${statusBadge}`}
                          >
                            {task.status.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Progress */}
                        <td className="py-4 px-5 text-center">
                          <div className="w-full bg-brand-beige/30 dark:bg-brand-midnight rounded-full h-2 overflow-hidden mb-1">
                            <div
                              className="bg-brand-gold h-full rounded-full transition-all duration-300"
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-brand-dark-grey">
                            {task.progress || 0}%
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/dashboard/tasks/${task._id}`}
                              className="p-2 rounded-xl bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-black text-brand-gold transition-all text-xs"
                              title="View Detail & Timeline"
                            >
                              <FiEye />
                            </Link>

                            {isSuperadminOrAdmin && (
                              <button
                                onClick={() => handleDeleteTask(task._id, task.title)}
                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all text-xs cursor-pointer"
                                title="Delete Task"
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-brand-dark-grey">
                      <MdAssignment className="text-3xl mx-auto mb-2 text-brand-gold/60" />
                      <p className="font-bold text-sm">No management instruction tasks found.</p>
                      <p className="text-xs text-brand-dark-grey mt-1">
                        Try adjusting your filters or create a new task instruction.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 bg-brand-offwhite dark:bg-brand-midnight border-t border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center justify-between">
              <span className="text-xs font-bold text-brand-dark-grey">
                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchTaskList(pagination.page - 1)}
                  className="p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey disabled:opacity-40 text-xs"
                >
                  <FiChevronLeft />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchTaskList(pagination.page + 1)}
                  className="p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey disabled:opacity-40 text-xs"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
