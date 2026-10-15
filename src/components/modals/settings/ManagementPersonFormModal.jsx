"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MdSupervisorAccount } from "react-icons/md";
import { FiX, FiUsers, FiSearch } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/settings/management-persons/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function ManagementPersonFormModal({ PRESET_ROLES, editingItem, employeeSelectorSearch, filteredEmployees, formData, handleSelectEmployee, handleSelectPreset, handleSubmit, isModalOpen, selectedEmployeeObj, setEmployeeSelectorSearch, setFormData, setIsModalOpen, submitting, permissions = FULL_ACCESS }) {
  const allowed = editingItem ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-lg font-bold">
                    <MdSupervisorAccount />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {editingItem
                        ? `Edit Authority: ${editingItem.title}`
                        : "Add Management Authority"}
                    </h3>
                    <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                      Configure authority title and select the corresponding employee
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white cursor-pointer"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 overflow-y-auto space-y-5 flex-1">
{!allowed && <ReadOnlyNotice />}
                {/* Quick Presets */}
                {!editingItem && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-brand-dark-grey block">
                      Quick Preset Roles
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_ROLES.map((preset) => (
                        <button
                          key={preset.code}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                            formData.code === preset.code
                              ? "bg-brand-gold text-brand-midnight shadow-xs font-black"
                              : "bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white border border-brand-beige/60 dark:border-brand-dark-grey"
                          }`}
                        >
                          {preset.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Row 1: Title & Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      Authority Title <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. MD Sir, Director Sir"
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      System Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
                        })
                      }
                      placeholder="e.g. MD_SIR"
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                {/* Row 2: Designation & Priority Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      Executive Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) =>
                        setFormData({ ...formData, designation: e.target.value })
                      }
                      placeholder="e.g. Managing Director"
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      Hierarchy Order (Priority)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={formData.priorityOrder}
                      onChange={(e) =>
                        setFormData({ ...formData, priorityOrder: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                {/* EMPLOYEE SELECTION SECTION (Core user requirement) */}
                <div className="p-4 rounded-2xl bg-brand-gold/5 dark:bg-brand-midnight/50 border border-brand-gold/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
                      <FiUsers className="text-sm" />
                      <span>Select Employee for {formData.title || "Authority"}</span>
                    </label>
                    {formData.employee && (
                      <button
                        type="button"
                        onClick={() => handleSelectEmployee("")}
                        className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer"
                      >
                        Clear Assignment
                      </button>
                    )}
                  </div>

                  {/* Search inside employee dropdown */}
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark-grey text-xs" />
                    <input
                      type="text"
                      value={employeeSelectorSearch}
                      onChange={(e) => setEmployeeSelectorSearch(e.target.value)}
                      placeholder="Type to filter employees by name, ID, designation..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  {/* Employee Dropdown Select */}
                  <select
                    value={formData.employee}
                    onChange={(e) => handleSelectEmployee(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                  >
                    <option value="">-- No Employee Selected (Unassigned) --</option>
                    {filteredEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} {emp.employeeId ? `(${emp.employeeId})` : ""} -{" "}
                        {emp.jobPosition || emp.department || "Staff"}
                      </option>
                    ))}
                  </select>

                  {/* Preview of Selected Employee */}
                  {selectedEmployeeObj && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3.5 p-3 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold font-black flex items-center justify-center overflow-hidden shrink-0 border border-brand-gold/40">
                        {selectedEmployeeObj.photo ? (
                          <img
                            src={selectedEmployeeObj.photo}
                            alt={selectedEmployeeObj.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base">
                            {selectedEmployeeObj.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-brand-black dark:text-brand-white truncate">
                            {selectedEmployeeObj.name}
                          </span>
                          {selectedEmployeeObj.employeeId && (
                            <span className="text-[10px] font-mono font-bold bg-brand-offwhite dark:bg-brand-midnight px-1.5 py-0.5 rounded border border-brand-beige/40">
                              {selectedEmployeeObj.employeeId}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-brand-gold font-bold">
                          {selectedEmployeeObj.jobPosition || "Executive"}
                        </p>
                        <p className="text-[10px] text-brand-dark-grey truncate">
                          {selectedEmployeeObj.email || "No email"} •{" "}
                          {selectedEmployeeObj.mobileNumber || selectedEmployeeObj.phone || "No phone"}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Row 3: Direct Overrides (Optional contact info) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. md@company.com"
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      Official Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +880 1700-000000"
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                {/* Row 4: Capabilities & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canIssueInstructions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          canIssueInstructions: e.target.checked,
                        })
                      }
                      className="rounded accent-brand-gold w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-brand-black dark:text-brand-white">
                      Can Issue Directives
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canApproveTasks}
                      onChange={(e) =>
                        setFormData({ ...formData, canApproveTasks: e.target.checked })
                      }
                      className="rounded accent-brand-gold w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-brand-black dark:text-brand-white">
                      Can Approve Tasks
                    </span>
                  </label>

                  <div className="space-y-1">
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="active">Status: Active</option>
                      <option value="inactive">Status: Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                    Notes / Memo
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Primary instruction authority for fitness and gym directives."
                    className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" hidden={!allowed}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-2xl bg-brand-gold text-brand-midnight font-black text-xs shadow-md shadow-brand-gold/20 hover:brightness-105 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting
                      ? "Saving..."
                      : editingItem
                      ? "Update Management Person"
                      : "Create Management Person"}
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
