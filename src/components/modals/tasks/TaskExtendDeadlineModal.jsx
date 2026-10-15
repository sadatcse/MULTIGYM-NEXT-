"use client";

import { FiX } from "react-icons/fi";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/tasks/[id]/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// is passed for consistency (this modal has no submit form).
export default function TaskExtendDeadlineModal({ actionLoading, extendReason, handleExtendConfirm, newDeadline, setExtendReason, setNewDeadline, setShowExtendModal, showExtendModal, permissions = FULL_ACCESS }) {
  return (
    <>
{showExtendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-5 animate-scale-in max-h-[calc(100dvh-2rem)] overflow-y-auto">
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
    </>
  );
}
