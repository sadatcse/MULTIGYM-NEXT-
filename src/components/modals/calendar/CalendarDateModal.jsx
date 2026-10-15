"use client";

import { FiCalendar, FiX, FiDollarSign, FiRotateCcw, FiSave } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/calendar/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function CalendarDateModal({ DAY_TYPE_OPTIONS, activeBranchName, dayFormData, handleResetDayOverride, handleSaveDayConfig, isConfigModalOpen, isSavingDay, selectedDay, setDayFormData, setIsConfigModalOpen, permissions = FULL_ACCESS }) {
  const allowed = permissions.canAdd || permissions.canEdit;
  return (
    <>
{isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-xl rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between bg-brand-offwhite/50 dark:bg-brand-midnight/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-lg">
                  <FiCalendar />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    Date Configuration & Override
                  </h3>
                  <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light font-mono">
                    {dayFormData.dateStr} ({dayFormData.dayName}) &bull; {activeBranchName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="p-2 rounded-xl text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-red hover:text-white transition-all cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={allowed ? handleSaveDayConfig : (e) => e.preventDefault()} className="p-6 space-y-5 overflow-y-auto">
{!allowed && <ReadOnlyNotice />}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-2">
                  Gym Status <span className="text-brand-red">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDayFormData({ ...dayFormData, gymStatus: "open" })}
                    className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${dayFormData.gymStatus === "open"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                        : "bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white border-brand-beige dark:border-brand-dark-grey"
                      }`}
                  >
                    <span>🟢 Gym Open</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDayFormData({ ...dayFormData, gymStatus: "closed" })}
                    className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${dayFormData.gymStatus === "closed"
                        ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20"
                        : "bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white border-brand-beige dark:border-brand-dark-grey"
                      }`}
                  >
                    <span>🔴 Gym Closed</span>
                  </button>
                </div>
              </div>

              {dayFormData.gymStatus === "open" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={dayFormData.openingTime}
                      onChange={(e) => setDayFormData({ ...dayFormData, openingTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={dayFormData.closingTime}
                      onChange={(e) => setDayFormData({ ...dayFormData, closingTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Day Type <span className="text-brand-red">*</span>
                </label>
                <select
                  value={dayFormData.dayType}
                  onChange={(e) => setDayFormData({ ...dayFormData, dayType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                >
                  {DAY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Holiday / Event Short Name
                </label>
                <input
                  type="text"
                  value={dayFormData.title}
                  onChange={(e) => setDayFormData({ ...dayFormData, title: e.target.value })}
                  placeholder="e.g. Independence Day / Gym Maintenance"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Description / Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={dayFormData.description}
                  onChange={(e) => setDayFormData({ ...dayFormData, description: e.target.value })}
                  placeholder="Additional context for HR and attendance auditing..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-gold/20 space-y-3">
                <span className="text-[11px] font-black uppercase text-brand-gold flex items-center gap-1.5">
                  <FiDollarSign /> Payroll Calculation Metadata
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Paid Holiday?
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDayFormData({ ...dayFormData, isPaidHoliday: true })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${dayFormData.isPaidHoliday
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-transparent text-brand-dark-grey border-brand-dark-grey/40"
                          }`}
                      >
                        Yes (Paid)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDayFormData({ ...dayFormData, isPaidHoliday: false })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${!dayFormData.isPaidHoliday
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-transparent text-brand-dark-grey border-brand-dark-grey/40"
                          }`}
                      >
                        No (Unpaid)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Salary Applicable?
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDayFormData({ ...dayFormData, isSalaryApplicable: true })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${dayFormData.isSalaryApplicable
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-transparent text-brand-dark-grey border-brand-dark-grey/40"
                          }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setDayFormData({ ...dayFormData, isSalaryApplicable: false })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${!dayFormData.isSalaryApplicable
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-transparent text-brand-dark-grey border-brand-dark-grey/40"
                          }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                {selectedDay?.isCustomOverride ? (
                  <button
                    type="button"
                    onClick={handleResetDayOverride}
                    className="px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-500/30 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FiRotateCcw /> Reset to Default
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(false)}
                    className="px-4 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey dark:text-brand-gold-light font-extrabold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit" hidden={!allowed}
                    disabled={isSavingDay}
                    className="px-5 py-2 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FiSave />
                    <span>{isSavingDay ? "Saving..." : "Save Configuration"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
