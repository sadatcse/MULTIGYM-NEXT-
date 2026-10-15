"use client";

import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useHrMutation, useHrQuery, money, titleCase } from "@/hooks/useHr";
import { Badge, Btn, Card, EmployeePicker, EmptyState, Field, inputCls, Loading, Select, Table, Td } from "@/components/hr/HrUi";

// Monthly bonus / incentive / arrear / one-off deduction register.
// Adding needs `canAdd`, removing needs `canDelete` (payroll page RBAC).
export default function AdjustmentsTab({ month, staff, symbol, canAdd, canDelete }) {
  const { data, loading, refetch } = useHrQuery("/payroll/adjustments", { month });
  const { run, busy } = useHrMutation();
  const [f, setF] = useState({ type: "bonus", title: "", amount: "", note: "", employeeIds: [] });
  const [pick, setPick] = useState("");
  const add = async () => {
    const res = await run("post", "/payroll/adjustments", { ...f, month, amount: Number(f.amount) });
    if (res) {
      setF({ ...f, title: "", amount: "", note: "", employeeIds: [] });
      refetch();
    }
  };
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {canAdd && (
        <Card title={`Add for ${month}`} subtitle="Festival bonus, incentive, arrear, or a one-off deduction.">
          <div className="space-y-3">
            <Field label="Type"><Select value={f.type} onChange={(v) => setF({ ...f, type: v })} options={["bonus", "incentive", "allowance", "arrear", "deduction"].map((v) => ({ value: v, label: titleCase(v) }))} /></Field>
            <Field label="Title" required><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} placeholder="e.g. Eid Bonus" /></Field>
            <Field label={`Amount (${symbol})`} required><input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={inputCls} /></Field>
            <Field label="Employees" required>
              <EmployeePicker staff={staff} value={pick} onChange={(id) => { setPick(""); if (!f.employeeIds.includes(id)) setF({ ...f, employeeIds: [...f.employeeIds, id] }); }} placeholder="Add employee…" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {f.employeeIds.map((id) => (
                  <button key={id} type="button" onClick={() => setF({ ...f, employeeIds: f.employeeIds.filter((x) => x !== id) })} className="px-2 py-1 rounded-lg bg-brand-gold/15 text-[10px] font-black cursor-pointer">{staff.find((s) => s._id === id)?.name} ✕</button>
                ))}
              </div>
              <button type="button" className="text-[10px] font-black text-brand-gold mt-1 cursor-pointer" onClick={() => setF({ ...f, employeeIds: staff.filter((s) => !["resigned", "terminated", "inactive"].includes(s.status)).map((s) => s._id) })}>Select all active staff</button>
            </Field>
            <Field label="Note"><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className={inputCls} /></Field>
            <Btn onClick={add} loading={busy} disabled={!f.title || !f.amount || !f.employeeIds.length} className="w-full">Add to {f.employeeIds.length} employee(s)</Btn>
          </div>
        </Card>
      )}
      <Card title="Adjustments this month" className={canAdd ? "lg:col-span-2" : "lg:col-span-3"} bodyClassName="p-0">
        {loading ? <Loading /> : !data?.data?.length ? <EmptyState title="No adjustments" /> : (
          <Table head={["Employee", "Type", "Title", "Amount", "By", ""]}>
            {data.data.map((a) => (
              <tr key={a._id}>
                <Td>{a.employeeName}<div className="text-[10px] text-brand-dark-grey">{a.employeeCode} · {a.branch}</div></Td>
                <Td><Badge tone={a.type === "deduction" ? "red" : "green"}>{a.type}</Badge></Td>
                <Td>{a.title}{a.note && <div className="text-[10px] text-brand-dark-grey">{a.note}</div>}</Td>
                <Td className={a.type === "deduction" ? "text-red-500" : "text-emerald-600"}>{money(a.amount, symbol)}</Td>
                <Td className="text-[11px]">{a.createdBy?.name}</Td>
                <Td className="text-right">{canDelete && <Btn size="sm" variant="ghost" onClick={async () => { if (confirm("Remove?") && (await run("delete", `/payroll/adjustments/${a._id}`))) refetch(); }}><FiTrash2 /></Btn>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
