"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiCopy, FiPlus, FiRepeat } from "react-icons/fi";
import { MdEventAvailable, MdViewWeek } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, addDaysISO, todayISO } from "@/hooks/useHr";
import { Avatar, Btn, Card, EmptyState, Loading, PageHeader, Select, Tabs } from "@/components/hr/HrUi";
import RosterDutyModal from "@/components/hr/modals/RosterDutyModal";
import HistoryTab from "@/components/hr/tabs/RosterHistoryTab";
import { DUTY_STYLE } from "@/components/hr/duty";
import FridayDutyModal from "@/components/hr/modals/FridayDutyModal";
import { fmt12, toHHMM } from "@/components/hr/dutyPlan";
import { plannedOn, shortRange, weekdayOf } from "@/components/hr/dailyDuty";


// Weeks start on Saturday (Bangladesh working week).
const weekStartOf = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const diff = (d.getUTCDay() + 1) % 7;
  return addDaysISO(iso, -diff);
};
const dayLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" });
const hasPlan = (p) => !!(p.branchSchedules?.length || (p.dutyInTime && p.dutyOutTime));

// Opening a roster entry from a usual duty chip starts from that day's usual time.
const presetFrom = (e, iso) => {
  const startTime = toHHMM(e.inTime);
  const endTime = toHHMM(e.outTime);
  const dutyType = weekdayOf(iso) === "friday" ? "friday" : startTime < "12:00" ? "morning" : "evening";
  return { dutyType, startTime, endTime, usual: `${fmt12(startTime)} – ${fmt12(endTime)}` };
};

export default function RosterPage() {
  const permissions = usePagePermission();
  const { canAdd, canEdit, canDelete } = permissions;
  const { me } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const [tab, setTab] = useState("planner");
  const [branch, setBranch] = useState("");
  const [weekStart, setWeekStart] = useState(weekStartOf(todayISO()));
  const [cell, setCell] = useState(null);
  const [fridayOpen, setFridayOpen] = useState(false);
  const branchOptions = me?.scope === "branch" ? me.branches : branches;

  useEffect(() => {
    // Syncing a default from data that arrives asynchronously is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!branch && branchOptions.length) setBranch(branchOptions[0]);
  }, [branch, branchOptions]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)), [weekStart]);
  const staff = useHrQuery("/roster/staff", { branch }, { enabled: !!branch });
  const roster = useHrQuery("/roster", { branch, from: days[0], to: days[6] }, { enabled: !!branch });
  const branchDocs = useHrQuery("/branch", { limit: 200, page: 1 });
  const { run, busy } = useHrMutation();

  const byCell = useMemo(() => {
    const m = {};
    for (const r of roster.data?.data || []) (m[`${r.employee}|${r.date}`] ||= []).push(r);
    return m;
  }, [roster.data]);

  const people = useMemo(() => {
    const list = [...(staff.data?.data || [])];
    // Include visiting staff rostered here from another branch.
    for (const r of roster.data?.data || []) {
      if (!list.some((p) => p._id === r.employee)) list.push({ _id: r.employee, name: r.employeeName, employeeId: r.employeeCode, jobPosition: r.designation, visiting: true });
    }
    return list;
  }, [staff.data, roster.data]);

  // On duty here each day: rostered people, plus everyone else whose usual duty time puts them here.
  const counts = useMemo(() => {
    const c = {};
    for (const d of days) {
      c[d] = people.filter((p) => {
        const items = byCell[`${p._id}|${d}`] || [];
        if (items.length) return items.some((r) => r.dutyType !== "off");
        return !p.visiting && plannedOn(p, d, branch).some((e) => e.branch === branch);
      }).length;
    }
    return c;
  }, [days, people, byCell, branch]);

  // The branch's Friday hours (Settings → Branches) prefill Friday duty times.
  const fridayHours = useMemo(() => {
    const body = branchDocs.data;
    const doc = (body?.data || body?.branches || []).find((b) => b.name === branch);
    const fri = doc?.operatingHours?.friday || {};
    if (fri.isClosed) return { closed: true, note: "Closed on Fridays" };
    return { open: fri.open || doc?.openingTime || "", close: fri.close || doc?.closingTime || "" };
  }, [branchDocs.data, branch]);
  const friday = days[6];

  const copyPrevWeek = async () => {
    if (!confirm(`Copy the roster of the week starting ${addDaysISO(weekStart, -7)} into this week? Existing duties are kept.`)) return;
    const res = await run("post", "/roster/copy-week", { branch, sourceStart: addDaysISO(weekStart, -7), targetStart: weekStart });
    if (res) roster.refetch();
  };

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader
        icon={<MdViewWeek />}
        title="Duty Roster"
        subtitle="Usual duty comes from Employee Duty Time (dashed). Use the roster for Friday duty and one-off changes such as covers, swaps and days off; they replace the usual time for that day. Every change is kept in the history."
        actions={
          <Tabs value={tab} onChange={setTab} tabs={[{ value: "planner", label: "Planner" }, { value: "history", label: "Change history" }]} />
        }
      />

      {tab === "planner" ? (
        <Card
          title={branch ? `${branch} · ${dayLabel(days[0])} – ${dayLabel(days[6])}` : "Select a branch"}
          bodyClassName="p-0"
          actions={
            <>
              <Select value={branch} onChange={setBranch} options={branchOptions} className="w-48" />
              <Btn variant="ghost" size="sm" onClick={() => setWeekStart(addDaysISO(weekStart, -7))}><FiChevronLeft /></Btn>
              <Btn variant="ghost" size="sm" onClick={() => setWeekStart(weekStartOf(todayISO()))}>This week</Btn>
              <Btn variant="ghost" size="sm" onClick={() => setWeekStart(addDaysISO(weekStart, 7))}><FiChevronRight /></Btn>
              {canAdd && <Btn variant="ghost" size="sm" onClick={() => setFridayOpen(true)}><MdEventAvailable /> Friday duty</Btn>}
              {canAdd && <Btn variant="gold" size="sm" loading={busy} onClick={copyPrevWeek}><FiCopy /> Copy last week</Btn>}
            </>
          }
        >
          {staff.loading || roster.loading ? (
            <Loading rows={6} />
          ) : !people.length ? (
            <EmptyState title="No staff in this branch" text="Assign employees to the branch from the Employee Directory." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[980px] table-fixed">
                <thead>
                  <tr className="bg-brand-offwhite dark:bg-brand-midnight/60 text-[10px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
                    <th className="sticky left-0 z-10 bg-brand-offwhite dark:bg-brand-midnight py-3 px-3 text-left w-56">Staff</th>
                    {days.map((d) => (
                      <th key={d} className={`py-2 px-2 text-center ${d === todayISO() ? "text-brand-gold" : ""}`}>
                        {dayLabel(d)}
                        <div className="text-[9px] font-bold opacity-70 normal-case">{counts[d] || 0} on duty</div>
                        {d === friday && canAdd && (
                          <button type="button" onClick={() => setFridayOpen(true)} className="mt-0.5 text-[9px] font-black normal-case text-teal-600 dark:text-teal-300 hover:underline cursor-pointer">
                            Set Friday duty
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40">
                  {people.map((p) => (
                    <tr key={p._id}>
                      <td className="sticky left-0 z-10 bg-brand-white dark:bg-brand-charcoal py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={p.name} photo={p.photo} size={30} />
                          <div className="min-w-0">
                            <div className="text-xs font-black truncate">{p.name}</div>
                            <div className="text-[10px] text-brand-dark-grey truncate">{p.jobPosition || "—"}{p.visiting ? " · visiting" : ""}</div>
                          </div>
                        </div>
                      </td>
                      {days.map((d) => {
                        const items = byCell[`${p._id}|${d}`] || [];
                        const plan = items.length || p.visiting ? [] : plannedOn(p, d, branch);
                        return (
                          <td key={d} className={`p-1.5 align-top ${d === todayISO() ? "bg-brand-gold/5" : ""}`}>
                            <div className="min-h-[52px] flex flex-col gap-1">
                              <AnimatePresence>
                                {items.map((it) => (
                                  <motion.button
                                    key={it._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    type="button"
                                    onClick={() => (canEdit || canDelete) && setCell({ employee: p, date: d, item: it })}
                                    className={`text-left px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer ${DUTY_STYLE[it.dutyType]?.cls}`}
                                    title={it.note}
                                  >
                                    <div className="flex items-center gap-1">
                                      {DUTY_STYLE[it.dutyType]?.label}
                                      {it.isTemporary && <FiRepeat title="Temporary change" />}
                                    </div>
                                    {it.startTime && <div className="font-bold opacity-80">{shortRange(it.startTime, it.endTime)}</div>}
                                  </motion.button>
                                ))}
                              </AnimatePresence>
                              {!items.length &&
                                plan.map((e, i) => {
                                  const here = e.branch === branch;
                                  return (
                                    <button
                                      key={`plan-${i}`}
                                      type="button"
                                      disabled={!canAdd || !here}
                                      onClick={() => setCell({ employee: p, date: d, item: null, preset: presetFrom(e, d) })}
                                      title={here ? "Usual duty time (Employee Duty Time). Click to change it for this day." : `Usual duty at ${e.branch}`}
                                      className={`text-left px-2 py-1 rounded-lg border border-dashed text-[10px] font-bold leading-tight ${here ? "border-brand-beige dark:border-brand-dark-grey text-brand-dark-grey dark:text-brand-gold-light enabled:hover:border-brand-gold enabled:cursor-pointer" : "border-transparent text-brand-dark-grey/60 dark:text-brand-gold-light/50"}`}
                                    >
                                      {!here && <div className="truncate">@ {e.branch}</div>}
                                      <div>{shortRange(e.inTime, e.outTime)}</div>
                                    </button>
                                  );
                                })}
                              {!items.length && !plan.length && !p.visiting && hasPlan(p) && (
                                <span className="px-2 py-1 text-[10px] font-bold text-brand-dark-grey/60 dark:text-brand-gold-light/50">{weekdayOf(d) === "friday" ? "Friday off" : "Off"}</span>
                              )}
                              {canAdd && (
                                <button
                                  type="button"
                                  onClick={() => setCell({ employee: p, date: d, item: null })}
                                  className="opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity text-[10px] font-black text-brand-gold border border-dashed border-brand-gold/40 rounded-lg py-1 cursor-pointer"
                                >
                                  <FiPlus className="inline" /> Add
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex flex-wrap gap-2 p-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
            <span className="px-2 py-0.5 rounded-lg border border-dashed border-brand-beige dark:border-brand-dark-grey text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light">Usual duty time</span>
            {Object.entries(DUTY_STYLE).map(([k, v]) => (
              <span key={k} className={`px-2 py-0.5 rounded-lg border text-[10px] font-black ${v.cls}`}>{v.label}</span>
            ))}
            <span className="text-[10px] font-bold text-brand-dark-grey flex items-center gap-1"><FiRepeat /> = temporary change</span>
          </div>
        </Card>
      ) : (
        <HistoryTab branch={branch} branchOptions={branchOptions} setBranch={setBranch} />
      )}

      <RosterDutyModal cell={cell} branch={branch} permissions={permissions} onClose={() => setCell(null)} onSaved={() => { setCell(null); roster.refetch(); }} />
      <FridayDutyModal
        day={fridayOpen && branch ? { date: friday, branch, hours: fridayHours, assigned: (roster.data?.data || []).filter((r) => r.date === friday && r.dutyType === "friday") } : null}
        staff={people}
        endpoint="/roster"
        permissions={permissions}
        onClose={() => setFridayOpen(false)}
        onSaved={() => { setFridayOpen(false); roster.refetch(); }}
      />
    </div>
  );
}
