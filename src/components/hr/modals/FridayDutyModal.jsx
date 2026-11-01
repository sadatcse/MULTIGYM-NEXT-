"use client";

import { useMemo, useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Avatar, Btn, Field, inputCls, SearchBox } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import { DUTY_STYLE } from "@/components/hr/duty";
import { toHHMM } from "@/components/hr/dutyPlan";
import { dateLabel, rangeText } from "@/components/hr/dailyDuty";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

// Pick who works a Friday and their hours in one step. Saves roster entries
// (duty type "friday") through `endpoint`: "/roster" from the planner,
// "/duty-plan/fridays" from the Friday Duty page. Unticking someone who is
// already on duty removes their entry.
// `day` = { date, branch, hours: { open, close, closed, note }, assigned: [{ _id, employee, startTime, endTime, note }] }
// `staff` rows may carry `recent` / `last` (Fridays worked lately), `leaveOn` and `usualFriday`.
export default function FridayDutyModal({ day, staff = [], endpoint = "/roster", permissions = NO_PERMISSIONS, onClose, onSaved }) {
  return (
    <ModalShell isOpen={!!day} onClose={onClose} size="2xl" title={day ? `Friday duty — ${dateLabel(day.date, { weekday: "long", day: "numeric", month: "long" })}` : ""}>
      {day && <Body key={`${day.branch}|${day.date}`} day={day} staff={staff} endpoint={endpoint} permissions={permissions} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

const history = (p) => {
  if (p.recent === undefined) return "";
  if (!p.recent) return "No Friday duty in 12 weeks";
  return `${p.recent} Friday${p.recent > 1 ? "s" : ""} in 12 weeks · last ${dateLabel(p.last, { day: "numeric", month: "short" })}`;
};

function Body({ day, staff, endpoint, permissions, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const open = day.hours?.closed ? "" : toHHMM(day.hours?.open);
  const close = day.hours?.closed ? "" : toHHMM(day.hours?.close);
  const [defaults, setDefaults] = useState({ start: open || DUTY_STYLE.friday.times[0], end: close || DUTY_STYLE.friday.times[1] });
  const assignedBy = useMemo(() => Object.fromEntries((day.assigned || []).map((a) => [String(a.employee), a])), [day.assigned]);
  const [picked, setPicked] = useState(() =>
    Object.fromEntries((day.assigned || []).map((a) => [String(a.employee), { start: toHHMM(a.startTime), end: toHHMM(a.endTime), note: a.note || "" }])),
  );
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const allowed = permissions.canAdd || permissions.canEdit;

  const people = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (
      staff
        .filter((p) => !q || `${p.name} ${p.employeeId || ""} ${p.jobPosition || ""}`.toLowerCase().includes(q))
        // Whoever is already on duty first, then whoever has done the fewest Fridays lately.
        .sort((a, b) => (assignedBy[b._id] ? 1 : 0) - (assignedBy[a._id] ? 1 : 0) || (a.recent ?? 0) - (b.recent ?? 0) || a.name.localeCompare(b.name))
    );
  }, [staff, search, assignedBy]);

  const toggle = (p) =>
    setPicked((m) => {
      const next = { ...m };
      if (next[p._id]) delete next[p._id];
      else next[p._id] = { start: toHHMM(p.usualFriday?.start) || defaults.start, end: toHHMM(p.usualFriday?.end) || defaults.end, note: "" };
      return next;
    });
  const setTime = (id, patch) => setPicked((m) => ({ ...m, [id]: { ...m[id], ...patch } }));
  const applyDefaults = () => setPicked((m) => Object.fromEntries(Object.entries(m).map(([id, v]) => [id, { ...v, start: defaults.start, end: defaults.end }])));

  const removed = Object.keys(assignedBy).filter((id) => !picked[id]);
  const changed = Object.entries(picked).filter(([id, v]) => {
    const a = assignedBy[id];
    return !a || toHHMM(a.startTime) !== v.start || toHHMM(a.endTime) !== v.end;
  });
  const incomplete = Object.values(picked).some((v) => !v.start || !v.end || v.start === v.end);
  const count = Object.keys(picked).length;

  const save = async () => {
    let ok = true;
    if (changed.length) {
      const items = changed.map(([employeeId, v]) => ({ employeeId, branch: day.branch, date: day.date, dutyType: "friday", startTime: v.start, endTime: v.end, note: v.note }));
      ok = !!(await run("post", endpoint, { items, reason: reason || "Friday duty" }));
    }
    for (let i = 0; ok && i < removed.length; i++) {
      const url = `${endpoint}/${assignedBy[removed[i]]._id}?reason=${encodeURIComponent(reason || "Removed from Friday duty")}`;
      const last = i === removed.length - 1;
      ok = !!(await run("delete", url, undefined, last ? { success: `${removed.length} removed from Friday duty` } : { silent: true }));
    }
    if (ok) onSaved();
  };

  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 space-y-4 min-w-0">
        <div className="rounded-2xl bg-brand-offwhite dark:bg-brand-midnight px-4 py-3 text-xs font-bold flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-black">{day.branch}</span>
          <span className={day.hours?.closed ? "text-red-500" : "text-brand-dark-grey dark:text-brand-gold-light"}>
            {day.hours?.closed ? `Branch closed${day.hours.note ? ` · ${day.hours.note}` : ""}` : open && close ? `Branch open ${rangeText(open, close)}` : "Branch hours not set for Friday"}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Field label="Start">
            <input type="time" value={defaults.start} onChange={(e) => setDefaults((d) => ({ ...d, start: e.target.value }))} className={`${inputCls} w-[132px]`} />
          </Field>
          <Field label="End">
            <input type="time" value={defaults.end} onChange={(e) => setDefaults((d) => ({ ...d, end: e.target.value }))} className={`${inputCls} w-[132px]`} />
          </Field>
          <Btn variant="ghost" size="sm" onClick={applyDefaults} disabled={!count}>Use for everyone ticked</Btn>
        </div>

        <SearchBox value={search} onChange={setSearch} placeholder="Search staff" />

        <ul className="rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 overflow-hidden">
          {people.map((p) => {
            const v = picked[p._id];
            const onLeave = (p.leaveOn || []).includes(day.date);
            // Without delete permission, people already on duty stay ticked.
            const locked = !!assignedBy[p._id] && !permissions.canDelete;
            return (
              <li key={p._id} className={`flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2 px-3 py-2.5 ${v ? "bg-brand-gold/5" : ""}`}>
                <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                  <input type="checkbox" checked={!!v} disabled={(onLeave && !v) || (locked && !!v)} onChange={() => toggle(p)} className="w-4 h-4 accent-brand-gold shrink-0" />
                  <Avatar name={p.name} photo={p.photo} size={30} />
                  <span className="min-w-0">
                    <span className="block text-xs font-black truncate">{p.name}{p.visiting ? <span className="font-bold text-brand-dark-grey"> · other branch</span> : null}</span>
                    <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80 truncate">{[p.jobPosition, history(p)].filter(Boolean).join(" · ") || "—"}</span>
                  </span>
                </label>
                {onLeave && <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-full px-2 py-0.5 shrink-0">On leave</span>}
                {v && (
                  <span className="flex items-center gap-1.5 w-full sm:w-auto pl-7 sm:pl-0">
                    <input type="time" aria-label={`${p.name} start`} value={v.start} onChange={(e) => setTime(p._id, { start: e.target.value })} className={`${inputCls} w-[124px]`} />
                    <span className="text-brand-dark-grey">–</span>
                    <input type="time" aria-label={`${p.name} end`} value={v.end} onChange={(e) => setTime(p._id, { end: e.target.value })} className={`${inputCls} w-[124px]`} />
                  </span>
                )}
              </li>
            );
          })}
          {!people.length && <li className="px-4 py-6 text-center text-xs font-bold text-brand-dark-grey">No staff match “{search}”.</li>}
        </ul>

        <Field label="Reason" hint="Kept in the roster change history.">
          <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} placeholder="e.g. Asked in the staff group" />
        </Field>
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter
          onClose={onClose}
          onSubmit={save}
          busy={busy}
          allowed={allowed}
          disabled={incomplete || (!changed.length && !removed.length)}
          submitLabel="Save Friday duty"
          left={<span className="text-xs font-black text-brand-dark-grey self-center">{count} on Friday duty{removed.length ? ` · ${removed.length} to remove` : ""}</span>}
        />
      </div>
    </>
  );
}
