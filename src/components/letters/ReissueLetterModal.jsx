"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiRefreshCw, FiAlertTriangle } from "react-icons/fi";
import Swal from "sweetalert2";

export default function ReissueLetterModal({
  isOpen,
  onClose,
  letter,
  onReissueSubmit,
}) {
  const [reissueReason, setReissueReason] = useState("");
  const [letterDate, setLetterDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !letter) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reissueReason.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Reason Required",
        text: "Please provide a reason for reissuing this official HR letter.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await onReissueSubmit(letter._id, {
        reissueReason,
        letterDate,
        remarks,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey overflow-hidden shadow-2xl"
        >
          <div className="p-6 bg-brand-offwhite dark:bg-brand-midnight border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg">
                <FiRefreshCw />
              </div>
              <div>
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                  Reissue HR Letter
                </h3>
                <p className="text-xs text-brand-dark-grey font-mono">
                  {letter.letterNumber} (v{letter.version || 1} → v{(letter.version || 1) + 1})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-brand-white dark:bg-brand-charcoal hover:bg-brand-red hover:text-white flex items-center justify-center text-brand-dark-grey transition-all cursor-pointer"
            >
              <FiX className="text-base" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <FiAlertTriangle className="text-base shrink-0 mt-0.5" />
              <p>
                Reissuing will create <strong>Version {(letter.version || 1) + 1}</strong>. The original official letter will remain permanently preserved in audit history as superseded.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-dark-grey mb-1.5">
                Reissue Date *
              </label>
              <input
                type="date"
                required
                value={letterDate}
                onChange={(e) => setLetterDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-brand-black dark:text-brand-white font-medium focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-dark-grey mb-1.5">
                Reason for Reissuance *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Corrected typo in designation / updated salary terms per MD Sir instruction..."
                value={reissueReason}
                onChange={(e) => setReissueReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-brand-black dark:text-brand-white font-medium focus:outline-none focus:border-brand-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-dark-grey mb-1.5">
                Additional Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="Optional internal administrative note"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-brand-black dark:text-brand-white font-medium focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-brand-beige/50 dark:border-brand-dark-grey/50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight font-bold text-brand-dark-grey hover:bg-brand-beige/50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <FiRefreshCw className={submitting ? "animate-spin" : ""} />
                <span>{submitting ? "Reissuing..." : "Confirm Reissue"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
