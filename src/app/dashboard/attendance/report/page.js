"use client";

import { useContext, useMemo, useState } from "react";
import { FiBarChart2 } from "react-icons/fi";
import { AuthContext } from "@/providers/AuthProvider";
import { useHrConfig, useHrLookups, useHrQuery, monthISO, fmtMinutes } from "@/hooks/useHr";
import { Card, EmptyState, Loading, PageHeader, SearchBox, Select, Table, Td } from "@/components/hr/HrUi";
import ExportButtons from "@/components/Comon/ExportButtons";
import { exportToExcel } from "@/lib/exportHelper";
import { printDocument, tableHtml } from "@/lib/hrPrint";

export default function AttendanceReportPage() {
  const { company } = useContext(AuthContext);
  const { me } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const [month, setMonth] = useState(monthISO());
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");
  const { data, loading } = useHrQuery("/attendance/monthly", { month, branch });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.data || []).filter((r) => !q || `${r.employeeName} ${r.employeeCode}`.toLowerCase().includes(q));
  }, [data, search]);

  const totals = rows.reduce(
    (t, r) => ({ present: t.present + r.present, late: t.late + r.late, absent: t.absent + r.absent, leave: t.leave + r.leave, ot: t.ot + r.overtimeMinutes }),
    { present: 0, late: 0, absent: 0, leave: 0, ot: 0 },
  );

  const head = ["ID", "Name", "Designation", "Branch", "Present", "Late", "Late min", "Early", "Half", "Missing", "Absent", "Leave", "Off/Hol", "Worked", "OT"];
  const cells = (r) => [r.employeeCode, r.employeeName, r.designation, r.branch, r.present, r.late, r.lateMinutes, r.earlyLeave, r.halfDay, r.missingPunch, r.absent, r.leave, r.weekend + r.holiday, fmtMinutes(r.workedMinutes), fmtMinutes(r.overtimeMinutes)];

  return (
    <div className="space-y-5 max-w-[1700px] mx-auto pb-10">
      <PageHeader
        icon={<FiBarChart2 />}
        title="Monthly Attendance Report"
        subtitle="Per-employee summary for payroll and review — branch-wise or all branches combined."
        actions={<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white [color-scheme:dark]" />}
      />
      <Card
        title={`${rows.length} employees · ${month}`}
        subtitle={`Present ${totals.present} · Late ${totals.late} · Absent ${totals.absent} · Leave ${totals.leave} · OT ${fmtMinutes(totals.ot)}`}
        bodyClassName="p-0"
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} className="w-44" />
            {me?.scope !== "self" && (
              <Select value={branch} onChange={setBranch} options={[{ value: "all", label: "All branches" }, ...(me?.scope === "branch" ? me.branches : branches).map((b) => ({ value: b, label: b }))]} className="w-48" />
            )}
            <ExportButtons
              onExportExcel={() => exportToExcel(rows.map((r) => Object.fromEntries(head.map((h, i) => [h, cells(r)[i]]))), `attendance_report_${month}_${branch}`, "Monthly")}
              onPrint={() =>
                printDocument({ title: `Monthly Attendance — ${month}`, subtitle: branch === "all" ? "All branches" : branch, company, landscape: true, bodyHtml: tableHtml(head, rows.map(cells)) })
              }
            />
          </>
        }
      >
        {loading ? (
          <Loading />
        ) : !rows.length ? (
          <EmptyState title="No attendance data" text="Records appear once devices push punches or a day is processed." />
        ) : (
          <Table head={head}>
            {rows.map((r) => (
              <tr key={r._id} className="hover:bg-brand-offwhite/60 dark:hover:bg-brand-midnight/30">
                {cells(r).map((c, i) => (
                  <Td key={i} className={`whitespace-nowrap ${i === 10 && c ? "text-red-500" : i === 5 && c ? "text-amber-500" : ""}`}>{c === 0 ? "0" : c || "—"}</Td>
                ))}
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
