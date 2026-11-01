"use client";

import Link from "next/link";
import { FiArrowRight, FiEdit3, FiFileText, FiPaperclip, FiPrinter } from "react-icons/fi";
import { Badge, Table, Td } from "@/components/hr/HrUi";
import { fmtDate, money } from "@/hooks/useHr";
import { DISPOSAL_TYPES, labelOf, MAINT_STATUS, MAINTENANCE_TYPES } from "./gymAssets";

// Lists shared by the Transfers / Maintenance / Disposals pages and the asset
// detail tabs. Table from md up, cards below.

const assetLink = (id, code, name, showAsset) =>
  showAsset ? (
    <Link href={`/dashboard/gym-assets/${id}`} className="hover:text-brand-red">
      <span className="block font-black">{name}</span>
      <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">{code}</span>
    </Link>
  ) : null;

const fromTo = (t) => (
  <span className="inline-flex flex-wrap items-center gap-1.5">
    <span>
      {t.fromLocation?.name} <span className="text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold">› {t.fromPlace?.name}</span>
    </span>
    <FiArrowRight className="text-brand-gold shrink-0" />
    <span>
      {t.toLocation?.name} <span className="text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold">› {t.toPlace?.name}</span>
    </span>
  </span>
);

function LetterButtons({ t, letter }) {
  return (
    <span className="inline-flex gap-1.5">
      <button type="button" onClick={() => letter.open(t._id, "print")} disabled={!!letter.busy} title="Print transfer order" aria-label="Print transfer order" className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey hover:border-brand-gold cursor-pointer disabled:opacity-50">
        <FiPrinter className={letter.busy === `${t._id}:print` ? "animate-pulse" : ""} />
      </button>
      <button type="button" onClick={() => letter.open(t._id, "pdf")} disabled={!!letter.busy} title="Download transfer order PDF" aria-label="Download transfer order PDF" className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey hover:border-brand-gold cursor-pointer disabled:opacity-50">
        <FiFileText className={letter.busy === `${t._id}:pdf` ? "animate-pulse" : ""} />
      </button>
    </span>
  );
}

export function TransferList({ rows, letter, showAsset = true }) {
  return (
    <>
      <div className="hidden md:block">
        <Table head={["Transfer", ...(showAsset ? ["Asset"] : []), { label: "Qty", className: "text-right" }, "From → To", "Reason", { label: "Letter", className: "text-right" }]}>
          {rows.map((t) => (
            <tr key={t._id}>
              <Td className="whitespace-nowrap">
                <span className="block font-black">{t.transferId}</span>
                <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">{fmtDate(t.transferDate)}</span>
              </Td>
              {showAsset && <Td>{assetLink(t.movedAsset || t.asset, t.assetCode, t.assetName, true)}</Td>}
              <Td className="text-right tabular-nums whitespace-nowrap">
                {t.quantity} <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70">{t.unit}</span>
              </Td>
              <Td>{fromTo(t)}</Td>
              <Td>
                <span className="block">{t.reason}</span>
                <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">by {t.by?.name || "—"}</span>
              </Td>
              <Td className="text-right">
                <LetterButtons t={t} letter={letter} />
              </Td>
            </tr>
          ))}
        </Table>
      </div>
      <ul className="md:hidden divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40">
        {rows.map((t) => (
          <li key={t._id} className="p-4 space-y-1.5 text-xs font-bold text-brand-black dark:text-brand-white">
            <div className="flex items-start justify-between gap-2">
              <span>
                <span className="block font-black">{t.transferId}</span>
                <span className="block text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">{fmtDate(t.transferDate)} · {t.quantity} {t.unit}</span>
              </span>
              <LetterButtons t={t} letter={letter} />
            </div>
            {showAsset && assetLink(t.movedAsset || t.asset, t.assetCode, t.assetName, true)}
            <div className="text-[11px]">{fromTo(t)}</div>
            <div className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">{t.reason}</div>
          </li>
        ))}
      </ul>
    </>
  );
}

const statusBadge = (s) => <Badge tone={MAINT_STATUS[s]?.tone}>{MAINT_STATUS[s]?.label || s}</Badge>;
const files = (list = []) =>
  list.length ? (
    <span className="inline-flex flex-wrap gap-1.5">
      {list.map((f, i) => (
        <a key={i} href={f.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-gold hover:underline">
          <FiPaperclip /> {f.name || `File ${i + 1}`}
        </a>
      ))}
    </span>
  ) : null;

export function MaintenanceList({ rows, onOpen, canEdit, showAsset = true }) {
  const editBtn = (m) =>
    canEdit && (
      <button type="button" onClick={() => onOpen(m)} title="Update" aria-label="Update maintenance" className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey hover:border-brand-gold cursor-pointer">
        <FiEdit3 />
      </button>
    );
  return (
    <>
      <div className="hidden md:block">
        <Table head={["Record", ...(showAsset ? ["Asset"] : []), "Problem", "Provider", "Status", { label: "Cost", className: "text-right" }, "Next due", { label: "", className: "text-right" }]}>
          {rows.map((m) => (
            <tr key={m._id}>
              <Td className="whitespace-nowrap">
                <span className="block font-black">{m.maintenanceId}</span>
                <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">
                  {fmtDate(m.maintenanceDate)}
                  {m.completionDate ? ` → ${fmtDate(m.completionDate)}` : ""}
                </span>
              </Td>
              {showAsset && (
                <Td>
                  {assetLink(m.asset, m.assetCode, m.assetName, true)}
                  <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">{m.location?.name} › {m.place?.name}</span>
                </Td>
              )}
              <Td>
                <span className="block max-w-[18rem]">{m.problem}</span>
                <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">{labelOf(MAINTENANCE_TYPES, m.maintenanceType)}</span>
                {files(m.attachments)}
              </Td>
              <Td>
                <span className="block">{m.serviceProvider || "—"}</span>
                {m.technician && <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">{m.technician}</span>}
              </Td>
              <Td>{statusBadge(m.status)}</Td>
              <Td className="text-right tabular-nums whitespace-nowrap">{m.cost ? money(m.cost) : "—"}</Td>
              <Td className="whitespace-nowrap">{m.nextMaintenanceDate ? fmtDate(m.nextMaintenanceDate) : "—"}</Td>
              <Td className="text-right">{editBtn(m)}</Td>
            </tr>
          ))}
        </Table>
      </div>
      <ul className="md:hidden divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40">
        {rows.map((m) => (
          <li key={m._id} className="p-4 space-y-1.5 text-xs font-bold text-brand-black dark:text-brand-white">
            <div className="flex items-start justify-between gap-2">
              <span>
                <span className="block font-black">{m.maintenanceId}</span>
                <span className="block text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">{fmtDate(m.maintenanceDate)} · {labelOf(MAINTENANCE_TYPES, m.maintenanceType)}</span>
              </span>
              <span className="flex items-center gap-2">
                {statusBadge(m.status)}
                {editBtn(m)}
              </span>
            </div>
            {showAsset && assetLink(m.asset, m.assetCode, m.assetName, true)}
            <div className="text-[11px] font-semibold">{m.problem}</div>
            <div className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">
              {[m.serviceProvider, m.cost ? money(m.cost) : null, m.nextMaintenanceDate ? `next ${fmtDate(m.nextMaintenanceDate)}` : null].filter(Boolean).join(" · ")}
            </div>
            {files(m.attachments)}
          </li>
        ))}
      </ul>
    </>
  );
}

export function DisposalList({ rows, onOpen, canEdit, showAsset = true }) {
  const editBtn = (d) =>
    canEdit && (
      <button type="button" onClick={() => onOpen(d)} title="Add documents or remarks" aria-label="Add documents or remarks" className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey hover:border-brand-gold cursor-pointer">
        <FiPaperclip />
      </button>
    );
  return (
    <>
      <div className="hidden md:block">
        <Table head={["Disposal", ...(showAsset ? ["Asset"] : []), "Type", "Reason", { label: "Book value", className: "text-right" }, { label: "Received", className: "text-right" }, "Approved by", { label: "", className: "text-right" }]}>
          {rows.map((d) => (
            <tr key={d._id}>
              <Td className="whitespace-nowrap">
                <span className="block font-black">{d.disposalId}</span>
                <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">{fmtDate(d.disposalDate)}</span>
              </Td>
              {showAsset && (
                <Td>
                  {assetLink(d.asset, d.assetCode, d.assetName, true)}
                  <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">{d.quantity} · {d.location?.name}</span>
                </Td>
              )}
              <Td>
                <Badge tone="slate">{labelOf(DISPOSAL_TYPES, d.disposalType)}</Badge>
              </Td>
              <Td>
                <span className="block max-w-[16rem]">{d.reason}</span>
                {files(d.attachments)}
              </Td>
              <Td className="text-right tabular-nums">{money(d.bookValue)}</Td>
              <Td className="text-right tabular-nums">{money(d.disposalValue)}</Td>
              <Td className="whitespace-nowrap">{d.approvedBy?.name}</Td>
              <Td className="text-right">{editBtn(d)}</Td>
            </tr>
          ))}
        </Table>
      </div>
      <ul className="md:hidden divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40">
        {rows.map((d) => (
          <li key={d._id} className="p-4 space-y-1.5 text-xs font-bold text-brand-black dark:text-brand-white">
            <div className="flex items-start justify-between gap-2">
              <span>
                <span className="block font-black">{d.disposalId}</span>
                <span className="block text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">{fmtDate(d.disposalDate)} · {labelOf(DISPOSAL_TYPES, d.disposalType)}</span>
              </span>
              {editBtn(d)}
            </div>
            {showAsset && assetLink(d.asset, d.assetCode, d.assetName, true)}
            <div className="text-[11px] font-semibold">{d.reason}</div>
            <div className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">
              Book {money(d.bookValue)} · received {money(d.disposalValue)} · approved by {d.approvedBy?.name}
            </div>
            {files(d.attachments)}
          </li>
        ))}
      </ul>
    </>
  );
}
