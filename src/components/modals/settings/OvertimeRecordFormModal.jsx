"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiFileText, FiX, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/settings/overtime/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function OvertimeRecordFormModal({ editingRecord, employees, handleSubmitRecord, isRecordModalOpen, isSubmitting, recordErrors, recordForm, setIsRecordModalOpen, setRecordForm, permissions = FULL_ACCESS }) {
  const allowed = editingRecord ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isRecordModalOpen && (
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
                    <FiFileText className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {editingRecord ? "Edit Overtime Record" : "Log Overtime Record"}
                    </h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                      Record overtime hours and approval status for an employee
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={allowed ? handleSubmitRecord : (e) => e.preventDefault()} className="p-6 space-y-4">
{!allowed && <ReadOnlyNotice />}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Employee <span className="text-brand-red">*</span>
                  </label>
                  {employees && employees.length > 0 ? (
                    <select
                      value={recordForm.employeeName}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const selectedEmp = employees.find((emp) => emp.name === e.target.value);
                        setRecordForm((prev) => ({
                          ...prev,
                          employeeName: e.target.value,
                          employeeId: selectedEmp?.employeeId || prev.employeeId,
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                    >
                      <option value="">Select Employee...</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp.name}>
                          {emp.name} ({emp.employeeId || "No ID"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={recordForm.employeeName}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, employeeName: e.target.value }))}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  )}
                  {recordErrors.employeeName && (
                    <p className="text-brand-red text-[11px] mt-1 font-bold">{recordErrors.employeeName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Date <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="date"
                      value={recordForm.recordDate}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, recordDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={recordForm.overtimeHours}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, overtimeHours: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Minutes
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={recordForm.overtimeMinutes}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, overtimeMinutes: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <select
                      value={recordForm.status}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={recordForm.employeeId}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                      placeholder="e.g. EMP-001"
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={recordForm.remarks}
                    disabled={isSubmitting}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Optional notes or reason for overtime..."
                    className="w-full px-4 py-2 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
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
                      <span>{editingRecord ? "Update Record" : "Save Record"}</span>
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
