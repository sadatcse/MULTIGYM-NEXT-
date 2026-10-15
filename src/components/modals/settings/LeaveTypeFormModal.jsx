"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiCalendar, FiX, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/settings/leave-types/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function LeaveTypeFormModal({ editingItem, formData, formError, handleSubmit, isModalOpen, isSubmitting, setFormData, setIsModalOpen, permissions = FULL_ACCESS }) {
  const allowed = editingItem ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-brand-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-xl rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-base font-bold">
                    <FiCalendar />
                  </div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    {editingItem ? "Edit Leave Type Policy" : "Create Leave Type Policy"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-brand-dark-grey hover:text-brand-red transition-colors cursor-pointer"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold">
                  {formError}
                </div>
              )}

              {/* Modal Form */}
              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="space-y-4">
{!allowed && <ReadOnlyNotice />}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Leave Type Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Annual Vacation, Sick Leave, Casual Leave"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Description & Policy Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Eligibility, notice requirements, documentation needed..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Days Allowed / Year <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.daysAllowed}
                      onChange={(e) =>
                        setFormData({ ...formData, daysAllowed: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Compensation Type
                    </label>
                    <select
                      value={formData.isPaid}
                      onChange={(e) => setFormData({ ...formData, isPaid: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    >
                      <option value="yes">Paid Leave (Full Compensation)</option>
                      <option value="no">Unpaid Leave (Loss of Pay)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Carry Forward to Next Year?
                    </label>
                    <select
                      value={formData.carryForward}
                      onChange={(e) =>
                        setFormData({ ...formData, carryForward: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    >
                      <option value="yes">Yes (Carry forward permitted)</option>
                      <option value="no">No (Lapses at year end)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Applicable For
                    </label>
                    <select
                      value={formData.applicableFor}
                      onChange={(e) =>
                        setFormData({ ...formData, applicableFor: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    >
                      <option value="All">All Employees</option>
                      <option value="Male">Male Employees Only</option>
                      <option value="Female">Female Employees Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Policy Year
                    </label>
                    <input
                      type="number"
                      value={formData.policyYear}
                      onChange={(e) =>
                        setFormData({ ...formData, policyYear: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    >
                      <option value="active">Active (Requestable)</option>
                      <option value="inactive">Inactive (Disabled)</option>
                    </select>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" hidden={!allowed}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && <FiLoader className="animate-spin text-sm" />}
                    <span>
                      {isSubmitting
                        ? "Saving..."
                        : editingItem
                        ? "Update Leave Type"
                        : "Create Leave Type"}
                    </span>
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
