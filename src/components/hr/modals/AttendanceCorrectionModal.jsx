"use client";

import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import ModalShell from "@/components/modals/ModalShell";
import { Btn, Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation, titleCase } from "@/hooks/useHr";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

const STATUS_OPTIONS = ["present", "late", "half_day", "absent", "leave", "missing_punch", "weekend", "holiday"];

// Manual attendance correction. Requires `permissions.canEdit`; every save is
// written to the correction audit log with the mandatory reason.
export default function AttendanceCorrectionModal({ row, onClose, onSaved, permissions = NO_PERMISSIONS }) {
  return (
    <ModalShell isOpen={!!row} onClose={onClose} size="md" title={row ? `Correct attendance — ${row.employee.name}` : ""}>
      {row && <Body key={`${row.employee._id}|${row.date}`} row={row} onClose={onClose} onSaved={onSaved} canEdit={permissions.canEdit} />}
    </ModalShell>
  );
}

function Body({ row, onClose, onSaved, canEdit }) {
  const { run, busy } = useHrMutation();
  const [form, setForm] = useState({ status: "", inTime: row.inTime || "", outTime: row.outTime || "", remarks: row.remarks || "", reason: "" });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const body = {
      ...(row._id ? { recordId: row._id } : { employeeId: row.employee._id, date: row.date }),
      inTime: form.inTime,
      outTime: form.outTime,
      remarks: form.remarks,
      reason: form.reason,
      ...(form.status ? { status: form.status } : {}),
    };
    if (await run("post", "/attendance/correct", body)) onSaved();
  };
  const reset = async () => {
    if (await run("post", `/attendance/records/${row._id}/reset`, { reason: form.reason || "Reset to device data" })) onSaved();
  };

  return (
    <>
      <div className="p-5 sm:p-6 space-y-4">
        <div className="rounded-2xl bg-brand-offwhite dark:bg-brand-midnight p-3 text-[11px] font-bold grid grid-cols-1 sm:grid-cols-2 gap-2">
          <span>Date: {row.date}</span>
          <span>Shift: {row.shiftStart ? `${row.shiftStart}–${row.shiftEnd}` : "—"}</span>
          <span>Device In/Out: {row.inTime || "—"} / {row.outTime || "—"}</span>
          <span>Current: {titleCase(row.status)}</span>
        </div>
        <fieldset disabled={!canEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="In time"><input type="time" value={form.inTime} onChange={(e) => set("inTime")(e.target.value)} className={inputCls} /></Field>
            <Field label="Out time"><input type="time" value={form.outTime} onChange={(e) => set("outTime")(e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Status override" hint="Leave blank to calculate from the times and the shift.">
            <Select value={form.status} onChange={set("status")} placeholder="Auto (from times)" options={STATUS_OPTIONS.map((v) => ({ value: v, label: titleCase(v) }))} />
          </Field>
          <Field label="Remarks"><input value={form.remarks} onChange={(e) => set("remarks")(e.target.value)} className={inputCls} /></Field>
          <Field label="Reason for correction" required hint="Stored in the correction audit log with your name and time.">
            <textarea rows={2} value={form.reason} onChange={(e) => set("reason")(e.target.value)} className={inputCls} placeholder="e.g. Device offline — verified with CCTV / In-charge confirmation" />
          </Field>
        </fieldset>
      </div>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter
          onClose={onClose}
          onSubmit={save}
          busy={busy}
          allowed={canEdit}
          disabled={!form.reason.trim()}
          submitLabel="Save correction"
          left={row.isManual && canEdit && <Btn variant="ghost" onClick={reset} loading={busy}><FiRefreshCw /> Reset to device data</Btn>}
        />
      </div>
    </>
  );
}
