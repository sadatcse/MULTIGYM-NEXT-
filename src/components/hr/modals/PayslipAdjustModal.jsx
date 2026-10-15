"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Field, inputCls } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

const FIELDS = [
  ["overtimePay", "Overtime pay"],
  ["bonus", "Bonus"],
  ["otherEarnings", "Other earnings"],
  ["lateDeduction", "Late deduction"],
  ["absentDeduction", "Absent deduction"],
  ["otherDeductions", "Other deductions"],
];

// Manual adjustment of a DRAFT payslip. Requires `permissions.canEdit`.
export default function PayslipAdjustModal({ slip, symbol = "৳", onClose, onSaved, permissions = NO_PERMISSIONS }) {
  return (
    <ModalShell isOpen={!!slip} onClose={onClose} title={slip ? `Adjust payslip — ${slip.employeeName}` : ""}>
      {slip && <Body key={slip._id} slip={slip} symbol={symbol} onClose={onClose} onSaved={onSaved} allowed={permissions.canEdit} />}
    </ModalShell>
  );
}

function Body({ slip, symbol, onClose, onSaved, allowed }) {
  const { run, busy } = useHrMutation();
  const [f, setF] = useState(() => ({ ...Object.fromEntries(FIELDS.map(([k]) => [k, slip[k] ?? 0])), remarks: slip.remarks || "" }));
  const save = async () => {
    const body = { ...Object.fromEntries(FIELDS.map(([k]) => [k, Number(f[k]) || 0])), remarks: f.remarks };
    if (await run("patch", `/payroll/payslips/${slip._id}`, body)) onSaved();
  };
  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map(([k, label]) => (
          <Field key={k} label={`${label} (${symbol})`}>
            <input type="number" min={0} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={inputCls} />
          </Field>
        ))}
        <Field label="Remarks" className="sm:col-span-2"><input value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} className={inputCls} /></Field>
        <p className="sm:col-span-2 text-[10px] text-brand-dark-grey">Gross, advance/loan and fixed deductions come from the salary structure and loan register.</p>
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} />
      </div>
    </>
  );
}
