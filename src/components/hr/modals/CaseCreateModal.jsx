"use client";

import { useState } from "react";
import { FiAlertOctagon, FiAlertTriangle, FiFileText, FiMessageSquare, FiSearch, FiSlash } from "react-icons/fi";
import ModalShell from "@/components/modals/ModalShell";
import { Attachments, EmployeePicker, Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation, todayISO } from "@/hooks/useHr";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

export const CASE_TYPES = [
  { value: "verbal_warning", label: "Verbal Warning", icon: <FiMessageSquare />, tone: "slate" },
  { value: "written_warning", label: "Written Warning", icon: <FiFileText />, tone: "amber" },
  { value: "show_cause", label: "Show Cause", icon: <FiAlertTriangle />, tone: "purple" },
  { value: "complaint", label: "Complaint", icon: <FiAlertOctagon />, tone: "red" },
  { value: "investigation", label: "Investigation", icon: <FiSearch />, tone: "blue" },
  { value: "suspension", label: "Suspension", icon: <FiSlash />, tone: "red" },
];

// Open a disciplinary case. Requires `permissions.canAdd` (discipline page).
export default function CaseCreateModal({ open, staff = [], onClose, onCreated, permissions = NO_PERMISSIONS }) {
  return (
    <ModalShell isOpen={open} onClose={onClose} size="lg" title="Open disciplinary case">
      {open && <Body staff={staff} onClose={onClose} onCreated={onCreated} allowed={permissions.canAdd} />}
    </ModalShell>
  );
}

function Body({ staff, onClose, onCreated, allowed }) {
  const { run, busy } = useHrMutation();
  const [f, setF] = useState({ employeeId: "", caseType: "written_warning", subject: "", description: "", incidentDate: todayISO(), complainant: "", severity: "medium", replyDeadline: "", letterNumber: "", attachments: [], confidential: false });
  const save = async () => {
    const res = await run("post", "/discipline", f);
    if (res) onCreated(res.data);
  };
  return (
    <>
        <fieldset disabled={!allowed} className="p-5 sm:p-6 grid sm:grid-cols-2 gap-4">
          <Field label="Employee" required className="sm:col-span-2"><EmployeePicker staff={staff} value={f.employeeId} onChange={(id) => setF({ ...f, employeeId: id })} /></Field>
          <Field label="Case type" className="sm:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CASE_TYPES.map((c) => (
                <button key={c.value} type="button" onClick={() => setF({ ...f, caseType: c.value })} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-black cursor-pointer transition-all ${f.caseType === c.value ? "bg-brand-gold text-brand-black border-brand-gold" : "border-brand-beige dark:border-brand-dark-grey"}`}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Subject" required className="sm:col-span-2"><input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className={inputCls} placeholder="e.g. Repeated late entry in October" /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} /></Field>
          <Field label="Incident date"><input type="date" value={f.incidentDate} onChange={(e) => setF({ ...f, incidentDate: e.target.value })} className={inputCls} /></Field>
          <Field label="Severity"><Select value={f.severity} onChange={(v) => setF({ ...f, severity: v })} options={["low", "medium", "high", "critical"]} /></Field>
          <Field label="Complainant / reported by"><input value={f.complainant} onChange={(e) => setF({ ...f, complainant: e.target.value })} className={inputCls} /></Field>
          {f.caseType === "show_cause" ? (
            <Field label="Reply deadline"><input type="date" value={f.replyDeadline} onChange={(e) => setF({ ...f, replyDeadline: e.target.value })} className={inputCls} /></Field>
          ) : (
            <Field label="Letter / memo no." hint="From HR Letters (warning / show cause)"><input value={f.letterNumber} onChange={(e) => setF({ ...f, letterNumber: e.target.value })} className={inputCls} /></Field>
          )}
          <Field label="Attachments" className="sm:col-span-2"><Attachments value={f.attachments} onChange={(a) => setF({ ...f, attachments: a })} folder="discipline" /></Field>
          <label className="sm:col-span-2 flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="checkbox" checked={f.confidential} onChange={(e) => setF({ ...f, confidential: e.target.checked })} /> Confidential (hidden from branch in-charges)</label>
        </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} disabled={!f.employeeId || !f.subject} submitLabel="Open case" />
      </div>
    </>
  );
}
