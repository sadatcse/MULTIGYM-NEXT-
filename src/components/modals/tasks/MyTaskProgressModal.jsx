"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiClock, FiX, FiLoader } from "react-icons/fi";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/tasks/my-tasks/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// is passed for consistency (this modal has no submit form).
export default function MyTaskProgressModal({ activeTaskForModal, handleSaveProgress, modalLoading, progressRemark, progressVal, setActiveTaskForModal, setProgressRemark, setProgressVal, permissions = FULL_ACCESS }) {
  return (
    <>
<AnimatePresence>
        {activeTaskForModal && (
          <div className="fixed inset-0 z-50 bg-brand-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-5 max-h-[calc(100dvh-2rem)] overflow-y-auto"
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
    </>
  );
}
