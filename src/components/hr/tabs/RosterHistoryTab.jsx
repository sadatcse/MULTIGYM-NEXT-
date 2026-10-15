"use client";

import { useState } from "react";
import { useHrQuery, fmtDateTime, titleCase } from "@/hooks/useHr";
import { Badge, Card, Loading, Select, Table, Td } from "@/components/hr/HrUi";
import { DUTY_STYLE } from "@/components/hr/duty";
import Pagination from "@/components/Comon/Pagination";

// Who changed which duty, when and why (roster audit trail).
export default function HistoryTab({ branch, branchOptions, setBranch }) {
  const [page, setPage] = useState(1);
  const { data, loading } = useHrQuery("/roster/history", { branch, page, limit: 30 }, { enabled: !!branch });
  const show = (x) => (x ? `${DUTY_STYLE[x.dutyType]?.label || x.dutyType}${x.startTime ? ` ${x.startTime}–${x.endTime}` : ""}${x.isTemporary ? " (temp)" : ""}` : "—");
  return (
    <Card title="Roster change history" subtitle="Who changed which duty, when, and why." bodyClassName="p-0" actions={<Select value={branch} onChange={setBranch} options={branchOptions} className="w-48" />}>
      {loading ? (
        <Loading />
      ) : (
        <Table head={["When", "Duty date", "Employee", "Action", "Before", "After", "Reason", "By"]}>
          {(data?.data || []).map((h) => (
            <tr key={h._id}>
              <Td className="whitespace-nowrap">{fmtDateTime(h.createdAt)}</Td>
              <Td>{h.date}</Td>
              <Td>{h.employeeName || "—"}</Td>
              <Td><Badge tone={h.action === "deleted" ? "red" : h.action === "created" ? "green" : "blue"}>{h.action}</Badge></Td>
              <Td className="text-[11px]">{h.action === "copied" ? "—" : show(h.before)}</Td>
              <Td className="text-[11px]">{h.action === "copied" ? `${h.after?.copied} duties from ${h.after?.sourceStart}` : show(h.after)}</Td>
              <Td className="text-[11px] max-w-[200px]">{h.reason || "—"}</Td>
              <Td>{h.changedBy?.name}<div className="text-[10px] text-brand-dark-grey">{titleCase(h.changedBy?.role || "")}</div></Td>
            </tr>
          ))}
        </Table>
      )}
      {data?.totalPages > 1 && <div className="p-4"><Pagination currentPage={page} totalPages={data.totalPages} totalItems={data.total} itemsPerPage={30} onPageChange={setPage} /></div>}
    </Card>
  );
}
