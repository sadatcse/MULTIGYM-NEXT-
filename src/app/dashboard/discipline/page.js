"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";
import { MdGavel } from "react-icons/md";
import { useRouter } from "next/navigation";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrQuery, fmtDate } from "@/hooks/useHr";
import { Avatar, Badge, Btn, Card, EmptyState, Loading, PageHeader, SearchBox, Select, StatCard, Table, Td } from "@/components/hr/HrUi";
import CaseCreateModal, { CASE_TYPES } from "@/components/hr/modals/CaseCreateModal";
import Pagination from "@/components/Comon/Pagination";

export default function DisciplinePage() {
  const router = useRouter();
  const permissions = usePagePermission();
  const { canAdd } = permissions;
  const { me } = useHrConfig();
  const { branches, staff } = useHrLookups();
  const [caseType, setCaseType] = useState("all");
  const [status, setStatus] = useState("active");
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const { data, loading } = useHrQuery("/discipline", { caseType, status, branch, search: search || undefined, page, limit: 20 });
  const byType = data?.stats?.byType || {};


  return (
    <div className="space-y-5 max-w-[1500px] mx-auto pb-10">
      <PageHeader
        icon={<MdGavel />}
        title="Employee Discipline & Case Record"
        subtitle="Verbal & written warnings, show cause, complaints, investigations, management decisions and administrative actions — with attachments and full history."
        actions={canAdd && <Btn variant="gold" onClick={() => setOpen(true)}><FiPlus /> Open case</Btn>}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CASE_TYPES.map((c, i) => (
          <StatCard key={c.value} index={i} icon={c.icon} label={c.label} value={byType[c.value] || 0} tone={c.tone} active={caseType === c.value} onClick={() => { setCaseType(caseType === c.value ? "all" : c.value); setPage(1); }} />
        ))}
      </div>
      <Card
        title={`${data?.total ?? 0} cases`}
        bodyClassName="p-0"
        actions={
          <>
            <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Case no, name, subject" className="w-52" />
            <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "active", label: "Not closed" }, { value: "all", label: "All" }, "open", "awaiting_reply", "under_investigation", "decision_made", "closed"].map((o) => (typeof o === "string" ? { value: o, label: o.replace(/_/g, " ") } : o))} className="w-44" />
            {me?.scope === "all" && <Select value={branch} onChange={setBranch} options={[{ value: "all", label: "All branches" }, ...branches]} className="w-40" />}
          </>
        }
      >
        {loading ? <Loading /> : !data?.data?.length ? <EmptyState icon={<MdGavel />} title="No cases" /> : (
          <Table head={["Case", "Employee", "Type", "Subject", "Severity", "Status", "Decision", "Opened"]}>
            {data.data.map((c, i) => (
              <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-brand-offwhite/60 dark:hover:bg-brand-midnight/30">
                <Td><Link href={`/dashboard/discipline/${c._id}`} className="font-black hover:text-brand-gold">{c.caseNo}</Link>{c.confidential && <div className="text-[9px] font-black text-red-500">CONFIDENTIAL</div>}</Td>
                <Td>
                  <div className="flex items-center gap-2"><Avatar name={c.employeeName} photo={c.employeePhoto} size={28} /><div><div className="font-black">{c.employeeName}</div><div className="text-[10px] text-brand-dark-grey">{c.employeeCode} · {c.branch}</div></div></div>
                </Td>
                <Td><Badge tone={CASE_TYPES.find((t) => t.value === c.caseType)?.tone}>{CASE_TYPES.find((t) => t.value === c.caseType)?.label}</Badge></Td>
                <Td className="max-w-[240px]">{c.subject}</Td>
                <Td><Badge status={c.severity} /></Td>
                <Td><Badge status={c.status} /></Td>
                <Td className="text-[11px]">{c.decision ? c.decision.action.replace(/_/g, " ") : "—"}</Td>
                <Td className="text-[11px] whitespace-nowrap">{fmtDate(c.incidentDate)}</Td>
              </motion.tr>
            ))}
          </Table>
        )}
        {data?.totalPages > 1 && <div className="p-4"><Pagination currentPage={page} totalPages={data.totalPages} totalItems={data.total} itemsPerPage={20} onPageChange={setPage} /></div>}
      </Card>

      <CaseCreateModal open={open} staff={staff} permissions={permissions} onClose={() => setOpen(false)} onCreated={(c) => router.push(`/dashboard/discipline/${c._id}`)} />
    </div>
  );
}
