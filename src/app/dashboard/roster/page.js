"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiCopy, FiPlus, FiRepeat } from "react-icons/fi";
import { MdViewWeek } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, addDaysISO, todayISO } from "@/hooks/useHr";
import { Avatar, Btn, Card, EmptyState, Loading, PageHeader, Select, Tabs } from "@/components/hr/HrUi";
import RosterDutyModal from "@/components/hr/modals/RosterDutyModal";
import HistoryTab from "@/components/hr/tabs/RosterHistoryTab";
import { DUTY_STYLE } from "@/components/hr/duty";


// Weeks start on Saturday (Bangladesh working week).
const weekStartOf = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const diff = (d.getUTCDay() + 1) % 7;
  return addDaysISO(iso, -diff);
};
const dayLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" });

export default function RosterPage() {
  const permissions = usePagePermission();
  const { canAdd, canEdit, canDelete } = permissions;
  const { me } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const [tab, setTab] = useState("planner");
  const [branch, setBranch] = useState("");
  const [weekStart, setWeekStart] = useState(weekStartOf(todayISO()));
  const [cell, setCell] = useState(null);
  const branchOptions = me?.scope === "branch" ? me.branches : branches;

  useEffect(() => {
    // Syncing a default from data that arrives asynchronously is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!branch && branchOptions.length) setBranch(branchOptions[0]);
  }, [branch, branchOptions]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)), [weekStart]);
  const staff = useHrQuery("/roster/staff", { branch }, { enabled: !!branch });
  const roster = useHrQuery("/roster", { branch, from: days[0], to: days[6] }, { enabled: !!branch });
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

  const counts = useMemo(() => {
    const c = {};
    for (const r of roster.data?.data || []) if (r.dutyType !== "off") c[r.date] = (c[r.date] || 0) + 1;
    return c;
  }, [roster.data]);

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
        subtitle="Plan Morning / Evening / Friday / Special / Opening & Closing duties branch by branch. Every change is kept in the roster history."
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
              <table className="w-full border-collapse min-w-[980px]">
                <thead>
                  <tr className="bg-brand-offwhite dark:bg-brand-midnight/60 text-[10px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
                    <th className="sticky left-0 z-10 bg-brand-offwhite dark:bg-brand-midnight py-3 px-3 text-left w-56">Staff</th>
                    {days.map((d) => (
                      <th key={d} className={`py-2 px-2 text-center ${d === todayISO() ? "text-brand-gold" : ""}`}>
                        {dayLabel(d)}
                        <div className="text-[9px] font-bold opacity-70 normal-case">{counts[d] || 0} on duty</div>
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
                                    {it.startTime && <div className="font-bold opacity-80">{it.startTime}–{it.endTime}</div>}
                                  </motion.button>
                                ))}
                              </AnimatePresence>
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
    </div>
  );
}
