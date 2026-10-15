"use client";

import { FiSliders, FiX, FiSave } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/calendar/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function WeeklyScheduleModal({ WEEKDAY_NAMES, activeBranchName, handleSaveWeeklySchedule, isSavingWeekly, isWeeklyModalOpen, setIsWeeklyModalOpen, setWeeklyScheduleData, weeklyScheduleData, permissions = FULL_ACCESS }) {
  const allowed = permissions.canAdd || permissions.canEdit;
  return (
    <>
{isWeeklyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between bg-brand-offwhite/50 dark:bg-brand-midnight/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-lg">
                  <FiSliders />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    Normal Weekly Gym Schedule ({activeBranchName})
                  </h3>
                  <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                    Default recurring status for each day of the week.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWeeklyModalOpen(false)}
                className="p-2 rounded-xl text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-red hover:text-white transition-all cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={allowed ? handleSaveWeeklySchedule : (e) => e.preventDefault()} className="p-6 space-y-4 overflow-y-auto">
{!allowed && <ReadOnlyNotice />}
              <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light font-semibold">
                Set standard open/closed status for Sunday to Saturday. Note: Manually configured specific dates will always override these defaults.
              </p>

              <div className="space-y-3">
                {WEEKDAY_NAMES.map((dayName) => {
                  const key = dayName.toLowerCase();
                  const dayData = weeklyScheduleData[key] || {
                    gymStatus: key === "friday" ? "closed" : "open",
                    dayType: key === "friday" ? "weekly_off" : "working_day",
                    openingTime: key === "friday" ? "" : "07:00",
                    closingTime: key === "friday" ? "" : "23:00",
                  };
                  const isOpen = dayData.gymStatus === "open";

                  return (
                    <div
                      key={dayName}
                      className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 flex flex-col sm:flex-row items-center justify-between gap-3"
                    >
                      <div className="w-28 font-black text-xs text-brand-black dark:text-brand-white">
                        {dayName}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setWeeklyScheduleData({
                              ...weeklyScheduleData,
                              [key]: {
                                ...dayData,
                                gymStatus: "open",
                                dayType: "working_day",
                                openingTime: dayData.openingTime || "07:00",
                                closingTime: dayData.closingTime || "23:00",
                              },
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs cursor-pointer border ${isOpen
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : "bg-transparent text-brand-dark-grey border-brand-dark-grey/30"
                            }`}
                        >
                          🟢 Open
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setWeeklyScheduleData({
                              ...weeklyScheduleData,
                              [key]: {
                                ...dayData,
                                gymStatus: "closed",
                                dayType: "weekly_off",
                              },
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs cursor-pointer border ${!isOpen
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-transparent text-brand-dark-grey border-brand-dark-grey/30"
                            }`}
                        >
                          🔴 Closed
                        </button>
                      </div>

                      {isOpen && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={dayData.openingTime || "07:00"}
                            onChange={(e) => {
                              setWeeklyScheduleData({
                                ...weeklyScheduleData,
                                [key]: { ...dayData, openingTime: e.target.value },
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-mono font-bold text-brand-black dark:text-brand-white"
                          />
                          <span className="text-xs text-brand-dark-grey">–</span>
                          <input
                            type="time"
                            value={dayData.closingTime || "23:00"}
                            onChange={(e) => {
                              setWeeklyScheduleData({
                                ...weeklyScheduleData,
                                [key]: { ...dayData, closingTime: e.target.value },
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-mono font-bold text-brand-black dark:text-brand-white"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                <button
                  type="button"
                  onClick={() => setIsWeeklyModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey dark:text-brand-gold-light font-extrabold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit" hidden={!allowed}
                  disabled={isSavingWeekly}
                  className="px-5 py-2 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FiSave />
                  <span>{isSavingWeekly ? "Saving..." : "Save Default Weekly Schedule"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
