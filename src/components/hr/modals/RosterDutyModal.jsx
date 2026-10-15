"use client";

import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import ModalShell from "@/components/modals/ModalShell";
import { Btn, Field, inputCls } from "@/components/hr/HrUi";
import { useHrMutation, addDaysISO } from "@/hooks/useHr";
import { DUTY_STYLE } from "@/components/hr/duty";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

const dayLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" });

// Assign (needs canAdd) / change (canEdit) / remove (canDelete) a roster duty.
// `cell` = { employee, date, item | null }.
export default function RosterDutyModal({ cell, branch, onClose, onSaved, permissions = NO_PERMISSIONS }) {
  const key = cell ? `${cell.employee._id}|${cell.date}|${cell.item?._id || "new"}` : "";
  return (
    <ModalShell isOpen={!!cell} onClose={onClose} title={cell ? `${cell.item ? "Change" : "Assign"} duty — ${cell.employee.name}` : ""}>
      {cell && <Body key={key} cell={cell} branch={branch} onClose={onClose} onSaved={onSaved} permissions={permissions} />}
    </ModalShell>
  );
}

function Body({ cell, branch, onClose, onSaved, permissions }) {
  const { run, busy } = useHrMutation();
  const it = cell.item;
  const allowed = it ? permissions.canEdit : permissions.canAdd;
  const [f, setF] = useState({
    dutyType: it?.dutyType || "morning",
    startTime: it?.startTime ?? DUTY_STYLE.morning.times[0],
    endTime: it?.endTime ?? DUTY_STYLE.morning.times[1],
    isTemporary: it?.isTemporary || false,
    note: it?.note || "",
    reason: "",
    repeat: false,
  });
  const set = (patch) => setF((x) => ({ ...x, ...patch }));

  const save = async () => {
    if (it) {
      const res = await run("patch", `/roster/${it._id}`, { dutyType: f.dutyType, startTime: f.startTime, endTime: f.endTime, isTemporary: f.isTemporary, note: f.note, reason: f.reason });
      if (res) onSaved();
      return;
    }
    const dates = f.repeat ? Array.from({ length: 7 }, (_, i) => addDaysISO(cell.date, i)) : [cell.date];
    const items = dates.map((date) => ({ employeeId: cell.employee._id, branch, date, dutyType: f.dutyType, startTime: f.startTime, endTime: f.endTime, isTemporary: f.isTemporary, note: f.note }));
    if (await run("post", "/roster", { items, reason: f.reason })) onSaved();
  };
  const remove = async () => {
    const reason = prompt("Reason for removing this duty (kept in history):", "");
    if (reason === null) return;
    if (await run("delete", `/roster/${it._id}?reason=${encodeURIComponent(reason)}`)) onSaved();
  };

  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 space-y-4">
        <p className="text-xs font-bold text-brand-dark-grey">{dayLabel(cell.date)} · {branch}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(DUTY_STYLE).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => set({ dutyType: k, startTime: v.times[0], endTime: v.times[1] })}
              className={`px-2 py-2 rounded-xl border text-[11px] font-black transition-all cursor-pointer ${v.cls} ${f.dutyType === k ? "ring-2 ring-brand-gold scale-[1.03]" : "opacity-70 hover:opacity-100"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {f.dutyType !== "off" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start"><input type="time" value={f.startTime} onChange={(e) => set({ startTime: e.target.value })} className={inputCls} /></Field>
            <Field label="End"><input type="time" value={f.endTime} onChange={(e) => set({ endTime: e.target.value })} className={inputCls} /></Field>
          </div>
        )}
        <Field label="Note"><input value={f.note} onChange={(e) => set({ note: e.target.value })} className={inputCls} placeholder="e.g. Covering for Karim" /></Field>
        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="checkbox" checked={f.isTemporary} onChange={(e) => set({ isTemporary: e.target.checked })} /> Temporary shift change (swap / cover)</label>
        {!it && <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="checkbox" checked={f.repeat} onChange={(e) => set({ repeat: e.target.checked })} /> Repeat for the next 7 days</label>}
        <Field label="Reason for change" hint="Saved in the roster change history."><input value={f.reason} onChange={(e) => set({ reason: e.target.value })} className={inputCls} /></Field>
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter
          onClose={onClose}
          onSubmit={save}
          busy={busy}
          allowed={allowed}
          left={it && permissions.canDelete && <Btn variant="ghost" onClick={remove} loading={busy}><FiTrash2 /> Remove</Btn>}
        />
      </div>
    </>
  );
}
