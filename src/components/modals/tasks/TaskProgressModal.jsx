"use client";

import { FiX } from "react-icons/fi";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/tasks/[id]/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// is passed for consistency (this modal has no submit form).
export default function TaskProgressModal({ actionLoading, handleSaveProgress, progressRemark, progressVal, setProgressRemark, setProgressVal, setShowProgressModal, showProgressModal, permissions = FULL_ACCESS }) {
  return (
    <>
{showProgressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-5 animate-scale-in max-h-[calc(100dvh-2rem)] overflow-y-auto">
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
    </>
  );
}
