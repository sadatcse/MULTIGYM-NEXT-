"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";
import { MdShoppingCart } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrQuery, money, fmtDate } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Loading, PageHeader, SearchBox, Select, Table, Tabs, Td } from "@/components/hr/HrUi";
import Pagination from "@/components/Comon/Pagination";
import ExportButtons from "@/components/Comon/ExportButtons";
import { exportToExcel } from "@/lib/exportHelper";

const REQ_FLOW = ["submitted", "verified", "approved", "purchased", "received"];

export default function RequisitionsPage() {
  const { canAdd } = usePagePermission();
  const { me } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const [view, setView] = useState("all");
  const [status, setStatus] = useState("open");
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const list = useHrQuery("/requisitions", { status, branch, search: search || undefined, page, limit: 20, mine: view === "mine" ? "true" : undefined }, { enabled: view !== "queue" });
  const queue = useHrQuery("/requisitions/pending-for-me", {}, { enabled: view === "queue" });
  const rows = view === "queue" ? queue.data?.data || [] : list.data?.data || [];
  const loading = view === "queue" ? queue.loading : list.loading;
  const st = list.data?.stats || {};

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader
        icon={<MdShoppingCart />}
        title="Purchase & Requisition"
        subtitle="Employee / Branch → Requisition → Admin verification → Management approval → Purchase → Received"
        actions={canAdd && <Link href="/dashboard/requisitions/create"><Btn variant="gold"><FiPlus /> New requisition</Btn></Link>}
      />
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Tabs value={view} onChange={(v) => { setView(v); setPage(1); }} tabs={[{ value: "all", label: "All" }, { value: "queue", label: "Waiting for me" }, { value: "mine", label: "Raised by me" }]} />
        {view !== "queue" && (
          <div className="flex flex-wrap gap-1.5">
            {["open", ...REQ_FLOW, "rejected", "cancelled", "all"].map((s) => (
              <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-3 py-1.5 rounded-xl text-[11px] font-black border cursor-pointer transition-colors ${status === s ? "bg-brand-gold text-brand-black border-brand-gold" : "border-brand-beige dark:border-brand-dark-grey"}`}>
                {s === "open" ? "Open" : s[0].toUpperCase() + s.slice(1)} {st[s] ? `(${st[s]})` : ""}
              </button>
            ))}
          </div>
        )}
      </div>
      <Card
        bodyClassName="p-0"
        actions={
          view !== "queue" && (
            <>
              <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="REQ no, item, vendor" className="w-52" />
              {me?.scope === "all" && <Select value={branch} onChange={setBranch} options={[{ value: "all", label: "All branches" }, ...branches]} className="w-44" />}
              <ExportButtons onExportExcel={() => exportToExcel(rows.map((r) => ({ No: r.requisitionNo, Title: r.title, Branch: r.branch, RequestedBy: r.requestedBy?.name, Items: r.items.map((i) => `${i.name} x${i.quantity}`).join("; "), Estimated: r.estimatedTotal, Approved: r.approvedAmount, Vendor: r.vendorName, Status: r.status, Purchase: r.purchaseStatus, Delivery: r.deliveryStatus, Date: fmtDate(r.createdAt) })), "requisitions", "Requisitions")} />
            </>
          )
        }
      >
        {loading ? <Loading /> : !rows.length ? <EmptyState icon={<MdShoppingCart />} title="No requisitions" /> : (
          <Table head={["Requisition", "Branch", "Requested by", "Items", "Estimated", "Approved", "Vendor", "Progress", "Status"]}>
            {rows.map((r, i) => (
              <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10">
                <Td>
                  <Link href={`/dashboard/requisitions/${r._id}`} className="font-black hover:text-brand-gold">{r.requisitionNo}</Link>
                  <div className="text-[11px] font-semibold">{r.title}</div>
                  {r.priority !== "normal" && <Badge status={r.priority} />}
                </Td>
                <Td>{r.branch}</Td>
                <Td>{r.requestedBy?.name}<div className="text-[10px] text-brand-dark-grey">{fmtDate(r.createdAt)}</div></Td>
                <Td className="text-[11px] max-w-[200px]">{r.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}</Td>
                <Td>{money(r.estimatedTotal)}</Td>
                <Td className="font-black">{r.approvedAmount ? money(r.approvedAmount) : "—"}</Td>
                <Td>{r.vendorName || "—"}</Td>
                <Td><FlowDots status={r.status} /></Td>
                <Td><Badge status={r.status} />{r.deliveryStatus === "partial" && <div className="mt-1"><Badge tone="amber">Partial delivery</Badge></div>}</Td>
              </motion.tr>
            ))}
          </Table>
        )}
        {view !== "queue" && list.data?.totalPages > 1 && <div className="p-4"><Pagination currentPage={page} totalPages={list.data.totalPages} totalItems={list.data.total} itemsPerPage={20} onPageChange={setPage} /></div>}
      </Card>
    </div>
  );
}

function FlowDots({ status }) {
  const idx = REQ_FLOW.indexOf(status);
  const bad = status === "rejected" || status === "cancelled";
  return (
    <div className="flex items-center gap-1">
      {REQ_FLOW.map((s, i) => (
        <span key={s} title={s} className={`h-1.5 w-5 rounded-full ${bad ? "bg-red-400/40" : i <= idx ? "bg-brand-gold" : "bg-brand-beige/60 dark:bg-brand-dark-grey"}`} />
      ))}
    </div>
  );
}
