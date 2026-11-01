"use client";

import { useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiFileText, FiPrinter, FiRepeat, FiX } from "react-icons/fi";
import usePagePermission from "@/hooks/usePagePermission";
import useDebounce from "@/hooks/useDebounce";
import { useHrQuery } from "@/hooks/useHr";
import { Btn, Card, controlCls, EmptyState, Loading, PageHeader, pageCls, SearchBox, Select } from "@/components/hr/HrUi";
import Pagination from "@/components/Comon/Pagination";
import { Refreshing, useGymLookups, useTransferLetter } from "@/components/hr/GymAssetUi";
import { TransferList } from "@/components/hr/GymAssetTables";
import AssetTransferModal from "@/components/hr/modals/AssetTransferModal";

export default function AssetTransfersPage() {
  const permissions = usePagePermission();
  const lookups = useGymLookups();
  const letter = useTransferLetter();
  const [text, setText] = useState("");
  const [search] = useDebounce(text, 400);
  const [filters, setFilters] = useState({ location: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const setFilter = (k) => (v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };
  const q = useHrQuery("/gym-asset/transfers", { ...filters, search, page, limit });
  const rows = q.data?.data || [];
  const [modal, setModal] = useState(null);
  const [saved, setSaved] = useState(null);
  const filtered = search || filters.location || filters.from || filters.to;

  return (
    <div className={pageCls}>
      <PageHeader
        title="Asset Transfers"
        subtitle="Move assets between locations and places. Every transfer gets a transfer order you can print or save as PDF."
        actions={permissions.canAdd && <Btn onClick={() => setModal({})}><FiRepeat /> New transfer</Btn>}
      />

      {saved && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <p className="text-xs font-bold text-brand-black dark:text-brand-white">
            <FiCheckCircle className="inline mr-1.5 text-emerald-500" />
            {saved.transferId}: {saved.quantity} {saved.unit} of {saved.assetName} moved to {saved.toLocation?.name} › {saved.toPlace?.name}.
          </p>
          <div className="flex gap-2">
            <Btn size="sm" variant="gold" onClick={() => letter.open(saved._id, "print")} loading={letter.busy === `${saved._id}:print`}><FiPrinter /> Print transfer order</Btn>
            <Btn size="sm" variant="ghost" onClick={() => letter.open(saved._id, "pdf")} loading={letter.busy === `${saved._id}:pdf`}><FiFileText /> PDF</Btn>
            <button type="button" onClick={() => setSaved(null)} title="Dismiss" aria-label="Dismiss" className="p-2 text-brand-dark-grey hover:text-brand-red cursor-pointer"><FiX /></button>
          </div>
        </div>
      )}

      <Card
        title="Transfer history"
        subtitle={q.data ? `${q.data.total.toLocaleString()} transfers` : undefined}
        actions={
          <>
            <SearchBox value={text} onChange={(v) => { setText(v); setPage(1); }} placeholder="Transfer no., asset code or name" className="sm:w-60" />
            <Select value={filters.location} onChange={setFilter("location")} options={lookups.locations.map((l) => ({ value: l._id, label: l.name }))} placeholder="All locations" className="sm:w-44" aria-label="Location" />
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
          <EmptyState icon={<FiAlertTriangle />} title="Couldn't load transfers" text={q.error} action={<Btn variant="ghost" size="sm" onClick={q.refetch}>Try again</Btn>} />
        ) : !rows.length ? (
          <EmptyState icon={<FiRepeat />} title={filtered ? "No transfers match" : "No transfers yet"} text={filtered ? "Try a different search, location or dates." : "When an asset moves to another location or place, record it here."} />
        ) : (
          <>
            <TransferList rows={rows} letter={letter} />
            <div className="p-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
              <Pagination currentPage={page} totalPages={q.data.totalPages} totalItems={q.data.total} itemsPerPage={limit} onPageChange={setPage} onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }} itemsPerPageOptions={[10, 20, 50, 100]} />
            </div>
          </>
        )}
      </Card>

      <AssetTransferModal
        state={modal}
        lookups={lookups}
        permissions={permissions}
        onClose={() => setModal(null)}
        onSaved={(t) => {
          setModal(null);
          setSaved(t);
          q.refetch();
        }}
      />
    </div>
  );
}
