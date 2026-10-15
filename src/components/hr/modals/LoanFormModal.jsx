"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { EmployeePicker, Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation, monthISO } from "@/hooks/useHr";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

// Record an advance salary / loan with installment recovery. Requires
// `permissions.canAdd`.
export default function LoanFormModal({ open, staff = [], symbol = "৳", onClose, onSaved, permissions = NO_PERMISSIONS }) {
  return (
    <ModalShell isOpen={open} onClose={onClose} title="New advance / loan">
      {open && <Body staff={staff} symbol={symbol} onClose={onClose} onSaved={onSaved} allowed={permissions.canAdd} />}
    </ModalShell>
  );
}

function Body({ staff, symbol, onClose, onSaved, allowed }) {
  const { run, busy } = useHrMutation();
  const [f, setF] = useState({ employeeId: "", type: "advance", amount: "", installmentAmount: "", startMonth: monthISO(), reason: "", disbursedOn: "" });
  const months = f.amount ? Math.ceil(Number(f.amount) / Number(f.installmentAmount || f.amount)) : 0;
  const save = async () => {
    const res = await run("post", "/payroll/loans", { ...f, amount: Number(f.amount), installmentAmount: Number(f.installmentAmount || f.amount), disbursedOn: f.disbursedOn || undefined });
    if (res) onSaved();
  };
  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Employee" required className="sm:col-span-2"><EmployeePicker staff={staff} value={f.employeeId} onChange={(id) => setF({ ...f, employeeId: id })} /></Field>
        <Field label="Type"><Select value={f.type} onChange={(v) => setF({ ...f, type: v })} options={[{ value: "advance", label: "Advance salary" }, { value: "loan", label: "Loan" }, { value: "adjustment", label: "Adjustment" }]} /></Field>
        <Field label="First deduction month"><input type="month" value={f.startMonth} onChange={(e) => setF({ ...f, startMonth: e.target.value })} className={inputCls} /></Field>
        <Field label={`Amount (${symbol})`} required><input type="number" min={1} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={inputCls} /></Field>
        <Field label={`Monthly installment (${symbol})`} hint="Blank = recover in one month"><input type="number" min={1} value={f.installmentAmount} onChange={(e) => setF({ ...f, installmentAmount: e.target.value })} className={inputCls} /></Field>
        <Field label="Disbursed on"><input type="date" value={f.disbursedOn} onChange={(e) => setF({ ...f, disbursedOn: e.target.value })} className={inputCls} /></Field>
        <Field label="Reason"><input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} className={inputCls} /></Field>
        {months > 0 && <p className="sm:col-span-2 text-[11px] font-bold text-brand-gold">≈ {months} month(s) to recover</p>}
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} disabled={!f.employeeId || !(Number(f.amount) > 0)} />
      </div>
    </>
  );
}
