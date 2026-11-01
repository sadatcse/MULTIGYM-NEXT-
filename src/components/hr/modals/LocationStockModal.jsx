"use client";

import { useContext, useMemo, useState } from "react";
import Link from "next/link";
import { FiExternalLink, FiPrinter } from "react-icons/fi";
import ModalShell from "@/components/modals/ModalShell";
import { AuthContext } from "@/providers/AuthProvider";
import { Btn, EmptyState, Loading, SearchBox, Table, Td } from "@/components/hr/HrUi";
import { useHrQuery } from "@/hooks/useHr";
import { printDocument, tableHtml, escapeHtml as esc } from "@/lib/hrPrint";

// Everything stored at one location, plus a printable stock list the store
// keeper can tick off during a stock count.
export default function LocationStockModal({ location, onClose }) {
  return (
    <ModalShell isOpen={!!location} onClose={onClose} size="xl" title={location ? `Stored at ${location.name}` : ""}>
      {location && <Body key={location._id} location={location} />}
    </ModalShell>
  );
}

/** "S 10 · M 12 · L 8": units in store per size, for items with sizes. */
const sizesText = (a) => (a.sizeVariants || []).map((v) => `${v.size || v.variantName} ${v.quantityAvailable ?? v.quantityTotal ?? 0}`).join(" · ");
const placeLine = (l) => [l.branch || "Central store", l.details].filter(Boolean).join(" · ");

function Body({ location }) {
  const { company } = useContext(AuthContext);
  const q = useHrQuery("/asset", { location: location._id, limit: 500, page: 1 });
  const items = useMemo(() => q.data?.data || [], [q.data]);
  const [search, setSearch] = useState("");

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter((a) => `${a.assetCode} ${a.description || ""} ${a.assetType?.name || ""} ${a.storageSpot || ""}`.toLowerCase().includes(s));
  }, [items, search]);
  const totals = shown.reduce((t, a) => ({ inStore: t.inStore + (a.quantityAvailable || 0), issued: t.issued + (a.quantityAssigned || 0), total: t.total + (a.quantityTotal || 0) }), { inStore: 0, issued: 0, total: 0 });

  const print = () => {
    const keeper = location.inCharge?.name ? ` · In charge: ${location.inCharge.name}${location.inCharge.mobileNumber ? ` (${location.inCharge.mobileNumber})` : ""}` : "";
    const rows = items.map((a) => [a.assetCode, [a.description, sizesText(a)].filter(Boolean).join(" — "), a.assetType?.name || "", a.storageSpot || "", a.quantityAvailable || 0, a.quantityAssigned || 0, a.quantityTotal || 0, ""]);
    const all = items.reduce((t, a) => [t[0] + (a.quantityAvailable || 0), t[1] + (a.quantityAssigned || 0), t[2] + (a.quantityTotal || 0)], [0, 0, 0]);
    printDocument({
      title: "Stock List",
      subtitle: `${location.name} — ${placeLine(location)}`,
      company,
      bodyHtml: `<p style="margin:0 0 8px">${esc(`${items.length} item${items.length === 1 ? "" : "s"}${keeper}`)}</p>${tableHtml(["Code", "Item", "Type", "Shelf / rack", "In store", "Issued", "Total", "Counted"], rows, { totals: ["", "Total", "", "", all[0], all[1], all[2], ""] })}`,
      landscape: true,
    });
  };

  return (
    <div className="p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs font-semibold text-brand-dark-grey dark:text-brand-gold-light">
          <p>{placeLine(location)}</p>
          {location.inCharge?.name && (
            <p className="mt-0.5">
              In charge: <span className="font-black text-brand-black dark:text-brand-white">{location.inCharge.name}</span>
              {location.inCharge.mobileNumber ? ` · ${location.inCharge.mobileNumber}` : ""}
            </p>
          )}
        </div>
        {items.length > 5 && <SearchBox value={search} onChange={setSearch} placeholder="Search items…" className="sm:w-56" />}
      </div>

      {q.loading && !q.data ? (
        <Loading rows={4} />
      ) : q.error && !q.data ? (
        <EmptyState title="Couldn't load the items" text={q.error} action={<Btn variant="ghost" size="sm" onClick={q.refetch}>Try again</Btn>} />
      ) : !items.length ? (
        <EmptyState title="Nothing is stored here yet" text="Pick this location when you add or edit an asset, and it will be listed here." />
      ) : (
        <>
        {/* Phones: one row per item with the in-store count up front. */}
        <ul className="sm:hidden divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs">
          {shown.map((a) => (
            <li key={a._id} className="p-3 space-y-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <Link href={`/dashboard/assets/${a._id}`} className="font-black text-brand-black dark:text-brand-white hover:text-brand-red truncate">
                  {a.assetCode}
                </Link>
                <span className={`shrink-0 font-black tabular-nums ${a.isLowStock ? "text-amber-600 dark:text-amber-400" : "text-brand-black dark:text-brand-white"}`}>{a.quantityAvailable || 0} in store</span>
              </div>
              {(a.description || a.sizeVariants?.length > 0) && (
                <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">{[a.description, sizesText(a)].filter(Boolean).join(" — ")}</p>
              )}
              <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">
                {[a.assetType?.name, a.storageSpot, `${a.quantityAssigned || 0} issued of ${a.quantityTotal || 0}`].filter(Boolean).join(" · ")}
              </p>
            </li>
          ))}
          <li className="p-3 flex justify-between font-black bg-brand-offwhite dark:bg-brand-midnight rounded-b-2xl">
            <span>Total ({shown.length})</span>
            <span className="tabular-nums">{totals.inStore} in store · {totals.issued} issued</span>
          </li>
        </ul>
        <div className="hidden sm:block rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 overflow-hidden max-h-[55vh] overflow-y-auto">
          <Table
            head={["Item", "Type", "Shelf / rack", { label: "In store", className: "text-right" }, { label: "Issued", className: "text-right" }, { label: "Total", className: "text-right" }]}
            footer={
              <tfoot className="bg-brand-offwhite dark:bg-brand-midnight text-xs font-black">
                <tr>
                  <Td colSpan={3}>Total ({shown.length} item{shown.length === 1 ? "" : "s"})</Td>
                  <Td className="text-right tabular-nums">{totals.inStore}</Td>
                  <Td className="text-right tabular-nums">{totals.issued}</Td>
                  <Td className="text-right tabular-nums">{totals.total}</Td>
                </tr>
              </tfoot>
            }
          >
            {shown.map((a) => (
              <tr key={a._id}>
                <Td>
                  <Link href={`/dashboard/assets/${a._id}`} className="hover:text-brand-red">
                    {a.assetCode}
                  </Link>
                  {(a.description || a.sizeVariants?.length > 0) && (
                    <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">{[a.description, sizesText(a)].filter(Boolean).join(" — ")}</span>
                  )}
                </Td>
                <Td className="whitespace-nowrap">{a.assetType?.name || "—"}</Td>
                <Td className="whitespace-nowrap">{a.storageSpot || <span className="text-brand-dark-grey/70">—</span>}</Td>
                <Td className={`text-right tabular-nums ${a.isLowStock ? "text-amber-600 dark:text-amber-400" : ""}`}>{a.quantityAvailable || 0}</Td>
                <Td className="text-right tabular-nums">{a.quantityAssigned || 0}</Td>
                <Td className="text-right tabular-nums">{a.quantityTotal || 0}</Td>
              </tr>
            ))}
          </Table>
        </div>
        </>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2">
        <Link href={`/dashboard/assets?location=${location._id}`} className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-[11px] rounded-xl font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey hover:border-brand-gold">
          <FiExternalLink /> Open in Asset Directory
        </Link>
        <Btn variant="gold" size="sm" onClick={print} disabled={!items.length}>
          <FiPrinter /> Print stock list
        </Btn>
      </div>
    </div>
  );
}
