"use client";

import { useContext, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiAlertTriangle, FiBarChart2 } from "react-icons/fi";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import { errMsg, fmtDate, money, useHrQuery } from "@/hooks/useHr";
import { AuthContext } from "@/providers/AuthProvider";
import { Btn, Card, controlCls, EmptyState, Field, Loading, PageHeader, pageCls, Select, Table, Td } from "@/components/hr/HrUi";
import Pagination from "@/components/Comon/Pagination";
import { ExportButtons, Refreshing, useGymLookups, useGymSuggestions } from "@/components/hr/GymAssetUi";
import { CONDITION, CONDITIONS, labelOf, LOCATION_TYPES, MAINT_STATUS, MAINTENANCE_STATUSES, MAINTENANCE_TYPES } from "@/components/hr/gymAssets";
import { exportToExcel } from "@/lib/exportHelper";
import { downloadDocumentPdf, printDocument, tableHtml } from "@/lib/hrPrint";

// Column = { label, get(row) → raw value (Excel keeps numbers), fmt?(raw) → text for
// screen/PDF, num? (right-aligned), total? (key in the report totals for the footer) }
const n = (v) => Number(v || 0).toLocaleString();
const COUNT_COLS = [
  { label: "Assets", get: (r) => r.lines, fmt: n, num: true, total: "lines" },
  { label: "Quantity", get: (r) => r.units, fmt: n, num: true, total: "units" },
  { label: "Purchase value", get: (r) => r.purchaseValue, fmt: money, num: true, total: "purchaseValue" },
  { label: "Current value", get: (r) => r.currentValue, fmt: money, num: true, total: "currentValue" },
];
const where = (r) => `${r.location?.name || "—"} › ${r.place?.name || "—"}`;

const REPORTS = {
  location: {
    label: "Location wise",
    dateLabel: "Purchase date",
    filters: ["date", "category", "condition", "status", "person", "location"],
    cols: [{ label: "Location", get: (r) => `${r.location}${r.inactive ? " (inactive)" : ""}` }, { label: "Type", get: (r) => labelOf(LOCATION_TYPES, r.type) }, ...COUNT_COLS, { label: "Damaged", get: (r) => r.damaged, fmt: n, num: true, total: "damaged" }, { label: "Under maintenance", get: (r) => r.maintenance, fmt: n, num: true, total: "maintenance" }],
    summary: true,
  },
  place: {
    label: "Place wise",
    dateLabel: "Purchase date",
    filters: ["date", "location", "place", "category", "condition", "status", "person"],
    cols: [{ label: "Location", get: (r) => r.location }, { label: "Place", get: (r) => `${r.place}${r.inactive ? " (inactive)" : ""}` }, ...COUNT_COLS],
    summary: true,
  },
  category: {
    label: "Category wise",
    dateLabel: "Purchase date",
    filters: ["date", "location", "place", "category", "condition", "status", "person"],
    cols: [{ label: "Category", get: (r) => `${r.category}${r.inactive ? " (inactive)" : ""}` }, { label: "Depreciation", get: (r) => (r.depreciationRate ? `${r.depreciationRate}% / yr` : "None") }, ...COUNT_COLS],
    summary: true,
  },
  condition: {
    label: "Condition wise",
    dateLabel: "Purchase date",
    filters: ["date", "location", "place", "category", "status", "person"],
    cols: [{ label: "Condition", get: (r) => CONDITION[r.condition]?.label || r.condition }, ...COUNT_COLS],
    summary: true,
    defaultStatus: "all",
  },
  transfers: {
    label: "Transfer history",
    dateLabel: "Transfer date",
    filters: ["date", "location", "place", "category", "person", "search"],
    employeeLabel: "Recorded by",
    cols: [
      { label: "Transfer", get: (r) => r.transferId },
      { label: "Date", get: (r) => fmtDate(r.transferDate) },
      { label: "Asset", get: (r) => `${r.assetCode} · ${r.assetName}` },
      { label: "Qty", get: (r) => r.quantity, fmt: n, num: true },
      { label: "From", get: (r) => `${r.fromLocation?.name} › ${r.fromPlace?.name}` },
      { label: "To", get: (r) => `${r.toLocation?.name} › ${r.toPlace?.name}` },
      { label: "Reason", get: (r) => r.reason },
      { label: "By", get: (r) => r.by?.name || "" },
    ],
  },
  "recent-transfers": { label: "Recently transferred", dateLabel: "Transfer date (default: last 30 days)", recent: true },
  maintenance: {
    label: "Maintenance history",
    dateLabel: "Maintenance date",
    filters: ["date", "location", "place", "category", "maintenanceStatus", "person", "search"],
    employeeLabel: "Recorded by",
    cols: [
      { label: "Record", get: (r) => r.maintenanceId },
      { label: "Date", get: (r) => fmtDate(r.maintenanceDate) },
      { label: "Asset", get: (r) => `${r.assetCode} · ${r.assetName}` },
      { label: "Location", get: where },
      { label: "Type", get: (r) => labelOf(MAINTENANCE_TYPES, r.maintenanceType) },
      { label: "Problem", get: (r) => r.problem },
      { label: "Provider", get: (r) => r.serviceProvider || "" },
      { label: "Status", get: (r) => MAINT_STATUS[r.status]?.label || r.status },
      { label: "Completed", get: (r) => (r.completionDate ? fmtDate(r.completionDate) : "") },
      { label: "Cost", get: (r) => r.cost, fmt: money, num: true },
      { label: "Next due", get: (r) => (r.nextMaintenanceDate ? fmtDate(r.nextMaintenanceDate) : "") },
    ],
  },
  warranty: {
    label: "Warranty expiry",
    dateLabel: "Expiry date",
    filters: ["date", "location", "place", "category", "condition", "person", "search"],
    cols: [
      { label: "Asset", get: (r) => `${r.assetCode} · ${r.name}` },
      { label: "Category", get: (r) => r.category?.name || "" },
      { label: "Location", get: where },
      { label: "Purchased", get: (r) => (r.purchaseDate ? fmtDate(r.purchaseDate) : "") },
      { label: "Supplier", get: (r) => r.supplier || "" },
      { label: "Warranty ends", get: (r) => fmtDate(r.warrantyExpiry) },
      { label: "Status", get: (r) => (r.daysLeft < 0 ? `Expired ${-r.daysLeft} days ago` : r.daysLeft === 0 ? "Ends today" : `${r.daysLeft} days left`) },
    ],
  },
  "recent-assets": {
    label: "Recently added",
    dateLabel: "Date added (default: last 30 days)",
    filters: ["date", "location", "place", "category", "condition", "status", "person", "search"],
    defaultStatus: "all",
  },
  audit: {
    label: "Asset audit",
    dateLabel: "Purchase date",
    filters: ["date", "location", "place", "category", "condition", "status", "person", "search"],
    cols: [
      { label: "Code", get: (r) => r.assetCode },
      { label: "Asset", get: (r) => r.name },
      { label: "Category", get: (r) => r.category?.name || "" },
      { label: "Brand / model", get: (r) => [r.brand, r.modelNumber].filter(Boolean).join(" ") },
      { label: "Serial", get: (r) => r.serialNumber || "" },
      { label: "Location", get: where },
      { label: "Qty", get: (r) => r.quantity, fmt: n, num: true },
      { label: "Unit", get: (r) => r.unit },
      { label: "Condition", get: (r) => CONDITION[r.condition]?.label || r.condition },
      { label: "Purchased", get: (r) => (r.purchaseDate ? fmtDate(r.purchaseDate) : "") },
      { label: "Purchase value", get: (r) => r.purchaseValue, fmt: money, num: true },
      { label: "Current value", get: (r) => r.currentValue, fmt: money, num: true },
      { label: "Warranty ends", get: (r) => (r.warrantyExpiry ? fmtDate(r.warrantyExpiry) : "") },
      { label: "Responsible", get: (r) => r.responsiblePerson || "" },
    ],
  },
};
REPORTS["recent-transfers"] = { ...REPORTS.transfers, ...REPORTS["recent-transfers"] };
REPORTS["recent-assets"].cols = [{ label: "Added", get: (r) => fmtDate(r.createdAt) }, ...REPORTS.audit.cols.filter((c) => c.label !== "Warranty ends"), { label: "Added by", get: (r) => r.createdBy?.name || "" }];

const STATUS_OPTIONS = [
  { value: "active", label: "Active assets" },
  { value: "disposed", label: "Disposed" },
  { value: "all", label: "Active and disposed" },
];

function totalsRow(report, data) {
  const t = data?.totals;
  if (!t) return null;
  if (!report.summary) return null;
  return report.cols.map((c, i) => (i === 0 ? "Total" : c.total ? c.fmt(t[c.total]) : ""));
}

function summaryLine(type, data) {
  const t = data?.totals;
  if (!t) return "";
  if (REPORTS[type].summary) return `${n(t.lines)} assets · ${n(t.units)} units · purchase ${money(t.purchaseValue)} · now ${money(t.currentValue)}`;
  if (type === "maintenance") return `${n(t.lines)} records · cost ${money(t.cost)} (excluding cancelled)`;
  if (type === "warranty") return `${n(t.lines)} assets with a warranty · ${t.expired} expired · ${t.soon} ending in 30 days`;
  if (type.includes("transfers")) return `${n(t.lines)} transfers`;
  return `${n(t.lines)} assets · purchase ${money(t.purchaseValue)} · now ${money(t.currentValue)}`;
}

export default function AssetReportsPage() {
  const axiosSecure = useAxiosSecure();
  const { company } = useContext(AuthContext);
  const lookups = useGymLookups();
  const suggest = useGymSuggestions();
  const [type, setType] = useState("location");
  const report = REPORTS[type];
  const [filters, setFilters] = useState({ from: "", to: "", location: "", place: "", category: "", condition: "", status: "", person: "", maintenanceStatus: "", search: "" });
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const setFilter = (k) => (v) => {
    setFilters((f) => ({ ...f, [k]: v, ...(k === "location" ? { place: "" } : {}) }));
    setPage(1);
  };
  const has = (f) => report.filters.includes(f);
  // Only send the filters this report understands.
  const params = useMemo(() => {
    const p = { page, limit: 50 };
    for (const [k, v] of Object.entries(filters)) {
      if (!v) continue;
      if ((k === "from" || k === "to") && !has("date")) continue;
      if (k !== "from" && k !== "to" && !has(k)) continue;
      p[k] = v;
    }
    if (has("status") && !filters.status) p.status = report.defaultStatus || "active";
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, type]);
  const q = useHrQuery(`/gym-asset/reports/${type}`, params);
  const data = q.data?.data;
  const rows = data?.rows || [];

  const placeOptions = lookups.places.filter((p) => String(p.location) === filters.location).map((p) => ({ value: p._id, label: p.name }));
  const filterText = () => {
    const parts = [];
    if (filters.from || filters.to || data?.from) parts.push(`${report.dateLabel.replace(/ \(.*\)/, "")}: ${filters.from || data?.from || "start"} to ${filters.to || "today"}`);
    const name = (list, id) => list.find((x) => x._id === id)?.name;
    if (params.location) parts.push(`Location: ${name(lookups.locations, params.location)}`);
    if (params.place) parts.push(`Place: ${name(lookups.places, params.place)}`);
    if (params.category) parts.push(`Category: ${name(lookups.categories, params.category)}`);
    if (params.condition) parts.push(`Condition: ${CONDITION[params.condition]?.label}`);
    if (params.status) parts.push(`Status: ${labelOf(STATUS_OPTIONS, params.status)}`);
    if (params.maintenanceStatus) parts.push(`Status: ${MAINT_STATUS[params.maintenanceStatus]?.label}`);
    if (params.person) parts.push(`${report.employeeLabel || "Responsible person"}: ${params.person}`);
    if (params.search) parts.push(`Search: "${params.search}"`);
    return parts.join(" · ");
  };

  /** Fetches every row (not just this page) for Excel / PDF / Print. */
  const exportAs = async (mode) => {
    setBusy(mode);
    try {
      const res = await axiosSecure.get(`/gym-asset/reports/${type}`, { params: { ...params, page: 1, export: 1 } });
      const all = res.data?.data;
      if (!all?.rows?.length) {
        toast.warning("Nothing to export for these filters.");
        return;
      }
      const title = `Asset Report — ${report.label}`;
      const totals = totalsRow(report, all);
      if (mode === "excel") {
        const sheet = all.rows.map((r) => Object.fromEntries(report.cols.map((c) => [c.label, c.get(r) ?? ""])));
        if (totals) sheet.push(Object.fromEntries(report.cols.map((c, i) => [c.label, i === 0 ? "Total" : c.total ? all.totals[c.total] : ""])));
        exportToExcel(sheet, `asset-report-${type}-${new Date().toISOString().slice(0, 10)}`, report.label.slice(0, 30));
        return;
      }
      const body = `<p class="sub">${summaryLine(type, all)}${filterText() ? `<br/>${filterText()}` : ""}</p>${tableHtml(
        report.cols.map((c) => c.label),
        all.rows.map((r) => report.cols.map((c) => (c.fmt ? c.fmt(c.get(r)) : c.get(r)))),
        { totals },
      )}`;
      const doc = { title, subtitle: `Generated ${new Date().toLocaleDateString("en-GB")}`, company, bodyHtml: body, landscape: report.cols.length > 6 };
      if (mode === "pdf") await downloadDocumentPdf({ ...doc, fileName: `asset-report-${type}.pdf` });
      else printDocument(doc);
    } catch (err) {
      toast.error(errMsg(err, "Export failed"));
    } finally {
      setBusy(null);
    }
  };

  const totals = totalsRow(report, data);

  return (
    <div className={pageCls}>
      <PageHeader title="Asset Reports" subtitle="Pick a report, narrow it with the filters, then export to Excel or PDF, or print it." actions={<ExportButtons onExcel={() => exportAs("excel")} onPdf={() => exportAs("pdf")} onPrint={() => exportAs("print")} busy={busy} disabled={!rows.length} />} />

      <Card bodyClassName="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(REPORTS).map(([key, r]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setType(key);
                setPage(1);
              }}
              aria-pressed={type === key}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-colors cursor-pointer ${type === key ? "bg-brand-gold text-brand-midnight border-brand-gold" : "bg-brand-offwhite dark:bg-brand-midnight border-brand-beige/50 dark:border-brand-dark-grey hover:border-brand-gold"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {has("date") && (
            <Field label={report.dateLabel}>
              <span className="grid grid-cols-2 gap-2">
                <input type="date" value={filters.from} onChange={(e) => setFilter("from")(e.target.value)} className={`${controlCls} w-full`} aria-label="From date" />
                <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter("to")(e.target.value)} className={`${controlCls} w-full`} aria-label="To date" />
              </span>
            </Field>
          )}
          {has("location") && (
            <Field label="Location">
              <Select value={filters.location} onChange={setFilter("location")} options={lookups.locations.map((l) => ({ value: l._id, label: l.name }))} placeholder="All locations" />
            </Field>
          )}
          {has("place") && (
            <Field label="Place">
              <Select value={filters.place} onChange={setFilter("place")} options={placeOptions} placeholder={filters.location ? "All places" : "Pick a location first"} disabled={!filters.location} />
            </Field>
          )}
          {has("category") && (
            <Field label="Category">
              <Select value={filters.category} onChange={setFilter("category")} options={lookups.categories.map((c) => ({ value: c._id, label: c.name }))} placeholder="All categories" />
            </Field>
          )}
          {has("condition") && (
            <Field label="Condition">
              <Select value={filters.condition} onChange={setFilter("condition")} options={CONDITIONS} placeholder="Any condition" />
            </Field>
          )}
          {has("status") && (
            <Field label="Asset status">
              <Select value={filters.status || report.defaultStatus || "active"} onChange={setFilter("status")} options={STATUS_OPTIONS} />
            </Field>
          )}
          {has("maintenanceStatus") && (
            <Field label="Maintenance status">
              <Select value={filters.maintenanceStatus} onChange={setFilter("maintenanceStatus")} options={MAINTENANCE_STATUSES} placeholder="Any status" />
            </Field>
          )}
          {has("person") && (
            <Field label={report.employeeLabel || "Responsible person"}>
              <Select value={filters.person} onChange={setFilter("person")} options={report.employeeLabel ? suggest.recordedBy : suggest.responsible} placeholder="Anyone" />
            </Field>
          )}
          {has("search") && (
            <Field label="Asset">
              <input value={filters.search} onChange={(e) => setFilter("search")(e.target.value)} placeholder="Code or name" className={`${controlCls} w-full`} />
            </Field>
          )}
        </div>
        {Object.values(filters).some(Boolean) && (
          <Btn variant="ghost" size="sm" onClick={() => { setFilters({ from: "", to: "", location: "", place: "", category: "", condition: "", status: "", person: "", maintenanceStatus: "", search: "" }); setPage(1); }}>
            Clear filters
          </Btn>
        )}
      </Card>

      <Card title={report.label} subtitle={summaryLine(type, data)} bodyClassName="p-0">
        <Refreshing show={q.loading && !!q.data} />
        {q.loading && !q.data ? (
          <div className="p-5"><Loading rows={6} /></div>
        ) : q.error && !q.data ? (
          <EmptyState icon={<FiAlertTriangle />} title="Couldn't load the report" text={q.error} action={<Btn variant="ghost" size="sm" onClick={q.refetch}>Try again</Btn>} />
        ) : !rows.length ? (
          <EmptyState icon={<FiBarChart2 />} title="Nothing to report" text="No records match these filters." />
        ) : (
          <>
            <div className="hidden md:block">
              <Table
                head={report.cols.map((c) => (c.num ? { label: c.label, className: "text-right" } : c.label))}
                footer={
                  totals && (
                    <tfoot className="bg-brand-offwhite dark:bg-brand-midnight text-xs font-black">
                      <tr>
                        {totals.map((v, i) => (
                          <Td key={i} className={report.cols[i].num ? "text-right tabular-nums" : ""}>{v}</Td>
                        ))}
                      </tr>
                    </tfoot>
                  )
                }
              >
                {rows.map((r, i) => (
                  <tr key={r._id || r.key || i}>
                    {report.cols.map((c) => (
                      <Td key={c.label} className={c.num ? "text-right tabular-nums whitespace-nowrap" : ""}>
                        {c.fmt ? c.fmt(c.get(r)) : c.get(r) || "—"}
                      </Td>
                    ))}
                  </tr>
                ))}
              </Table>
            </div>
            <ul className="md:hidden divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40">
              {rows.map((r, i) => (
                <li key={r._id || r.key || i} className="p-4">
                  <p className="text-sm font-black text-brand-black dark:text-brand-white">{report.cols[0].get(r)}</p>
                  <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    {report.cols.slice(1).map((c) => (
                      <div key={c.label} className="min-w-0">
                        <dt className="font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">{c.label}</dt>
                        <dd className="font-bold text-brand-black dark:text-brand-white break-words">{c.fmt ? c.fmt(c.get(r)) : c.get(r) || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
              {totals && (
                <li className="p-4 bg-brand-offwhite dark:bg-brand-midnight">
                  <p className="text-sm font-black text-brand-black dark:text-brand-white">Total</p>
                  <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    {report.cols.map((c, i) =>
                      i > 0 && totals[i] !== "" ? (
                        <div key={c.label}>
                          <dt className="font-semibold text-brand-dark-grey dark:text-brand-gold-light/70">{c.label}</dt>
                          <dd className="font-black text-brand-black dark:text-brand-white">{totals[i]}</dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                </li>
              )}
            </ul>
            {data.totalPages > 1 && (
              <div className="p-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                <Pagination currentPage={page} totalPages={data.totalPages} totalItems={data.total} itemsPerPage={50} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
