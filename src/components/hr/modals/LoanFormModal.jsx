"use client";

import { useEffect, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from "react-icons/fi";
import ModalShell from "@/components/modals/ModalShell";
import { EmployeePicker, Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrConfig, useHrQuery, useHrMutation, monthISO, money } from "@/hooks/useHr";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

// Record an advance salary / loan with installment recovery. Requires
// `permissions.canAdd`. Advances are checked against the active advance policy.
export default function LoanFormModal({ open, staff = [], symbol = "৳", onClose, onSaved, permissions = NO_PERMISSIONS }) {
  return (
    <ModalShell isOpen={open} onClose={onClose} title="New advance / loan" size="lg">
      {open && <Body staff={staff} symbol={symbol} onClose={onClose} onSaved={onSaved} allowed={permissions.canAdd} />}
    </ModalShell>
  );
}

function Body({ staff, symbol, onClose, onSaved, allowed }) {
  const { me } = useHrConfig();
  const { run, busy } = useHrMutation();
  const [f, setF] = useState({ employeeId: "", type: "advance", amount: "", installmentAmount: "", startMonth: monthISO(), reason: "", disbursedOn: "", override: false, overrideReason: "" });
  const months = f.amount ? Math.ceil(Number(f.amount) / Number(f.installmentAmount || f.amount)) : 0;

  // Policy check for advances, refreshed shortly after the figures change.
  const [checkParams, setCheckParams] = useState(null);
  const wantCheck = f.type === "advance" && !!f.employeeId;
  const paramsKey = JSON.stringify({ employeeId: f.employeeId, amount: Number(f.amount) || 0, installmentAmount: Number(f.installmentAmount || f.amount) || 0 });
  useEffect(() => {
    const t = setTimeout(() => setCheckParams(wantCheck ? JSON.parse(paramsKey) : null), 350);
    return () => clearTimeout(t);
  }, [wantCheck, paramsKey]);
  const check = useHrQuery("/payroll/loans/eligibility", checkParams || {}, { enabled: !!checkParams });
  const result = checkParams ? check.data?.data : null;
  const outside = !!result?.policy && !result.eligible && Number(f.amount) > 0;
  const canOverride = me?.scope === "all";

  const save = async () => {
    const res = await run("post", "/payroll/loans", {
      ...f,
      amount: Number(f.amount),
      installmentAmount: Number(f.installmentAmount || f.amount),
      disbursedOn: f.disbursedOn || undefined,
      override: outside && f.override,
      overrideReason: outside && f.override ? f.overrideReason : undefined,
    });
    if (res) onSaved();
  };
  const blocked = outside && !(f.override && f.overrideReason.trim());

  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Employee" required className="sm:col-span-2"><EmployeePicker staff={staff} value={f.employeeId} onChange={(id) => setF({ ...f, employeeId: id })} /></Field>
        <Field label="Type"><Select value={f.type} onChange={(v) => setF({ ...f, type: v })} options={[{ value: "advance", label: "Advance salary" }, { value: "loan", label: "Loan" }, { value: "adjustment", label: "Adjustment" }]} /></Field>
        <Field label="First deduction month"><input type="month" value={f.startMonth} onChange={(e) => setF({ ...f, startMonth: e.target.value })} className={inputCls} /></Field>
        <Field label={`Amount (${symbol})`} required hint={result?.maxAmount != null ? `Policy limit ${money(result.maxAmount, symbol)}` : undefined}><input type="number" min={1} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={inputCls} /></Field>
        <Field label={`Monthly installment (${symbol})`} hint={result?.maxInstallments ? `Recover within ${result.maxInstallments} month(s)` : "Blank = recover in one month"}><input type="number" min={1} value={f.installmentAmount} onChange={(e) => setF({ ...f, installmentAmount: e.target.value })} className={inputCls} /></Field>
        <Field label="Disbursed on"><input type="date" value={f.disbursedOn} onChange={(e) => setF({ ...f, disbursedOn: e.target.value })} className={inputCls} /></Field>
        <Field label="Reason"><input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} className={inputCls} /></Field>
        {months > 0 && <p className="sm:col-span-2 text-[11px] font-bold text-brand-gold">≈ {months} month(s) to recover</p>}

        {wantCheck && (
          <div className="sm:col-span-2 rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 p-4 space-y-2">
            {!result ? (
              <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">Checking the advance policy…</p>
            ) : !result.policy ? (
              <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">No active advance policy — nothing to check against.</p>
            ) : (
              <>
                <p className="text-xs font-black text-brand-black dark:text-brand-white">{result.policy.policyName}</p>
                <ul className="space-y-1">
                  {result.checks.map((c) => (
                    <li key={c.key} className="flex items-start gap-2 text-[11px] font-semibold">
                      {c.ok ? <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-500" /> : <FiXCircle className="mt-0.5 shrink-0 text-brand-red" />}
                      <span className={c.ok ? "text-brand-black dark:text-brand-white" : "text-brand-red"}>
                        {c.label} <span className="text-brand-dark-grey dark:text-brand-gold-light">— {c.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {outside && (
                  <div className="pt-2 space-y-2">
                    <p className="flex items-center gap-2 text-[11px] font-bold text-amber-700 dark:text-amber-400"><FiAlertTriangle /> This advance is outside the policy.</p>
                    {canOverride ? (
                      <>
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                          <input type="checkbox" checked={f.override} onChange={(e) => setF({ ...f, override: e.target.checked })} className="accent-[#E6BB60]" />
                          Grant it anyway
                        </label>
                        {f.override && <input value={f.overrideReason} onChange={(e) => setF({ ...f, overrideReason: e.target.value })} placeholder="Why — kept on the record" className={inputCls} />}
                      </>
                    ) : (
                      <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">Only HR/management can grant an advance outside the policy.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} disabled={!f.employeeId || !(Number(f.amount) > 0) || blocked} />
      </div>
    </>
  );
}
