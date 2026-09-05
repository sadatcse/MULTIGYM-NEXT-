"use client";

import React, { useState, useEffect, useCallback, useContext, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ProofSubmissionModal from "@/components/tasks/ProofSubmissionModal";
import SubmissionHistoryModal from "@/components/tasks/SubmissionHistoryModal";
import useTaskApi from "@/hooks/useTaskApi";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import { AuthContext } from "@/providers/AuthProvider";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiCheckCircle,
  FiClock,
  FiPlay,
  FiUploadCloud,
  FiSend,
  FiAlertTriangle,
  FiFileText,
  FiX,
  FiCalendar,
  FiGrid,
  FiList,
  FiSearch,
  FiLoader,
  FiArrowRight,
  FiRefreshCw,
  FiAward,
} from "react-icons/fi";
import { MdAssignment, MdPendingActions, MdOutlineHistory } from "react-icons/md";

const SOURCE_COLORS = {
  "MD Sir": "bg-purple-500/10 text-purple-600 border-purple-500/30",
  "Director Sir": "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  Management: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "Admin & HR": "bg-amber-500/10 text-amber-600 border-amber-500/30",
};

const PRIORITY_BADGES = {
  CRITICAL: "bg-red-500 text-white animate-pulse shadow-xs",
  URGENT: "bg-orange-500 text-white shadow-xs",
  HIGH: "bg-amber-500 text-white shadow-xs",
  MEDIUM: "bg-blue-500 text-white shadow-xs",
  LOW: "bg-slate-500 text-white shadow-xs",
};

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
};

export default function MyTasksPage() {
  const axiosSecure = useAxiosSecure();
  const { user } = useContext(AuthContext);
  const {
    getMyTasks,
    startTask,
    updateProgress,
    uploadProof,
    submitForApproval,
    completeTaskDirect,
  } = useTaskApi();

  const [loading, setLoading] = useState(true);
  const [allAssignments, setAllAssignments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Progress Update Modal State
  const [activeTaskForModal, setActiveTaskForModal] = useState(null);
  const [progressVal, setProgressVal] = useState(50);
  const [progressRemark, setProgressRemark] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Proof Upload Modal State
  const [activeTaskForProof, setActiveTaskForProof] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofRemark, setProofRemark] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  // Submission & Correction History Modal State
  const [activeHistoryAssignee, setActiveHistoryAssignee] = useState(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyTasks({
        limit: 100,
      });
      setAllAssignments(res.assignments || []);
    } catch (err) {
      console.error("Failed to fetch personal tasks:", err);
      toast.error("Failed to load your tasks");
    } finally {
      setLoading(false);
    }
  }, [getMyTasks]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const formatOrdinal = (num) => {
    if (!num) return "—";
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;
    return `${num}th`;
  };

  // Overall metric counts calculated from allAssignments
  const totalCount = allAssignments.length;
  const pendingCount = allAssignments.filter((a) => a.status === "PENDING").length;
  const inProgressCount = allAssignments.filter((a) => a.status === "IN_PROGRESS").length;
  const waitingApprovalCount = allAssignments.filter(
    (a) =>
      a.status === "WAITING_FOR_APPROVAL" ||
      a.status === "SUBMITTED" ||
      a.status === "UNDER_REVIEW"
  ).length;
  const completedCount = allAssignments.filter(
    (a) => a.status === "COMPLETED" || a.status === "APPROVED"
  ).length;
  const overdueCount = allAssignments.filter((a) => a.isOverdue).length;

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return allAssignments.filter((item) => {
      // Status filter
      if (statusFilter === "PENDING" && item.status !== "PENDING") return false;
      if (statusFilter === "IN_PROGRESS" && item.status !== "IN_PROGRESS") return false;
      if (
        statusFilter === "WAITING_FOR_APPROVAL" &&
        item.status !== "WAITING_FOR_APPROVAL" &&
        item.status !== "SUBMITTED" &&
        item.status !== "UNDER_REVIEW"
      )
        return false;
      if (
        statusFilter === "COMPLETED" &&
        item.status !== "COMPLETED" &&
        item.status !== "APPROVED"
      )
        return false;
      if (statusFilter === "OVERDUE" && !item.isOverdue) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const task = item.task || {};
        const titleMatch = (task.title || "").toLowerCase().includes(q);
        const descMatch = (task.description || "").toLowerCase().includes(q);
        const sourceMatch = (task.instructionSource || "").toLowerCase().includes(q);
        const priorityMatch = (task.priority || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !sourceMatch && !priorityMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allAssignments, statusFilter, search]);

  // Pagination calculation
  const totalItems = filteredAssignments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const paginatedAssignments = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredAssignments.slice(start, start + limit);
  }, [filteredAssignments, page, limit]);

  // Handle Start Task
  const handleStartTask = async (taskId) => {
    try {
      await startTask(taskId);
      toast.success("Task marked as in progress!");
      fetchAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start task");
    }
  };

  // Handle Submit for Approval (Requirement 3 & Multi-Round Revisions)
  const handleSubmitForApproval = async (item) => {
    const taskId = item.task?._id || item.task;
    const proofCount = item.proofs?.length || 0;
    const isResubmission = item.status === "REJECTED" || (item.submissionHistory?.length || 0) > 0;
    const nextRound = (item.submissionHistory?.length || 0) + 1;

    let confirmText = "Status will change to Submitted / Under Review for Director/Manager verification.";
    if (proofCount === 0) {
      confirmText = `You are submitting without attachments. Status will change to Submitted / Under Review (Round #${nextRound}).`;
    } else if (isResubmission) {
      confirmText = `Submitting correction (Round #${nextRound}) with ${proofCount} attachment(s). Status will change to Submitted / Under Review.`;
    }

    const { value: remark, isConfirmed } = await Swal.fire({
      title: isResubmission ? `Submit Correction (Round #${nextRound})?` : "Submit for Approval?",
      text: confirmText,
      input: "text",
      inputPlaceholder: "Optional submission note / summary of work...",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#3F3F46",
      confirmButtonText: "Yes, submit for approval",
    });

    if (isConfirmed) {
      try {
        await submitForApproval(taskId, { remark: remark?.trim() || undefined });
        toast.success(
          isResubmission
            ? `Correction (Round #${nextRound}) submitted for review!`
            : "Task submitted for management review! Status updated."
        );
        fetchAssignments();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to submit for approval");
      }
    }
  };

  // Handle Direct Complete
  const handleDirectComplete = async (taskId) => {
    const confirm = await Swal.fire({
      title: "Mark Task as Completed?",
      text: "Confirm that all instructions for this directive have been fully completed.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#3F3F46",
      confirmButtonText: "Yes, Mark Completed",
    });

    if (confirm.isConfirmed) {
      try {
        await completeTaskDirect(taskId);
        toast.success("Task completed successfully!");
        fetchAssignments();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to complete task");
      }
    }
  };

  // Handle Progress Update Save
  const handleSaveProgress = async () => {
    if (!activeTaskForModal) return;
    setModalLoading(true);
    try {
      await updateProgress(activeTaskForModal.task._id, {
        progress: progressVal,
        remark: progressRemark,
      });
      toast.success("Task progress updated successfully");
      setActiveTaskForModal(null);
      fetchAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update progress");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Proof Upload Save
  const handleSaveProof = async () => {
    if (!activeTaskForProof || !proofFile) {
      toast.warning("Please select a file to upload as proof");
      return;
    }

    setUploadingProof(true);
    try {
      const data = new FormData();
      const isImage = proofFile.type.startsWith("image/");
      const endpoint = isImage
        ? "/upload/image?folder=task-proofs"
        : "/upload/document?folder=task-proofs";
      const field = isImage ? "image" : "document";
      data.append(field, proofFile);

      const res = await axiosSecure.post(endpoint, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res?.data?.data?.url;
      if (url) {
        await uploadProof(activeTaskForProof.task._id, {
          name: proofFile.name,
          url,
          fileType: proofFile.type,
          size: proofFile.size,
          remark: proofRemark,
        });
        toast.success("Completion proof uploaded successfully!");
        setActiveTaskForProof(null);
        setProofFile(null);
        setProofRemark("");
        fetchAssignments();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload proof");
    } finally {
      setUploadingProof(false);
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Mtitle
          title="My Tasks & Directives"
          subtitle="Manage official instructions assigned to you. Update progress, upload proof of work, and track deadlines."
        />
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => fetchAssignments()}
            className="p-3 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 text-brand-dark-grey hover:text-brand-gold shadow-sm transition-all cursor-pointer inline-flex items-center justify-center"
            title="Refresh Tasks"
          >
            <FiRefreshCw className={`text-base ${loading ? "animate-spin text-brand-gold" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 STAT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold shrink-0">
            <MdAssignment />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Total Assigned
            </span>
            <p className="text-2xl font-black text-brand-black dark:text-brand-white mt-0.5">
              {totalCount}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              All directives assigned to you
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl font-bold shrink-0">
            <FiPlay />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              In Progress
            </span>
            <p className="text-2xl font-black text-blue-500 mt-0.5">
              {inProgressCount}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Tasks under active execution
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold shrink-0">
            <FiClock />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Awaiting Approval
            </span>
            <p className="text-2xl font-black text-amber-500 mt-0.5">
              {waitingApprovalCount}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Submitted for review
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold shrink-0">
            <FiCheckCircle />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Completed Tasks
            </span>
            <p className="text-2xl font-black text-emerald-500 mt-0.5">
              {completedCount}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Successfully finalized directives
            </p>
          </div>
        </motion.div>
      </div>

      {/* CONTROL BAR: SEARCH, STATUS TABS, LIMIT, VIEW TOGGLE */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Search Bar & Status Tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
            <input
              type="text"
              placeholder="Search by title, source, priority..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark-grey hover:text-brand-red text-xs transition-colors cursor-pointer"
                title="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige dark:border-brand-dark-grey w-full sm:w-auto overflow-x-auto">
            {[
              { label: "All", value: "all", count: totalCount },
              { label: "Pending", value: "PENDING", count: pendingCount },
              { label: "In Progress", value: "IN_PROGRESS", count: inProgressCount },
              { label: "Awaiting Approval", value: "WAITING_FOR_APPROVAL", count: waitingApprovalCount },
              { label: "Completed", value: "COMPLETED", count: completedCount },
              ...(overdueCount > 0 ? [{ label: "Overdue", value: "OVERDUE", count: overdueCount }] : []),
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === tab.value
                    ? "bg-brand-gold text-brand-midnight shadow-xs font-black"
                    : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-brand-white font-bold"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    statusFilter === tab.value
                      ? "bg-brand-midnight/20 text-brand-midnight font-black"
                      : "bg-brand-beige/40 dark:bg-brand-dark-grey/40 text-brand-dark-grey dark:text-brand-gold-light"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Items Per Page & View Mode Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Limit Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light hidden sm:inline">
              Show:
            </span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige dark:border-brand-dark-grey">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-brand-red text-white shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-brand-white"
              }`}
              title="Table View"
            >
              <FiList />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-brand-red text-white shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-brand-white"
              }`}
              title="Grid View"
            >
              <FiGrid />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT: LOADING, TABLE, OR GRID */}
      {loading ? (
        <SkeletonLoading type={viewMode === "table" ? "table" : "card"} />
      ) : paginatedAssignments.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal p-12 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-2xl font-bold">
            <MdPendingActions />
          </div>
          <h3 className="text-base font-black text-brand-black dark:text-brand-white">
            No Tasks Found
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light max-w-sm mx-auto font-medium">
            {search || statusFilter !== "all"
              ? "No directives matched your search or status criteria. Try clearing filters."
              : "You currently have no instructions assigned. You are completely up to date!"}
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-offwhite dark:bg-brand-midnight/60 border-b border-brand-beige/50 dark:border-brand-dark-grey/50 text-[11px] font-black uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider">
                  <th className="py-4 px-4 w-12 text-center">#</th>
                  <th className="py-4 px-4 text-left min-w-[260px]">Directive & Instruction</th>
                  <th className="py-4 px-4 text-center w-28">Priority</th>
                  <th className="py-4 px-4 text-center w-36">Progress</th>
                  <th className="py-4 px-4 text-center w-36">Deadline & Timing</th>
                  <th className="py-4 px-4 text-center w-36">Requirements</th>
                  <th className="py-4 px-4 text-center w-44">Status</th>
                  <th className="py-4 px-4 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs font-bold">
                {paginatedAssignments.map((item, idx) => {
                  const task = item.task || {};
                  const sourceStyle =
                    SOURCE_COLORS[task.instructionSource] || SOURCE_COLORS["Management"];
                  const priorityBadge =
                    PRIORITY_BADGES[task.priority] || PRIORITY_BADGES["MEDIUM"];
                  const statusBadge = STATUS_BADGES[item.status] || STATUS_BADGES["PENDING"];
                  const proofsCount = item.proofs?.length || 0;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-center text-brand-dark-grey align-middle font-bold">
                        {(page - 1) * limit + idx + 1}
                      </td>

                      {/* Directive & Source */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${sourceStyle}`}
                            >
                              {task.instructionSource}
                            </span>
                            <Link
                              href={`/dashboard/tasks/${task._id}`}
                              className="font-black text-sm text-brand-black dark:text-brand-white hover:text-brand-gold transition-colors block"
                            >
                              {task.title}
                            </Link>
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light/80 font-normal line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          {item.rejectionReason && (
                            <div className="text-[10px] text-red-500 font-bold bg-red-500/10 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                              <span>Revision: {item.rejectionReason}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <span
                          className={`inline-block text-[9px] font-black uppercase px-2.5 py-1 rounded-xl ${priorityBadge}`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <div className="space-y-1 w-28 mx-auto">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-brand-dark-grey font-medium">Progress</span>
                            <span className="font-mono font-black text-brand-black dark:text-brand-white">
                              {item.progress || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-brand-beige/40 dark:bg-brand-midnight rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-brand-gold h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Deadline & Urgency */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-brand-black dark:text-brand-white block">
                            {task.deadline
                              ? new Date(task.deadline).toLocaleDateString()
                              : "—"}
                          </span>
                          <span
                            className={`text-[10px] font-black block ${
                              item.isOverdue
                                ? "text-red-500"
                                : item.daysRemaining === 0
                                ? "text-amber-500"
                                : "text-emerald-500"
                            }`}
                          >
                            {item.deadlineText || "On schedule"}
                          </span>
                        </div>
                      </td>

                      {/* Proof & Approval */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {task.completionProofRequired && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-brand-gold/10 text-brand-gold font-bold">
                              <FiUploadCloud className="text-xs" />
                              <span>{proofsCount} proof(s)</span>
                            </span>
                          )}
                          {task.approvalRequired && (
                            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 font-bold">
                              Approval Req.
                            </span>
                          )}
                          {!task.completionProofRequired && !task.approvalRequired && (
                            <span className="text-[10px] text-brand-dark-grey font-medium">Direct Task</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <div className="inline-flex flex-col items-center justify-center space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${statusBadge}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{item.status.replace(/_/g, " ")}</span>
                          </span>

                          {/* Submission metadata & History */}
                          {(item.lastSubmittedAt || item.submittedAt) && (
                            <div className="text-[10px] text-brand-dark-grey font-mono space-y-0.5 text-center">
                              <div>
                                Last: {new Date(item.lastSubmittedAt || item.submittedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveHistoryAssignee(item)}
                                className="text-brand-gold hover:underline cursor-pointer inline-flex items-center justify-center gap-1 font-bold"
                              >
                                <MdOutlineHistory className="text-xs" />
                                <span>
                                  {item.submissionHistory?.length > 1
                                    ? `Round #${item.submissionHistory.length} (History)`
                                    : "View Submission"}
                                </span>
                              </button>
                              {item.submissionRank && (
                                <div className="text-amber-600 font-bold">
                                  Rank: {formatOrdinal(item.submissionRank)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Work Quality Rating */}
                          {(item.status === "APPROVED" || item.status === "COMPLETED") &&
                            item.rating !== undefined &&
                            item.rating !== null && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <FiAward className="text-xs" /> Rating: {item.rating}%
                              </div>
                            )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {(item.submissionHistory?.length > 0 || item.submittedAt) && (
                            <button
                              type="button"
                              onClick={() => setActiveHistoryAssignee(item)}
                              className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-all cursor-pointer inline-flex items-center justify-center"
                              title="View Submission & Correction History"
                            >
                              <MdOutlineHistory className="text-sm" />
                            </button>
                          )}

                          {item.status === "PENDING" && (
                            <button
                              onClick={() => handleStartTask(task._id)}
                              className="p-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Start Task"
                            >
                              <FiPlay className="text-sm" />
                            </button>
                          )}

                          {(item.status === "IN_PROGRESS" || item.status === "PENDING") && (
                            <button
                              onClick={() => {
                                setActiveTaskForModal(item);
                                setProgressVal(item.progress || 0);
                                setProgressRemark("");
                              }}
                              className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Update Progress"
                            >
                              <FiClock className="text-sm" />
                            </button>
                          )}

                          {task.completionProofRequired && item.status !== "COMPLETED" && item.status !== "APPROVED" && (
                            <button
                              onClick={() => setActiveTaskForProof(item)}
                              className="p-2 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                              title={`Upload Proof (${proofsCount})`}
                            >
                              <FiUploadCloud className="text-sm" />
                            </button>
                          )}

                          {item.status === "IN_PROGRESS" && (
                            <>
                              {task.approvalRequired ? (
                                <button
                                  onClick={() => handleSubmitForApproval(item)}
                                  className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="Submit for Approval"
                                >
                                  <FiSend className="text-sm" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDirectComplete(task._id)}
                                  className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="Mark Completed"
                                >
                                  <FiCheckCircle className="text-sm" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginatedAssignments.map((item) => {
            const task = item.task || {};
            const sourceStyle =
              SOURCE_COLORS[task.instructionSource] || SOURCE_COLORS["Management"];
            const priorityBadge =
              PRIORITY_BADGES[task.priority] || PRIORITY_BADGES["MEDIUM"];
            const statusBadge = STATUS_BADGES[item.status] || STATUS_BADGES["PENDING"];
            const proofsCount = item.proofs?.length || 0;

            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:shadow-md hover:border-brand-gold/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${sourceStyle}`}
                      >
                        {task.instructionSource}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${priorityBadge}`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${statusBadge}`}
                      >
                        {item.status.replace(/_/g, " ")}
                      </span>
                      {(item.status === "APPROVED" || item.status === "COMPLETED") &&
                        item.rating !== undefined &&
                        item.rating !== null && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 font-mono">
                            <FiAward className="text-[10px]" /> {item.rating}%
                          </span>
                        )}
                      {item.submissionRank && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30 font-mono">
                          {formatOrdinal(item.submissionRank)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <Link
                      href={`/dashboard/tasks/${task._id}`}
                      className="text-base font-black text-brand-black dark:text-brand-white hover:text-brand-gold transition-colors line-clamp-2"
                    >
                      {task.title}
                    </Link>
                    <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light/80 mt-1 line-clamp-2 leading-relaxed">
                      {task.description || "No description provided."}
                    </p>
                  </div>

                  {/* Progress Bar & Status */}
                  <div className="space-y-1.5 pt-2 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-brand-dark-grey">My Progress</span>
                      <span className="text-brand-black dark:text-brand-white font-mono font-black">
                        {item.progress || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-brand-beige/30 dark:bg-brand-midnight rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-gold h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Deadline & Smart Urgency */}
                  <div className="flex items-center justify-between text-xs bg-brand-offwhite dark:bg-brand-midnight p-3 rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
                    <div className="flex items-center gap-1.5 text-brand-dark-grey">
                      <FiCalendar className="text-brand-gold text-xs" />
                      <span>
                        {task.deadline
                          ? new Date(task.deadline).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>

                    <span
                      className={`font-black text-[11px] ${
                        item.isOverdue
                          ? "text-red-500 font-extrabold"
                          : item.daysRemaining === 0
                          ? "text-amber-500 font-extrabold"
                          : "text-emerald-500"
                      }`}
                    >
                      {item.deadlineText}
                    </span>
                  </div>

                  {/* Rejection / Revision alert */}
                  {item.rejectionReason && (
                    <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 flex items-center justify-between gap-2">
                      <div>
                        <strong>Revision Notice:</strong> {item.rejectionReason}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveHistoryAssignee(item)}
                        className="text-[10px] underline font-black text-red-700 hover:text-red-900 shrink-0 cursor-pointer"
                      >
                        History
                      </button>
                    </div>
                  )}

                  {/* Submission & Correction History Banner */}
                  {(item.lastSubmittedAt || item.submittedAt || (item.submissionHistory?.length || 0) > 0) && (
                    <div className="flex items-center justify-between text-[11px] bg-brand-offwhite dark:bg-brand-midnight p-2.5 rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
                      <div className="flex items-center gap-1.5 text-brand-dark-grey">
                        <FiClock className="text-brand-gold text-xs" />
                        <span>
                          Last Submitted:{" "}
                          <strong className="text-brand-black dark:text-brand-white">
                            {new Date(item.lastSubmittedAt || item.submittedAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveHistoryAssignee(item)}
                        className="px-2 py-0.5 rounded-lg bg-brand-gold/15 text-brand-gold hover:bg-brand-gold hover:text-brand-black text-[10px] font-black transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <MdOutlineHistory />
                        <span>
                          {item.submissionHistory?.length || 1}{" "}
                          {(item.submissionHistory?.length || 1) === 1 ? "Submit" : "Submits"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex-wrap">
                  {item.status === "PENDING" && (
                      <button
                        onClick={() => handleStartTask(task._id)}
                        className="px-3.5 py-2 rounded-xl bg-blue-500 text-white text-xs font-black shadow-xs hover:bg-blue-600 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <FiPlay /> Start
                      </button>
                    )}

                    {(item.status === "IN_PROGRESS" || item.status === "PENDING") && (
                      <button
                        onClick={() => {
                          setActiveTaskForModal(item);
                          setProgressVal(item.progress || 0);
                          setProgressRemark("");
                        }}
                        className="px-3 py-2 rounded-xl bg-brand-gold text-brand-midnight text-xs font-black shadow-xs hover:bg-brand-gold-light transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <FiClock /> Progress
                      </button>
                    )}

                    {task.completionProofRequired && item.status !== "COMPLETED" && item.status !== "APPROVED" && (
                      <button
                        onClick={() => setActiveTaskForProof(item)}
                        className="px-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-gold/60 text-brand-gold text-xs font-extrabold hover:bg-brand-gold/10 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <FiUploadCloud /> Proof ({proofsCount})
                      </button>
                    )}

                    {item.status === "IN_PROGRESS" && (
                      <>
                        {task.approvalRequired ? (
                          <button
                            onClick={() => handleSubmitForApproval(item)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black shadow-xs hover:bg-emerald-600 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <FiSend /> Submit
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDirectComplete(task._id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black shadow-xs hover:bg-emerald-600 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <FiCheckCircle /> Complete
                          </button>
                        )}
                      </>
                    )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* PAGINATION COMPONENT */}
      {!loading && filteredAssignments.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* PROGRESS UPDATE MODAL */}
      <AnimatePresence>
        {activeTaskForModal && (
          <div className="fixed inset-0 z-50 bg-brand-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-base font-bold">
                    <FiClock />
                  </div>
                  <h4 className="font-extrabold text-sm text-brand-black dark:text-brand-white">
                    Update Task Progress
                  </h4>
                </div>
                <button
                  onClick={() => setActiveTaskForModal(null)}
                  className="text-brand-dark-grey hover:text-brand-red cursor-pointer p-1"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light truncate font-bold">
                {activeTaskForModal.task.title}
              </p>

              {/* Slider & Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Progress Percentage:</span>
                  <span className="text-brand-gold text-base font-black">{progressVal}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressVal}
                  onChange={(e) => setProgressVal(parseInt(e.target.value, 10))}
                  className="w-full accent-brand-gold cursor-pointer"
                />

                {/* Quick Presets */}
                <div className="flex items-center justify-between gap-1">
                  {[0, 25, 50, 75, 90, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setProgressVal(val)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                        progressVal === val
                          ? "bg-brand-gold text-brand-midnight shadow-xs"
                          : "bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white"
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Remark */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light">
                  Progress Note / Remarks
                </label>
                <textarea
                  rows={3}
                  value={progressRemark}
                  onChange={(e) => setProgressRemark(e.target.value)}
                  placeholder="e.g. Uniform fabric received. Stitching is currently underway."
                  className="w-full p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none transition-all"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                <button
                  type="button"
                  onClick={() => setActiveTaskForModal(null)}
                  className="px-4 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold text-brand-dark-grey hover:text-brand-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={modalLoading}
                  onClick={handleSaveProgress}
                  className="px-5 py-2 rounded-2xl bg-brand-gold text-brand-midnight text-xs font-black shadow-md hover:bg-brand-gold-light transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {modalLoading && <FiLoader className="animate-spin text-xs" />}
                  <span>{modalLoading ? "Saving..." : "Save Progress"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reusable Multi-Proof Submission Modal (Requirement 2) */}
      <ProofSubmissionModal
        isOpen={!!activeTaskForProof}
        onClose={() => setActiveTaskForProof(null)}
        task={activeTaskForProof?.task}
        onSuccess={fetchAssignments}
      />

      {/* Submission & Correction History Modal */}
      <SubmissionHistoryModal
        isOpen={Boolean(activeHistoryAssignee)}
        onClose={() => setActiveHistoryAssignee(null)}
        assigneeRecord={activeHistoryAssignee}
        taskTitle={activeHistoryAssignee?.task?.title || "Directive Submission"}
      />
    </div>
  );
}
