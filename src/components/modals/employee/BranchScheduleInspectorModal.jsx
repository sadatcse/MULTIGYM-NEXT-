"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiLayers, FiX, FiMapPin, FiClock } from "react-icons/fi";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/employee/duty-time/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// is passed for consistency (this modal has no submit form).
export default function BranchScheduleInspectorModal({ ALL_DAYS, setViewMultiBranchEmp, viewMultiBranchEmp, permissions = FULL_ACCESS }) {
  return (
    <>
<AnimatePresence>
        {viewMultiBranchEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden max-h-[calc(100dvh-2rem)] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold">
                    <FiLayers />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      Multi-Branch Duty Schedule
                    </h3>
                    <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                      {viewMultiBranchEmp.name} ({viewMultiBranchEmp.jobPosition || "Staff"})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewMultiBranchEmp(null)}
                  className="p-2 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                <div className="bg-brand-offwhite dark:bg-brand-midnight p-3.5 rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-brand-black dark:text-brand-white">
                      Employee ID:{" "}
                    </span>
                    <span className="font-mono text-brand-gold font-bold">
                      {viewMultiBranchEmp.employeeId || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="font-extrabold text-brand-black dark:text-brand-white">
                      Total Assigned Locations:{" "}
                    </span>
                    <span className="font-black text-purple-600">
                      {viewMultiBranchEmp.branchSchedules?.length || viewMultiBranchEmp.branches?.length || 0}
                    </span>
                  </div>
                </div>

                {viewMultiBranchEmp.branchSchedules &&
                viewMultiBranchEmp.branchSchedules.length > 0 ? (
                  viewMultiBranchEmp.branchSchedules.map((bs, bIdx) => (
                    <div
                      key={bIdx}
                      className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 font-black text-sm text-brand-black dark:text-brand-white">
                          <FiMapPin className="text-brand-gold" />
                          {bs.branch}
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-sky-500/10 text-sky-500 font-mono font-bold text-xs">
                          <FiClock className="text-xs" /> {bs.inTime} – {bs.outTime}
                        </span>
                      </div>

                      {bs.notes && (
                        <div className="text-xs text-brand-black dark:text-brand-white font-medium bg-brand-white dark:bg-brand-charcoal p-2.5 rounded-xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
                          {bs.notes}
                        </div>
                      )}

                      {/* Days pills */}
                      {bs.days && bs.days.length > 0 && (
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block mb-1.5">
                            Scheduled Days:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_DAYS.map((day) => {
                              const isDayActive = bs.days.includes(day);
                              return (
                                <span
                                  key={day}
                                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                                    isDayActive
                                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                      : "bg-brand-offwhite/60 dark:bg-brand-midnight/60 text-brand-dark-grey border-brand-beige/30 dark:border-brand-dark-grey/30 opacity-40"
                                  }`}
                                >
                                  {day.slice(0, 3)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs">
                    No detailed branch-by-branch day schedule configured yet. You can click &quot;Configure&quot; on this employee to specify exact branch times and days.
                  </div>
                )}
              </div>

                {/* Footer */}
                <div className="p-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end">
                <button
                  onClick={() => setViewMultiBranchEmp(null)}
                  className="px-5 py-2 rounded-2xl text-xs font-bold bg-brand-gold text-brand-midnight hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
