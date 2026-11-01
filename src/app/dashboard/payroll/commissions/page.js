"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiCheckCircle, FiChevronDown, FiChevronUp, FiEdit3, FiLock, FiRotateCcw, FiSave, FiTrash2, FiUsers } from "react-icons/fi";
import { MdFitnessCenter, MdPointOfSale } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, monthISO, money, fmtDateTime } from "@/hooks/useHr";
import { Avatar, Badge, Btn, Card, EmptyState, Loading, PageHeader, pageCls, SearchBox, StatCard, Table, Td } from "@/components/hr/HrUi";
import ExportButtons from "@/components/Comon/ExportButtons";
import { exportToExcel } from "@/lib/exportHelper";

// Each figure and the plan settings that pay for it (a column shows only
// when an active plan uses it).
const ALL_FIGURES = [
  { k: "ptSessions", label: "PT sessions", money: false, uses: ["ptSessionRate"], targets: ["pt_sessions"] },
  { k: "ptMonthlyClients", label: "Monthly PT clients", money: false, uses: ["ptMonthlyRate"], targets: [] },
  { k: "ptSalesAmount", label: "PT sales", money: true, uses: ["ptSalesPercent"], targets: ["pt_sales", "total_sales"] },
  { k: "membershipSalesAmount", label: "Membership", money: true, uses: ["membershipSalesPercent"], targets: ["membership_sales", "total_sales"] },
  { k: "newMembers", label: "New members", money: false, uses: ["newMemberRate"], targets: ["new_members"] },
  { k: "productSalesAmount", label: "Supplement sales", money: true, uses: ["productSalesPercent"], targets: ["total_sales"] },
  { k: "productItems", label: "Products sold", money: false, uses: ["productItemRate"], targets: [] },
];
const usedBy = (f, p) => f.uses.some((u) => Number(p[u]) > 0) || (p.slabs?.length > 0 && f.targets.includes(p.targetMetric || "total_sales"));

const cellInput = "w-[80px] px-2 py-1.5 rounded-lg text-xs font-bold text-right bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60";

export default function CommissionSheetPage() {
  const { canAdd, canEdit, canDelete } = usePagePermission();
  const { me, config } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const symbol = config?.payroll?.currency || "৳";
  const [month, setMonth] = useState(monthISO());
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState({}); // employeeId -> unsaved figures
  const [open, setOpen] = useState(null); // employeeId with breakdown shown
  const [picked, setPicked] = useState([]); // entry ids
  const { run, busy } = useHrMutation();

  useEffect(() => {
    // Syncing a default from data that arrives asynchronously is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me?.scope === "branch" && me.branches?.length && branch === "all") setBranch(me.branches[0]);
  }, [me, branch]);

  const { data, loading, refetch } = useHrQuery("/commission/entries", { month, branch });
  const sheet = data?.data;
  const plans = useMemo(() => sheet?.plans || [], [sheet]);
  const FIGURES = useMemo(() => {
    const shown = ALL_FIGURES.filter((f) => plans.some((p) => usedBy(f, p)));
    return shown.length ? shown : ALL_FIGURES;
  }, [plans]);
  const planName = (id) => plans.find((p) => String(p._id) === String(id))?.name || "—";
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (sheet?.rows || []).filter((r) => !q || `${r.employee.name} ${r.employee.employeeId}`.toLowerCase().includes(q));
  }, [sheet, search]);
  const locked = rows.find((r) => r.locked)?.locked;
  const st = sheet?.stats || {};

  // A month or branch change starts from the saved figures again.
  const resetKey = `${month}|${branch}`;
  const [lastKey, setLastKey] = useState(resetKey);
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setEdits({});
    setPicked([]);
    setOpen(null);
  }

  const valueOf = (r) => {
    const id = String(r.employee._id);
    if (edits[id]) return edits[id];
    const e = r.entry || {};
    return { planId: e.plan ? String(e.plan) : r.defaultPlanId || "", ...Object.fromEntries(FIGURES.map(({ k }) => [k, e[k] ?? ""])) };
  };
  const change = (r, k, v) => setEdits((x) => ({ ...x, [String(r.employee._id)]: { ...valueOf(r), [k]: v } }));

  const save = async (r) => {
    const v = valueOf(r);
    const res = await run("put", "/commission/entries", { employeeId: r.employee._id, month, planId: v.planId, ...Object.fromEntries(FIGURES.map(({ k }) => [k, Number(v[k]) || 0])) }, { success: `Saved for ${r.employee.name}` });
    if (res) {
      setEdits((x) => {
        const n = { ...x };
        delete n[String(r.employee._id)];
        return n;
      });
      refetch();
    }
  };
  const setStatus = async (ids, status) => {
    if (!ids.length) return;
    if (await run("post", "/commission/entries/status", { ids, status })) {
      setPicked([]);
      refetch();
    }
  };
  const remove = async (r) => {
    if (!confirm(`Remove ${r.employee.name}'s commission for ${month}?`)) return;
    if (await run("delete", `/commission/entries/${r.entry._id}`)) refetch();
  };

  const draftIds = rows.filter((r) => r.entry?.status === "draft" && !edits[String(r.employee._id)]).map((r) => String(r.entry._id));
  const branchOptions = me?.scope === "branch" ? me.branches || [] : ["all", ...branches];
  const dirtyCount = Object.keys(edits).length;

  return (
    <div className={pageCls}>
      <PageHeader
        icon={<MdPointOfSale />}
        title="Sales & PT Commission"
        subtitle="Enter each trainer's PT sessions and each salesperson's sales for the month. Approved commission is paid with that month's salary."
        actions={
          <>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50 dark:[color-scheme:dark]" />
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50">
              {branchOptions.map((b) => <option key={b} value={b}>{b === "all" ? "All branches" : b}</option>)}
            </select>
            <Link href="/dashboard/settings/commission-policy"><Btn variant="ghost" size="sm"><MdFitnessCenter /> Plans</Btn></Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<FiUsers />} label="On commission" value={st.people ?? 0} />
        <StatCard icon={<FiEdit3 />} label="Figures entered" value={`${st.entered ?? 0} / ${st.people ?? 0}`} tone="blue" index={1} />
        <StatCard icon={<FiCheckCircle />} label="Approved for payroll" value={money(st.approvedTotal, symbol)} hint={`${st.approved ?? 0} people`} tone="green" index={2} />
        <StatCard icon={<FiRotateCcw />} label="Waiting for approval" value={money(st.draftTotal, symbol)} tone="amber" index={3} />
      </div>

      {locked && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-700 dark:text-amber-400">
          <FiLock /> Payroll for {month} is {locked}. Commission for this month can no longer change — reopen the payroll first if a correction is needed.
        </div>
      )}

      <Card
        title={`Commission for ${new Date(`${month}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`}
        subtitle={dirtyCount ? `${dirtyCount} unsaved row${dirtyCount === 1 ? "" : "s"} — press Save on each.` : "Change a figure, then Save the row. Saving sends an approved row back for approval."}
        bodyClassName="p-0"
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} className="w-44" />
            {canEdit && !locked && (picked.length > 0 ? (
              <>
                <Btn size="sm" variant="success" loading={busy} onClick={() => setStatus(picked, "approved")}><FiCheckCircle /> Approve {picked.length}</Btn>
                <Btn size="sm" variant="ghost" loading={busy} onClick={() => setStatus(picked, "draft")}><FiRotateCcw /> Back to draft</Btn>
              </>
            ) : (
              draftIds.length > 0 && <Btn size="sm" variant="success" loading={busy} onClick={() => confirm(`Approve ${draftIds.length} saved row(s) for payroll?`) && setStatus(draftIds, "approved")}><FiCheckCircle /> Approve all saved ({draftIds.length})</Btn>
            ))}
            <ExportButtons
              onExportExcel={() =>
                exportToExcel(
                  rows.map((r) => ({
                    Employee: r.employee.name,
                    ID: r.employee.employeeId,
                    Designation: r.employee.jobPosition,
                    Branch: r.employee.branch,
                    Plan: r.entry?.planName || planName(r.defaultPlanId),
                    ...Object.fromEntries(FIGURES.map(({ k, label }) => [label, r.entry?.[k] ?? 0])),
                    Commission: r.entry?.total ?? 0,
                    Status: r.entry?.status || "not entered",
                  })),
                  `commission_${month}_${branch}`,
                  "Commission",
                )
              }
            />
          </>
        }
      >
        {loading && !sheet ? (
          <Loading rows={6} />
        ) : !plans.length && !rows.length ? (
          <EmptyState icon={<MdFitnessCenter />} title="No active commission plan" text="Create a plan first — it decides who appears here and how commission is worked out." action={<Link href="/dashboard/settings/commission-policy"><Btn>Set up a plan</Btn></Link>} />
        ) : !rows.length ? (
          <EmptyState icon={<FiUsers />} title="Nobody on commission here" text="No active staff in this branch match a plan's designations, roles or branches." />
        ) : (
          <Table
            head={[
              "",
              "Employee & plan",
              ...FIGURES.map((f) => ({ label: f.money ? `${f.label} (${symbol})` : f.label, className: "text-right !px-2" })),
              { label: "Commission", className: "text-right !px-3" },
              "Status",
            ]}
          >
            {rows.map((r) => {
              const id = String(r.employee._id);
              const v = valueOf(r);
              const dirty = !!edits[id];
              const entry = r.entry;
              const readOnly = !!r.locked || !canAdd;
              const showOpen = open === id && entry?.breakdown?.length;
              return (
                <Fragment key={id}>
                  <tr className={dirty ? "bg-brand-gold/5" : ""}>
                    <Td className="w-8">
                      {entry && canEdit && !r.locked && (
                        <input type="checkbox" aria-label={`Select ${r.employee.name}`} checked={picked.includes(String(entry._id))} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, String(entry._id)] : p.filter((x) => x !== String(entry._id))))} className="accent-[#E6BB60] cursor-pointer" />
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2.5 min-w-[200px]">
                        <Avatar name={r.employee.name} photo={r.employee.photo} size={30} />
                        <div className="min-w-0">
                          <div className="font-black truncate">{r.employee.name}</div>
                          <div className="text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light truncate">{[r.employee.employeeId, r.employee.jobPosition, r.employee.branch].filter(Boolean).join(" · ")}</div>
                          {r.planIds.length > 1 && !readOnly ? (
                            <select value={v.planId} onChange={(e) => change(r, "planId", e.target.value)} aria-label={`Plan for ${r.employee.name}`} className="mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey cursor-pointer">
                              {r.planIds.map((pid) => <option key={pid} value={pid}>{planName(pid)}</option>)}
                            </select>
                          ) : (
                            <div className="text-[10px] font-bold text-brand-gold truncate">{entry?.planName || planName(v.planId)}</div>
                          )}
                        </div>
                      </div>
                    </Td>
                    {FIGURES.map(({ k, label }) => (
                      <Td key={k} className="text-right !px-2">
                        <input type="number" min={0} inputMode="decimal" aria-label={`${label} for ${r.employee.name}`} value={v[k]} placeholder="0" disabled={readOnly} onChange={(e) => change(r, k, e.target.value)} onKeyDown={(e) => e.key === "Enter" && dirty && save(r)} className={cellInput} />
                      </Td>
                    ))}
                    <Td className="text-right whitespace-nowrap !px-3">
                      {dirty ? (
                        <span className="text-[11px] font-bold text-brand-gold">Save to update</span>
                      ) : entry ? (
                        <button type="button" onClick={() => setOpen(open === id ? null : id)} className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer" title="Show how it was worked out">
                          {money(entry.total, symbol)} {showOpen ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      ) : (
                        <span className="text-brand-dark-grey">—</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-[92px] shrink-0">{entry ? <Badge tone={entry.status === "approved" ? "green" : "amber"}>{entry.status === "approved" ? "Approved" : "Draft"}</Badge> : <span className="text-[11px] font-semibold text-brand-dark-grey">Not entered</span>}</span>
                        {!r.locked && (
                          <>
                            {canAdd && dirty && <Btn size="sm" disabled={!v.planId} loading={busy} onClick={() => save(r)} title="Save figures"><FiSave /> Save</Btn>}
                            {canEdit && entry && !dirty && (entry.status === "draft"
                              ? <Btn size="sm" variant="ghost" onClick={() => setStatus([String(entry._id)], "approved")} title="Approve for payroll"><FiCheckCircle /></Btn>
                              : <Btn size="sm" variant="ghost" onClick={() => setStatus([String(entry._id)], "draft")} title="Back to draft"><FiRotateCcw /></Btn>)}
                            {canDelete && entry && <Btn size="sm" variant="ghost" onClick={() => remove(r)} title="Remove"><FiTrash2 /></Btn>}
                          </>
                        )}
                      </div>
                    </Td>
                  </tr>
                  {showOpen && (
                    <tr className="bg-brand-offwhite/60 dark:bg-brand-midnight/60">
                      <Td />
                      <Td colSpan={FIGURES.length + 3}>
                        <ul className="space-y-1 text-[11px] font-semibold">
                          {entry.breakdown.map((b) => (
                            <li key={b.label} className="flex justify-between gap-6 max-w-xl"><span>{b.label}</span><span className="font-black">{money(b.amount, symbol)}</span></li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[10px] text-brand-dark-grey dark:text-brand-gold-light">
                          {entry.updatedBy ? `Saved by ${entry.updatedBy.name} · ${fmtDateTime(entry.updatedBy.at)}` : ""}
                          {entry.approvedBy ? ` · approved by ${entry.approvedBy.name} · ${fmtDateTime(entry.approvedBy.at)}` : ""}
                        </p>
                      </Td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}
