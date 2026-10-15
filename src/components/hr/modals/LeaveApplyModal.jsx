"use client";

import { useState } from "react";
import { useHrMutation, useHrQuery } from "@/hooks/useHr";
import { Attachments, Btn, EmployeePicker, Field, inputCls, Select } from "@/components/hr/HrUi";
import ModalShell from "@/components/modals/ModalShell";
import { NO_PERMISSIONS } from "./ModalFooter";

const daysBetween = (a, b) => (a && b && b >= a ? Math.round((new Date(b) - new Date(a)) / 86400000) + 1 : 0);

// Leave application. Employees always apply for themselves; applying on
// behalf of someone else needs `permissions.canAdd` on the leave-applications
// page (the staff picker is only shown then).
export default function LeaveApplyModal({ isOpen, onClose, onSaved, leaveTypes = [], staff, permissions = NO_PERMISSIONS }) {
  const onBehalf = staff && permissions.canAdd;
  const { run, busy } = useHrMutation();
  const [f, setF] = useState({ employeeId: "", leaveTypeId: "", fromDate: "", toDate: "", halfDay: false, reason: "", contactDuringLeave: "", handoverTo: "", attachments: [] });
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const balanceQ = useHrQuery(f.employeeId ? `/leave/balance/${f.employeeId}` : "/leave/my-balance", {}, { enabled: isOpen });
  const balance = (balanceQ.data?.data || []).find((b) => b.leaveTypeId === f.leaveTypeId);
  const total = f.halfDay && f.fromDate === f.toDate ? 0.5 : daysBetween(f.fromDate, f.toDate);

  const submit = async () => {
    const res = await run("post", "/leave/apply", { ...f, employeeId: f.employeeId || undefined });
    if (res) {
      setF({ employeeId: "", leaveTypeId: "", fromDate: "", toDate: "", halfDay: false, reason: "", contactDuringLeave: "", handoverTo: "", attachments: [] });
      onSaved?.(res.data);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Leave Application"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black">{total ? `${total} day${total === 1 ? "" : "s"}` : ""}{balance && total > balance.remaining ? <span className="text-red-500"> · exceeds balance ({balance.remaining})</span> : ""}</span>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn onClick={submit} loading={busy} disabled={!f.leaveTypeId || !f.fromDate || !f.toDate || !f.reason.trim()}>Submit application</Btn>
          </div>
        </div>
      }
    >
      <div className="p-6 grid sm:grid-cols-2 gap-4">
        {onBehalf && (
          <Field label="Employee (apply on behalf)" className="sm:col-span-2" hint="Leave empty to apply for yourself.">
            <EmployeePicker staff={staff} value={f.employeeId} onChange={(id) => set({ employeeId: id })} placeholder="Myself" />
          </Field>
        )}
        <Field label="Leave type" required className="sm:col-span-2">
          <Select value={f.leaveTypeId} onChange={(v) => set({ leaveTypeId: v })} placeholder="Select leave type" options={leaveTypes.map((t) => ({ value: t._id, label: `${t.name}${t.isPaid === "no" ? " (unpaid)" : ""}` }))} />
          {balance && <span className="text-[11px] font-bold text-brand-gold">Balance: {balance.remaining} of {balance.allowed} days{balance.pending ? ` · ${balance.pending} pending` : ""}</span>}
        </Field>
        <Field label="From" required><input type="date" value={f.fromDate} onChange={(e) => set({ fromDate: e.target.value, toDate: f.toDate && f.toDate >= e.target.value ? f.toDate : e.target.value })} className={inputCls} /></Field>
        <Field label="To" required><input type="date" value={f.toDate} min={f.fromDate} onChange={(e) => set({ toDate: e.target.value })} className={inputCls} /></Field>
        {f.fromDate && f.fromDate === f.toDate && (
          <label className="sm:col-span-2 flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="checkbox" checked={f.halfDay} onChange={(e) => set({ halfDay: e.target.checked })} /> Half day</label>
        )}
        <Field label="Reason" required className="sm:col-span-2"><textarea rows={3} value={f.reason} onChange={(e) => set({ reason: e.target.value })} className={inputCls} /></Field>
        <Field label="Contact during leave"><input value={f.contactDuringLeave} onChange={(e) => set({ contactDuringLeave: e.target.value })} className={inputCls} /></Field>
        <Field label="Duty handover to"><input value={f.handoverTo} onChange={(e) => set({ handoverTo: e.target.value })} className={inputCls} /></Field>
        <Field label="Supporting documents" className="sm:col-span-2" hint="Exam routine, medical paper, etc.">
          <Attachments value={f.attachments} onChange={(a) => set({ attachments: a })} folder="leave-attachments" />
        </Field>
      </div>
    </ModalShell>
  );
}

