"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiCheck, FiClock, FiFileText, FiPlus, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import { MdAlarmOn } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, monthISO, fmtDate, todayISO } from "@/hooks/useHr";
import { Avatar, Badge, Btn, Card, EmployeePicker, EmptyState, Field, inputCls, Loading, PageHeader, pageCls, StatCard, Table, Tabs, Td } from "@/components/hr/HrUi";
import ModalShell from "@/components/modals/ModalShell";
import ModalFooter from "@/components/hr/modals/ModalFooter";
import MonthFilters from "@/components/hr/MonthFilters";
import ExportButtons from "@/components/Comon/ExportButtons";
import { exportToExcel } from "@/lib/exportHelper";

const hrs = (min) => `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ""}`;

export default function MonthlyOvertimePage() {
  const permissions = usePagePermission();
  const { canAdd, canEdit, canDelete } = permissions;
  const { me } = useHrConfig();
  const { staff } = useHrLookups();
  const [month, setMonth] = useState(monthISO());
  const [branch, setBranch] = useState("all");
  const [department, setDepartment] = useState("all");
  const [view, setView] = useState("summary");
  const [status, setStatus] = useState("all");
  const [adding, setAdding] = useState(false);
  const { run } = useHrMutation();

  useEffect(() => {
    // Syncing a default from data that arrives asynchronously is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me?.scope === "branch" && me.branches?.length && branch === "all") setBranch(me.branches[0]);
  }, [me, branch]);

  const { data, loading, refetch } = useHrQuery("/duty-overtime/overtime", { month, branch, department });
  const d = data?.data;
  const st = d?.stats || {};
  const records = (d?.records || []).filter((r) => status === "all" || r.status === status);

  const decide = async (r, s) => {
    if (await run("patch", `/duty-overtime/overtime/${r._id}`, { status: s }, { success: s === "approved" ? "Approved" : s === "rejected" ? "Rejected" : "Back to pending" })) refetch();
  };
  const remove = async (r) => {
    if (confirm(`Delete ${r.employeeName}'s overtime on ${fmtDate(r.recordDate)}?`) && (await run("delete", `/duty-overtime/overtime/${r._id}`))) refetch();
  };

  return (
    <div className={pageCls}>
      <PageHeader
        icon={<MdAlarmOn />}
        title="Monthly Overtime"
        subtitle="Overtime per person for the month: what attendance recorded plus overtime entered by hand. Approved records are paid with that month's salary."
        actions={
          <>
            <MonthFilters month={month} setMonth={setMonth} branch={branch} setBranch={setBranch} department={department} setDepartment={setDepartment} />
            {canAdd && <Btn variant="gold" size="sm" className="whitespace-nowrap" onClick={() => setAdding(true)}><FiPlus /> Add overtime</Btn>}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<FiClock />} label="From attendance" value={hrs(st.attendanceMinutes || 0)} tone="blue" />
        <StatCard icon={<FiCheck />} label="Approved records" value={hrs(st.approvedMinutes || 0)} tone="green" index={1} />
        <StatCard icon={<FiFileText />} label="Waiting for approval" value={st.pending ?? 0} tone="amber" index={2} />
        <StatCard icon={<FiUsers />} label="People with overtime" value={st.people ?? 0} index={3} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onChange={setView} tabs={[{ value: "summary", label: "Per person", count: d?.rows?.length ?? 0 }, { value: "records", label: "Records", count: d?.records?.length ?? 0 }]} />
        <Link href="/dashboard/settings/overtime" className="text-[11px] font-black text-brand-gold hover:underline">Overtime rates & rules →</Link>
      </div>

      {view === "summary" ? (
        <Card
          bodyClassName="p-0"
          actions={<ExportButtons onExportExcel={() => exportToExcel((d?.rows || []).map((r) => ({ Employee: r.employee.name, ID: r.employee.employeeId, Department: r.employee.department, Branch: r.employee.branch, "Attendance OT (h)": +(r.attendanceMinutes / 60).toFixed(2), "Approved records (h)": +(r.approvedMinutes / 60).toFixed(2), Pending: r.pending, "Total (h)": +((r.attendanceMinutes + r.approvedMinutes) / 60).toFixed(2) })), `overtime_${month}`, "Overtime")} />}
        >
          {loading && !d ? <Loading /> : !(d?.rows || []).length ? (
            <EmptyState icon={<MdAlarmOn />} title="No overtime this month" text="Nobody in these filters has overtime from attendance or records." />
          ) : (
            <Table head={["Employee", "Department · Branch", { label: "From attendance", className: "text-right" }, { label: "Approved records", className: "text-right" }, { label: "Pending", className: "text-right" }, { label: "Total", className: "text-right" }]}>
              {d.rows.map((r) => (
                <tr key={r.employee._id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.employee.name} photo={r.employee.photo} size={30} />
                      <div><div className="font-black">{r.employee.name}</div><div className="text-[10px] font-semibold text-brand-dark-grey">{[r.employee.employeeId, r.employee.jobPosition].filter(Boolean).join(" · ")}</div></div>
                    </div>
                  </Td>
                  <Td className="text-[11px]">{[r.employee.department, r.employee.branch].filter(Boolean).join(" · ") || "—"}</Td>
                  <Td className="text-right">{hrs(r.attendanceMinutes)}<div className="text-[10px] text-brand-dark-grey">{r.attendanceDays} day{r.attendanceDays === 1 ? "" : "s"}</div></Td>
                  <Td className="text-right">{hrs(r.approvedMinutes)}</Td>
                  <Td className="text-right">{r.pending ? <Badge tone="amber">{r.pending}</Badge> : "—"}</Td>
                  <Td className="text-right font-black text-emerald-600 dark:text-emerald-400">{hrs(r.attendanceMinutes + r.approvedMinutes)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      ) : (
        <Card
          bodyClassName="p-0"
          actions={<Tabs value={status} onChange={setStatus} tabs={["all", "pending", "approved", "rejected"]} />}
        >
          {loading && !d ? <Loading /> : !records.length ? (
            <EmptyState icon={<FiFileText />} title="No records" text="Overtime entered by hand appears here — e.g. work done off the biometric device." action={canAdd && <Btn onClick={() => setAdding(true)}><FiPlus /> Add overtime</Btn>} />
          ) : (
            <Table head={["Date", "Employee", "Department · Branch", { label: "Time", className: "text-right" }, "Note", "Status", ""]}>
              {records.map((r) => (
                <tr key={r._id}>
                  <Td className="whitespace-nowrap">{fmtDate(r.recordDate)}</Td>
                  <Td><div className="font-black">{r.employeeName}</div><div className="text-[10px] text-brand-dark-grey">{r.employeeId}</div></Td>
                  <Td className="text-[11px]">{[r.department, r.branch].filter(Boolean).join(" · ") || "—"}</Td>
                  <Td className="text-right font-black">{hrs(r.minutes)}</Td>
                  <Td className="text-[11px] max-w-[220px]">{r.remarks || "—"}{r.createdBy?.name ? <div className="text-[10px] text-brand-dark-grey">by {r.createdBy.name}</div> : null}</Td>
                  <Td><Badge status={r.status} /></Td>
                  <Td className="text-right whitespace-nowrap">
                    {canEdit && r.status !== "approved" && <Btn size="sm" variant="ghost" title="Approve" onClick={() => decide(r, "approved")}><FiCheck /></Btn>}
                    {canEdit && r.status !== "rejected" && <Btn size="sm" variant="ghost" title="Reject" onClick={() => decide(r, "rejected")}><FiX /></Btn>}
                    {canDelete && <Btn size="sm" variant="ghost" title="Delete" onClick={() => remove(r)}><FiTrash2 /></Btn>}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      <ModalShell isOpen={adding} onClose={() => setAdding(false)} title="Add overtime">
        {adding && <AddOvertime staff={staff} canApprove={me?.scope === "all"} allowed={canAdd} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); refetch(); }} />}
      </ModalShell>
    </div>
  );
}

function AddOvertime({ staff, canApprove, allowed, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const [f, setF] = useState({ employeeId: "", recordDate: todayISO(), overtimeHours: "", overtimeMinutes: "", remarks: "", approve: false });
  const save = async () => {
    const res = await run("post", "/duty-overtime/overtime", { ...f, overtimeHours: Number(f.overtimeHours) || 0, overtimeMinutes: Number(f.overtimeMinutes) || 0, status: f.approve ? "approved" : "pending" });
    if (res) onSaved();
  };
  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 grid grid-cols-2 gap-3">
        <Field label="Employee" required className="col-span-2"><EmployeePicker staff={staff} value={f.employeeId} onChange={(id) => setF({ ...f, employeeId: id })} /></Field>
        <Field label="Date" required className="col-span-2"><input type="date" value={f.recordDate} onChange={(e) => setF({ ...f, recordDate: e.target.value })} className={inputCls} /></Field>
        <Field label="Hours"><input type="number" min={0} value={f.overtimeHours} onChange={(e) => setF({ ...f, overtimeHours: e.target.value })} className={inputCls} /></Field>
        <Field label="Minutes"><input type="number" min={0} max={59} value={f.overtimeMinutes} onChange={(e) => setF({ ...f, overtimeMinutes: e.target.value })} className={inputCls} /></Field>
        <Field label="Note" className="col-span-2"><input value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} placeholder="e.g. Stayed for the late PT batch" className={inputCls} /></Field>
        {canApprove && (
          <label className="col-span-2 flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input type="checkbox" checked={f.approve} onChange={(e) => setF({ ...f, approve: e.target.checked })} className="accent-[#E6BB60]" /> Approve now
          </label>
        )}
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} disabled={!f.employeeId || !(Number(f.overtimeHours) * 60 + Number(f.overtimeMinutes) > 0)} />
      </div>
    </>
  );
}
