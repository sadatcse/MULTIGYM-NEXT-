"use client";

import { FiX } from "react-icons/fi";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/tasks/[id]/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// is passed for consistency (this modal has no submit form).
export default function TaskRejectModal({ actionLoading, handleRejectConfirm, rejectReason, setRejectReason, setShowRejectModal, showRejectModal, permissions = FULL_ACCESS }) {
  return (
    <>
{showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-5 animate-scale-in max-h-[calc(100dvh-2rem)] overflow-y-auto">
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
    </>
  );
}
