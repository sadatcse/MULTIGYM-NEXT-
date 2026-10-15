"use client";

import { useMemo, useState } from "react";
import { FiEdit3 } from "react-icons/fi";
import { MdTune } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrQuery, money, fmtDate } from "@/hooks/useHr";
import { Avatar, Badge, Btn, Card, EmptyState, Loading, PageHeader, SearchBox, Select, Table, Td } from "@/components/hr/HrUi";
import SalaryStructureModal from "@/components/hr/modals/SalaryStructureModal";
import ExportButtons from "@/components/Comon/ExportButtons";
import { exportToExcel } from "@/lib/exportHelper";

const sumList = (l = []) => l.reduce((s, x) => s + (Number(x.amount) || 0), 0);

export default function SalaryStructuresPage() {
  const permissions = usePagePermission();
  const { canEdit } = permissions;
  const { me, config } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const symbol = config?.payroll?.currency || "৳";
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const { data, loading, refetch } = useHrQuery("/payroll/structures", { branch });
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.data || []).filter((r) => !q || `${r.employee.name} ${r.employee.employeeId}`.toLowerCase().includes(q));
  }, [data, search]);
  const missing = rows.filter((r) => !r.structure && !r.employee.grossSalary).length;

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader icon={<MdTune />} title="Salary Structures" subtitle="Basic salary, allowances and recurring deductions per employee. Every change is kept as an increment / revision in the employee history." />
      <Card
        title={`${rows.length} employees`}
        subtitle={missing ? `${missing} without any salary — they will be skipped in payroll` : "All employees have a salary"}
        bodyClassName="p-0"
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} className="w-48" />
            {me?.scope === "all" && <Select value={branch} onChange={setBranch} options={[{ value: "all", label: "All branches" }, ...branches]} className="w-44" />}
            <ExportButtons
              onExportExcel={() =>
                exportToExcel(
                  rows.map(({ employee: e, structure: s }) => ({ ID: e.employeeId, Name: e.name, Designation: e.jobPosition, Branch: e.branches?.[0], Basic: s?.basic ?? e.basicSalary, HouseRent: s?.houseRent ?? 0, Medical: s?.medical ?? 0, Conveyance: s?.conveyance ?? 0, OtherAllowances: sumList(s?.otherAllowances), Gross: s?.gross ?? e.grossSalary, FixedDeductions: sumList(s?.fixedDeductions), Payment: s?.paymentMode, Account: s?.accountNumber })),
                  "salary_structures",
                  "Structures",
                )
              }
            />
          </>
        }
      >
        {loading ? <Loading /> : !rows.length ? <EmptyState title="No employees" /> : (
          <Table head={["Employee", "Branch", "Basic", "House rent", "Medical", "Conveyance", "Other", "Gross", "Fixed ded.", "Since", ""]}>
            {rows.map(({ employee: e, structure: s }) => (
              <tr key={e._id} className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10">
                <Td>
                  <div className="flex items-center gap-2">
                    <Avatar name={e.name} photo={e.photo} size={30} />
                    <div><div className="font-black">{e.name}</div><div className="text-[10px] text-brand-dark-grey">{e.employeeId} · {e.jobPosition || "—"}</div></div>
                  </div>
                </Td>
                <Td>{e.branches?.[0] || "—"}</Td>
                {s ? (
                  <>
                    <Td>{money(s.basic, symbol)}</Td><Td>{money(s.houseRent, symbol)}</Td><Td>{money(s.medical, symbol)}</Td><Td>{money(s.conveyance, symbol)}</Td>
                    <Td>{money(sumList(s.otherAllowances), symbol)}</Td><Td className="font-black text-emerald-600">{money(s.gross, symbol)}</Td><Td className="text-red-500">{money(sumList(s.fixedDeductions), symbol)}</Td>
                    <Td className="text-[11px]">{fmtDate(s.effectiveFrom)}</Td>
                  </>
                ) : (
                  <Td colSpan={8}>{e.grossSalary ? <span className="text-[11px]">Profile only: basic {money(e.basicSalary, symbol)} / gross {money(e.grossSalary, symbol)} — no breakdown</span> : <Badge tone="amber">No salary set</Badge>}</Td>
                )}
                <Td className="text-right">{canEdit && <Btn size="sm" variant="ghost" onClick={() => setEditing({ employee: e, structure: s })}><FiEdit3 /> {s ? "Revise" : "Set"}</Btn>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <SalaryStructureModal target={editing} symbol={symbol} permissions={permissions} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
    </div>
  );
}
