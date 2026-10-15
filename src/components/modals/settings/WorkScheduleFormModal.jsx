"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiClock, FiX, FiPlus, FiMinus, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/settings/work-schedules/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function WorkScheduleFormModal({ availableShifts, editingItem, formData, formErrors, handleAddSlot, handleEndTimeChange, handleRemoveSlot, handleSlotChange, handleStartTimeChange, handleSubmit, handleWorkHoursInputChange, isModalOpen, isSubmitting, recalculateMultiSlotHours, setFormData, setIsModalOpen, permissions = FULL_ACCESS }) {
  const allowed = editingItem ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                    <FiClock className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {editingItem ? "Edit Work Schedule" : "Add Work Schedule"}
                    </h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                      Configure shifts, daily work hours, split slots, and policies
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 space-y-4 overflow-y-auto">
{!allowed && <ReadOnlyNotice />}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Schedule Name <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.scheduleName}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, scheduleName: e.target.value })}
                      placeholder="e.g. Standard 8.30 Hours Day Shift"
                      className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${
                        formErrors.scheduleName
                          ? "border-brand-red focus:ring-brand-red/50"
                          : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"
                      } text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                    {formErrors.scheduleName && (
                      <p className="text-brand-red text-[11px] mt-1 font-bold">{formErrors.scheduleName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.order}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Shift Category
                    </label>
                    <select
                      value={formData.shiftType}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                    >
                      {availableShifts && availableShifts.length > 0 ? (
                        availableShifts.map((s) => (
                          <option key={s._id} value={s.name}>
                            {s.name} ({s.shiftCategory || "General"})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="General Day Shift">General Day Shift</option>
                          <option value="Morning Shift">Morning Shift</option>
                          <option value="Evening Shift">Evening Shift</option>
                          <option value="Night Shift">Night Shift</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Multi-Slot Split Shift?
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isMultiSlot"
                          checked={!formData.isMultiSlot}
                          disabled={isSubmitting}
                          onChange={() => setFormData({ ...formData, isMultiSlot: false })}
                          className="w-4 h-4 accent-brand-gold cursor-pointer"
                        />
                        <span className="text-xs font-bold">Standard Single Shift</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isMultiSlot"
                          checked={formData.isMultiSlot}
                          disabled={isSubmitting}
                          onChange={() => {
                            const calc = recalculateMultiSlotHours(formData.timeSlots);
                            setFormData({
                              ...formData,
                              isMultiSlot: true,
                              workHoursPerDay: calc.workHoursPerDay,
                              workHoursFormatted: calc.workHoursFormatted,
                              workHoursInput: calc.workHoursInput,
                            });
                          }}
                          className="w-4 h-4 accent-sky-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-sky-500">Split-Shift Multi Slot</span>
                      </label>
                    </div>
                  </div>
                </div>

                {!formData.isMultiSlot ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50">
                    <div>
                      <label className="block text-[11px] font-extrabold text-brand-dark-grey dark:text-brand-gold-light uppercase tracking-wider mb-1">
                        Shift Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        disabled={isSubmitting}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-brand-dark-grey dark:text-brand-gold-light uppercase tracking-wider mb-1">
                        Shift End Time
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        disabled={isSubmitting}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-brand-dark-grey dark:text-brand-gold-light uppercase tracking-wider mb-1">
                        Daily Duration
                      </label>
                      <input
                        type="text"
                        value={formData.workHoursInput}
                        disabled={isSubmitting}
                        onChange={(e) => handleWorkHoursInputChange(e.target.value)}
                        placeholder="e.g. 8.30"
                        className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                      />
                      <span className="text-[10px] text-emerald-500 font-bold block mt-1">
                        {formData.workHoursFormatted}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-sky-500 tracking-wider">
                        Split Slots Configuration ({formData.workHoursFormatted})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddSlot}
                        className="px-3 py-1 bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-sky-600 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <FiPlus /> Add Slot
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formData.timeSlots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50">
                          <input
                            type="text"
                            value={slot.slotName}
                            onChange={(e) => handleSlotChange(idx, "slotName", e.target.value)}
                            placeholder="Slot Name"
                            className="w-32 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                          />
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleSlotChange(idx, "startTime", e.target.value)}
                            className="w-28 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                          />
                          <span className="text-xs font-bold text-brand-dark-grey">to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleSlotChange(idx, "endTime", e.target.value)}
                            className="w-28 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(idx)}
                            disabled={formData.timeSlots.length <= 1}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ml-auto"
                          >
                            <FiMinus className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Work Days / Week
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={formData.workDaysPerWeek}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, workDaysPerWeek: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Late Tolerance (Mins)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.lateToleranceMinutes}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, lateToleranceMinutes: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Half-Day Min Hours
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.halfDayHours}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, halfDayHours: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="scheduleStatus"
                        value="active"
                        checked={formData.status === "active"}
                        disabled={isSubmitting}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-emerald-500">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="scheduleStatus"
                        value="inactive"
                        checked={formData.status === "inactive"}
                        disabled={isSubmitting}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-4 h-4 accent-rose-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-rose-500">Inactive</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
                      <span>{editingItem ? "Update Schedule" : "Create Schedule"}</span>
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
