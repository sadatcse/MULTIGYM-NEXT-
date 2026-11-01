"use client";

import { useState } from "react";
import { FiAlertTriangle, FiArchive, FiDollarSign, FiTrendingDown } from "react-icons/fi";
import usePagePermission from "@/hooks/usePagePermission";
import useDebounce from "@/hooks/useDebounce";
import { money, useHrQuery } from "@/hooks/useHr";
import { Btn, Card, controlCls, EmptyState, Loading, PageHeader, pageCls, SearchBox, Select, StatCard } from "@/components/hr/HrUi";
import Pagination from "@/components/Comon/Pagination";
import { Refreshing, useGymLookups } from "@/components/hr/GymAssetUi";
import { DisposalList } from "@/components/hr/GymAssetTables";
import { DISPOSAL_TYPES } from "@/components/hr/gymAssets";
import AssetDisposalModal, { DisposalNotesModal } from "@/components/hr/modals/AssetDisposalModal";

export default function AssetDisposalsPage() {
  const permissions = usePagePermission();
  const lookups = useGymLookups();
  const [text, setText] = useState("");
  const [search] = useDebounce(text, 400);
  const [filters, setFilters] = useState({ location: "", disposalType: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const setFilter = (k) => (v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };
  const q = useHrQuery("/gym-asset/disposals", { ...filters, search, page, limit });
  const rows = q.data?.data || [];
  const s = q.data?.summary;
  const [modal, setModal] = useState(null);
  const [notes, setNotes] = useState(null);
  const filtered = search || Object.values(filters).some(Boolean);

  return (
    <div className={pageCls}>
      <PageHeader
        title="Asset Disposals"
        subtitle="Assets that were sold, scrapped, lost or donated. A disposed asset leaves the active register; its full history is kept."
        actions={permissions.canAdd && <Btn variant="danger" onClick={() => setModal({})}><FiArchive /> Dispose of an asset</Btn>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard index={0} icon={<FiArchive />} tone="slate" label="Disposals" value={q.data ? q.data.total : "—"} hint={filtered ? "Matching the filters" : "All time"} />
        <StatCard index={1} icon={<FiTrendingDown />} tone="amber" label="Book value written off" value={s ? money(s.bookValue) : "—"} hint="Depreciated value at disposal" />
        <StatCard index={2} icon={<FiDollarSign />} tone="green" label="Money received" value={s ? money(s.disposalValue) : "—"} hint="From sales and recoveries" />
      </div>

      <Card
        title="Disposed assets"
        actions={
          <>
            <SearchBox value={text} onChange={(v) => { setText(v); setPage(1); }} placeholder="Disposal no., asset code or name" className="sm:w-56" />
            <Select value={filters.location} onChange={setFilter("location")} options={lookups.locations.map((l) => ({ value: l._id, label: l.name }))} placeholder="All locations" className="sm:w-40" aria-label="Location" />
            <Select value={filters.disposalType} onChange={setFilter("disposalType")} options={DISPOSAL_TYPES} placeholder="Any type" className="sm:w-32" aria-label="Disposal type" />
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
          <EmptyState icon={<FiAlertTriangle />} title="Couldn't load disposals" text={q.error} action={<Btn variant="ghost" size="sm" onClick={q.refetch}>Try again</Btn>} />
        ) : !rows.length ? (
          <EmptyState icon={<FiArchive />} title={filtered ? "No disposals match" : "No disposals yet"} text={filtered ? "Try different filters." : "When an asset is sold, scrapped or lost, record it here with its approval."} />
        ) : (
          <>
            <DisposalList rows={rows} canEdit={permissions.canEdit} onOpen={setNotes} />
            <div className="p-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
              <Pagination currentPage={page} totalPages={q.data.totalPages} totalItems={q.data.total} itemsPerPage={limit} onPageChange={setPage} onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }} itemsPerPageOptions={[10, 20, 50, 100]} />
            </div>
          </>
        )}
      </Card>

      <AssetDisposalModal state={modal} permissions={permissions} onClose={() => setModal(null)} onSaved={() => { setModal(null); q.refetch(); }} />
      <DisposalNotesModal record={notes} permissions={permissions} onClose={() => setNotes(null)} onSaved={() => { setNotes(null); q.refetch(); }} />
    </div>
  );
}
