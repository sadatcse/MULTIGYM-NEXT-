"use client";

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { FiXCircle, FiSlash } from "react-icons/fi";

// Shared reason-entry modal for the two terminal off-ramp actions — reject
// (submission wasn't acceptable) and cancel (request no longer needed).
export default function MaintenanceReasonModal({ isOpen, onClose, onSubmit, isSubmitting, mode = "reject" }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReason("");
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit({ reason: reason.trim() });
  };

  const isReject = mode === "reject";

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={!isSubmitting}
      closeOnEsc={!isSubmitting}
      title={
        <div className="flex items-center gap-2">
          {isReject ? <FiXCircle className="text-brand-red" /> : <FiSlash className="text-brand-dark-grey" />}
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white">
            {isReject ? "Reject Request" : "Cancel Request"}
          </h3>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
            Reason <span className="text-brand-red">*</span>
          </label>
          <textarea
            rows={3}
            required
            disabled={isSubmitting}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isReject ? "Why is this request being rejected?" : "Why is this request being cancelled?"}
            className="w-full p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !reason.trim()}
            className="px-5 py-2 rounded-xl bg-brand-red text-white text-xs font-black shadow-md hover:bg-brand-red-dark transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Saving..." : isReject ? "Reject" : "Cancel Request"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
