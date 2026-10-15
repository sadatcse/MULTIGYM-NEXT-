"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiClock, FiX, FiPlus, FiTrash2 } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/employee/duty-time/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function DutyTimeEditModal({ ALL_DAYS, branches, editingEmployee, formData, handleAddBranchSlot, handleBranchSlotChange, handleRemoveBranchSlot, handleScheduleSelect, handleSubmit, handleToggleSlotDay, isModalOpen, isSubmitting, schedules, setFormData, setIsModalOpen, shifts, permissions = FULL_ACCESS }) {
  const allowed = editingEmployee ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isModalOpen && editingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                    <FiClock className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      Configure Duty Time & Roster
                    </h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                      Assign shifts, daily hours, and branch rosters for {editingEmployee.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 space-y-4 overflow-y-auto flex-1">
{!allowed && <ReadOnlyNotice />}
                {/* Employee Summary Card */}
                <div className="p-3.5 bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs">
                  <div className="font-black text-brand-black dark:text-brand-white text-sm">
                    {editingEmployee.name}
                  </div>
                  <div className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium mt-0.5 flex flex-wrap gap-x-3">
                    <span>ID: {editingEmployee.employeeId || "N/A"}</span>
                    <span>Role: {editingEmployee.jobPosition || "Staff"}</span>
                    <span>Branches: {editingEmployee.branches?.join(", ") || "General"}</span>
                  </div>
                </div>

                {/* Primary Branch Selection */}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                    Primary Branch
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white outline-none cursor-pointer"
                  >
                    <option value="">-- Select Primary Branch --</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Work Schedule (Preset Selector) */}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                    Work Schedule Preset
                  </label>
                  <select
                    value={formData.workSchedule}
                    onChange={(e) => handleScheduleSelect(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white outline-none cursor-pointer"
                  >
                    <option value="">-- Custom or Select Schedule Preset --</option>
                    {schedules.map((sch) => (
                      <option key={sch._id} value={sch.scheduleName}>
                        {sch.scheduleName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shift Category */}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                    Shift Category <span className="text-brand-red">*</span>
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white outline-none cursor-pointer"
                  >
                    <option value="">-- Select Shift Category --</option>
                    {shifts.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Daily In-Time & Out-Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                      Duty In-Time
                    </label>
                    <input
                      type="text"
                      value={formData.dutyInTime}
                      onChange={(e) =>
                        setFormData({ ...formData, dutyInTime: e.target.value })
                      }
                      placeholder="e.g. 07:30 AM or 08:00 AM"
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                      Duty Out-Time
                    </label>
                    <input
                      type="text"
                      value={formData.dutyOutTime}
                      onChange={(e) =>
                        setFormData({ ...formData, dutyOutTime: e.target.value })
                      }
                      placeholder="e.g. 03:30 PM or 11:00 PM"
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white outline-none"
                    />
                  </div>
                </div>

                {/* Multi-Branch Schedules Toggle & Editor */}
                <div className="pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="multiBranchToggle"
                        checked={formData.isMultiBranch}
                        onChange={(e) =>
                          setFormData({ ...formData, isMultiBranch: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-brand-red focus:ring-brand-red cursor-pointer"
                      />
                      <label
                        htmlFor="multiBranchToggle"
                        className="text-xs font-extrabold text-brand-black dark:text-brand-white cursor-pointer select-none"
                      >
                        Multi-Branch & Day-Specific Roster
                      </label>
                    </div>

                    {formData.isMultiBranch && (
                      <button
                        type="button"
                        onClick={handleAddBranchSlot}
                        className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <FiPlus className="text-xs" />
                        <span>Add Branch Timing</span>
                      </button>
                    )}
                  </div>

                  {formData.isMultiBranch && (
                    <div className="space-y-3">
                      {formData.branchSchedules.map((bs, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 space-y-3 relative"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                              Branch Slot #{sIdx + 1}
                            </span>
                            {formData.branchSchedules.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveBranchSlot(sIdx)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Remove Branch Slot"
                              >
                                <FiTrash2 className="text-xs" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Branch select */}
                            <div>
                              <label className="block text-[10px] font-bold text-brand-dark-grey uppercase mb-1">
                                Branch
                              </label>
                              <select
                                value={bs.branch}
                                onChange={(e) =>
                                  handleBranchSlotChange(sIdx, "branch", e.target.value)
                                }
                                className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                              >
                                {branches.map((b) => (
                                  <option key={b._id} value={b.name}>
                                    {b.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* In-Time */}
                            <div>
                              <label className="block text-[10px] font-bold text-brand-dark-grey uppercase mb-1">
                                In-Time
                              </label>
                              <input
                                type="text"
                                value={bs.inTime}
                                onChange={(e) =>
                                  handleBranchSlotChange(sIdx, "inTime", e.target.value)
                                }
                                placeholder="e.g. 08:00 AM"
                                className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                              />
                            </div>

                            {/* Out-Time */}
                            <div>
                              <label className="block text-[10px] font-bold text-brand-dark-grey uppercase mb-1">
                                Out-Time
                              </label>
                              <input
                                type="text"
                                value={bs.outTime}
                                onChange={(e) =>
                                  handleBranchSlotChange(sIdx, "outTime", e.target.value)
                                }
                                placeholder="e.g. 03:00 PM"
                                className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <input
                              type="text"
                              value={bs.notes || ""}
                              onChange={(e) =>
                                handleBranchSlotChange(sIdx, "notes", e.target.value)
                              }
                              placeholder="Notes (e.g. Sat: 8am-3pm, Mon: 2:30pm-9pm)"
                              className="w-full px-3 py-1.5 rounded-xl text-xs font-medium bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                            />
                          </div>

                          {/* Days Pill Toggle */}
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block mb-1">
                              Active Days:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {ALL_DAYS.map((day) => {
                                const isActive = bs.days?.includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleToggleSlotDay(sIdx, day)}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                                      isActive
                                        ? "bg-purple-600 text-white border-purple-600"
                                        : "bg-brand-white dark:bg-brand-charcoal text-brand-dark-grey border-brand-beige/50 dark:border-brand-dark-grey"
                                    }`}
                                  >
                                    {day.slice(0, 3)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-2xl text-xs font-bold bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light hover:bg-brand-beige/60 dark:hover:bg-brand-dark-grey transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" hidden={!allowed}
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-2xl text-xs font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? "Saving..." : "Save Duty Time"}
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
