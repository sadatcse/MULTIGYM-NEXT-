"use client";

import { useEffect, useState } from "react";
import { FiEdit3, FiPlus, FiRepeat, FiTrash2, FiUserCheck } from "react-icons/fi";
import { MdSwapHoriz } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, monthISO, money, fmtDate, todayISO } from "@/hooks/useHr";
import { Badge, Btn, Card, EmployeePicker, EmptyState, Field, inputCls, Loading, PageHeader, pageCls, Select, StatCard, Table, Tabs, Td } from "@/components/hr/HrUi";
import ModalShell from "@/components/modals/ModalShell";
import ModalFooter from "@/components/hr/modals/ModalFooter";
import MonthFilters from "@/components/hr/MonthFilters";
import ExportButtons from "@/components/Comon/ExportButtons";
import { exportToExcel } from "@/lib/exportHelper";

const EMPTY = { type: "proxy", originalEmployee: "", proxyEmployee: "", dutyDate: todayISO(), swapDate: "", proxyPayAmount: "", status: "active", remarks: "" };

export default function ProxySwapPage() {
  const permissions = usePagePermission();
  const { canAdd, canEdit, canDelete } = permissions;
  const { me, config } = useHrConfig();
  const { staff } = useHrLookups();
  const symbol = config?.payroll?.currency || "৳";
  const [month, setMonth] = useState(monthISO());
  const [branch, setBranch] = useState("all");
  const [department, setDepartment] = useState("all");
  const [type, setType] = useState("all");
  const [editing, setEditing] = useState(null);
  const { run } = useHrMutation();

  useEffect(() => {
    // Syncing a default from data that arrives asynchronously is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me?.scope === "branch" && me.branches?.length && branch === "all") setBranch(me.branches[0]);
  }, [me, branch]);

  const { data, loading, refetch } = useHrQuery("/duty-overtime/duties", { month, branch, department, type });
  const d = data?.data;
  const st = d?.stats || {};
  const list = d?.data || [];
  const idOf = (code) => staff.find((e) => e.employeeId && e.employeeId === code)?._id || "";

  const remove = async (r) => {
    if (confirm("Delete this duty record?") && (await run("delete", `/duty-overtime/duties/${r._id}`))) refetch();
  };

  return (
    <div className={pageCls}>
      <PageHeader
        icon={<MdSwapHoriz />}
        title="Proxy & Swap Duty"
        subtitle="Who covered whom, and who swapped duties, month by month. Proxy pay is added to the cover's salary for that month."
        actions={
          <>
            <MonthFilters month={month} setMonth={setMonth} branch={branch} setBranch={setBranch} department={department} setDepartment={setDepartment} />
            {canAdd && <Btn variant="gold" size="sm" className="whitespace-nowrap" onClick={() => setEditing({ ...EMPTY })}><FiPlus /> Add duty</Btn>}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={<FiUserCheck />} label="Proxy duties" value={st.proxies ?? 0} tone="blue" />
        <StatCard icon={<FiRepeat />} label="Duty swaps" value={st.swaps ?? 0} tone="purple" index={1} />
        <StatCard icon={<MdSwapHoriz />} label="Proxy pay this month" value={money(st.proxyPay || 0, symbol)} tone="green" index={2} />
      </div>

      <Card
        bodyClassName="p-0"
        actions={
          <>
            <Tabs value={type} onChange={setType} tabs={[{ value: "all", label: "All" }, { value: "proxy", label: "Proxy" }, { value: "swap", label: "Swap" }]} />
            <ExportButtons onExportExcel={() => exportToExcel(list.map((r) => ({ Date: r.dutyDate, Type: r.type, Original: r.originalEmployeeName, Cover: r.proxyEmployeeName, "Return date": r.swapDate || "", Pay: r.proxyPayAmount || 0, Branch: r.branch, Status: r.status, Note: r.remarks })), `duties_${month}`, "Duties")} />
          </>
        }
      >
        {loading && !d ? <Loading /> : !list.length ? (
          <EmptyState icon={<MdSwapHoriz />} title="Nothing this month" text="Record a proxy (someone covers a colleague's duty) or a swap (two people exchange duties)." action={canAdd && <Btn onClick={() => setEditing({ ...EMPTY })}><FiPlus /> Add duty</Btn>} />
        ) : (
          <Table head={["Date", "Type", "Duty of", "Covered by", "Branch", { label: "Pay", className: "text-right" }, "Status", ""]}>
            {list.map((r) => (
              <tr key={r._id}>
                <Td className="whitespace-nowrap">{fmtDate(r.dutyDate)}{r.type === "swap" && r.swapDate ? <div className="text-[10px] text-brand-dark-grey">returns {fmtDate(r.swapDate)}</div> : null}</Td>
                <Td><Badge tone={r.type === "swap" ? "purple" : "blue"}>{r.type === "swap" ? "Swap" : "Proxy"}</Badge></Td>
                <Td><div className="font-black">{r.originalEmployeeName}</div><div className="text-[10px] text-brand-dark-grey">{r.originalEmployeeId}</div></Td>
                <Td><div className="font-black">{r.proxyEmployeeName}</div><div className="text-[10px] text-brand-dark-grey">{r.proxyEmployeeId}</div></Td>
                <Td className="text-[11px]">{[r.branch, r.department].filter(Boolean).join(" · ") || "—"}</Td>
                <Td className="text-right font-black">{r.type === "swap" ? "—" : money(r.proxyPayAmount || 0, symbol)}</Td>
                <Td><Badge tone={r.status === "completed" ? "green" : r.status === "inactive" ? "slate" : "blue"}>{r.status === "completed" ? "Done" : r.status === "inactive" ? "Cancelled" : "Planned"}</Badge></Td>
                <Td className="text-right whitespace-nowrap">
                  {canEdit && (
                    <Btn size="sm" variant="ghost" title="Edit" onClick={() => setEditing({ ...EMPTY, ...r, originalEmployee: r.originalEmployee || idOf(r.originalEmployeeId), proxyEmployee: r.proxyEmployee || idOf(r.proxyEmployeeId), proxyPayAmount: r.proxyPayAmount ?? "" })}><FiEdit3 /></Btn>
                  )}
                  {canDelete && <Btn size="sm" variant="ghost" title="Delete" onClick={() => remove(r)}><FiTrash2 /></Btn>}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <ModalShell isOpen={!!editing} onClose={() => setEditing(null)} title={editing?._id ? "Edit duty" : "Add proxy or swap duty"}>
        {editing && <DutyForm key={editing._id || "new"} duty={editing} staff={staff} symbol={symbol} allowed={editing._id ? canEdit : canAdd} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />}
      </ModalShell>
    </div>
  );
}

function DutyForm({ duty, staff, symbol, allowed, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const [f, setF] = useState(() => ({ ...duty }));
  const swap = f.type === "swap";
  const save = async () => {
    const body = { type: f.type, originalEmployee: f.originalEmployee, proxyEmployee: f.proxyEmployee, dutyDate: f.dutyDate, swapDate: f.swapDate, proxyPayAmount: Number(f.proxyPayAmount) || 0, status: f.status, remarks: f.remarks };
    const res = duty._id ? await run("patch", `/duty-overtime/duties/${duty._id}`, body) : await run("post", "/duty-overtime/duties", body);
    if (res) onSaved();
  };
  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 grid grid-cols-2 gap-3 min-w-0">
        <div className="col-span-2 grid grid-cols-2 gap-1 p-1 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50" role="radiogroup" aria-label="Duty type">
          {[
            ["proxy", "Proxy — someone covers"],
            ["swap", "Swap — exchange duties"],
          ].map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={f.type === v} onClick={() => setF({ ...f, type: v })} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${f.type === v ? "bg-brand-gold text-brand-midnight shadow-xs" : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>
        <Field label={swap ? "First person" : "Duty of (absent)"} required className="col-span-2"><EmployeePicker staff={staff} value={f.originalEmployee} onChange={(id) => setF({ ...f, originalEmployee: id })} /></Field>
        <Field label={swap ? "Swaps with" : "Covered by"} required className="col-span-2"><EmployeePicker staff={staff} value={f.proxyEmployee} onChange={(id) => setF({ ...f, proxyEmployee: id })} /></Field>
        <Field label={swap ? "Swapped duty date" : "Duty date"} required><input type="date" value={f.dutyDate} onChange={(e) => setF({ ...f, dutyDate: e.target.value })} className={inputCls} /></Field>
        {swap ? (
          <Field label="Return date" hint="When the first person works in exchange"><input type="date" value={f.swapDate} onChange={(e) => setF({ ...f, swapDate: e.target.value })} className={inputCls} /></Field>
        ) : (
          <Field label={`Proxy pay (${symbol})`} hint="Added to the cover's salary"><input type="number" min={0} value={f.proxyPayAmount} onChange={(e) => setF({ ...f, proxyPayAmount: e.target.value })} className={inputCls} /></Field>
        )}
        <Field label="Status"><Select value={f.status} onChange={(v) => setF({ ...f, status: v })} options={[{ value: "active", label: "Planned" }, { value: "completed", label: "Done" }, { value: "inactive", label: "Cancelled" }]} /></Field>
        <Field label="Note"><input value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} className={inputCls} /></Field>
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} disabled={!f.originalEmployee || !f.proxyEmployee || !f.dutyDate} />
      </div>
    </>
  );
}
