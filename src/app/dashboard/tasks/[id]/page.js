"use client";

import React, { useState, useEffect, useCallback, useContext, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useTaskApi from "@/hooks/useTaskApi";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import { AuthContext } from "@/providers/AuthProvider";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import ProofSubmissionModal from "@/components/tasks/ProofSubmissionModal";
import TaskApprovalModal from "@/components/tasks/TaskApprovalModal";
import SubmissionHistoryModal from "@/components/tasks/SubmissionHistoryModal";
import {
  FiArrowLeft,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiAlertTriangle,
  FiPaperclip,
  FiUploadCloud,
  FiPlay,
  FiSend,
  FiXCircle,
  FiShield,
  FiActivity,
  FiUsers,
  FiFileText,
  FiEdit,
  FiX,
  FiDownload,
  FiCheck,
  FiAward,
  FiStar,
  FiTrendingUp,
  FiTrendingDown,
  FiLayers,
  FiPlus,
  FiTrash2,
  FiExternalLink,
} from "react-icons/fi";
import { MdAssignment, MdHistory, MdPriorityHigh, MdOutlineHistory } from "react-icons/md";

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
  SUBMITTED: "bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold",
  UNDER_REVIEW: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold",
  WAITING_FOR_APPROVAL: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black",
  COMPLETED: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border border-red-500/20 font-bold",
  OVERDUE: "bg-red-500/10 text-red-500 border border-red-500/20 font-black",
  CANCELLED: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 line-through",
};

export default function TaskDetailPage({ params }) {
  const unwrappedParams = use(params);
  const taskId = unwrappedParams.id;
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const { user } = useContext(AuthContext);

  const {
    getTaskById,
    startTask,
    updateProgress,
    uploadProof,
    batchUploadProofs,
    submitForApproval,
    approveTask,
    rejectTask,
    completeTaskDirect,
    extendDeadline,
    cancelTask,
    addSubtask,
    deleteSubtask,
  } = useTaskApi();

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);

  // Modals state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressVal, setProgressVal] = useState(50);
  const [progressRemark, setProgressRemark] = useState("");

  const [showProofModal, setShowProofModal] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofRemark, setProofRemark] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  // Reusable Approval Modal State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAssigneeForApproval, setSelectedAssigneeForApproval] = useState(null);
  const [selectedSubtaskIdForApproval, setSelectedSubtaskIdForApproval] = useState(null);

  // Reusable Submission History Modal State
  const [activeHistoryAssignee, setActiveHistoryAssignee] = useState(null);

  // Reusable Proof Submission Modal State
  const [showProofSubmissionModal, setShowProofSubmissionModal] = useState(false);
  const [selectedSubtaskIdForProof, setSelectedSubtaskIdForProof] = useState(null);

  // Add Subtask Modal State
  const [showAddSubtaskModal, setShowAddSubtaskModal] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    deadline: "",
    assigneeIds: [],
  });

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");
  const [extendReason, setExtendReason] = useState("");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedAssigneeForReject, setSelectedAssigneeForReject] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const formatOrdinal = (num) => {
    if (!num) return "—";
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;
    return `${num}th`;
  };

  const fetchTask = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTaskById(taskId);
      setTask(data);
    } catch (err) {
      console.error("Failed to load task:", err);
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  }, [taskId, getTaskById]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  if (loading || !task) {
    return (
      <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
        <SkeletonLoading count={5} />
      </div>
    );
  }

  const isManagerOrAdmin =
    user?.role === "superadmin" ||
    user?.role === "admin" ||
    user?.role === "director" ||
    user?.role === "manager" ||
    user?.role === "md";

  const myAssigneeRecord = task.assignees?.find(
    (a) => (a.employee?._id || a.employee)?.toString() === user?.id
  );

  const sourceStyle = SOURCE_COLORS[task.instructionSource] || SOURCE_COLORS["Management"];
  const priorityBadge = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES["MEDIUM"];
  const statusBadge = STATUS_BADGES[task.status] || STATUS_BADGES["PENDING"];

  const now = new Date();
  const deadlineDate = new Date(task.deadline);
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Handle Start Task
  const handleStart = async () => {
    try {
      await startTask(task._id);
      toast.success("Task marked as in progress!");
      fetchTask();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start task");
    }
  };

  // Handle Submit Progress
  const handleSaveProgress = async () => {
    setActionLoading(true);
    try {
      await updateProgress(task._id, { progress: progressVal, remark: progressRemark });
      toast.success("Progress updated successfully!");
      setShowProgressModal(false);
      fetchTask();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update progress");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Save Proof
  const handleSaveProof = async () => {
    if (!proofFile) {
      toast.warning("Please select a file to upload as proof");
      return;
    }
    setUploadingProof(true);
    try {
      const data = new FormData();
      const isImage = proofFile.type.startsWith("image/");
      const endpoint = isImage ? "/upload/image?folder=task-proofs" : "/upload/document?folder=task-proofs";
      const field = isImage ? "image" : "document";
      data.append(field, proofFile);

      const res = await axiosSecure.post(endpoint, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res?.data?.data?.url;
      if (url) {
        await uploadProof(task._id, {
          name: proofFile.name,
          url,
          fileType: proofFile.type,
          size: proofFile.size,
          remark: proofRemark,
        });
        toast.success("Completion proof uploaded successfully!");
        setShowProofModal(false);
        setProofFile(null);
        setProofRemark("");
        fetchTask();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Proof upload failed");
    } finally {
      setUploadingProof(false);
    }
  };

  // Handle Submit for Approval
  const handleSubmitApproval = async () => {
    if (task.completionProofRequired && (!myAssigneeRecord?.proofs || myAssigneeRecord.proofs.length === 0)) {
      toast.warning("Completion proof is required before submitting for approval. Please upload proof.");
      return;
    }

    try {
      await submitForApproval(task._id);
      toast.success("Task submitted for management approval!");
      fetchTask();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit for approval");
    }
  };

  // Handle Direct Complete
  const handleDirectComplete = async () => {
    try {
      await completeTaskDirect(task._id);
      toast.success("Task marked complete!");
      fetchTask();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to complete task");
    }
  };

  // Open Reusable Approval Modal
  const openApprovalModal = (assigneeRecord, subtaskId = null) => {
    setSelectedAssigneeForApproval(assigneeRecord);
    setSelectedSubtaskIdForApproval(subtaskId);
    setShowApprovalModal(true);
  };

  // Subtask Management Handlers (Requirement 1)
  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.title.trim()) {
      toast.warning("Please enter a subtask title");
      return;
    }
    setActionLoading(true);
    try {
      await addSubtask(task._id, newSubtask);
      toast.success("Subtask item added successfully!");
      setShowAddSubtaskModal(false);
      setNewSubtask({ title: "", description: "", priority: "MEDIUM", deadline: "", assigneeIds: [] });
      fetchTask();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add subtask");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    const confirm = await Swal.fire({
      title: "Delete Subtask?",
      text: "Are you sure you want to remove this subtask item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#3F3F46",
      confirmButtonText: "Yes, Delete",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteSubtask(task._id, subtaskId);
        toast.success("Subtask item removed!");
        fetchTask();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to delete subtask");
      }
    }
  };

  // Handle Reject
  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      toast.warning("Please provide a reason for revision / rejection");
      return;
    }
    setActionLoading(true);
    try {
      await rejectTask(task._id, {
        reason: rejectReason,
        assigneeEmployeeId: selectedAssigneeForReject,
      });
      toast.success("Task returned to in-progress status with feedback");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedAssigneeForReject(null);
      fetchTask();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject task");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Extend Deadline
  const handleExtendConfirm = async () => {
    if (!newDeadline) {
      toast.warning("Please specify a new deadline date");
      return;
    }
    if (!extendReason.trim()) {
      toast.warning("Please provide an auditable reason for extending the deadline");
      return;
    }
    setActionLoading(true);
    try {
      await extendDeadline(task._id, {
        newDeadline,
        reason: extendReason,
      });
      toast.success("Deadline extended and recorded in audit history!");
      setShowExtendModal(false);
      setNewDeadline("");
      setExtendReason("");
      fetchTask();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to extend deadline");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Task
  const handleCancelTask = async () => {
    const { value: reason } = await Swal.fire({
      title: "Cancel Management Instruction?",
      input: "textarea",
      inputLabel: "Cancellation Reason (Required)",
      inputPlaceholder: "State reason for cancelling this directive...",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#3F3F46",
      confirmButtonText: "Cancel Directive",
      inputValidator: (val) => {
        if (!val || !val.trim()) return "Cancellation reason is required!";
      },
    });

    if (reason) {
      try {
        await cancelTask(task._id, { reason });
        toast.success("Directive cancelled and archived in history");
        fetchTask();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to cancel task");
      }
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/tasks")}
          className="flex items-center gap-1.5 text-xs font-black text-brand-dark-grey hover:text-brand-gold transition-colors cursor-pointer"
        >
          <FiArrowLeft /> Back to Directory
        </button>

        {isManagerOrAdmin && task.status !== "CANCELLED" && task.status !== "COMPLETED" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewDeadline(new Date(task.deadline).toISOString().slice(0, 16));
                setShowExtendModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-bold hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
            >
              Extend Deadline
            </button>
            <button
              onClick={handleCancelTask}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 text-xs font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            >
              Cancel Directive
            </button>
          </div>
        )}
      </div>

      {/* Main Directive Overview Banner */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-6 sm:p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-6">
        {/* Source & Badges */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-black uppercase px-3 py-1 rounded-xl border ${sourceStyle}`}
            >
              Instruction By: {task.instructionSource}
            </span>
            {task.instructionSourceCustom && (
              <span className="text-xs font-bold text-brand-dark-grey bg-brand-offwhite dark:bg-brand-midnight px-3 py-1 rounded-xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
                Spoken By: {task.instructionSourceCustom}
              </span>
            )}
            <span
              className={`text-xs font-black uppercase px-3 py-1 rounded-full ${priorityBadge}`}
            >
              Priority: {task.priority}
            </span>
            <span
              className={`text-xs font-black uppercase px-3 py-1 rounded-full ${statusBadge}`}
            >
              Status: {task.status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
              Issued By User
            </span>
            <span className="font-extrabold text-xs text-brand-black dark:text-brand-white">
              {task.issuedBy?.name || "Management"} ({task.issuedBy?.role || "Staff"})
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-brand-black dark:text-brand-white leading-tight">
          {task.title}
        </h1>

        {/* Description */}
        <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs text-brand-black dark:text-brand-white leading-relaxed font-medium">
          {task.description}
        </div>

        {/* Key Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/30 dark:border-brand-dark-grey/30">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
              Target Branch
            </span>
            <span className="text-xs font-black text-brand-black dark:text-brand-white mt-0.5 block">
              {task.branch}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/30 dark:border-brand-dark-grey/30">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
              Department
            </span>
            <span className="text-xs font-black text-brand-black dark:text-brand-white mt-0.5 block">
              {task.department}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/30 dark:border-brand-dark-grey/30">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
              Instruction Date
            </span>
            <span className="text-xs font-black text-brand-black dark:text-brand-white mt-0.5 block">
              {new Date(task.instructionDate).toLocaleDateString()}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/30 dark:border-brand-dark-grey/30">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-red block">
              Deadline
            </span>
            <span className="text-xs font-black text-brand-black dark:text-brand-white mt-0.5 block">
              {deadlineDate.toLocaleString()}
            </span>
            <span
              className={`text-[10px] font-extrabold block mt-0.5 ${
                task.isOverdue
                  ? "text-red-500"
                  : diffDays === 0
                  ? "text-amber-500"
                  : "text-emerald-500"
              }`}
            >
              {task.isOverdue
                ? `Overdue by ${Math.abs(diffDays)}d`
                : diffDays === 0
                ? "Due Today"
                : `${diffDays} days left`}
            </span>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span>Overall Directive Progress</span>
            <span className="text-brand-gold font-mono">{task.progress || 0}%</span>
          </div>
          <div className="w-full bg-brand-beige/30 dark:bg-brand-midnight rounded-full h-3 overflow-hidden">
            <div
              className="bg-brand-gold h-full rounded-full transition-all duration-300"
              style={{ width: `${task.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Assigned Staff Actions (if current user is assigned) */}
        {myAssigneeRecord && task.status !== "CANCELLED" && (
          <div className="p-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-extrabold text-xs text-brand-black dark:text-brand-white block">
                My Assignment: {myAssigneeRecord.status.replace(/_/g, " ")} ({myAssigneeRecord.progress}%)
              </span>
              <span className="text-[11px] text-brand-dark-grey">
                {myAssigneeRecord.status === "PENDING"
                  ? "You have not started this task yet."
                  : myAssigneeRecord.status === "WAITING_FOR_APPROVAL"
                  ? "Waiting for management approval."
                  : myAssigneeRecord.status === "COMPLETED"
                  ? "You have completed this task!"
                  : "In progress. Keep your progress and proof updated."}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {myAssigneeRecord.status === "PENDING" && (
                <button
                  onClick={handleStart}
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FiPlay /> Start Task
                </button>
              )}

              {(myAssigneeRecord.status === "IN_PROGRESS" || myAssigneeRecord.status === "PENDING") && (
                <button
                  onClick={() => {
                    setProgressVal(myAssigneeRecord.progress || 0);
                    setProgressRemark("");
                    setShowProgressModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-gold text-brand-black text-xs font-black hover:bg-brand-gold-light transition-all cursor-pointer"
                >
                  Update Progress
                </button>
              )}

              {task.completionProofRequired && myAssigneeRecord.status !== "COMPLETED" && myAssigneeRecord.status !== "APPROVED" && (
                <button
                  onClick={() => {
                    setSelectedSubtaskIdForProof(null);
                    setShowProofSubmissionModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-gold/60 text-brand-gold text-xs font-extrabold hover:bg-brand-gold/10 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FiUploadCloud /> Submit Proof ({myAssigneeRecord.proofs?.length || 0})
                </button>
              )}

              {myAssigneeRecord.status === "IN_PROGRESS" && (
                <>
                  {task.approvalRequired ? (
                    <button
                      onClick={() => {
                        if (task.completionProofRequired && (!myAssigneeRecord.proofs || myAssigneeRecord.proofs.length === 0)) {
                          toast.info("Please attach proof files before submitting for approval.");
                          setShowProofSubmissionModal(true);
                        } else {
                          handleSubmitApproval();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-extrabold hover:bg-emerald-600 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiSend /> Submit Approval
                    </button>
                  ) : (
                    <button
                      onClick={handleDirectComplete}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-extrabold hover:bg-emerald-600 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiCheckCircle /> Mark Complete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 1. SUBTASKS BREAKDOWN (Requirement 1) */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
              <FiLayers className="text-brand-gold text-lg" /> Subtasks / Directive Items ({task.items?.length || 0})
            </h3>
            <p className="text-[11px] text-brand-dark-grey mt-0.5">
              Individual operational items, sub-deliverables, and deadlines under this directive.
            </p>
          </div>

          {isManagerOrAdmin && (
            <button
              type="button"
              onClick={() => setShowAddSubtaskModal(true)}
              className="px-4 py-2 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/40 text-xs font-black hover:bg-brand-gold hover:text-brand-black transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <FiPlus />
              <span>Add Subtask Item</span>
            </button>
          )}
        </div>

        {task.items && task.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {task.items.map((sub, sIdx) => {
              const subBadge = STATUS_BADGES[sub.status] || STATUS_BADGES["PENDING"];
              return (
                <div
                  key={sub._id || sIdx}
                  className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-5 h-5 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] font-black flex items-center justify-center">
                          {sIdx + 1}
                        </span>
                        <span className="font-extrabold text-xs text-brand-black dark:text-brand-white">
                          {sub.title}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                          {sub.priority}
                        </span>
                      </div>
                      {sub.description && (
                        <p className="text-[11px] text-brand-dark-grey line-clamp-2 pl-7">
                          {sub.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${subBadge}`}>
                        {sub.status.replace(/_/g, " ")}
                      </span>
                      {isManagerOrAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(sub._id)}
                          className="p-1 text-brand-dark-grey hover:text-brand-red rounded-lg transition-colors cursor-pointer"
                          title="Delete Subtask"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-brand-dark-grey font-mono pt-1 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
                    <span>Assignees: {sub.assignees?.length || "All Task Staff"}</span>
                    {sub.deadline && (
                      <span>Deadline: {new Date(sub.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 text-center text-xs text-brand-dark-grey">
            No subtask items defined. This is tracked as a single directive assignment.
          </div>
        )}
      </div>

      {/* 2. TASK-LEVEL EMPLOYEE COMPARISON & LEADERBOARD (Requirements 6, 7 & 10) */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
                <FiAward className="text-brand-gold text-lg" /> Multi-Employee Comparison & Submission Leaderboard
              </h3>
              <p className="text-[11px] text-brand-dark-grey mt-0.5">
                Comparative performance evaluation across all {task.assignees.length} employees assigned to this directive.
              </p>
            </div>
          </div>

          {/* Metric Highlights */}
          {task.comparativeAnalytics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Started First */}
              <div className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
                  Started First
                </span>
                <div className="font-black text-xs text-brand-black dark:text-brand-white mt-1 truncate">
                  {task.comparativeAnalytics.startedFirst?.employee?.name || "—"}
                </div>
                {task.comparativeAnalytics.startedFirst?.time && (
                  <span className="text-[9px] text-brand-dark-grey font-mono block mt-0.5">
                    {new Date(task.comparativeAnalytics.startedFirst.time).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Submitted First (1st place) */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 flex items-center gap-1">
                  <FiAward /> 1st to Submit
                </span>
                <div className="font-black text-xs text-brand-black dark:text-brand-white mt-1 truncate">
                  {task.comparativeAnalytics.submittedFirst?.employee?.name || "—"}
                </div>
                {task.comparativeAnalytics.submittedFirst?.time && (
                  <span className="text-[9px] text-amber-600 font-mono block mt-0.5">
                    {new Date(task.comparativeAnalytics.submittedFirst.time).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Submitted Last */}
              <div className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
                  Submitted Last
                </span>
                <div className="font-black text-xs text-brand-black dark:text-brand-white mt-1 truncate">
                  {task.comparativeAnalytics.submittedLast?.employee?.name || "—"}
                </div>
                {task.comparativeAnalytics.submittedLast?.time && (
                  <span className="text-[9px] text-brand-dark-grey font-mono block mt-0.5">
                    {new Date(task.comparativeAnalytics.submittedLast.time).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Highest Rating */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                  <FiTrendingUp /> Top Quality Rating
                </span>
                <div className="font-black text-xs text-emerald-600 mt-1 truncate">
                  {task.comparativeAnalytics.highestRated?.rating !== undefined && task.comparativeAnalytics.highestRated?.rating !== null
                    ? `${task.comparativeAnalytics.highestRated.rating}% (${task.comparativeAnalytics.highestRated.employee?.name || "Staff"})`
                    : "—"}
                </div>
              </div>

              {/* Lowest Rating */}
              <div className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey flex items-center gap-1">
                  <FiTrendingDown /> Lowest Rating
                </span>
                <div className="font-black text-xs text-brand-dark-grey mt-1 truncate">
                  {task.comparativeAnalytics.lowestRated?.rating !== undefined && task.comparativeAnalytics.lowestRated?.rating !== null
                    ? `${task.comparativeAnalytics.lowestRated.rating}% (${task.comparativeAnalytics.lowestRated.employee?.name || "Staff"})`
                    : "—"}
                </div>
              </div>

              {/* Timeliness Ratio */}
              <div className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
                  On-Time vs Late
                </span>
                <div className="font-mono font-black text-xs mt-1 flex items-center gap-1.5">
                  <span className="text-emerald-500">{task.comparativeAnalytics.onTimeCount || 0} On-Time</span>
                  <span className="text-brand-dark-grey">/</span>
                  <span className="text-red-500">{task.comparativeAnalytics.lateCount || 0} Late</span>
                </div>
              </div>
            </div>
          )}

          {/* Ranked Employee Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/70 dark:bg-brand-midnight/70 text-[10px] font-black uppercase tracking-wider text-brand-dark-grey">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Started</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Timeliness</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Quality Rating</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
                {task.assignees.map((a, idx) => {
                  const emp = a.employee || {};
                  const badge = STATUS_BADGES[a.status] || STATUS_BADGES["PENDING"];
                  const isFirst = a.submissionRank === 1;
                  const isSecond = a.submissionRank === 2;
                  const isThird = a.submissionRank === 3;

                  return (
                    <tr
                      key={a._id || idx}
                      className="hover:bg-brand-offwhite/40 dark:hover:bg-brand-midnight/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-black">
                        {a.submissionRank ? (
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-mono text-xs font-black ${
                              isFirst
                                ? "bg-amber-400 text-black shadow-md shadow-amber-400/30"
                                : isSecond
                                ? "bg-slate-300 text-black"
                                : isThird
                                ? "bg-amber-700/20 text-amber-700 dark:text-amber-400"
                                : "bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey"
                            }`}
                          >
                            {formatOrdinal(a.submissionRank)}
                          </span>
                        ) : (
                          <span className="text-brand-dark-grey text-[10px] font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-gold/20 text-brand-gold font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                            {emp.photo ? (
                              <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{emp.name?.charAt(0) || "U"}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-brand-black dark:text-brand-white">
                              {emp.name}
                            </div>
                            <div className="text-[10px] text-brand-dark-grey font-mono">
                              {emp.employeeId || "Staff"} • {emp.department || "General"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-brand-dark-grey">
                        {a.startedAt ? new Date(a.startedAt).toLocaleDateString() : "Not Started"}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-brand-dark-grey">
                        {a.lastSubmittedAt || a.submittedAt ? (
                          <div>
                            <div>
                              {new Date(a.lastSubmittedAt || a.submittedAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveHistoryAssignee(a)}
                              className="text-[10px] text-brand-gold hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <MdOutlineHistory />
                              <span>Round #{a.submissionHistory?.length || 1}</span>
                            </button>
                          </div>
                        ) : (
                          "Pending"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            a.isLate
                              ? "bg-red-500/10 text-red-500"
                              : a.isOnTime
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-gray-500/10 text-gray-500"
                          }`}
                        >
                          {a.isLate ? "Late" : a.isOnTime ? "On-Time" : "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${badge}`}>
                          {a.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-xs">
                        {a.rating !== undefined && a.rating !== null ? (
                          <span className="text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <FiAward className="text-xs" /> {a.rating}%
                          </span>
                        ) : (
                          <span className="text-brand-dark-grey text-[10px]">Unrated</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {(a.submissionHistory?.length > 0 || a.submittedAt) && (
                          <button
                            type="button"
                            onClick={() => setActiveHistoryAssignee(a)}
                            className="p-1.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey hover:text-brand-gold border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs inline-flex items-center gap-1 cursor-pointer"
                            title="View Submission & Revision History"
                          >
                            <MdOutlineHistory className="text-xs" />
                          </button>
                        )}
                        {isManagerOrAdmin && (
                          <button
                            type="button"
                            onClick={() => openApprovalModal(a)}
                            className="px-3 py-1 rounded-xl bg-brand-gold text-brand-black text-[11px] font-black hover:bg-brand-gold-light transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                          >
                            <FiAward />
                            <span>{a.rating !== null && a.rating !== undefined ? "Re-evaluate" : "Review & Rate"}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid: Assignees & Proofs (Left) + Auditable Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Assignees and Proofs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignees Detailed Cards */}
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
              <FiUsers className="text-brand-gold text-lg" /> Assigned Staff Independent Tracking ({task.assignees?.length || 0})
            </h3>

            <div className="space-y-3">
              {task.assignees?.map((a) => {
                const emp = a.employee || {};
                const assigneeBadge = STATUS_BADGES[a.status] || STATUS_BADGES["PENDING"];
                return (
                  <div
                    key={a._id}
                    className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold font-bold text-sm flex items-center justify-center overflow-hidden shrink-0">
                          {emp.photo ? (
                            <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{emp.name?.charAt(0) || "U"}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-brand-black dark:text-brand-white flex items-center gap-2">
                            <span>{emp.name}</span>
                            {a.submissionRank && (
                              <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">
                                {formatOrdinal(a.submissionRank)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-brand-dark-grey font-mono font-bold">
                            {emp.employeeId || "Staff"} • {emp.department || "General"} • {emp.branch || "Branch"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {a.rating !== undefined && a.rating !== null && (
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                            <FiAward className="text-xs" /> Rating: {a.rating}%
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${assigneeBadge}`}
                        >
                          {a.status.replace(/_/g, " ")}
                        </span>

                        {/* Approver Action button for manager */}
                        {isManagerOrAdmin && (
                          <button
                            type="button"
                            onClick={() => openApprovalModal(a)}
                            className="px-3 py-1 rounded-xl bg-brand-gold text-brand-black text-xs font-black hover:bg-brand-gold-light transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <FiAward />
                            <span>{a.rating !== undefined && a.rating !== null ? "Re-evaluate" : "Review & Rate"}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-brand-dark-grey">Progress</span>
                        <span>{a.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-brand-beige/30 dark:bg-brand-midnight rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand-gold h-full rounded-full transition-all"
                          style={{ width: `${a.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Timestamps Row */}
                    <div className="flex items-center gap-4 text-[10px] text-brand-dark-grey font-mono flex-wrap pt-1">
                      {a.startedAt && (
                        <span>Started: {new Date(a.startedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                      {a.submittedAt && (
                        <span>Submitted: {new Date(a.submittedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                      {a.completedAt && (
                        <span className="text-emerald-600 font-bold">Approved: {new Date(a.completedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                    </div>

                    {/* Latest Remark */}
                    {a.latestRemark && (
                      <div className="text-xs text-brand-dark-grey italic bg-brand-offwhite/80 dark:bg-brand-midnight/80 p-2.5 rounded-xl border border-brand-beige/30 dark:border-brand-dark-grey/30">
                        &ldquo;{a.latestRemark}&rdquo;
                      </div>
                    )}

                    {/* Approval comments if recorded */}
                    {a.approvalComment && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                        <span className="font-bold">Manager Review Comment:</span> &ldquo;{a.approvalComment}&rdquo;
                      </div>
                    )}

                    {/* Proofs uploaded by this assignee */}
                    {a.proofs && a.proofs.length > 0 && (
                      <div className="pt-2 border-t border-brand-beige/20 dark:border-brand-dark-grey/20">
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold block mb-1">
                          Completion Proofs ({a.proofs.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {a.proofs.map((proof, pIdx) => (
                            <a
                              key={pIdx}
                              href={proof.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 text-[10px] font-bold text-brand-gold hover:border-brand-gold flex items-center gap-1.5"
                            >
                              <FiPaperclip />
                              <span className="truncate max-w-[140px]">{proof.name || `Proof #${pIdx + 1}`}</span>
                              <FiExternalLink className="text-[9px]" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attachments & Reference Documents */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
                <FiPaperclip className="text-brand-gold text-lg" /> Task Directives & Documents
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {task.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 hover:border-brand-gold/60 transition-all flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FiFileText className="text-brand-gold text-base shrink-0" />
                      <span className="font-extrabold truncate">{att.name}</span>
                    </div>
                    <FiDownload className="text-brand-dark-grey shrink-0 text-sm" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Deadline Change History (if any) */}
          {task.deadlineHistory && task.deadlineHistory.length > 0 && (
            <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
                <MdHistory className="text-brand-gold text-lg" /> Deadline Modification Audit
              </h3>

              <div className="space-y-2">
                {task.deadlineHistory.map((dh, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/30 dark:border-brand-dark-grey/30 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-red-500 line-through mr-2">
                        {new Date(dh.oldDeadline).toLocaleDateString()}
                      </span>
                      <span className="font-black text-emerald-500 mr-3">
                        → {new Date(dh.newDeadline).toLocaleDateString()}
                      </span>
                      <span className="text-brand-dark-grey">Reason: {dh.reason}</span>
                    </div>
                    <span className="text-[10px] text-brand-dark-grey font-mono">
                      By {dh.changedBy?.name || "Admin"} on {new Date(dh.changedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Auditable Timeline Stream */}
        <div className="space-y-6">
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
              <FiActivity className="text-brand-gold text-lg" /> Audit Timeline Stream
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {task.timeline?.map((event) => {
                const actor = event.actor || {};
                const eventColor =
                  event.eventType === "TASK_COMPLETED"
                    ? "text-emerald-500"
                    : event.eventType === "TASK_APPROVED"
                    ? "text-emerald-500"
                    : event.eventType === "TASK_REJECTED"
                    ? "text-red-500"
                    : event.eventType === "TASK_OVERDUE"
                    ? "text-red-500"
                    : event.eventType === "TASK_DEADLINE_EXTENDED"
                    ? "text-amber-500"
                    : "text-brand-gold";

                return (
                  <div
                    key={event._id}
                    className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/30 dark:border-brand-dark-grey/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-black text-[10px] uppercase tracking-wider ${eventColor}`}>
                        {event.eventType?.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-mono text-brand-dark-grey">
                        {new Date(event.timestamp).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="font-extrabold text-brand-black dark:text-brand-white">
                      {actor.name || "System"} ({actor.role || "Admin"})
                    </div>

                    {event.comment && (
                      <p className="text-[11px] text-brand-dark-grey leading-relaxed">
                        {event.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Update Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-brand-black dark:text-brand-white">
                Update Progress ({progressVal}%)
              </h4>
              <button onClick={() => setShowProgressModal(false)} className="text-brand-dark-grey hover:text-brand-red">
                <FiX />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressVal}
                onChange={(e) => setProgressVal(parseInt(e.target.value, 10))}
                className="range range-warning range-sm w-full"
              />
              <div className="flex items-center justify-between gap-1">
                {[0, 25, 50, 75, 90, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setProgressVal(v)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-brand-offwhite dark:bg-brand-midnight"
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={progressRemark}
              onChange={(e) => setProgressRemark(e.target.value)}
              placeholder="Add remark or status update note..."
              className="w-full p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-medium outline-none"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProgressModal(false)}
                className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveProgress}
                className="px-5 py-2 rounded-xl bg-brand-gold text-brand-black text-xs font-black"
              >
                {actionLoading ? "Saving..." : "Save Progress"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Upload Modal */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-brand-black dark:text-brand-white">
                Upload Completion Proof
              </h4>
              <button onClick={() => setShowProofModal(false)} className="text-brand-dark-grey hover:text-brand-red">
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <label className="p-6 rounded-2xl border-2 border-dashed border-brand-gold/60 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-brand-gold/5 text-center">
                <FiUploadCloud className="text-2xl text-brand-gold" />
                <span className="text-xs font-extrabold text-brand-black dark:text-brand-white">
                  {proofFile ? proofFile.name : "Select photo, PDF, or document"}
                </span>
                <input
                  type="file"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={proofRemark}
                onChange={(e) => setProofRemark(e.target.value)}
                placeholder="Proof description / note"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadingProof || !proofFile}
                onClick={handleSaveProof}
                className="px-5 py-2 rounded-xl bg-brand-gold text-brand-black text-xs font-black"
              >
                {uploadingProof ? "Uploading..." : "Save Proof"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Deadline Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-brand-black dark:text-brand-white">
                Extend Task Deadline
              </h4>
              <button onClick={() => setShowExtendModal(false)} className="text-brand-dark-grey hover:text-brand-red">
                <FiX />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-brand-dark-grey">New Deadline</label>
                <input
                  type="datetime-local"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-brand-dark-grey">
                  Reason for Extension (Required)
                </label>
                <textarea
                  rows={3}
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="e.g. Supplier delayed delivery by 3 days; management approved extension."
                  className="w-full p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-medium outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExtendConfirm}
                className="px-5 py-2 rounded-xl bg-brand-red text-white text-xs font-black"
              >
                {actionLoading ? "Updating..." : "Confirm Extension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection / Request Revision Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-brand-black dark:text-brand-white">
                Request Revision / Reject Submission
              </h4>
              <button onClick={() => setShowRejectModal(false)} className="text-brand-dark-grey hover:text-brand-red">
                <FiX />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-brand-dark-grey">
                Reason for Revision / Feedback (Required)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain what corrections or additional work is needed before approval..."
                className="w-full p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-medium outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRejectConfirm}
                className="px-5 py-2 rounded-xl bg-red-500 text-white text-xs font-black"
              >
                {actionLoading ? "Submitting..." : "Send Revision Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Proof Submission Modal (Requirement 2) */}
      <ProofSubmissionModal
        isOpen={showProofSubmissionModal}
        onClose={() => setShowProofSubmissionModal(false)}
        task={task}
        subtaskId={selectedSubtaskIdForProof}
        onSuccess={fetchTask}
      />

      {/* Management Review & Work Quality Rating Modal (Requirements 4 & 5) */}
      <TaskApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedAssigneeForApproval(null);
          setSelectedSubtaskIdForApproval(null);
        }}
        task={task}
        assigneeRecord={selectedAssigneeForApproval}
        subtaskId={selectedSubtaskIdForApproval}
        onSuccess={fetchTask}
      />

      {/* Submission & Correction History Modal */}
      <SubmissionHistoryModal
        isOpen={Boolean(activeHistoryAssignee)}
        onClose={() => setActiveHistoryAssignee(null)}
        assigneeRecord={activeHistoryAssignee}
        taskTitle={task?.title || "Directive Submission"}
      />

      {/* Add Subtask Modal (Requirement 1) */}
      {showAddSubtaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-brand-black dark:text-brand-white flex items-center gap-2">
                <FiPlus className="text-brand-gold" /> Add Subtask Item
              </h4>
              <button
                onClick={() => setShowAddSubtaskModal(false)}
                className="text-brand-dark-grey hover:text-brand-red"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateSubtask} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-brand-dark-grey block mb-1">
                  Subtask Title *
                </label>
                <input
                  type="text"
                  required
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                  placeholder="e.g. Audit initial documents"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-brand-dark-grey block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newSubtask.description}
                  onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                  placeholder="Specific instructions for this subtask..."
                  className="w-full p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-brand-dark-grey block mb-1">
                    Priority
                  </label>
                  <select
                    value={newSubtask.priority}
                    onChange={(e) => setNewSubtask({ ...newSubtask, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-brand-dark-grey block mb-1">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={newSubtask.deadline}
                    onChange={(e) => setNewSubtask({ ...newSubtask, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubtaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-brand-gold text-brand-black text-xs font-black hover:bg-brand-gold-light cursor-pointer"
                >
                  {actionLoading ? "Adding..." : "Add Subtask"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
