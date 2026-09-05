"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiAlertTriangle,
  FiFileText,
  FiPaperclip,
  FiUser,
  FiExternalLink,
  FiMessageSquare,
  FiLayers,
  FiAward,
} from "react-icons/fi";
import { MdFlag, MdOutlineHistory } from "react-icons/md";

export default function SubmissionHistoryModal({
  isOpen,
  onClose,
  assigneeRecord,
  taskTitle = "Task Submission History",
}) {
  if (!isOpen || !assigneeRecord) return null;

  const emp = assigneeRecord.employee || {};
  const history = assigneeRecord.submissionHistory || [];
  const rejectionHistory = assigneeRecord.rejectionHistory || [];

  // If submissionHistory is empty but we have submittedAt or rejectionHistory, synthesize entries for backward compatibility
  const displayCycles =
    history.length > 0
      ? history
      : assigneeRecord.submittedAt
      ? [
          {
            cycle: 1,
            submittedAt: assigneeRecord.submittedAt,
            remark: assigneeRecord.latestRemark || "Submitted for approval",
            proofs: assigneeRecord.proofs || [],
            status: assigneeRecord.status,
            reviewComment: assigneeRecord.rejectionReason || assigneeRecord.approvalComment,
            reviewedAt: assigneeRecord.approvedAt || assigneeRecord.lastUpdateAt,
            reviewedBy: assigneeRecord.approvedBy,
            rating: assigneeRecord.rating,
          },
        ]
      : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-brand-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center text-xl font-black">
                <MdOutlineHistory />
              </div>
              <div>
                <h3 className="text-base font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                  <span>Submission & Correction History</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold font-mono font-bold">
                    {displayCycles.length} {displayCycles.length === 1 ? "Round" : "Rounds"}
                  </span>
                </h3>
                <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light line-clamp-1">
                  {taskTitle} &bull; {emp.name || "Employee"} ({emp.employeeId || "—"})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-brand-beige/40 dark:hover:bg-brand-midnight text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white transition-colors cursor-pointer"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          {/* Body: Timeline of Submissions */}
          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
            {displayCycles.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl">
                  <FiClock />
                </div>
                <p className="text-sm font-bold text-brand-black dark:text-brand-white">
                  No Submissions Recorded Yet
                </p>
                <p className="text-xs text-brand-dark-grey max-w-xs mx-auto">
                  When this task is submitted for management approval, all submission attempts, attached proofs, and feedback will be logged here.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-brand-beige/50 dark:before:bg-brand-dark-grey/40">
                {displayCycles.map((cycleItem, index) => {
                  const isLatest = index === displayCycles.length - 1;
                  const cycleNum = cycleItem.cycle || index + 1;
                  const proofs = cycleItem.proofs || [];
                  const isRejected = cycleItem.status === "REJECTED";
                  const isApproved = cycleItem.status === "APPROVED" || cycleItem.status === "COMPLETED";

                  return (
                    <div key={index} className="relative group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[27px] top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-black ${
                          isApproved
                            ? "bg-emerald-500 border-white text-white"
                            : isRejected
                            ? "bg-red-500 border-white text-white"
                            : "bg-brand-gold border-white text-brand-black font-black"
                        }`}
                      >
                        {cycleNum}
                      </div>

                      {/* Card for this submission cycle */}
                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          isLatest
                            ? "bg-brand-offwhite/80 dark:bg-brand-midnight/70 border-brand-gold/50 shadow-sm"
                            : "bg-brand-white dark:bg-brand-charcoal/80 border-brand-beige/50 dark:border-brand-dark-grey/40"
                        }`}
                      >
                        {/* Round Header */}
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-brand-black dark:text-brand-white uppercase">
                              Submission Round #{cycleNum}
                            </span>
                            {isLatest && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold text-brand-black font-black uppercase tracking-wider">
                                Latest Attempt
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-brand-dark-grey font-mono">
                            <FiCalendar className="text-brand-gold" />
                            <span>
                              {cycleItem.submittedAt
                                ? new Date(cycleItem.submittedAt).toLocaleString()
                                : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Submitter Note / Remarks */}
                        {cycleItem.remark && (
                          <div className="mb-3 p-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal text-xs text-brand-black dark:text-brand-gold-light border border-brand-beige/40 dark:border-brand-dark-grey/40">
                            <span className="text-[10px] font-bold text-brand-dark-grey uppercase block mb-0.5">
                              Employee Submission Note:
                            </span>
                            <p className="italic">"{cycleItem.remark}"</p>
                          </div>
                        )}

                        {/* Proofs Attached in this Round */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[11px] font-bold text-brand-dark-grey mb-1.5">
                            <span className="flex items-center gap-1">
                              <FiPaperclip className="text-brand-gold text-xs" />
                              <span>Attached Proofs ({proofs.length})</span>
                            </span>
                          </div>

                          {proofs.length === 0 ? (
                            <p className="text-[11px] text-brand-dark-grey italic">
                              Submitted without file attachments.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {proofs.map((proof, pIdx) => (
                                <a
                                  key={pIdx}
                                  href={proof.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/40 dark:border-brand-dark-grey/40 hover:border-brand-gold transition-colors text-xs group/link"
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <FiFileText className="text-brand-gold shrink-0 text-sm" />
                                    <div className="overflow-hidden">
                                      <p className="font-bold text-brand-black dark:text-brand-white truncate text-[11px]">
                                        {proof.name}
                                      </p>
                                      {proof.remark && (
                                        <p className="text-[10px] text-brand-dark-grey truncate">
                                          {proof.remark}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <FiExternalLink className="text-brand-dark-grey group-hover/link:text-brand-gold shrink-0 text-xs ml-1" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Manager Review Status / Rejection Reason for this cycle */}
                        {isRejected && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs space-y-1">
                            <div className="flex items-center justify-between text-red-600 font-bold text-[11px]">
                              <span className="flex items-center gap-1">
                                <FiAlertTriangle />
                                <span>Revision Required by Manager</span>
                              </span>
                              {cycleItem.reviewedAt && (
                                <span className="font-mono text-[10px] text-red-500">
                                  {new Date(cycleItem.reviewedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-red-700 dark:text-red-400 font-medium">
                              {cycleItem.reviewComment || "Revision requested. Please make necessary corrections."}
                            </p>
                          </div>
                        )}

                        {isApproved && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                            <div className="flex items-center justify-between text-emerald-600 font-bold text-[11px]">
                              <span className="flex items-center gap-1">
                                <FiCheckCircle />
                                <span>Approved</span>
                              </span>
                              {cycleItem.rating !== undefined && cycleItem.rating !== null && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-mono font-black text-[10px]">
                                  Rating: {cycleItem.rating}%
                                </span>
                              )}
                            </div>
                            {cycleItem.reviewComment && (
                              <p className="text-emerald-700 dark:text-emerald-400">
                                "{cycleItem.reviewComment}"
                              </p>
                            )}
                          </div>
                        )}

                        {!isRejected && !isApproved && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 flex items-center justify-between">
                            <span className="flex items-center gap-1 font-bold">
                              <FiClock /> Awaiting Management Verification
                            </span>
                            <span className="text-[10px] font-mono">Under Review</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/40 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey/60 text-xs font-bold text-brand-black dark:text-brand-white hover:border-brand-gold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
