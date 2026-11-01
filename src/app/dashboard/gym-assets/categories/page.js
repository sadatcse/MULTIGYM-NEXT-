"use client";

import { useMemo, useState } from "react";
import { FiAlertTriangle, FiEdit3, FiPlus, FiTag, FiTrash2 } from "react-icons/fi";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrMutation, useHrQuery } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Loading, PageHeader, pageCls, SearchBox, Select, Table, Td } from "@/components/hr/HrUi";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { Refreshing } from "@/components/hr/GymAssetUi";
import AssetCategoryModal from "@/components/hr/modals/AssetCategoryModal";

const STATUS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function AssetCategoriesPage() {
  const permissions = usePagePermission();
  const q = useHrQuery("/gym-asset/categories");
  const all = useMemo(() => q.data?.data || [], [q.data]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { run, busy } = useHrMutation();
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return all.filter((c) => (status === "all" || c.status === status) && (!s || `${c.name} ${c.description}`.toLowerCase().includes(s)));
  }, [all, search, status]);

  const used = (c) => c.assets.active + c.assets.disposed;
  const rowActions = (c) => (
    <div className="flex justify-end gap-1.5">
      {permissions.canEdit && (
        <button type="button" onClick={() => setEditing(c)} title="Edit" aria-label={`Edit ${c.name}`} className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey hover:border-brand-gold cursor-pointer">
          <FiEdit3 />
        </button>
      )}
      {permissions.canDelete && (
        <button type="button" onClick={() => setDeleting(c)} disabled={used(c) > 0} title={used(c) ? "In use; mark it inactive instead" : "Delete"} aria-label={`Delete ${c.name}`} className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey hover:border-brand-red cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          <FiTrash2 />
        </button>
      )}
    </div>
  );

  return (
    <div className={pageCls}>
      <PageHeader title="Asset Categories" subtitle="Group assets for the register and reports. New categories appear in the asset form straight away." actions={permissions.canAdd && <Btn onClick={() => setEditing({})}><FiPlus /> Add category</Btn>} />

      <Card
        title="Categories"
        subtitle={q.data ? `${rows.length} of ${all.length}` : undefined}
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Search categories" className="sm:w-56" />
            <Select value={status} onChange={setStatus} options={STATUS} className="sm:w-36" aria-label="Status" />
          </>
        }
        bodyClassName="p-0"
      >
        <Refreshing show={q.loading && !!q.data} />
        {q.loading && !q.data ? (
          <div className="p-5"><Loading rows={5} /></div>
        ) : q.error && !q.data ? (
          <EmptyState icon={<FiAlertTriangle />} title="Couldn't load categories" text={q.error} action={<Btn variant="ghost" size="sm" onClick={q.refetch}>Try again</Btn>} />
        ) : !all.length ? (
          <EmptyState icon={<FiTag />} title="No categories yet" text="Add categories such as Gym Equipment, Furniture, Electronics or CCTV & Security." action={permissions.canAdd && <Btn onClick={() => setEditing({})}><FiPlus /> Add category</Btn>} />
        ) : !rows.length ? (
          <EmptyState title="No categories match" text="Try a different search or status." />
        ) : (
          <>
            <div className="hidden md:block">
              <Table head={["Category", "Examples", { label: "Depreciation", className: "text-right" }, { label: "Assets", className: "text-right" }, "Status", { label: "", className: "text-right" }]}>
                {rows.map((c) => (
                  <tr key={c._id}>
                    <Td className="font-black">{c.name}</Td>
                    <Td className="text-brand-dark-grey dark:text-brand-gold-light/80 font-semibold">{c.description || "—"}</Td>
                    <Td className="text-right tabular-nums">{c.depreciationRate ? `${c.depreciationRate}% / yr` : "None"}</Td>
                    <Td className="text-right tabular-nums">
                      {c.assets.active}
                      {c.assets.disposed ? <span className="block text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70">+{c.assets.disposed} disposed</span> : null}
                    </Td>
                    <Td><Badge status={c.status} /></Td>
                    <Td>{rowActions(c)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
            <ul className="md:hidden divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40">
              {rows.map((c) => (
                <li key={c._id} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-brand-black dark:text-brand-white">{c.name}</span>
                      <Badge status={c.status} />
                    </div>
                    {c.description && <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">{c.description}</p>}
                    <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">
                      {c.assets.active} assets · {c.depreciationRate ? `${c.depreciationRate}% a year` : "no depreciation"}
                    </p>
                  </div>
                  {rowActions(c)}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <AssetCategoryModal category={editing} permissions={permissions} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); q.refetch(); }} />
      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => !busy && setDeleting(null)}
        onConfirm={async () => {
          const res = await run("delete", `/gym-asset/categories/${deleting._id}`);
          if (res) {
            setDeleting(null);
            q.refetch();
          }
        }}
        itemName={deleting?.name || ""}
        isDeleting={busy}
      />
    </div>
  );
}
