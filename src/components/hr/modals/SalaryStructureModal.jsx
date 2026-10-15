"use client";

import { useState } from "react";
import { FiPlus, FiTrendingUp, FiX } from "react-icons/fi";
import ModalShell from "@/components/modals/ModalShell";
import { Badge, Btn, Field, inputCls, Select, Timeline } from "@/components/hr/HrUi";
import { useHrMutation, money, fmtDate, titleCase, todayISO } from "@/hooks/useHr";
import { NO_PERMISSIONS } from "./ModalFooter";

const sumList = (l = []) => l.reduce((s, x) => s + (Number(x.amount) || 0), 0);

function ListEditor({ label, value, onChange, symbol }) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        {value.map((x, i) => (
          <div key={i} className="flex gap-2">
            <input value={x.name} placeholder="Name" onChange={(e) => onChange(value.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} className={inputCls} />
            <input type="number" value={x.amount} placeholder={symbol} onChange={(e) => onChange(value.map((y, j) => (j === i ? { ...y, amount: e.target.value } : y)))} className={`${inputCls} w-32`} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-2 text-brand-dark-grey hover:text-brand-red cursor-pointer"><FiX /></button>
          </div>
        ))}
        <Btn size="sm" variant="ghost" onClick={() => onChange([...value, { name: "", amount: "" }])}><FiPlus /> Add</Btn>
      </div>
    </Field>
  );
}

// Set or revise an employee's salary structure. Requires `permissions.canEdit`;
// revisions are written to the salary history and employee career history.
export default function SalaryStructureModal({ target, symbol, onClose, onSaved, permissions = NO_PERMISSIONS }) {
  const allowed = permissions.canEdit;
  const { run, busy } = useHrMutation();
  const [f, setF] = useState(null);
  const [id, setId] = useState(null);
  if (target && id !== target.employee._id) {
    setId(target.employee._id);
    const s = target.structure;
    const e = target.employee;
    setF({
      basic: s?.basic ?? e.basicSalary ?? "",
      houseRent: s?.houseRent ?? "",
      medical: s?.medical ?? "",
      conveyance: s?.conveyance ?? "",
      otherAllowances: s?.otherAllowances || [],
      fixedDeductions: s?.fixedDeductions || [],
      paymentMode: s?.paymentMode || "cash",
      accountNumber: s?.accountNumber || "",
      effectiveFrom: todayISO(),
      revisionType: "increment",
      remarks: "",
      referenceNo: "",
    });
  }
  if (!target || !f) return <ModalShell isOpen={false} onClose={onClose} />;
  const gross = ["basic", "houseRent", "medical", "conveyance"].reduce((s, k) => s + (Number(f[k]) || 0), 0) + sumList(f.otherAllowances);
  const prevGross = target.structure?.gross ?? target.employee.grossSalary ?? 0;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    const body = { ...f, ...Object.fromEntries(["basic", "houseRent", "medical", "conveyance"].map((k) => [k, Number(f[k]) || 0])) };
    if (await run("put", `/payroll/structures/${target.employee._id}`, body)) onSaved();
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      size="xl"
      title={`Salary structure — ${target.employee.name}`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-black">
            Gross {money(gross, symbol)}
            {prevGross > 0 && gross !== prevGross && <span className={gross > prevGross ? "text-emerald-500" : "text-red-500"}> ({gross > prevGross ? "+" : ""}{money(gross - prevGross, symbol)})</span>}
          </span>
          <div className="flex gap-2"><Btn variant="ghost" onClick={onClose}>{allowed ? "Cancel" : "Close"}</Btn>{allowed && <Btn loading={busy} onClick={save} disabled={!(Number(f.basic) > 0)}>Save</Btn>}</div>
        </div>
      }
    >
      <fieldset disabled={!allowed} className="p-5 sm:p-6 grid md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Basic" required><input type="number" value={f.basic} onChange={set("basic")} className={inputCls} /></Field>
            <Field label="House rent"><input type="number" value={f.houseRent} onChange={set("houseRent")} className={inputCls} /></Field>
            <Field label="Medical"><input type="number" value={f.medical} onChange={set("medical")} className={inputCls} /></Field>
            <Field label="Conveyance"><input type="number" value={f.conveyance} onChange={set("conveyance")} className={inputCls} /></Field>
          </div>
          <ListEditor label="Other allowances" value={f.otherAllowances} onChange={(v) => setF({ ...f, otherAllowances: v })} symbol={symbol} />
          <ListEditor label="Fixed monthly deductions (PF, tax…)" value={f.fixedDeductions} onChange={(v) => setF({ ...f, fixedDeductions: v })} symbol={symbol} />
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Payment mode"><Select value={f.paymentMode} onChange={(v) => setF({ ...f, paymentMode: v })} options={[{ value: "cash", label: "Cash" }, { value: "bank", label: "Bank" }, { value: "mobile_banking", label: "bKash / Nagad" }]} /></Field>
            <Field label="Account / wallet no."><input value={f.accountNumber} onChange={set("accountNumber")} className={inputCls} /></Field>
            <Field label="Effective from"><input type="date" value={f.effectiveFrom} onChange={set("effectiveFrom")} className={inputCls} /></Field>
            {target.structure && <Field label="Change type"><Select value={f.revisionType} onChange={(v) => setF({ ...f, revisionType: v })} options={[{ value: "increment", label: "Increment" }, { value: "revision", label: "Salary revision" }]} /></Field>}
            <Field label="Letter / memo no."><input value={f.referenceNo} onChange={set("referenceNo")} className={inputCls} /></Field>
          </div>
          <Field label="Remarks"><textarea rows={2} value={f.remarks} onChange={set("remarks")} className={inputCls} placeholder="e.g. Annual increment 2026" /></Field>
          {target.structure?.revisions?.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-black uppercase text-brand-dark-grey mb-3 flex items-center gap-1"><FiTrendingUp /> Salary history</div>
              <Timeline
                items={[...target.structure.revisions].reverse().map((r, i) => ({
                  key: i,
                  title: `${money(r.previousGross, symbol)} → ${money(r.newGross, symbol)}`,
                  badge: <Badge tone={r.type === "decrement" ? "red" : r.type === "initial" ? "slate" : "green"}>{titleCase(r.type)}</Badge>,
                  meta: `${fmtDate(r.effectiveFrom)} · ${r.by?.name || ""}`,
                  body: r.remarks,
                }))}
              />
            </div>
          )}
        </div>
      </fieldset>
    </ModalShell>
  );
}
