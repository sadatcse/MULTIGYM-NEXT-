"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiAlertTriangle, FiArchive, FiArrowLeft, FiEdit3, FiPackage, FiRepeat, FiTool } from "react-icons/fi";
import useUserPermissions from "@/hooks/useUserPermissions";
import { fmtDate, fmtDateTime, money, useHrQuery } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Loading, pageCls, Tabs, Timeline } from "@/components/hr/HrUi";
import { ConditionBadge, Refreshing, useGymLookups, useTransferLetter } from "@/components/hr/GymAssetUi";
import { DisposalList, MaintenanceList, TransferList } from "@/components/hr/GymAssetTables";
import { DISPOSAL_TYPES, labelOf, LOCATION_TYPES, MAINT_STATUS } from "@/components/hr/gymAssets";
import GymAssetFormModal from "@/components/hr/modals/GymAssetFormModal";
import AssetTransferModal from "@/components/hr/modals/AssetTransferModal";
import AssetMaintenanceModal from "@/components/hr/modals/AssetMaintenanceModal";
import AssetDisposalModal from "@/components/hr/modals/AssetDisposalModal";

const EVENT_DOT = {
  created: "bg-blue-500",
  transferred: "bg-cyan-500",
  split: "bg-cyan-500",
  location_changed: "bg-cyan-500",
  place_changed: "bg-cyan-500",
  maintenance_logged: "bg-amber-500",
  maintenance_started: "bg-purple-500",
  maintenance_completed: "bg-emerald-500",
  maintenance_cancelled: "bg-zinc-400",
  condition_changed: "bg-amber-500",
  disposed: "bg-red-500",
  deleted: "bg-red-500",
};

export default function AssetDetailPage() {
  const { id } = useParams();
  const { can } = useUserPermissions();
  const perm = (key) => ({ canView: can(key, "view"), canAdd: can(key, "add"), canEdit: can(key, "edit"), canDelete: can(key, "delete") });
  const registerPerm = perm("gym-assets");
  const transferPerm = perm("gym-asset-transfers");
  const maintenancePerm = perm("gym-asset-maintenance");
  const disposalPerm = perm("gym-asset-disposals");
  const q = useHrQuery(`/gym-asset/assets/${id}`);
  const a = q.data?.data;
  const lookups = useGymLookups();
  const [tab, setTab] = useState("history");
  const [editing, setEditing] = useState(null);
  const [transfer, setTransfer] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [disposal, setDisposal] = useState(null);
  const [version, setVersion] = useState(0); // bumps the tab lists after a change
  const refresh = () => {
    q.refetch();
    setVersion((v) => v + 1);
  };
  const done = (setter) => () => {
    setter(null);
    refresh();
  };

  if (q.loading && !a) return <div className={pageCls}><Loading rows={8} /></div>;
  if (q.error && !a) {
    return (
      <div className={pageCls}>
        <EmptyState icon={<FiAlertTriangle />} title="Couldn't load this asset" text={q.error} action={<Link href="/dashboard/gym-assets" className="text-xs font-black text-brand-gold">Back to the register</Link>} />
      </div>
    );
  }
  const active = a.status === "active";
  const pickerAsset = { ...a, location: a.location, place: a.place };

  return (
    <div className={pageCls}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-brand-beige/50 dark:border-brand-dark-grey/50">
        <div className="flex items-start gap-3 min-w-0">
          <Link href="/dashboard/gym-assets" title="Back to the register" aria-label="Back to the register" className="p-2.5 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 hover:border-brand-gold shrink-0">
            <FiArrowLeft />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-brand-black dark:text-brand-white break-words">{a.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light">
              <span>{a.assetCode}</span>
              <span>·</span>
              <span>{a.category?.name}</span>
              {active ? <ConditionBadge value={a.condition} /> : <Badge tone="red">Disposed</Badge>}
            </div>
          </div>
        </div>
        {active && (
          <div className="flex flex-wrap gap-2 max-sm:*:flex-1">
            {registerPerm.canEdit && <Btn variant="ghost" size="sm" onClick={() => setEditing(a)}><FiEdit3 /> Edit</Btn>}
            {transferPerm.canAdd && <Btn variant="ghost" size="sm" onClick={() => setTransfer({ asset: pickerAsset })} disabled={!!a.openMaintenance} title={a.openMaintenance ? "Finish its maintenance first" : undefined}><FiRepeat /> Transfer</Btn>}
            {maintenancePerm.canAdd && !a.openMaintenance && <Btn variant="ghost" size="sm" onClick={() => setMaintenance({ asset: pickerAsset })}><FiTool /> Log maintenance</Btn>}
            {disposalPerm.canAdd && <Btn variant="danger" size="sm" onClick={() => setDisposal({ asset: pickerAsset })} disabled={!!a.openMaintenance} title={a.openMaintenance ? "Finish its maintenance first" : undefined}><FiArchive /> Dispose</Btn>}
          </div>
        )}
      </div>
      <Refreshing show={q.loading} />

      {a.openMaintenance && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5">
          <p className="text-xs font-bold text-brand-black dark:text-brand-white">
            <FiTool className="inline mr-1.5 text-purple-500" />
            {a.openMaintenance.maintenanceId} is {MAINT_STATUS[a.openMaintenance.status]?.label.toLowerCase()} since {fmtDate(a.openMaintenance.maintenanceDate)}: {a.openMaintenance.problem}
          </p>
          {maintenancePerm.canEdit && <Btn size="sm" variant="ghost" onClick={() => setMaintenance({ record: a.openMaintenance })}>Update maintenance</Btn>}
        </div>
      )}
      {a.disposal && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/5 text-xs font-bold text-brand-black dark:text-brand-white">
          <FiArchive className="inline mr-1.5 text-red-500" />
          Disposed on {fmtDate(a.disposal.disposalDate)} ({labelOf(DISPOSAL_TYPES, a.disposal.disposalType)}): {a.disposal.reason}. Approved by {a.disposal.approvedBy?.name}; {money(a.disposal.disposalValue)} received. {a.disposal.disposalId}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card title="Photos" bodyClassName="p-4">
          {a.images?.length ? (
            <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
              {a.images.map((img, i) => (
                <a key={img.url} href={img.url} target="_blank" rel="noreferrer" className={`block rounded-xl overflow-hidden border border-brand-beige/50 dark:border-brand-dark-grey ${i === 0 ? "col-span-3 lg:col-span-2 aspect-video" : "aspect-square"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={`${a.name} photo ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-brand-gold/10 text-brand-gold flex flex-col items-center justify-center gap-1 text-xs font-bold">
              <FiPackage className="text-2xl" /> No photos
            </div>
          )}
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard
            title="Asset"
            rows={[
              ["Quantity", `${a.quantity} ${a.unit}`],
              ["Brand", a.brand],
              ["Model", a.modelNumber],
              ["Serial number", a.serialNumber],
              ["Responsible person", a.responsiblePerson],
              ["Split from", a.splitFrom ? <Link key="s" href={`/dashboard/gym-assets/${a.splitFrom._id}`} className="text-brand-gold hover:underline">{a.splitFrom.assetCode}</Link> : ""],
            ]}
          />
          <InfoCard
            title="Purchase and value"
            rows={[
              ["Purchase date", a.purchaseDate ? fmtDate(a.purchaseDate) : ""],
              ["Price per unit", a.unitPrice ? money(a.unitPrice) : ""],
              ["Purchase value", money(a.purchaseValue)],
              ["Current value", `${money(a.currentValue)}${a.category?.depreciationRate ? ` (${a.category.depreciationRate}% a year)` : ""}`],
              ["Supplier", a.supplier],
              ["Warranty", warrantyText(a)],
            ]}
          />
          <InfoCard
            title="Location"
            rows={[
              ["Location", a.location ? `${a.location.name} (${labelOf(LOCATION_TYPES, a.location.type)})` : ""],
              ["Place", a.place?.name],
              ["Address", a.location?.address],
              ["Contact", [a.location?.contactPerson, a.location?.contactNumber].filter(Boolean).join(" · ")],
            ]}
          />
          <InfoCard
            title="Details"
            rows={[
              ["Specification", a.specification],
              ["Description", a.description],
              ["Notes", a.notes],
              ["Added", `${fmtDateTime(a.createdAt)}${a.createdBy?.name ? ` by ${a.createdBy.name}` : ""}`],
            ]}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "history", label: "History" },
            { value: "transfers", label: `Transfers (${a.counts?.transfers || 0})` },
            { value: "maintenance", label: `Maintenance (${a.counts?.maintenance || 0})` },
            ...(a.disposal ? [{ value: "disposal", label: "Disposal" }] : []),
          ]}
        />
        {tab === "history" && <HistoryTab id={id} version={version} />}
        {tab === "transfers" && <TransfersTab id={id} version={version} />}
        {tab === "maintenance" && <MaintenanceTab id={id} version={version} canEdit={maintenancePerm.canEdit} onOpen={(m) => setMaintenance({ record: m })} />}
        {tab === "disposal" && a.disposal && (
          <Card bodyClassName="p-0">
            <DisposalList rows={[a.disposal]} showAsset={false} canEdit={false} />
          </Card>
        )}
      </div>

      <GymAssetFormModal asset={editing} lookups={lookups} permissions={registerPerm} onClose={() => setEditing(null)} onSaved={done(setEditing)} />
      <AssetTransferModal state={transfer} lookups={lookups} permissions={transferPerm} onClose={() => setTransfer(null)} onSaved={done(setTransfer)} />
      <AssetMaintenanceModal state={maintenance} permissions={maintenancePerm} onClose={() => setMaintenance(null)} onSaved={done(setMaintenance)} />
      <AssetDisposalModal state={disposal} permissions={disposalPerm} onClose={() => setDisposal(null)} onSaved={done(setDisposal)} />
    </div>
  );
}

function warrantyText(a) {
  if (!a.warrantyExpiry) return a.warrantyMonths ? `${a.warrantyMonths} months` : "";
  const days = Math.round((new Date(a.warrantyExpiry) - new Date()) / 86400000);
  return `${fmtDate(a.warrantyExpiry)} (${days < 0 ? "expired" : `${days} days left`})`;
}

function InfoCard({ title, rows }) {
  const shown = rows.filter(([, v]) => v);
  return (
    <Card title={title} bodyClassName="p-4">
      {shown.length ? (
        <dl className="space-y-2 text-xs">
          {shown.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-2">
              <dt className="font-bold text-brand-dark-grey dark:text-brand-gold-light/80">{k}</dt>
              <dd className="font-bold text-brand-black dark:text-brand-white break-words whitespace-pre-line">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light/70">Nothing recorded.</p>
      )}
    </Card>
  );
}

function HistoryTab({ id, version }) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const q = useHrQuery(`/gym-asset/assets/${id}/history`, { page, limit: 30, version });
  useEffect(() => {
    const d = q.data;
    if (!d) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- appending a fetched page to the list
    setItems((prev) => (d.page === 1 ? d.data : [...prev, ...d.data.filter((x) => !prev.some((p) => p._id === x._id))]));
  }, [q.data]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a change reloads from the newest entry
    setPage(1);
  }, [version]);
  if (q.loading && !items.length) return <Loading rows={4} />;
  if (q.error && !items.length) return <EmptyState title="Couldn't load the history" text={q.error} />;
  return (
    <Card bodyClassName="p-5">
      <p className="mb-4 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">Every change is recorded here and can&apos;t be edited or deleted.</p>
      <Timeline
        items={items.map((h) => ({
          key: h._id,
          dot: EVENT_DOT[h.event],
          title: h.message,
          meta: `${fmtDateTime(h.at)}${h.by?.name ? ` · ${h.by.name}` : ""}${h.ref ? ` · ${h.ref}` : ""}`,
          body: h.event === "updated" && h.changes?.length ? h.changes.map((c) => `${c.field}: ${c.from || "—"} → ${c.to || "—"}`).join(" · ") : null,
        }))}
      />
      {q.data && page < q.data.totalPages && (
        <Btn variant="ghost" size="sm" className="mt-4 w-full" loading={q.loading} onClick={() => setPage((p) => p + 1)}>
          Show older entries
        </Btn>
      )}
    </Card>
  );
}

function TransfersTab({ id, version }) {
  const q = useHrQuery("/gym-asset/transfers", { asset: id, limit: 100, version });
  const letter = useTransferLetter();
  const rows = q.data?.data || [];
  if (q.loading && !q.data) return <Loading rows={3} />;
  if (q.error && !q.data) return <EmptyState title="Couldn't load transfers" text={q.error} />;
  return <Card bodyClassName="p-0">{rows.length ? <TransferList rows={rows} letter={letter} showAsset={false} /> : <EmptyState title="Never transferred" text="Transfers of this asset will show here with their transfer orders." />}</Card>;
}

function MaintenanceTab({ id, version, canEdit, onOpen }) {
  const q = useHrQuery("/gym-asset/maintenance", { asset: id, limit: 100, version });
  const rows = q.data?.data || [];
  if (q.loading && !q.data) return <Loading rows={3} />;
  if (q.error && !q.data) return <EmptyState title="Couldn't load maintenance" text={q.error} />;
  return <Card bodyClassName="p-0">{rows.length ? <MaintenanceList rows={rows} canEdit={canEdit} onOpen={onOpen} showAsset={false} /> : <EmptyState title="No maintenance yet" text="Repairs and servicing for this asset will show here." />}</Card>;
}
