"use client";

import { escapeHtml as esc } from "@/lib/hrPrint";
import { fmtDate } from "@/hooks/useHr";

// Shared values and helpers for the Gym Assets pages. Lists mirror
// Backend/src/modules/gym-asset/schemas/gym-asset-common.ts.

export const CONDITIONS = [
  { value: "new", label: "New", tone: "blue" },
  { value: "excellent", label: "Excellent", tone: "green" },
  { value: "good", label: "Good", tone: "green" },
  { value: "fair", label: "Fair", tone: "amber" },
  { value: "damaged", label: "Damaged", tone: "red" },
  { value: "under_maintenance", label: "Under maintenance", tone: "purple" },
  { value: "non_functional", label: "Non-functional", tone: "red" },
  { value: "disposed", label: "Disposed", tone: "slate" },
];
// What a person may pick on the asset form (maintenance and disposal set the others).
export const EDITABLE_CONDITIONS = CONDITIONS.filter((c) => !["under_maintenance", "disposed"].includes(c.value));
export const AFTER_MAINTENANCE_CONDITIONS = EDITABLE_CONDITIONS;

export const LOCATION_TYPES = [
  { value: "branch", label: "Gym branch" },
  { value: "warehouse", label: "Warehouse" },
  { value: "head_office", label: "Head office" },
  { value: "other", label: "Other" },
];

export const MAINTENANCE_TYPES = [
  { value: "repair", label: "Repair" },
  { value: "preventive", label: "Preventive" },
  { value: "servicing", label: "Servicing" },
  { value: "inspection", label: "Inspection" },
  { value: "replacement", label: "Part replacement" },
  { value: "other", label: "Other" },
];

export const MAINTENANCE_STATUSES = [
  { value: "pending", label: "Pending", tone: "amber" },
  { value: "in_progress", label: "In progress", tone: "blue" },
  { value: "completed", label: "Completed", tone: "green" },
  { value: "cancelled", label: "Cancelled", tone: "slate" },
];

export const DISPOSAL_TYPES = [
  { value: "sold", label: "Sold" },
  { value: "damaged", label: "Damaged" },
  { value: "lost", label: "Lost" },
  { value: "donated", label: "Donated" },
  { value: "scrapped", label: "Scrapped" },
  { value: "other", label: "Other" },
];

export const UNITS = ["pcs", "set", "pair", "unit", "box", "kg", "meter"];
export const WARRANTY_OPTIONS = [
  { value: "0", label: "No warranty" },
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "1 year" },
  { value: "24", label: "2 years" },
  { value: "36", label: "3 years" },
  { value: "60", label: "5 years" },
];

const byValue = (list) => Object.fromEntries(list.map((x) => [x.value, x]));
export const CONDITION = byValue(CONDITIONS);
export const MAINT_STATUS = byValue(MAINTENANCE_STATUSES);
export const labelOf = (list, value) => list.find((x) => x.value === value)?.label || value || "—";

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const isoDay = (v) => (v ? String(v).slice(0, 10) : "");

/** Key sent with every create, so a save retried on a slow connection is stored once. */
export const newRequestId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** "Main Warehouse › Storage Room" */
export const whereText = (location, place) => [location?.name || location, place?.name || place].filter(Boolean).join(" › ");

/**
 * Shrinks a photo before upload (longest side 1600px, JPEG): a 4 MB phone
 * picture becomes ~300 KB, which matters on a slow connection.
 */
export async function compressImage(file, { maxSide = 1600, quality = 0.8 } = {}) {
  if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 600 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Body of the transfer order letter (for printDocument / downloadDocumentPdf). */
export function transferLetterHtml(t) {
  const a = t.assetDetails || {};
  const row = (label, value) => `<div><b>${esc(label)}</b> ${esc(value || "—")}</div>`;
  return `
<p style="margin:0 0 10px">Transfer order no. <b>${esc(t.transferId)}</b> &nbsp;·&nbsp; Date: <b>${esc(fmtDate(t.transferDate))}</b></p>
<p style="margin:0 0 12px">The asset below is to be moved from <b>${esc(t.fromLocation?.name)} › ${esc(t.fromPlace?.name)}</b> to <b>${esc(t.toLocation?.name)} › ${esc(t.toPlace?.name)}</b>. The receiving person should check the item on arrival and sign below.</p>
<h2>Asset</h2>
<div class="grid">
  ${row("Asset code", a.assetCode || t.assetCode)}
  ${row("Asset name", t.assetName)}
  ${row("Category", t.categoryName)}
  ${row("Quantity", `${t.quantity} ${t.unit || ""}`)}
  ${row("Brand", a.brand)}
  ${row("Model", a.modelNumber)}
  ${row("Serial number", a.serialNumber)}
  ${row("Condition", CONDITION[a.condition]?.label || a.condition)}
</div>
<h2>Movement</h2>
<table>
  <thead><tr><th></th><th>Location</th><th>Place</th></tr></thead>
  <tbody>
    <tr><td><b>From</b></td><td>${esc(t.fromLocation?.name)}</td><td>${esc(t.fromPlace?.name)}</td></tr>
    <tr><td><b>To</b></td><td>${esc(t.toLocation?.name)}</td><td>${esc(t.toPlace?.name)}</td></tr>
  </tbody>
</table>
<div class="grid" style="grid-template-columns:1fr">
  ${row("Reason", t.reason)}
  ${row("Note", t.note)}
  ${row("Recorded by", t.by?.name)}
</div>
<div class="sign"><div>Issued by<br/>(${esc(t.fromLocation?.name)})</div><div>Received by<br/>(${esc(t.toLocation?.name)})</div><div>Approved by</div></div>`;
}
