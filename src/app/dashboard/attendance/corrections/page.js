"use client";

import { useState } from "react";
import { FiArrowRight, FiShield } from "react-icons/fi";
import { useHrConfig, useHrLookups, useHrQuery, fmtDateTime, titleCase } from "@/hooks/useHr";
import { Badge, Card, EmptyState, Loading, PageHeader, Select, Table, Td } from "@/components/hr/HrUi";
import Pagination from "@/components/Comon/Pagination";

const Snap = ({ s }) =>
  s ? (
    <span className="inline-flex items-center gap-1.5">
      <Badge status={s.status} />
      <span className="text-[11px] text-brand-dark-grey dark:text-zinc-300">{s.inTime || "—"} / {s.outTime || "—"}</span>
    </span>
  ) : (
    <span className="text-brand-dark-grey">No record</span>
  );

export default function AttendanceCorrectionsPage() {
  const { me } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const [branch, setBranch] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading } = useHrQuery("/attendance/corrections", { branch, from: from || undefined, to: to || undefined, page, limit: 30 });
  const rows = data?.data || [];

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader icon={<FiShield />} title="Attendance Correction Audit Log" subtitle="Every manual change to attendance — who edited it, when, what it was before and after, and why." />
      <Card
        title={`${data?.total ?? 0} corrections`}
        bodyClassName="p-0"
        actions={
          <>
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="px-3 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold" />
            <span className="text-xs">to</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="px-3 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold" />
            {me?.scope === "all" && <Select value={branch} onChange={(v) => { setBranch(v); setPage(1); }} options={[{ value: "all", label: "All branches" }, ...branches]} className="w-44" />}
          </>
        }
      >
        {loading ? (
          <Loading />
        ) : !rows.length ? (
          <EmptyState title="No corrections recorded" />
        ) : (
          <Table head={["Edited at", "Attendance date", "Employee", "Branch", "Change", "Reason", "Edited by"]}>
            {rows.map((c) => (
              <tr key={c._id}>
                <Td className="whitespace-nowrap">{fmtDateTime(c.createdAt)}</Td>
                <Td className="whitespace-nowrap">{c.date}</Td>
                <Td>
                  <div className="font-black">{c.employeeName}</div>
                  <div className="text-[10px] text-brand-dark-grey">{c.employeeCode}</div>
                </Td>
                <Td>{c.branch}</Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-2">
                    <Snap s={c.before} />
                    <FiArrowRight className="text-brand-gold" />
                    <Snap s={c.after} />
                  </div>
                </Td>
                <Td className="max-w-[260px] text-[11px] font-semibold">{c.reason}</Td>
                <Td>
                  <div className="font-black">{c.editedBy?.name}</div>
                  <div className="text-[10px] text-brand-dark-grey">{titleCase(c.editedBy?.role || "")}{c.ipAddress ? ` · ${c.ipAddress}` : ""}</div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {data?.totalPages > 1 && (
          <div className="p-4">
            <Pagination currentPage={page} totalPages={data.totalPages} totalItems={data.total} itemsPerPage={30} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
