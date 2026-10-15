"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiClock, FiX, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/settings/overtime/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function OvertimePolicyFormModal({ editingPolicy, handleSubmitPolicy, isPolicyModalOpen, isSubmitting, policyErrors, policyForm, setIsPolicyModalOpen, setPolicyForm, permissions = FULL_ACCESS }) {
  const allowed = editingPolicy ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isPolicyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] overflow-y-auto"
            >
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                    <FiClock className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {editingPolicy ? "Edit Overtime Policy" : "Add Overtime Policy"}
                    </h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                      Configure multipliers, monthly limits, and minimum thresholds
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={allowed ? handleSubmitPolicy : (e) => e.preventDefault()} className="p-6 space-y-4">
{!allowed && <ReadOnlyNotice />}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Policy Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={policyForm.policyName}
                    disabled={isSubmitting}
                    onChange={(e) => setPolicyForm((prev) => ({ ...prev, policyName: e.target.value }))}
                    placeholder="e.g. Standard 1.5x Overtime"
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${
                      policyErrors.policyName
                        ? "border-brand-red focus:ring-brand-red/50"
                        : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"
                    } text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                  {policyErrors.policyName && (
                    <p className="text-brand-red text-[11px] mt-1 font-bold">{policyErrors.policyName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Rate Multiplier (x Normal)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={1}
                      value={policyForm.ratePerHour}
                      disabled={isSubmitting}
                      onChange={(e) => setPolicyForm((prev) => ({ ...prev, ratePerHour: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Max Hours / Month
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={policyForm.maxHoursPerMonth}
                      disabled={isSubmitting}
                      onChange={(e) => setPolicyForm((prev) => ({ ...prev, maxHoursPerMonth: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Min Threshold (Minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={policyForm.minOvertimeMinutes}
                    disabled={isSubmitting}
                    onChange={(e) => setPolicyForm((prev) => ({ ...prev, minOvertimeMinutes: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="policyStatus"
                        value="active"
                        checked={policyForm.status === "active"}
                        disabled={isSubmitting}
                        onChange={(e) => setPolicyForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-emerald-500">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="policyStatus"
                        value="inactive"
                        checked={policyForm.status === "inactive"}
                        disabled={isSubmitting}
                        onChange={(e) => setPolicyForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-4 h-4 accent-rose-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-rose-500">Inactive</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPolicyModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-2xl text-xs font-bold bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light hover:bg-brand-beige/60 dark:hover:bg-brand-dark-grey transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" hidden={!allowed}
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-2xl text-xs font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader className="text-sm animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingPolicy ? "Update Policy" : "Create Policy"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
