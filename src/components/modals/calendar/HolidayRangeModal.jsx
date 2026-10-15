"use client";

import { FiPlus, FiX, FiSave } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/calendar/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function HolidayRangeModal({ DAY_TYPE_OPTIONS, activeBranchName, handleSaveRangeHoliday, isRangeModalOpen, isSavingRange, rangeFormData, setIsRangeModalOpen, setRangeFormData, permissions = FULL_ACCESS }) {
  const allowed = permissions.canAdd || permissions.canEdit;
  return (
    <>
{isRangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-xl rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between bg-brand-offwhite/50 dark:bg-brand-midnight/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-red/20 text-brand-red flex items-center justify-center font-bold text-lg">
                  <FiPlus />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    Add Holiday / Special Date Range ({activeBranchName})
                  </h3>
                  <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                    Configure single or multi-day holidays & event closures.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRangeModalOpen(false)}
                className="p-2 rounded-xl text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-red hover:text-white transition-all cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={allowed ? handleSaveRangeHoliday : (e) => e.preventDefault()} className="p-6 space-y-4 overflow-y-auto">
{!allowed && <ReadOnlyNotice />}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Start Date <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="date"
                    value={rangeFormData.startDate}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    End Date <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="date"
                    value={rangeFormData.endDate}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Holiday / Event Title <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={rangeFormData.title}
                  onChange={(e) => setRangeFormData({ ...rangeFormData, title: e.target.value })}
                  placeholder="e.g. Eid-ul-Fitr / Independence Day / Annual Maintenance"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Holiday Type
                  </label>
                  <select
                    value={rangeFormData.dayType}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, dayType: e.target.value })}
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
                    Gym Status
                  </label>
                  <select
                    value={rangeFormData.gymStatus}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, gymStatus: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                  >
                    <option value="closed">🔴 Closed</option>
                    <option value="open">🟢 Open</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Description / Details
                </label>
                <textarea
                  rows={2}
                  value={rangeFormData.description}
                  onChange={(e) => setRangeFormData({ ...rangeFormData, description: e.target.value })}
                  placeholder="Government declaration details or company announcement..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                <button
                  type="button"
                  onClick={() => setIsRangeModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey dark:text-brand-gold-light font-extrabold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit" hidden={!allowed}
                  disabled={isSavingRange}
                  className="px-5 py-2 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FiSave />
                  <span>{isSavingRange ? "Applying..." : "Apply Holiday Range"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
