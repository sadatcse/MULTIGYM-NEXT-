"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiBox, FiEdit3, FiGrid, FiMapPin, FiPhone, FiPlus, FiTrash2, FiUser } from "react-icons/fi";
import { MdWarehouse } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { money, useHrMutation, useHrQuery } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Loading, PageHeader, pageCls, SearchBox, Select, StatCard } from "@/components/hr/HrUi";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import GymLocationModal from "@/components/hr/modals/GymLocationModal";
import AssetPlaceModal from "@/components/hr/modals/AssetPlaceModal";
import { Refreshing } from "@/components/hr/GymAssetUi";
import { labelOf, LOCATION_TYPES } from "@/components/hr/gymAssets";

const num = (n) => Number(n || 0).toLocaleString();
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All statuses" },
];

// Gym asset locations and the places inside them.
export default function GymLocationsPage() {
  const router = useRouter();
  const permissions = usePagePermission();
  const q = useHrQuery("/gym-asset/locations");
  const placesQ = useHrQuery("/gym-asset/places");
  const locations = useMemo(() => q.data?.data || [], [q.data]);
  const places = useMemo(() => placesQ.data?.data || [], [placesQ.data]);
  const { run, busy } = useHrMutation();

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("active");
  const [editing, setEditing] = useState(null);
  const [placeEditing, setPlaceEditing] = useState(null);
  const [deleting, setDeleting] = useState(null); // { kind: 'location' | 'place', row }

  const placesBy = useMemo(() => {
    const m = new Map();
    for (const p of places) m.set(String(p.location), [...(m.get(String(p.location)) || []), p]);
    return m;
  }, [places]);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return locations.filter(
      (l) =>
        (status === "all" || l.status === status) &&
        (!type || l.type === type) &&
        (!s || `${l.name} ${l.address} ${l.contactPerson} ${(placesBy.get(String(l._id)) || []).map((p) => p.name).join(" ")}`.toLowerCase().includes(s)),
    );
  }, [locations, search, type, status, placesBy]);

  const totals = useMemo(() => locations.reduce((t, l) => ({ assets: t.assets + l.assets.lines, units: t.units + l.assets.units, value: t.value + l.assets.value }), { assets: 0, units: 0, value: 0 }), [locations]);
  const active = locations.filter((l) => l.status === "active").length;
  const refetchAll = () => {
    q.refetch();
    placesQ.refetch();
  };

  const remove = async () => {
    const url = deleting.kind === "place" ? `/gym-asset/places/${deleting.row._id}` : `/gym-asset/locations/${deleting.row._id}`;
    const res = await run("delete", url);
    if (res) {
      setDeleting(null);
      refetchAll();
    }
  };

  return (
    <div className={pageCls}>
      <PageHeader
        title="Locations & Places"
        subtitle="Gym branches, the warehouse and head office, and the places inside each one. Every asset is recorded at a place."
        actions={permissions.canAdd && <Btn onClick={() => setEditing({})}><FiPlus /> Add location</Btn>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard index={0} icon={<MdWarehouse />} label="Locations" value={num(active)} hint={locations.length > active ? `${locations.length - active} inactive` : "All active"} />
        <StatCard index={1} icon={<FiGrid />} tone="cyan" label="Places" value={num(places.length)} hint="Rooms and areas inside locations" />
        <StatCard index={2} icon={<FiBox />} tone="blue" label="Assets" value={num(totals.assets)} hint={`${num(totals.units)} units, bought for ${money(totals.value)}`} onClick={() => router.push("/dashboard/gym-assets")} />
      </div>

      <Card
        title="Locations"
        subtitle={q.data ? `${shown.length} of ${locations.length}` : undefined}
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Name, address, contact, place…" className="sm:w-56" />
            <Select value={type} onChange={setType} options={LOCATION_TYPES} placeholder="All types" className="sm:w-40" aria-label="Type" />
            <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} className="sm:w-36" aria-label="Status" />
          </>
        }
        bodyClassName="p-4 sm:p-5"
      >
        <Refreshing show={(q.loading && !!q.data) || (placesQ.loading && !!placesQ.data)} />
        {q.loading && !q.data ? (
          <Loading rows={4} />
        ) : q.error && !q.data ? (
          <EmptyState title="Couldn't load locations" text={q.error} action={<Btn variant="ghost" size="sm" onClick={refetchAll}>Try again</Btn>} />
        ) : !locations.length ? (
          <EmptyState
            icon={<MdWarehouse />}
            title="No locations yet"
            text="Add your gym branches, the main warehouse and head office. Then add the places inside each, such as Main Gym Floor or Store Room."
            action={permissions.canAdd && <Btn onClick={() => setEditing({})}><FiPlus /> Add first location</Btn>}
          />
        ) : !shown.length ? (
          <EmptyState title="No locations match" text="Try a different search, type or status." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {shown.map((loc) => (
              <LocationCard
                key={loc._id}
                loc={loc}
                places={placesBy.get(String(loc._id)) || []}
                permissions={permissions}
                onEdit={() => setEditing(loc)}
                onDelete={() => setDeleting({ kind: "location", row: loc })}
                onAddPlace={() => setPlaceEditing({ location: loc._id })}
                onEditPlace={(p) => setPlaceEditing(p)}
                onDeletePlace={(p) => setDeleting({ kind: "place", row: p })}
              />
            ))}
          </div>
        )}
      </Card>

      <GymLocationModal location={editing} permissions={permissions} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetchAll(); }} />
      <AssetPlaceModal place={placeEditing} locations={locations.filter((l) => l.status === "active" || l._id === String(placeEditing?.location))} permissions={permissions} onClose={() => setPlaceEditing(null)} onSaved={() => { setPlaceEditing(null); refetchAll(); }} />
      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => !busy && setDeleting(null)} onConfirm={remove} itemName={deleting?.row?.name || ""} isDeleting={busy} />
    </div>
  );
}

function LocationCard({ loc, places, permissions, onEdit, onDelete, onAddPlace, onEditPlace, onDeletePlace }) {
  const deletable = !places.length && !loc.assets.lines;
  return (
    <article className={`rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/40 dark:bg-brand-midnight/40 p-4 flex flex-col gap-3 ${loc.status === "inactive" ? "opacity-75" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-lg shrink-0">
          <MdWarehouse />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-brand-black dark:text-brand-white break-words">{loc.name}</h3>
            <Badge tone="gold">{labelOf(LOCATION_TYPES, loc.type)}</Badge>
            {loc.status === "inactive" && <Badge tone="slate">Inactive</Badge>}
          </div>
        </div>
      </div>

      <div className="space-y-1 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">
        {loc.address && <p className="flex items-start gap-1.5"><FiMapPin className="mt-0.5 shrink-0 text-brand-gold" />{loc.address}</p>}
        {loc.contactPerson && <p className="flex items-center gap-1.5"><FiUser className="shrink-0 text-brand-gold" />{loc.contactPerson}</p>}
        {loc.contactNumber && (
          <p className="flex items-center gap-1.5">
            <FiPhone className="shrink-0 text-brand-gold" />
            <a href={`tel:${loc.contactNumber.replace(/\s/g, "")}`} className="hover:underline">{loc.contactNumber}</a>
          </p>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Places", places.length],
          ["Assets", loc.assets.lines],
          ["Units", loc.assets.units],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/40 dark:border-brand-dark-grey/40 py-2">
            <dt className="text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light/70">{label}</dt>
            <dd className="text-base font-black tabular-nums text-brand-black dark:text-brand-white">{num(value)}</dd>
          </div>
        ))}
      </dl>
      {loc.assets.lines > 0 && <p className="text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light/80">Bought for {money(loc.assets.value)}</p>}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">Places</span>
          {permissions.canAdd && loc.status === "active" && (
            <button type="button" onClick={onAddPlace} className="text-[11px] font-black text-brand-gold hover:underline cursor-pointer">
              + Add place
            </button>
          )}
        </div>
        {places.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {places.map((p) => (
              <li key={p._id} className={`inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-xl border text-[11px] font-bold ${p.status === "active" ? "border-brand-beige/60 dark:border-brand-dark-grey bg-brand-white dark:bg-brand-charcoal" : "border-dashed border-brand-beige dark:border-brand-dark-grey opacity-70"}`}>
                <span className="text-brand-black dark:text-brand-white">{p.name}</span>
                <span className="text-brand-dark-grey dark:text-brand-gold-light/70 tabular-nums" title="Active assets here">{p.assets?.active || 0}</span>
                {permissions.canEdit && (
                  <button type="button" onClick={() => onEditPlace(p)} title={`Edit ${p.name}`} aria-label={`Edit ${p.name}`} className="p-1 rounded-lg hover:text-brand-gold cursor-pointer">
                    <FiEdit3 className="text-[11px]" />
                  </button>
                )}
                {permissions.canDelete && (
                  <button
                    type="button"
                    onClick={() => onDeletePlace(p)}
                    disabled={!!(p.assets?.active || p.assets?.disposed)}
                    title={p.assets?.active || p.assets?.disposed ? "Has assets; transfer them or mark the place inactive" : `Delete ${p.name}`}
                    aria-label={`Delete ${p.name}`}
                    className="p-1 rounded-lg hover:text-brand-red cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiTrash2 className="text-[11px]" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] font-semibold text-brand-dark-grey/80 dark:text-brand-gold-light/60">No places yet. Assets need a place inside the location.</p>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-2">
        {permissions.canEdit && (
          <Btn variant="ghost" size="sm" onClick={onEdit}>
            <FiEdit3 /> Edit
          </Btn>
        )}
        {permissions.canDelete && (
          <Btn variant="ghost" size="sm" onClick={onDelete} disabled={!deletable} title={deletable ? "Delete location" : "Has places or assets; mark it inactive instead"} aria-label="Delete location">
            <FiTrash2 />
          </Btn>
        )}
      </div>
    </article>
  );
}
