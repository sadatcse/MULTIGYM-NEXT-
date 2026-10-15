"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Attachments, Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation, titleCase, todayISO } from "@/hooks/useHr";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

const DECISIONS = ["no_action", "counselling", "verbal_warning", "written_warning", "final_warning", "suspension", "salary_deduction", "increment_withheld", "demotion", "transfer", "termination", "other"];

// Final management decision. Needs `permissions.canEdit` AND a management
// data scope (`isManagement`) — the backend enforces the same rule.
export default function CaseDecisionModal({ open, caseId, branches = [], isManagement, onClose, onSaved, permissions = NO_PERMISSIONS }) {
  return (
    <ModalShell isOpen={open} onClose={onClose} size="lg" title="Management decision">
      {open && <Body caseId={caseId} branches={branches} onClose={onClose} onSaved={onSaved} allowed={permissions.canEdit && isManagement} />}
    </ModalShell>
  );
}

function Body({ caseId, branches, onClose, onSaved, allowed }) {
  const { run, busy } = useHrMutation();
  const [d, setD] = useState({ action: "written_warning", summary: "", effectiveDate: todayISO(), suspensionDays: "", deductionAmount: "", applyToProfile: false, newDesignation: "", newBranch: "", attachments: [] });
  const save = async () => {
    if (await run("post", `/discipline/${caseId}/decision`, d)) onSaved();
  };
  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 grid sm:grid-cols-2 gap-3">
        <Field label="Action"><Select value={d.action} onChange={(v) => setD({ ...d, action: v })} options={DECISIONS.map((x) => ({ value: x, label: titleCase(x) }))} /></Field>
        <Field label="Effective date"><input type="date" value={d.effectiveDate} onChange={(e) => setD({ ...d, effectiveDate: e.target.value })} className={inputCls} /></Field>
        {d.action === "suspension" && <Field label="Suspension days"><input type="number" min={1} value={d.suspensionDays} onChange={(e) => setD({ ...d, suspensionDays: e.target.value })} className={inputCls} /></Field>}
        {d.action === "salary_deduction" && <Field label="Deduction amount"><input type="number" min={1} value={d.deductionAmount} onChange={(e) => setD({ ...d, deductionAmount: e.target.value })} className={inputCls} /></Field>}
        {d.action === "demotion" && <Field label="New designation"><input value={d.newDesignation} onChange={(e) => setD({ ...d, newDesignation: e.target.value })} className={inputCls} /></Field>}
        {d.action === "transfer" && <Field label="New branch"><Select value={d.newBranch} onChange={(v) => setD({ ...d, newBranch: v })} placeholder="Select" options={branches} /></Field>}
        <Field label="Decision summary" required className="sm:col-span-2"><textarea rows={3} value={d.summary} onChange={(e) => setD({ ...d, summary: e.target.value })} className={inputCls} /></Field>
        <Field label="Attachments" className="sm:col-span-2"><Attachments value={d.attachments} onChange={(a) => setD({ ...d, attachments: a })} folder="discipline" readOnly={!allowed} /></Field>
        {["suspension", "termination", "demotion", "transfer"].includes(d.action) && (
          <label className="sm:col-span-2 flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="checkbox" checked={d.applyToProfile} onChange={(e) => setD({ ...d, applyToProfile: e.target.checked })} /> Apply to employee profile now (status / designation / branch)</label>
        )}
        <p className="sm:col-span-2 text-[10px] text-brand-dark-grey">Warnings, suspension, demotion, transfer and termination are also written to the employee&apos;s career history. Salary deductions can be added in Payroll → Bonus &amp; adjustments.</p>
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} disabled={!d.summary.trim()} submitLabel="Record decision" />
      </div>
    </>
  );
}
