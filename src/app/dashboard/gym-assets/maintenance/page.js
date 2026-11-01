"use client";

import { useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiDollarSign, FiPlus, FiTool } from "react-icons/fi";
import usePagePermission from "@/hooks/usePagePermission";
import useDebounce from "@/hooks/useDebounce";
import { money, useHrQuery } from "@/hooks/useHr";
import { Btn, Card, controlCls, EmptyState, Loading, PageHeader, pageCls, SearchBox, Select, StatCard, Tabs } from "@/components/hr/HrUi";
import Pagination from "@/components/Comon/Pagination";
import { Refreshing, useGymLookups } from "@/components/hr/GymAssetUi";
import { MaintenanceList } from "@/components/hr/GymAssetTables";
import { MAINTENANCE_TYPES } from "@/components/hr/gymAssets";
import AssetMaintenanceModal from "@/components/hr/modals/AssetMaintenanceModal";

export default function AssetMaintenancePage() {
  const permissions = usePagePermission();
  const lookups = useGymLookups();
  const [text, setText] = useState("");
  const [search] = useDebounce(text, 400);
  const [status, setStatus] = useState("all");
  const [filters, setFilters] = useState({ location: "", maintenanceType: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const setFilter = (k) => (v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };
  const q = useHrQuery("/gym-asset/maintenance", { ...filters, status, search, page, limit });
  const rows = q.data?.data || [];
  const s = q.data?.summary;
  const [modal, setModal] = useState(null);
  const open = (s?.pending || 0) + (s?.in_progress || 0);

  return (
    <div className={pageCls}>
      <PageHeader title="Asset Maintenance" subtitle="Repairs and servicing for every asset: who did it, what it cost, and when it is due next." actions={permissions.canAdd && <Btn onClick={() => setModal({})}><FiPlus /> Log maintenance</Btn>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard index={0} icon={<FiClock />} tone="amber" label="Pending" value={s ? s.pending : "—"} hint="Logged, not started" onClick={() => { setStatus("pending"); setPage(1); }} active={status === "pending"} />
        <StatCard index={1} icon={<FiTool />} tone="blue" label="In progress" value={s ? s.in_progress : "—"} hint={open ? `${open} open in total` : "Nothing open"} onClick={() => { setStatus("in_progress"); setPage(1); }} active={status === "in_progress"} />
        <StatCard index={2} icon={<FiCheckCircle />} tone="green" label="Completed" value={s ? s.completed : "—"} hint={s?.cancelled ? `${s.cancelled} cancelled` : " "} onClick={() => { setStatus("completed"); setPage(1); }} active={status === "completed"} />
        <StatCard index={3} icon={<FiDollarSign />} label="Cost" value={s ? money(s.cost) : "—"} hint="Excludes cancelled" />
      </div>

      <Tabs
        value={status}
        onChange={(v) => { setStatus(v); setPage(1); }}
        tabs={[{ value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "in_progress", label: "In progress" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }]}
      />
      <Card
        title="Maintenance records"
        subtitle={q.data ? `${q.data.total.toLocaleString()} found` : undefined}
        actions={
          <>
            <SearchBox value={text} onChange={(v) => { setText(v); setPage(1); }} placeholder="Record no., asset code or name" className="sm:w-56" />
            <Select value={filters.location} onChange={setFilter("location")} options={lookups.locations.map((l) => ({ value: l._id, label: l.name }))} placeholder="All locations" className="sm:w-40" aria-label="Location" />
            <Select value={filters.maintenanceType} onChange={setFilter("maintenanceType")} options={MAINTENANCE_TYPES} placeholder="Any type" className="sm:w-36" aria-label="Type" />
            <input type="date" value={filters.from} onChange={(e) => setFilter("from")(e.target.value)} className={controlCls} aria-label="From date" title="From date" />
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter("to")(e.target.value)} className={controlCls} aria-label="To date" title="To date" />
          </>
        }
        bodyClassName="p-0"
      >
        <Refreshing show={q.loading && !!q.data} />
        {q.loading && !q.data ? (
          <div className="p-5"><Loading rows={5} /></div>
        ) : q.error && !q.data ? (
          <EmptyState icon={<FiAlertTriangle />} title="Couldn't load maintenance" text={q.error} action={<Btn variant="ghost" size="sm" onClick={q.refetch}>Try again</Btn>} />
        ) : !rows.length ? (
          <EmptyState icon={<FiTool />} title="No maintenance records" text={status !== "all" || search ? "Nothing matches these filters." : "Log a repair or service when an asset needs work."} />
        ) : (
          <>
            <MaintenanceList rows={rows} canEdit={permissions.canEdit} onOpen={(m) => setModal({ record: m })} />
            <div className="p-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
              <Pagination currentPage={page} totalPages={q.data.totalPages} totalItems={q.data.total} itemsPerPage={limit} onPageChange={setPage} onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }} itemsPerPageOptions={[10, 20, 50, 100]} />
            </div>
          </>
        )}
      </Card>

      <AssetMaintenanceModal
        state={modal}
        permissions={permissions}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null);
          q.refetch();
        }}
      />
    </div>
  );
}
