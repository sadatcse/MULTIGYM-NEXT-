"use client";

import { useContext, useState } from "react";
import { FiBookOpen } from "react-icons/fi";
import { AuthContext } from "@/providers/AuthProvider";
import { useHrConfig, useHrLookups, useHrQuery } from "@/hooks/useHr";
import { Card, EmptyState, Loading, PageHeader, Select, Table, Td } from "@/components/hr/HrUi";
import ExportButtons from "@/components/Comon/ExportButtons";
import { exportToExcel } from "@/lib/exportHelper";
import { printDocument, tableHtml } from "@/lib/hrPrint";

export default function LeaveRegisterPage() {
  const { company } = useContext(AuthContext);
  const { me } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(String(thisYear));
  const [branch, setBranch] = useState("all");
  const { data, loading } = useHrQuery("/leave/register", { year, branch });
  const types = data?.leaveTypes || [];
  const rows = data?.data || [];
  const head = ["ID", "Employee", "Branch", ...types.map((t) => `${t.name} (${t.daysAllowed})`), "Total days", "Applications"];
  const cells = (r) => [r.employeeCode, r.employeeName, r.branch, ...types.map((t) => r.byType[t.name] || 0), r.totalDays, r.applications];

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader icon={<FiBookOpen />} title="Leave Register" subtitle="Approved leave per employee and leave type for the year — the official leave record." />
      <Card
        title={`${rows.length} employees took leave in ${year}`}
        bodyClassName="p-0"
        actions={
          <>
            <Select value={year} onChange={setYear} options={[thisYear - 2, thisYear - 1, thisYear, thisYear + 1].map(String)} className="w-28" />
            {me?.scope === "all" && <Select value={branch} onChange={setBranch} options={[{ value: "all", label: "All branches" }, ...branches]} className="w-44" />}
            <ExportButtons
              onExportExcel={() => exportToExcel(rows.map((r) => Object.fromEntries(head.map((h, i) => [h, cells(r)[i]]))), `leave_register_${year}`, "Register")}
              onPrint={() => printDocument({ title: `Leave Register ${year}`, subtitle: branch === "all" ? "All branches" : branch, company, landscape: true, bodyHtml: tableHtml(head, rows.map(cells)) })}
            />
          </>
        }
      >
        {loading ? <Loading /> : !rows.length ? <EmptyState title="No approved leave this year" /> : (
          <Table head={head}>
            {rows.map((r) => (
              <tr key={r.employeeId}>
                {cells(r).map((c, i) => <Td key={i} className={i === cells(r).length - 2 ? "text-brand-gold font-black" : ""}>{c}</Td>)}
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
