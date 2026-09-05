"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiUser,
  FiClock,
  FiCalendar,
  FiPaperclip,
  FiExternalLink,
  FiAward,
  FiMessageSquare,
  FiLoader,
  FiAlertTriangle,
  FiFileText,
  FiImage,
} from "react-icons/fi";
import { MdOutlineHistory } from "react-icons/md";
import { toast } from "react-toastify";
import useTaskApi from "@/hooks/useTaskApi";

const RATING_PRESETS = [10, 20, 30, 50, 70, 80, 90, 100];

export default function TaskApprovalModal({
  isOpen,
  onClose,
  task,
  assigneeRecord,
  subtaskId = null,
  onSuccess,
}) {
  const { approveTask, rejectTask } = useTaskApi();

  const [rating, setRating] = useState(90);
  const [comment, setComment] = useState("");
  const [mode, setMode] = useState("approve"); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  if (!isOpen || !task || !assigneeRecord) return null;

  const emp = assigneeRecord.employee || {};
  const proofs = assigneeRecord.proofs || [];

  const getRatingBadgeColor = (val) => {
    if (val >= 90) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    if (val >= 70) return "bg-brand-gold/15 text-brand-gold border-brand-gold/30";
    if (val >= 50) return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    return "bg-red-500/10 text-red-500 border-red-500/30";
  };

  const formatOrdinal = (num) => {
    if (!num) return "—";
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;
    return `${num}th`;
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await approveTask(task._id, {
        assigneeEmployeeId: emp._id || emp,
        subtaskId: subtaskId || undefined,
        rating: Number(rating),
        comment: comment.trim() || undefined,
      });
      toast.success("Task approved and quality rating recorded successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Task approval error:", err);
      toast.error(err?.response?.data?.message || "Failed to approve task");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.warning("Please specify the reason for rejection / requested revision");
      return;
    }
    setLoading(true);
    try {
      await rejectTask(task._id, {
        assigneeEmployeeId: emp._id || emp,
        subtaskId: subtaskId || undefined,
        reason: rejectReason.trim(),
      });
      toast.info("Task rejected and returned for revision");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Task rejection error:", err);
      toast.error(err?.response?.data?.message || "Failed to reject task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-brand-beige/30 dark:border-brand-dark-grey/30 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center">
                <FiAward className="text-xl" />
              </div>
              <div>
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                  Management Review & Verification
                </h3>
                <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light/70 truncate max-w-md">
                  Directive: {task.title}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-xl text-brand-dark-grey hover:text-brand-red hover:bg-brand-beige/30 dark:hover:bg-brand-midnight transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Employee Card & Submission Metadata */}
            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 text-brand-gold font-black text-base flex items-center justify-center overflow-hidden shrink-0">
                  {emp.photo ? (
                    <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{emp.name?.charAt(0) || "U"}</span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                    <span>{emp.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                      {emp.employeeId || "Staff"}
                    </span>
                  </div>
                  <p className="text-xs text-brand-dark-grey">
                    {emp.designation || emp.role || "Staff Member"} • {emp.department || "General"}
                  </p>
                </div>
              </div>

              {/* Submission Rank, Round & Timeliness */}
              <div className="flex items-center gap-2 flex-wrap">
                {(assigneeRecord.submissionHistory?.length > 1 || assigneeRecord.submissionCount > 1) && (
                  <span className="text-xs font-black px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/30 flex items-center gap-1.5 font-mono">
                    <MdOutlineHistory className="text-sm" />
                    <span>Round #{assigneeRecord.submissionHistory?.length || assigneeRecord.submissionCount}</span>
                  </span>
                )}
                {assigneeRecord.submissionRank && (
                  <span className="text-xs font-black px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center gap-1.5">
                    <FiAward className="text-sm" />
                    <span>Rank: {formatOrdinal(assigneeRecord.submissionRank)}</span>
                  </span>
                )}
                {(assigneeRecord.lastSubmittedAt || assigneeRecord.submittedAt) && (
                  <span className="text-xs font-bold px-3 py-1 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/30 flex items-center gap-1.5">
                    <FiClock className="text-xs" />
                    <span>
                      {new Date(assigneeRecord.lastSubmittedAt || assigneeRecord.submittedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                )}
                <span
                  className={`text-xs font-black px-3 py-1 rounded-xl border ${
                    assigneeRecord.isLate
                      ? "bg-red-500/10 text-red-500 border-red-500/30"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  }`}
                >
                  {assigneeRecord.isLate ? "Late Submission" : "On-Time Submission"}
                </span>
              </div>
            </div>

            {/* Task Overview */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                Task / Directive Description
              </h4>
              <div className="p-3.5 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/30 dark:border-brand-dark-grey/30 text-xs text-brand-black dark:text-brand-white leading-relaxed">
                {task.description || "No description provided."}
              </div>
            </div>

            {/* Proof Submission Notes */}
            {assigneeRecord.latestRemark && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                  Employee Proof Remarks
                </h4>
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-brand-black dark:text-brand-white italic">
                  &ldquo;{assigneeRecord.latestRemark}&rdquo;
                </div>
              </div>
            )}

            {/* Submitted Proofs & Attachments */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey flex items-center justify-between">
                <span>Submitted Proofs & Attachments ({proofs.length})</span>
                {task.completionProofRequired && (
                  <span className="text-[10px] text-amber-500 font-bold">Proof Required</span>
                )}
              </h4>

              {proofs.length === 0 ? (
                <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-center text-xs text-brand-dark-grey">
                  No proof files uploaded by this employee.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {proofs.map((proof, idx) => {
                    const isImg =
                      proof.fileType?.startsWith("image/") ||
                      /\.(jpg|jpeg|png|webp)$/i.test(proof.url || proof.name);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isImg ? (
                            <FiImage className="text-blue-500 text-base shrink-0" />
                          ) : (
                            <FiFileText className="text-red-500 text-base shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="font-bold text-brand-black dark:text-brand-white truncate">
                              {proof.name || `Proof File #${idx + 1}`}
                            </div>
                            {proof.uploadedAt && (
                              <div className="text-[10px] text-brand-dark-grey">
                                {new Date(proof.uploadedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        {proof.url && (
                          <a
                            href={proof.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-brand-gold/15 text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-all shrink-0 flex items-center gap-1 font-bold text-[11px]"
                          >
                            <span>View</span>
                            <FiExternalLink className="text-xs" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Complete Multi-Round Submission & Revision Timeline */}
            {(assigneeRecord.submissionHistory?.length > 0 || (assigneeRecord.rejectionHistory?.length || 0) > 0) && (
              <div className="p-4 rounded-2xl bg-brand-offwhite/80 dark:bg-brand-midnight/70 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-1.5">
                    <MdOutlineHistory className="text-brand-gold text-base" />
                    <span>Submission & Correction Timeline ({assigneeRecord.submissionHistory?.length || (assigneeRecord.rejectionHistory?.length || 0) + 1} Rounds)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFullHistory(!showFullHistory)}
                    className="text-xs text-brand-gold font-black hover:underline cursor-pointer"
                  >
                    {showFullHistory ? "Hide Timeline" : "Expand All Rounds"}
                  </button>
                </div>

                {showFullHistory && (
                  <div className="space-y-3 pt-2 max-h-64 overflow-y-auto pr-1">
                    {(assigneeRecord.submissionHistory?.length > 0
                      ? assigneeRecord.submissionHistory
                      : [
                          {
                            cycle: 1,
                            submittedAt: assigneeRecord.submittedAt,
                            remark: assigneeRecord.latestRemark,
                            proofs: assigneeRecord.proofs || [],
                            status: assigneeRecord.status,
                            reviewComment: assigneeRecord.rejectionReason,
                          },
                        ]
                    ).map((sub, sIdx) => {
                      const cycleNum = sub.cycle || sIdx + 1;
                      const isLatest =
                        sIdx ===
                        (assigneeRecord.submissionHistory?.length || 1) - 1;
                      return (
                        <div
                          key={sIdx}
                          className="p-3 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="font-black text-brand-black dark:text-brand-white flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] flex items-center justify-center font-mono">
                                {cycleNum}
                              </span>
                              <span>Round #{cycleNum}</span>
                              {isLatest && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-gold text-brand-black font-black uppercase">
                                  Current
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-brand-dark-grey font-mono">
                              {sub.submittedAt
                                ? new Date(sub.submittedAt).toLocaleString()
                                : "—"}
                            </span>
                          </div>

                          {sub.remark && (
                            <div className="text-[11px] text-brand-dark-grey italic">
                              "{sub.remark}"
                            </div>
                          )}

                          {sub.proofs?.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-brand-dark-grey font-bold">
                                Files ({sub.proofs.length}):
                              </span>
                              {sub.proofs.map((p, pIdx) => (
                                <a
                                  key={pIdx}
                                  href={p.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] px-2 py-0.5 rounded bg-brand-offwhite dark:bg-brand-midnight text-brand-gold border border-brand-beige/40 dark:border-brand-dark-grey/40 hover:underline flex items-center gap-1"
                                >
                                  <FiPaperclip className="text-[9px]" />
                                  <span className="truncate max-w-[120px]">
                                    {p.name}
                                  </span>
                                </a>
                              ))}
                            </div>
                          )}

                          {sub.status === "REJECTED" && (
                            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-600 space-y-0.5">
                              <span className="font-bold flex items-center gap-1">
                                <FiAlertTriangle className="text-[10px]" /> Revision Notice:
                              </span>
                              <p>{sub.reviewComment || "Revision requested."}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Mode Switch: Approve vs Reject */}
            <div className="flex items-center gap-2 p-1.5 bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
              <button
                type="button"
                onClick={() => setMode("approve")}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === "approve"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "text-brand-dark-grey hover:text-emerald-500"
                }`}
              >
                <FiCheckCircle />
                <span>Approve & Rate</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("reject")}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === "reject"
                    ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                    : "text-brand-dark-grey hover:text-red-500"
                }`}
              >
                <FiXCircle />
                <span>Request Revision / Reject</span>
              </button>
            </div>

            {/* Mode: APPROVE */}
            {mode === "approve" && (
              <form onSubmit={handleApprove} className="space-y-5">
                {/* Work Quality Rating */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey flex items-center gap-2">
                      <FiAward className="text-brand-gold" />
                      <span>Work Quality Rating (0 - 100%)</span>
                    </label>
                    <span
                      className={`text-sm font-black px-3 py-0.5 rounded-xl border font-mono ${getRatingBadgeColor(
                        rating
                      )}`}
                    >
                      {rating}%
                    </span>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {RATING_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRating(preset)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          rating === preset
                            ? "bg-brand-gold text-brand-black shadow-md shadow-brand-gold/25 scale-105"
                            : "bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey hover:text-brand-gold border border-brand-beige/40 dark:border-brand-dark-grey/40"
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>

                  {/* Slider */}
                  <div className="pt-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full h-2 bg-brand-beige/40 dark:bg-brand-midnight rounded-lg appearance-none cursor-pointer accent-brand-gold"
                    />
                    <div className="flex justify-between text-[10px] text-brand-dark-grey mt-1 font-mono">
                      <span>0% (Poor)</span>
                      <span>50% (Average)</span>
                      <span>100% (Exceptional)</span>
                    </div>
                  </div>
                </div>

                {/* Approval Comments */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-brand-dark-grey mb-1.5">
                    Approval Comments / Manager Feedback
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Provide constructive feedback or commendation for this employee's performance..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey/60 text-brand-black dark:text-brand-white text-xs focus:outline-none focus:border-brand-gold transition-colors resize-none"
                  />
                </div>

                {/* Submit Approve Button */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-2xl border border-brand-beige dark:border-brand-dark-grey text-brand-dark-grey text-xs font-bold hover:bg-brand-beige/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="animate-spin" />
                        <span>Recording Approval...</span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle />
                        <span>Approve Task ({rating}%)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Mode: REJECT */}
            {mode === "reject" && (
              <form onSubmit={handleReject} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-red-500 mb-1.5">
                    Reason for Revision / Rejection *
                  </label>
                  <textarea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                    placeholder="Detail exactly what requires correction or further proof before this task can be approved..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-red-500/50 text-brand-black dark:text-brand-white text-xs focus:outline-none focus:border-red-500 transition-colors resize-none"
                  />
                </div>

                {/* Submit Reject Button */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-2xl border border-brand-beige dark:border-brand-dark-grey text-brand-dark-grey text-xs font-bold hover:bg-brand-beige/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !rejectReason.trim()}
                    className="px-6 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-black shadow-lg shadow-red-500/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="animate-spin" />
                        <span>Sending Revision...</span>
                      </>
                    ) : (
                      <>
                        <FiXCircle />
                        <span>Send Revision Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
