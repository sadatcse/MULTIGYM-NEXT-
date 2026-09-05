"use client";

import React, { useState, useEffect } from "react";
import useNoticeApi from "@/hooks/useNoticeApi";
import { toast } from "react-toastify";
import {
  FiX,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiFileText,
  FiDownload,
  FiShield,
  FiCalendar,
  FiUser,
} from "react-icons/fi";

export default function NoticeModal({ notice, onClose, onRefresh }) {
  const { recordSeen, recordAcknowledgement } = useNoticeApi();
  const [loading, setLoading] = useState(false);
  const [showConfirmAck, setShowConfirmAck] = useState(false);
  const [acknowledgedState, setAcknowledgedState] = useState(notice?.isAcknowledged || false);

  // Automatically record "SEEN" event when modal opens
  useEffect(() => {
    if (notice?.noticeId && !notice.isSeen) {
      recordSeen(notice.noticeId).then(() => {
        if (onRefresh) onRefresh();
      }).catch((err) => {
        console.error("Failed to record seen status:", err);
      });
    }
  }, [notice, recordSeen, onRefresh]);

  if (!notice) return null;

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      const res = await recordAcknowledgement(notice.noticeId);
      if (res?.success || res?.alreadyAcknowledged) {
        toast.success("Notice acknowledged successfully");
        setAcknowledgedState(true);
        setShowConfirmAck(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Failed to acknowledge notice:", err);
      toast.error(err?.response?.data?.message || "Failed to acknowledge notice");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
      case "Urgent":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "Important":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-3xl rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-start justify-between bg-brand-offwhite/50 dark:bg-brand-midnight/50">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${getPriorityBadge(notice.priority)}`}>
                {notice.priority}
              </span>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                {notice.category}
              </span>
              {notice.requiresAcknowledgement && (
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Acknowledgement Required
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-brand-black dark:text-brand-white leading-tight">
              {notice.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-brand-dark-grey hover:bg-brand-beige/40 dark:hover:bg-brand-dark-grey/40 transition-colors"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Row */}
          <div className="flex items-center justify-between gap-4 text-xs text-brand-dark-grey dark:text-brand-gold-light bg-brand-beige/20 dark:bg-brand-midnight/60 p-3.5 rounded-2xl border border-brand-beige/30 dark:border-brand-dark-grey/30 flex-wrap">
            <div className="flex items-center gap-1.5">
              <FiUser className="text-brand-gold" />
              <span>Issued By: <strong className="text-brand-black dark:text-brand-white">{notice.author?.name || "Management"}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <FiCalendar className="text-brand-gold" />
              <span>Published: <strong>{new Date(notice.publishedAt || notice.createdAt).toLocaleDateString()}</strong></span>
            </div>

            {notice.acknowledgementDeadline && (
              <div className="flex items-center gap-1.5">
                <FiClock className="text-brand-gold" />
                <span>Deadline: <strong className={notice.isPastDeadline ? "text-red-500" : ""}>{new Date(notice.acknowledgementDeadline).toLocaleDateString()}</strong></span>
              </div>
            )}
          </div>

          {/* Critical Priority Alert Banner */}
          {(notice.priority === "Critical" || notice.priority === "Urgent") && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <FiAlertTriangle className="text-amber-500 text-xl shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold leading-relaxed">
                <strong>IMPORTANT NOTICE:</strong> All employees are required to read, understand, and acknowledge this notice before the deadline.
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="prose dark:prose-invert max-w-none text-sm text-brand-black dark:text-brand-white leading-relaxed space-y-3 whitespace-pre-line">
            {notice.content}
          </div>

          {/* Attachments Section */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
              <h5 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey flex items-center gap-1.5">
                <FiFileText className="text-brand-gold" /> Attachments ({notice.attachments.length})
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notice.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey hover:border-brand-gold transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FiFileText className="text-brand-gold shrink-0 text-base" />
                      <span className="text-xs font-bold text-brand-black dark:text-brand-white truncate group-hover:text-brand-gold">
                        {att.name}
                      </span>
                    </div>
                    {notice.allowDownload !== false && (
                      <FiDownload className="text-brand-dark-grey group-hover:text-brand-gold shrink-0 text-sm" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <FiShield className="text-brand-gold text-sm" />
            <span className="text-brand-dark-grey font-semibold">
              First Seen: {notice.firstSeenAt ? new Date(notice.firstSeenAt).toLocaleString() : "Just Now"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {acknowledgedState ? (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black text-xs flex items-center gap-1.5">
                <FiCheckCircle className="text-sm" /> ACKNOWLEDGED
              </div>
            ) : notice.requiresAcknowledgement ? (
              <button
                onClick={() => setShowConfirmAck(true)}
                className="px-5 py-2.5 rounded-xl bg-brand-gold text-brand-black font-extrabold text-xs shadow-md shadow-brand-gold/20 hover:bg-brand-gold-dark transition-all flex items-center gap-1.5"
              >
                <FiCheckCircle className="text-sm" /> Acknowledge Notice
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white border border-brand-beige/60 dark:border-brand-dark-grey font-bold text-xs hover:border-brand-gold transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmAck && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-brand-white dark:bg-brand-charcoal max-w-md w-full rounded-3xl p-6 border border-brand-beige/60 dark:border-brand-dark-grey shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-amber-500">
              <FiShield className="text-2xl shrink-0" />
              <h4 className="text-lg font-black text-brand-black dark:text-brand-white">
                Confirm Acknowledgement
              </h4>
            </div>

            <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light leading-relaxed">
              By clicking <strong>&quot;Confirm & Acknowledge&quot;</strong>, you confirm that you have read, understood, and agreed to comply with the terms set forth in <strong>&quot;{notice.title}&quot;</strong>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmAck(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-brand-dark-grey hover:bg-brand-beige/40 dark:hover:bg-brand-dark-grey/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcknowledge}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-brand-gold text-brand-black font-extrabold text-xs shadow-md shadow-brand-gold/20 hover:bg-brand-gold-dark transition-all"
              >
                {loading ? "Recording..." : "Confirm & Acknowledge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
