"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiAlertTriangle, FiArchive, FiEdit3, FiMapPin, FiPackage, FiPlus, FiTrash2 } from "react-icons/fi";
import { MdWarehouse } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrLookups, useHrMutation, useHrQuery } from "@/hooks/useHr";
import { Avatar, Badge, Btn, Card, EmptyState, Loading, PageHeader, pageCls, SearchBox, Select, StatCard } from "@/components/hr/HrUi";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import AssetLocationModal from "@/components/hr/modals/AssetLocationModal";
import LocationStockModal from "@/components/hr/modals/LocationStockModal";

const num = (n) => Number(n || 0).toLocaleString();
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All statuses" },
];

export default function AssetLocationsPage() {
  const router = useRouter();
  const permissions = usePagePermission();
  const { branches, staff } = useHrLookups();
  const q = useHrQuery("/asset-location");
  const locations = useMemo(() => q.data?.data || [], [q.data]);
  const unplaced = q.data?.unplaced || { items: 0, units: 0 };
  const { run, busy } = useHrMutation();

  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("active");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return locations.filter(
      (l) =>
        (status === "all" || l.status === status) &&
        (branch === "all" || (branch === "none" ? !l.branch : l.branch === branch)) &&
        (!s || `${l.name} ${l.branch} ${l.details} ${l.inCharge?.name || ""}`.toLowerCase().includes(s)),
    );
  }, [locations, search, branch, status]);

  const totals = useMemo(
    () => locations.reduce((t, l) => ({ items: t.items + l.stock.items, inStore: t.inStore + l.stock.inStore, issued: t.issued + l.stock.issued }), { items: 0, inStore: 0, issued: 0 }),
    [locations],
  );
  const active = locations.filter((l) => l.status === "active").length;
  const branchOptions = useMemo(() => {
    const names = [...new Set([...branches, ...locations.map((l) => l.branch).filter(Boolean)])];
    return [{ value: "all", label: "All branches" }, ...names.map((b) => ({ value: b, label: b })), { value: "none", label: "Central (no branch)" }];
  }, [branches, locations]);

  const remove = async () => {
    const res = await run("delete", `/asset-location/${deleting._id}`);
    if (res) {
      setDeleting(null);
      q.refetch();
    }
  };

  return (
    <div className={pageCls}>
      <PageHeader
        title="Asset Locations"
        subtitle="Store rooms and other places where stock is kept. Pick one when you add an asset, so anyone can find it."
        actions={
          permissions.canAdd && (
            <Btn onClick={() => setEditing({})}>
              <FiPlus /> Add location
            </Btn>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard index={0} icon={<MdWarehouse />} label="Store locations" value={num(active)} hint={locations.length > active ? `${locations.length - active} inactive` : "In use"} />
        <StatCard index={1} icon={<FiPackage />} tone="blue" label="Items placed" value={num(totals.items)} hint="Items with a location" />
        <StatCard index={2} icon={<FiArchive />} tone="green" label="Units in store" value={num(totals.inStore)} hint={`${num(totals.issued)} issued to staff`} />
        <StatCard
          index={3}
          icon={<FiAlertTriangle />}
          tone={unplaced.items ? "red" : "slate"}
          label="No location set"
          value={num(unplaced.items)}
          hint={unplaced.items ? "Click to see and fix them" : "Every item has a place"}
          onClick={unplaced.items ? () => router.push("/dashboard/assets?location=none") : undefined}
        />
      </div>

      <Card
        title="Locations"
        subtitle={q.data ? `${shown.length} of ${locations.length}` : undefined}
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Search name, place, person…" className="sm:w-56" />
            <Select value={branch} onChange={setBranch} options={branchOptions} className="sm:w-44" aria-label="Branch" />
            <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} className="sm:w-36" aria-label="Status" />
          </>
        }
        bodyClassName="p-4 sm:p-5"
      >
        {q.loading && !q.data ? (
          <Loading rows={4} />
        ) : q.error && !q.data ? (
          <EmptyState title="Couldn't load locations" text={q.error} action={<Btn variant="ghost" size="sm" onClick={q.refetch}>Try again</Btn>} />
        ) : !locations.length ? (
          <EmptyState
            icon={<MdWarehouse />}
            title="No store locations yet"
            text="Add the places where you keep stock, such as a store room or a reception cupboard. Then pick one when you add an asset."
            action={permissions.canAdd && <Btn onClick={() => setEditing({})}><FiPlus /> Add first location</Btn>}
          />
        ) : !shown.length ? (
          <EmptyState title="No locations match" text="Try a different search, branch or status." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {shown.map((loc) => (
              <LocationCard key={loc._id} loc={loc} permissions={permissions} onView={() => setViewing(loc)} onEdit={() => setEditing(loc)} onDelete={() => setDeleting(loc)} />
            ))}
          </div>
        )}
      </Card>

      <AssetLocationModal
        location={editing}
        branches={branches}
        staff={staff}
        permissions={permissions}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          q.refetch();
        }}
      />
      <LocationStockModal location={viewing} onClose={() => setViewing(null)} />
      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => !busy && setDeleting(null)} onConfirm={remove} itemName={deleting?.name || "Location"} isDeleting={busy} />
    </div>
  );
}

function LocationCard({ loc, permissions, onView, onEdit, onDelete }) {
  const s = loc.stock;
  return (
    <article className={`rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/40 dark:bg-brand-midnight/40 p-4 flex flex-col gap-3 ${loc.status === "inactive" ? "opacity-75" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-lg shrink-0">
          <MdWarehouse />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-brand-black dark:text-brand-white break-words">{loc.name}</h3>
            {loc.status === "inactive" && <Badge tone="slate">Inactive</Badge>}
          </div>
          <p className="text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light">{loc.branch || "Central store, no branch"}</p>
        </div>
      </div>

      {loc.details && (
        <p className="flex items-start gap-1.5 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">
          <FiMapPin className="mt-0.5 shrink-0 text-brand-gold" />
          {loc.details}
        </p>
      )}

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Items", s.items],
          ["In store", s.inStore],
          ["Issued", s.issued],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/40 dark:border-brand-dark-grey/40 py-2">
            <dt className="text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light/70">{label}</dt>
            <dd className="text-base font-black tabular-nums text-brand-black dark:text-brand-white">{num(value)}</dd>
          </div>
        ))}
      </dl>

      {s.lowStock > 0 && (
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
          <FiAlertTriangle /> {s.lowStock} item{s.lowStock > 1 ? "s" : ""} running low
        </p>
      )}

      <div className="flex items-center gap-2 text-[11px] font-bold min-w-0">
        {loc.inCharge ? (
          <>
            <Avatar name={loc.inCharge.name} photo={loc.inCharge.photo} size={24} />
            <span className="min-w-0 truncate text-brand-black dark:text-brand-white">
              <span className="font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">In charge: </span>
              {loc.inCharge.name}
              {loc.inCharge.mobileNumber && <span className="font-semibold text-brand-dark-grey dark:text-brand-gold-light/80"> · {loc.inCharge.mobileNumber}</span>}
            </span>
          </>
        ) : (
          <span className="text-brand-dark-grey/80 dark:text-brand-gold-light/60">Nobody in charge yet</span>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center gap-2">
        <Btn variant="ghost" size="sm" onClick={onView} className="flex-1">
          <FiPackage /> See what&apos;s stored
        </Btn>
        {permissions.canEdit && (
          <Btn variant="ghost" size="sm" onClick={onEdit} title="Edit location" aria-label="Edit location">
            <FiEdit3 />
          </Btn>
        )}
        {permissions.canDelete && (
          <Btn variant="ghost" size="sm" onClick={onDelete} disabled={s.items > 0} title={s.items ? "Move its items to another location first" : "Delete location"} aria-label="Delete location">
            <FiTrash2 />
          </Btn>
        )}
      </div>
    </article>
  );
}
