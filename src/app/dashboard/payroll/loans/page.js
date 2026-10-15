"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiCheck, FiPlus, FiSlash } from "react-icons/fi";
import { MdAccountBalanceWallet } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, money, fmtDate } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Loading, PageHeader, Select, StatCard, Table, Td } from "@/components/hr/HrUi";
import LoanFormModal from "@/components/hr/modals/LoanFormModal";

export default function LoansPage() {
  const permissions = usePagePermission();
  const { canAdd, canEdit } = permissions;
  const { config } = useHrConfig();
  const { staff } = useHrLookups();
  const symbol = config?.payroll?.currency || "৳";
  const [status, setStatus] = useState("active");
  const [type, setType] = useState("all");
  const [open, setOpen] = useState(false);
  const { data, loading, refetch } = useHrQuery("/payroll/loans", { status, type });
  const { run } = useHrMutation();
  const st = data?.stats || {};


  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader
        icon={<MdAccountBalanceWallet />}
        title="Advance Salary & Loans"
        subtitle="Disbursements are recovered automatically from salary in monthly installments when payroll is finalized."
        actions={canAdd && <Btn variant="gold" onClick={() => setOpen(true)}><FiPlus /> New advance / loan</Btn>}
      />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Records" value={st.total ?? 0} icon="#" />
        <StatCard label="Active" value={st.active ?? 0} icon="↻" tone="amber" index={1} />
        <StatCard label="Outstanding" value={money(st.outstanding, symbol)} icon="৳" tone="red" index={2} />
      </div>
      <Card
        bodyClassName="p-0"
        actions={
          <>
            <Select value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, { value: "active", label: "Active" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }]} className="w-36" />
            <Select value={type} onChange={setType} options={[{ value: "all", label: "All types" }, { value: "advance", label: "Advance" }, { value: "loan", label: "Loan" }, { value: "adjustment", label: "Adjustment" }]} className="w-36" />
          </>
        }
      >
        {loading ? <Loading /> : !data?.data?.length ? <EmptyState title="No records" /> : (
          <Table head={["No.", "Employee", "Type", "Amount", "Installment", "Recovered", "Progress", "Status", "Start", ""]}>
            {data.data.map((l) => {
              const pct = Math.min(100, (l.recoveredAmount / l.amount) * 100);
              return (
                <tr key={l._id}>
                  <Td className="font-black">{l.loanNo}</Td>
                  <Td>{l.employeeName}<div className="text-[10px] text-brand-dark-grey">{l.employeeCode} · {l.branch}</div></Td>
                  <Td><Badge tone={l.type === "advance" ? "blue" : "purple"}>{l.type}</Badge></Td>
                  <Td>{money(l.amount, symbol)}</Td>
                  <Td>{money(l.installmentAmount, symbol)}/mo</Td>
                  <Td>{money(l.recoveredAmount, symbol)}</Td>
                  <Td className="min-w-[120px]">
                    <div className="h-2 rounded-full bg-brand-offwhite dark:bg-brand-midnight overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-emerald-500" /></div>
                    <div className="text-[10px] text-brand-dark-grey mt-0.5">{Math.round(pct)}% · due {money(l.amount - l.recoveredAmount, symbol)}</div>
                  </Td>
                  <Td><Badge status={l.status} /></Td>
                  <Td className="text-[11px]">{l.startMonth}<div className="text-brand-dark-grey">paid {fmtDate(l.disbursedOn)}</div></Td>
                  <Td className="text-right whitespace-nowrap">
                    {canEdit && l.status === "active" && (
                      <>
                        <Btn size="sm" variant="ghost" title="Mark completed" onClick={async () => { if (confirm("Mark as fully recovered?") && (await run("patch", `/payroll/loans/${l._id}`, { status: "completed" }))) refetch(); }}><FiCheck /></Btn>
                        {l.recoveredAmount === 0 && <Btn size="sm" variant="ghost" title="Cancel" onClick={async () => { if (confirm("Cancel this record?") && (await run("patch", `/payroll/loans/${l._id}`, { status: "cancelled" }))) refetch(); }}><FiSlash /></Btn>}
                      </>
                    )}
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <LoanFormModal open={open} staff={staff} symbol={symbol} permissions={permissions} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); refetch(); }} />
    </div>
  );
}
