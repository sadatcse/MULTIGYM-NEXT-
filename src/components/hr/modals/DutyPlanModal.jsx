"use client";

import { useState } from "react";
import { FiAlertTriangle, FiCopy, FiPlus, FiTrash2 } from "react-icons/fi";
import ModalShell from "@/components/modals/ModalShell";
import { Avatar, Btn, inputCls } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import ModalFooter from "./ModalFooter";
import { DAY_SHORT, WEEK, WORK_DAYS, branchColor, daysText, entriesOn, fmt12, overlaps, toHHMM } from "@/components/hr/dutyPlan";

// Edit one person's weekly duty plan: rows of branch + days + in/out time.
// Several rows give multi-branch duty, split shifts and per-day times.
export default function DutyPlanModal({ employee, branches, allowed, onClose, onSaved }) {
  return (
    <ModalShell isOpen={!!employee} onClose={onClose} size="2xl" title={employee ? `Duty plan — ${employee.name}` : ""}>
      {employee && <Body key={employee._id} employee={employee} branches={branches} allowed={allowed} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

const blank = (branch) => ({ branch: branch || "", days: [...WORK_DAYS], inTime: "", outTime: "", notes: "" });

function Body({ employee, branches, allowed, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const [rows, setRows] = useState(() => {
    const list = (employee.branchSchedules || []).map((e) => ({ branch: e.branch || "", days: e.days?.length ? e.days : [...WORK_DAYS], inTime: toHHMM(e.inTime), outTime: toHHMM(e.outTime), notes: e.notes || "" }));
    if (list.length) return list;
    // No plan yet: start from the old single duty time, every day.
    return [{ ...blank(employee.branches?.[0]), inTime: toHHMM(employee.dutyInTime), outTime: toHHMM(employee.dutyOutTime) }];
  });
  const set = (i, patch) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const toggleDay = (i, d) => {
    const days = rows[i].days.includes(d) ? rows[i].days.filter((x) => x !== d) : [...rows[i].days, d];
    set(i, { days: WEEK.filter((x) => days.includes(x)) });
  };
  const clash = overlaps(rows);
  const clashRows = new Set(clash.flatMap((c) => [c.a, c.b]));
  const incomplete = rows.some((r) => !r.branch || !r.inTime || !r.outTime || r.inTime === r.outTime || !r.days.length);

  const save = async () => {
    const res = await run("put", `/duty-plan/${employee._id}`, { branchSchedules: rows });
    if (res?.data) onSaved(res.data);
  };

  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 space-y-4 min-w-0">
        <div className="flex items-center gap-3">
          <Avatar name={employee.name} photo={employee.photo} size={40} />
          <div className="min-w-0">
            <div className="text-sm font-black text-brand-black dark:text-brand-white">{employee.name}</div>
            <div className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">{[employee.employeeId, employee.jobPosition, employee.department].filter(Boolean).join(" · ")}</div>
          </div>
        </div>

        <p className="text-[12px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">
          Add a row for each duty window. Use several rows for work at more than one branch, for a split shift (two windows the same day), or when times differ by day. <b>Sat–Thu</b> is the usual week — Friday is everyone&apos;s day off; days that no row covers are off days.
        </p>

        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className={`rounded-2xl border p-3 space-y-2.5 ${clashRows.has(i) ? "border-red-400 bg-red-500/5" : "border-brand-beige/60 dark:border-brand-dark-grey/60"}`}>
              <div className="grid sm:grid-cols-[minmax(0,1.3fr)_132px_132px_auto] gap-2 items-center">
                <select aria-label={`Branch for row ${i + 1}`} value={r.branch} onChange={(e) => set(i, { branch: e.target.value })} className={`${inputCls} cursor-pointer`} style={r.branch ? { borderLeft: `4px solid ${branchColor(r.branch, branches)}` } : undefined}>
                  <option value="">Choose branch…</option>
                  {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <input type="time" aria-label={`In time row ${i + 1}`} value={r.inTime} onChange={(e) => set(i, { inTime: e.target.value })} className={`${inputCls} dark:[color-scheme:dark]`} />
                <input type="time" aria-label={`Out time row ${i + 1}`} value={r.outTime} onChange={(e) => set(i, { outTime: e.target.value })} className={`${inputCls} dark:[color-scheme:dark]`} />
                <div className="flex justify-end gap-1">
                  <Btn size="sm" variant="ghost" title="Copy this row (e.g. for a split shift)" onClick={() => setRows((x) => [...x.slice(0, i + 1), { ...r, inTime: r.outTime, outTime: "" }, ...x.slice(i + 1)])}><FiCopy /></Btn>
                  <Btn size="sm" variant="ghost" title="Remove row" disabled={rows.length <= 1} onClick={() => setRows((x) => x.filter((_, j) => j !== i))}><FiTrash2 /></Btn>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => set(i, { days: [...WORK_DAYS] })} className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${daysText(r.days) === "Sat–Thu" ? "bg-brand-gold text-brand-midnight border-brand-gold" : "border-brand-beige dark:border-brand-dark-grey text-brand-dark-grey dark:text-brand-gold-light"}`}>Sat–Thu</button>
                {WEEK.map((d) => (
                  <button key={d} type="button" aria-pressed={r.days.includes(d)} onClick={() => toggleDay(i, d)} className={`w-11 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${r.days.includes(d) ? "bg-brand-charcoal text-white border-brand-charcoal dark:bg-brand-gold dark:text-brand-midnight dark:border-brand-gold" : "border-brand-beige dark:border-brand-dark-grey text-brand-dark-grey dark:text-brand-gold-light"}`}>{DAY_SHORT[d]}</button>
                ))}
                <input value={r.notes} onChange={(e) => set(i, { notes: e.target.value })} placeholder="Note (optional)" className={`${inputCls} !py-1 !text-[11px] flex-1 min-w-[140px]`} />
              </div>
            </div>
          ))}
          <Btn size="sm" variant="ghost" onClick={() => setRows((x) => [...x, blank(x[x.length - 1]?.branch)])}><FiPlus /> Add duty window</Btn>
        </div>

        {clash.length > 0 && (
          <p className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-[12px] font-bold text-red-700 dark:text-red-300">
            <FiAlertTriangle className="mt-0.5 shrink-0" /> Overlapping times on {[...new Set(clash.map((c) => DAY_SHORT[c.day]))].join(", ")} — fix the highlighted rows.
          </p>
        )}

        <div>
          <p className="text-xs font-black text-brand-black dark:text-brand-white mb-2">The week</p>
          <div className="grid grid-cols-7 gap-1.5 overflow-x-auto min-w-0">
            {WEEK.map((d) => {
              const list = entriesOn(rows.filter((r) => r.inTime && r.outTime), d);
              return (
                <div key={d} className="min-w-[78px] rounded-xl bg-brand-offwhite dark:bg-brand-midnight p-1.5">
                  <div className="text-[10px] font-black text-center text-brand-dark-grey dark:text-brand-gold-light mb-1">{DAY_SHORT[d]}</div>
                  {list.length ? (
                    list.map((e, k) => (
                      <div key={k} className="mb-1 rounded-lg px-1.5 py-1 text-[10px] font-bold leading-tight text-white" style={{ background: branchColor(e.branch, branches) }} title={e.branch}>
                        <div className="truncate">{e.branch || "—"}</div>
                        <div>{fmt12(e.inTime)}</div>
                        <div>{fmt12(e.outTime)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] font-bold text-center text-amber-600 dark:text-amber-400 py-2">Off</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} disabled={incomplete || clash.length > 0} submitLabel="Save duty plan" />
      </div>
    </>
  );
}
