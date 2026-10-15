"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiUsers, FiX, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/settings/proxy-duty/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function ProxyDutyFormModal({ currencySymbol, editingItem, employees, formData, formError, handleSelectOriginal, handleSelectProxy, handleSubmit, isModalOpen, isSubmitting, setFormData, setIsModalOpen, permissions = FULL_ACCESS }) {
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
                    <FiUsers />
                  </div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    {editingItem ? "Edit Proxy Duty Swap Record" : "Record Proxy Duty Swap"}
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
                    Original Employee (On Leave) <span className="text-brand-red">*</span>
                  </label>
                  <select
                    value={formData.originalEmployeeName}
                    onChange={(e) => handleSelectOriginal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    required
                  >
                    <option value="">-- Select Original Employee --</option>
                    {employees?.map((emp) => (
                      <option key={emp._id} value={emp.name}>
                        {emp.name} ({emp.employeeId || emp.designation || "Staff"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Proxy Employee (Substitute) <span className="text-brand-red">*</span>
                  </label>
                  <select
                    value={formData.proxyEmployeeName}
                    onChange={(e) => handleSelectProxy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    required
                  >
                    <option value="">-- Select Proxy Substitute Employee --</option>
                    {employees?.map((emp) => (
                      <option key={emp._id} value={emp.name}>
                        {emp.name} ({emp.employeeId || emp.designation || "Staff"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Duty Date <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dutyDate}
                      onChange={(e) => setFormData({ ...formData, dutyDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all cursor-pointer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Proxy Pay Amount ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.proxyPayAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, proxyPayAmount: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Duty Swap Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                  >
                    <option value="active">Active (Pending / In-Progress)</option>
                    <option value="completed">Completed (Duty Served)</option>
                    <option value="inactive">Inactive (Cancelled)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Remarks / Duty Shift Details
                  </label>
                  <textarea
                    rows={2}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Duty swap justification, specific shift hours, supervisor approval note..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none transition-all"
                  />
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
                        ? "Update Record"
                        : "Create Record"}
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
