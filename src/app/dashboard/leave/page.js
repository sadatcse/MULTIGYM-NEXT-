"use client";

import { useState } from "react";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { MdEventNote } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrQuery, fmtDate, fmtDateTime } from "@/hooks/useHr";
import { Avatar, Badge, Btn, Card, EmptyState, Loading, PageHeader, SearchBox, Select, StatCard, Table, Td } from "@/components/hr/HrUi";
import { LeaveStepper } from "@/components/hr/LeaveParts";
import LeaveApplyModal from "@/components/hr/modals/LeaveApplyModal";
import Pagination from "@/components/Comon/Pagination";
import ExportButtons from "@/components/Comon/ExportButtons";
import { exportToExcel } from "@/lib/exportHelper";

export default function LeaveApplicationsPage() {
  const permissions = usePagePermission();
  const { canAdd } = permissions;
  const { me } = useHrConfig();
  const { branches, staff, leaveTypes } = useHrLookups();
  const [status, setStatus] = useState("all");
  const [branch, setBranch] = useState("all");
  const [leaveType, setLeaveType] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const { data, loading, refetch } = useHrQuery("/leave", { status, branch, leaveType, search: search || undefined, page, limit: 20 });
  const rows = data?.data || [];
  const st = data?.stats || {};
  const pending = (st.pending_branch || 0) + (st.pending_hr || 0) + (st.pending_director || 0);

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
      <PageHeader
        icon={<MdEventNote />}
        title="Leave Applications"
        subtitle="All applications across branches with their position in the approval workflow."
        actions={canAdd && <Btn variant="gold" onClick={() => setOpen(true)}><FiPlus /> Apply on behalf</Btn>}
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Pending (all stages)" value={pending} tone="amber" icon="⏳" onClick={() => setStatus("pending")} active={status === "pending"} />
        <StatCard label="At Branch" value={st.pending_branch || 0} tone="amber" icon="1" onClick={() => setStatus("pending_branch")} active={status === "pending_branch"} index={1} />
        <StatCard label="At HR" value={st.pending_hr || 0} tone="blue" icon="2" onClick={() => setStatus("pending_hr")} active={status === "pending_hr"} index={2} />
        <StatCard label="At Director" value={st.pending_director || 0} tone="purple" icon="3" onClick={() => setStatus("pending_director")} active={status === "pending_director"} index={3} />
        <StatCard label="Approved" value={st.approved || 0} tone="green" icon="✓" onClick={() => setStatus("approved")} active={status === "approved"} index={4} />
      </div>
      <Card
        title={`${data?.total ?? 0} applications`}
        bodyClassName="p-0"
        actions={
          <>
            <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Name, ID, LV-no" className="w-48" />
            <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "all", label: "All statuses" }, { value: "pending", label: "Pending" }, "approved", "rejected", "cancelled"].map((o) => (typeof o === "string" ? { value: o, label: o[0].toUpperCase() + o.slice(1) } : o))} className="w-36" />
            <Select value={leaveType} onChange={setLeaveType} options={[{ value: "all", label: "All types" }, ...leaveTypes.map((t) => ({ value: t._id, label: t.name }))]} className="w-36" />
            {me?.scope === "all" && <Select value={branch} onChange={setBranch} options={[{ value: "all", label: "All branches" }, ...branches]} className="w-40" />}
            <ExportButtons
              onExportExcel={() =>
                exportToExcel(
                  rows.map((a) => ({ No: a.applicationNo, Employee: a.employeeName, ID: a.employeeCode, Branch: a.branch, Type: a.leaveTypeName, From: a.fromDate, To: a.toDate, Days: a.totalDays, Status: a.status, Approved: a.approvedDays, Reason: a.reason })),
                  "leave_applications",
                  "Leave",
                )
              }
            />
          </>
        }
      >
        {loading ? (
          <Loading />
        ) : !rows.length ? (
          <EmptyState title="No applications" />
        ) : (
          <Table head={["Application", "Employee", "Leave", "Days", "Workflow", "Status", "Applied"]}>
            {rows.map((a) => (
              <tr key={a._id} className="hover:bg-brand-offwhite/60 dark:hover:bg-brand-midnight/30">
                <Td><Link className="font-black hover:text-brand-gold" href={`/dashboard/leave/${a._id}`}>{a.applicationNo}</Link></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Avatar name={a.employeeName} photo={a.employeePhoto} size={28} />
                    <div><div className="font-black">{a.employeeName}</div><div className="text-[10px] text-brand-dark-grey">{a.employeeCode} · {a.branch}</div></div>
                  </div>
                </Td>
                <Td>{a.leaveTypeName}<div className="text-[10px] text-brand-dark-grey">{fmtDate(a.fromDate)} → {fmtDate(a.toDate)}</div></Td>
                <Td>{a.totalDays}{a.status === "approved" && a.approvedDays !== a.totalDays ? <span className="text-amber-500"> ({a.approvedDays})</span> : ""}</Td>
                <Td className="min-w-[200px]"><LeaveStepper app={a} compact /></Td>
                <Td><Badge status={a.status} /></Td>
                <Td className="whitespace-nowrap text-[11px]">{fmtDateTime(a.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        )}
        {data?.totalPages > 1 && <div className="p-4"><Pagination currentPage={page} totalPages={data.totalPages} totalItems={data.total} itemsPerPage={20} onPageChange={setPage} /></div>}
      </Card>
      <LeaveApplyModal isOpen={open} onClose={() => setOpen(false)} staff={staff} permissions={permissions} leaveTypes={leaveTypes} onSaved={() => { setOpen(false); refetch(); }} />
    </div>
  );
}
