"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Attachments, Field, inputCls, Select } from "@/components/hr/HrUi";
import { todayISO } from "@/hooks/useHr";
import { EVENT_META, MANUAL_TYPES } from "@/components/hr/careerEvents";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

// Record a career event (promotion, transfer, confirmation…), optionally
// applying it to the profile. Requires `permissions.canAdd` (employee-history).
export default function CareerEventModal({ open, emp, branches, busy, onClose, onSubmit, permissions = NO_PERMISSIONS }) {
  const allowed = permissions.canAdd;
  const [f, setF] = useState({ eventType: "promotion", effectiveDate: todayISO(), title: "", description: "", referenceNo: "", applyToProfile: true, to: {}, attachments: [] });
  const setTo = (k, v) => setF({ ...f, to: { ...f.to, [k]: v } });
  const t = f.eventType;
  const showDesignation = ["promotion", "demotion", "promotion_transfer", "appointment", "confirmation"].includes(t);
  const showBranch = ["transfer", "promotion_transfer"].includes(t);
  const showSalary = ["salary_revision", "increment", "promotion", "promotion_transfer"].includes(t);
  return (
    <ModalShell isOpen={open} onClose={onClose} size="lg" title={`Record career event${emp ? ` — ${emp.name}` : ""}`} footer={<ModalFooter onClose={onClose} onSubmit={() => onSubmit(f)} busy={busy} allowed={allowed} />}>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 grid sm:grid-cols-2 gap-4">
        <Field label="Event"><Select value={f.eventType} onChange={(v) => setF({ ...f, eventType: v, to: {} })} options={MANUAL_TYPES.map((v) => ({ value: v, label: EVENT_META[v].label }))} /></Field>
        <Field label="Effective date"><input type="date" value={f.effectiveDate} onChange={(e) => setF({ ...f, effectiveDate: e.target.value })} className={inputCls} /></Field>
        {showDesignation && <Field label={`New designation (now: ${emp?.jobPosition || "—"})`}><input value={f.to.designation || ""} onChange={(e) => setTo("designation", e.target.value)} className={inputCls} placeholder="e.g. Assistant Trainer" /></Field>}
        {showBranch && <Field label={`New branch (now: ${(emp?.branches || []).join(", ") || "—"})`}><Select value={f.to.branches?.[0] || ""} onChange={(v) => setTo("branches", v ? [v] : [])} placeholder="Select" options={branches} /></Field>}
        {showSalary && <Field label="New basic"><input type="number" value={f.to.basicSalary || ""} onChange={(e) => setTo("basicSalary", e.target.value)} className={inputCls} /></Field>}
        {showSalary && <Field label="New gross"><input type="number" value={f.to.grossSalary || ""} onChange={(e) => setTo("grossSalary", e.target.value)} className={inputCls} /></Field>}
        <Field label="Title (optional)"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} /></Field>
        <Field label="Letter / memo no."><input value={f.referenceNo} onChange={(e) => setF({ ...f, referenceNo: e.target.value })} className={inputCls} /></Field>
        <Field label="Description" className="sm:col-span-2"><textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} /></Field>
        <Field label="Attachments" className="sm:col-span-2"><Attachments value={f.attachments} onChange={(a) => setF({ ...f, attachments: a })} folder="employee-documents" /></Field>
        <label className="sm:col-span-2 flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="checkbox" checked={f.applyToProfile} onChange={(e) => setF({ ...f, applyToProfile: e.target.checked })} /> Also update the employee profile (designation / branch / salary / status)</label>
      </fieldset>
    </ModalShell>
  );
}
