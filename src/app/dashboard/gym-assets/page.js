"use client";

import { useState } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiArchive, FiBox, FiClock, FiEdit3, FiEye, FiPackage, FiPlus, FiRepeat, FiTool, FiTrash2 } from "react-icons/fi";
import usePagePermission from "@/hooks/usePagePermission";
import useUserPermissions from "@/hooks/useUserPermissions";
import useDebounce from "@/hooks/useDebounce";
import { money, useHrMutation, useHrQuery } from "@/hooks/useHr";
import { Btn, Card, EmptyState, Loading, PageHeader, pageCls, SearchBox, Select, StatCard, Table, Td } from "@/components/hr/HrUi";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { ConditionBadge, Refreshing, useGymLookups } from "@/components/hr/GymAssetUi";
import { CONDITIONS, whereText } from "@/components/hr/gymAssets";
import GymAssetFormModal from "@/components/hr/modals/GymAssetFormModal";
import AssetTransferModal from "@/components/hr/modals/AssetTransferModal";
import AssetMaintenanceModal from "@/components/hr/modals/AssetMaintenanceModal";
import AssetDisposalModal from "@/components/hr/modals/AssetDisposalModal";

const STATUS_OPTIONS = [
  { value: "active", label: "Active assets" },
  { value: "disposed", label: "Disposed (archived)" },
  { value: "all", label: "All" },
];

export default function AssetRegisterPage() {
  const permissions = usePagePermission();
  const { can } = useUserPermissions();
  const perm = (key) => ({ canView: can(key, "view"), canAdd: can(key, "add"), canEdit: can(key, "edit"), canDelete: can(key, "delete") });
  const transferPerm = perm("gym-asset-transfers");
  const maintenancePerm = perm("gym-asset-maintenance");
  const disposalPerm = perm("gym-asset-disposals");
  const lookups = useGymLookups();

  const [text, setText] = useState("");
  const [search] = useDebounce(text, 400);
  const [filters, setFilters] = useState({ location: "", place: "", category: "", condition: "", status: "active" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const setFilter = (key) => (value) => {
    setFilters((f) => ({ ...f, [key]: value, ...(key === "location" ? { place: "" } : {}) }));
    setPage(1);
  };
  const params = { ...filters, search, page, limit };
  const q = useHrQuery("/gym-asset/assets", params);
  const statsQ = useHrQuery("/gym-asset/assets/stats", { ...filters, search });
  const rows = q.data?.data || [];
  const stats = statsQ.data?.data;

  const [editing, setEditing] = useState(null);
  const [transfer, setTransfer] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [disposal, setDisposal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { run, busy } = useHrMutation();
  const refresh = () => {
    q.refetch();
    statsQ.refetch();
  };
  const done = (setter) => () => {
    setter(null);
    refresh();
  };

  const placeOptions = lookups.places.filter((p) => String(p.location) === filters.location).map((p) => ({ value: p._id, label: p.name }));
  const filtered = search || Object.entries(filters).some(([k, v]) => v && !(k === "status" && v === "active"));

  const actions = (a) => (
    <div className="flex items-center justify-end gap-1.5">
      <Link href={`/dashboard/gym-assets/${a._id}`} title="View details" aria-label="View details" className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey hover:border-brand-gold">
        <FiEye className="text-sm" />
      </Link>
      {a.status === "active" && permissions.canEdit && (
        <IconBtn title="Edit" onClick={() => setEditing(a)}>
          <FiEdit3 />
        </IconBtn>
      )}
      {a.status === "active" && transferPerm.canAdd && (
        <IconBtn title="Transfer" onClick={() => setTransfer({ asset: a })}>
          <FiRepeat />
        </IconBtn>
      )}
      {a.status === "active" && maintenancePerm.canAdd && (
        <IconBtn title="Log maintenance" onClick={() => setMaintenance({ asset: a })}>
          <FiTool />
        </IconBtn>
      )}
      {a.status === "active" && disposalPerm.canAdd && (
        <IconBtn title="Dispose" onClick={() => setDisposal({ asset: a })}>
          <FiArchive />
        </IconBtn>
      )}
      {permissions.canDelete && (
        <IconBtn title="Delete (only for entries made by mistake)" onClick={() => setDeleting(a)}>
          <FiTrash2 />
        </IconBtn>
      )}
    </div>
  );

  return (
    <div className={pageCls}>
      <PageHeader
        title="Asset Register"
        subtitle="Every machine, piece of furniture and device across the branches, warehouse and head office."
        actions={
          <>
            {transferPerm.canAdd && (
              <Btn variant="ghost" onClick={() => setTransfer({})}>
                <FiRepeat /> Transfer
              </Btn>
            )}
            {permissions.canAdd && (
              <Btn onClick={() => setEditing({})}>
                <FiPlus /> Add asset
              </Btn>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard index={0} icon={<FiBox />} label="Assets" value={stats ? stats.lines.toLocaleString() : "—"} hint={stats ? `${stats.units.toLocaleString()} unit${stats.units === 1 ? "" : "s"}` : " "} />
        <StatCard index={1} icon={<FiPackage />} tone="blue" label="Purchase value" value={stats ? money(stats.purchaseValue) : "—"} hint={stats ? `Now worth ${money(stats.currentValue)}` : " "} />
        <StatCard
          index={2}
          icon={<FiTool />}
          tone="purple"
          label="Under maintenance"
          value={stats ? stats.underMaintenance : "—"}
          hint={stats?.damaged ? `${stats.damaged} damaged / not working` : "None damaged"}
          onClick={() => setFilter("condition")(filters.condition === "under_maintenance" ? "" : "under_maintenance")}
          active={filters.condition === "under_maintenance"}
        />
        <StatCard index={3} icon={<FiClock />} tone={stats?.warrantySoon ? "amber" : "slate"} label="Warranty ending" value={stats ? stats.warrantySoon : "—"} hint="In the next 30 days" />
      </div>

      <Card
        title="Assets"
        subtitle={q.data ? `${q.data.total.toLocaleString()} found` : undefined}
        actions={
          <>
            <SearchBox value={text} onChange={(v) => { setText(v); setPage(1); }} placeholder="Code, name, serial, brand…" className="sm:w-60" />
            <Select value={filters.status} onChange={setFilter("status")} options={STATUS_OPTIONS} className="sm:w-44" aria-label="Status" />
          </>
        }
        bodyClassName="p-0"
      >
        <div className="p-4 sm:px-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 border-b border-brand-beige/40 dark:border-brand-dark-grey/40">
          <Select value={filters.location} onChange={setFilter("location")} options={lookups.locations.map((l) => ({ value: l._id, label: l.name }))} placeholder="All locations" aria-label="Location" />
          <Select value={filters.place} onChange={setFilter("place")} options={placeOptions} placeholder={filters.location ? "All places" : "Pick a location for places"} disabled={!filters.location} aria-label="Place" />
          <Select value={filters.category} onChange={setFilter("category")} options={lookups.categories.map((c) => ({ value: c._id, label: c.name }))} placeholder="All categories" aria-label="Category" />
          <Select value={filters.condition} onChange={setFilter("condition")} options={CONDITIONS} placeholder="Any condition" aria-label="Condition" />
        </div>
        <Refreshing show={q.loading && !!q.data} />

        {q.loading && !q.data ? (
          <div className="p-5"><Loading rows={6} /></div>
        ) : q.error && !q.data ? (
          <EmptyState icon={<FiAlertTriangle />} title="Couldn't load assets" text={q.error} action={<Btn variant="ghost" size="sm" onClick={refresh}>Try again</Btn>} />
        ) : !rows.length ? (
          <EmptyState
            icon={<FiBox />}
            title={filtered ? "No assets match" : "No assets yet"}
            text={filtered ? "Try a different search or filter." : "Add your first asset. Set up locations, places and categories first so the form has options."}
            action={!filtered && permissions.canAdd && <Btn onClick={() => setEditing({})}><FiPlus /> Add asset</Btn>}
          />
        ) : (
          <>
            {/* Laptop and desktop: table */}
            <div className="hidden md:block">
              <Table head={["Asset", "Category", "Location", { label: "Qty", className: "text-right" }, "Condition", { label: "Value", className: "text-right" }, { label: "", className: "text-right" }]}>
                {rows.map((a) => (
                  <tr key={a._id}>
                    <Td>
                      <Link href={`/dashboard/gym-assets/${a._id}`} className="flex items-center gap-3 group">
                        <Thumb asset={a} />
                        <span className="min-w-0">
                          <span className="block font-black group-hover:text-brand-red truncate max-w-[16rem]">{a.name}</span>
                          <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">
                            {a.assetCode}
                            {a.brand ? ` · ${a.brand}` : ""}
                          </span>
                        </span>
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap">{a.category?.name || "—"}</Td>
                    <Td>
                      <span className="block whitespace-nowrap">{a.location?.name || "—"}</span>
                      <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">{a.place?.name}</span>
                    </Td>
                    <Td className="text-right tabular-nums whitespace-nowrap">
                      {a.quantity} <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70">{a.unit}</span>
                    </Td>
                    <Td>
                      <ConditionBadge value={a.condition} />
                    </Td>
                    <Td className="text-right tabular-nums whitespace-nowrap">
                      {money(a.purchaseValue)}
                      {a.currentValue !== a.purchaseValue && <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">now {money(a.currentValue)}</span>}
                    </Td>
                    <Td className="text-right">{actions(a)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
            {/* Phones and tablets: cards */}
            <ul className="md:hidden divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40">
              {rows.map((a) => (
                <li key={a._id} className="p-4 space-y-2">
                  <Link href={`/dashboard/gym-assets/${a._id}`} className="flex items-start gap-3">
                    <Thumb asset={a} size="w-14 h-14" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-black text-brand-black dark:text-brand-white">{a.name}</span>
                        <ConditionBadge value={a.condition} />
                      </span>
                      <span className="block text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">
                        {a.assetCode} · {a.category?.name}
                      </span>
                      <span className="block text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">{whereText(a.location, a.place)}</span>
                      <span className="block text-xs font-black text-brand-black dark:text-brand-white mt-0.5">
                        {a.quantity} {a.unit} · {money(a.purchaseValue)}
                      </span>
                    </span>
                  </Link>
                  {actions(a)}
                </li>
              ))}
            </ul>
            <div className="p-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
              <Pagination currentPage={page} totalPages={q.data?.totalPages || 1} totalItems={q.data?.total} itemsPerPage={limit} onPageChange={setPage} onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }} itemsPerPageOptions={[10, 20, 50, 100]} />
            </div>
          </>
        )}
      </Card>

      <GymAssetFormModal asset={editing} lookups={lookups} permissions={permissions} onClose={() => setEditing(null)} onSaved={done(setEditing)} />
      <AssetTransferModal state={transfer} lookups={lookups} permissions={transferPerm} onClose={() => setTransfer(null)} onSaved={done(setTransfer)} />
      <AssetMaintenanceModal state={maintenance} permissions={maintenancePerm} onClose={() => setMaintenance(null)} onSaved={done(setMaintenance)} />
      <AssetDisposalModal state={disposal} permissions={disposalPerm} onClose={() => setDisposal(null)} onSaved={done(setDisposal)} />
      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => !busy && setDeleting(null)}
        onConfirm={async () => {
          const res = await run("delete", `/gym-asset/assets/${deleting._id}`);
          if (res) done(setDeleting)();
        }}
        itemName={deleting ? `${deleting.assetCode} · ${deleting.name}` : ""}
        isDeleting={busy}
      />
    </div>
  );
}

function IconBtn({ title, onClick, children }) {
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title} className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey hover:border-brand-gold text-sm cursor-pointer">
      {children}
    </button>
  );
}

function Thumb({ asset, size = "w-10 h-10" }) {
  const img = asset.images?.[0]?.url;
  return (
    <span className={`${size} shrink-0 rounded-xl overflow-hidden bg-brand-gold/10 text-brand-gold flex items-center justify-center`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {img ? <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" /> : <FiPackage />}
    </span>
  );
}
