"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FiEdit3, FiPause, FiPlay, FiPlus, FiTarget, FiTrash2, FiX } from "react-icons/fi";
import { MdFitnessCenter, MdPointOfSale } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrMutation, useHrQuery, money } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Field, inputCls, Loading, PageHeader, pageCls, Select, StatCard } from "@/components/hr/HrUi";
import ModalShell from "@/components/modals/ModalShell";
import ModalFooter from "@/components/hr/modals/ModalFooter";
import AppliesToPicker, { appliesToText } from "@/components/hr/AppliesToPicker";
import { COMMISSION_TARGETS, planRates, slabText } from "@/components/hr/payrollRules";

const PRESETS = [
  { name: "Personal trainer", ptSessionRate: 300, ptMonthlyRate: 1500, ptSalesPercent: 10, targetMetric: "pt_sessions", slabs: [{ min: 60, bonus: 2000 }, { min: 100, bonus: 5000 }] },
  { name: "Front desk & membership sales", membershipSalesPercent: 3, newMemberRate: 200, targetMetric: "membership_sales", slabs: [{ min: 300000, bonus: 3000 }] },
  { name: "Supplement counter", productSalesPercent: 5, productItemRate: 20, targetMetric: "total_sales", slabs: [{ min: 100000, bonus: 1500 }] },
];

const EMPTY = { name: "", ptSessionRate: 0, ptMonthlyRate: 0, productItemRate: 0, ptSalesPercent: 0, membershipSalesPercent: 0, newMemberRate: 0, productSalesPercent: 0, targetMetric: "total_sales", slabs: [], appliesTo: {}, notes: "", status: "active" };

const RATE_FIELDS = [
  { k: "ptSessionRate", label: "Per PT session", unit: "money", hint: "Each personal-training session conducted" },
  { k: "ptMonthlyRate", label: "Per monthly PT package", unit: "money", hint: "Each client on a monthly personal-training package" },
  { k: "ptSalesPercent", label: "PT package sales", unit: "%", hint: "Share of PT packages sold" },
  { k: "membershipSalesPercent", label: "Membership sales", unit: "%", hint: "Share of memberships sold / renewed" },
  { k: "newMemberRate", label: "Per new member", unit: "money", hint: "Each new member signed up" },
  { k: "productSalesPercent", label: "Supplement & product sales", unit: "%", hint: "Share of shakes, supplements, merchandise sold" },
  { k: "productItemRate", label: "Per product sold", unit: "money", hint: "Fixed amount for each supplement / product item" },
];

export default function CommissionPolicyPage() {
  const permissions = usePagePermission();
  const { canAdd, canEdit, canDelete } = permissions;
  const { config } = useHrConfig();
  const symbol = config?.payroll?.currency || "৳";
  const [editing, setEditing] = useState(null);
  const { data, loading, refetch } = useHrQuery("/commission/plans", { status: "all" });
  const { run } = useHrMutation();
  const plans = data?.data || [];
  const active = plans.filter((p) => p.status === "active");

  const toggle = async (p) => {
    if (await run("patch", `/commission/plans/${p._id}`, { status: p.status === "active" ? "inactive" : "active" }, { success: p.status === "active" ? "Plan paused" : "Plan switched on" })) refetch();
  };
  const remove = async (p) => {
    if (!confirm(`Delete the "${p.name}" plan?`)) return;
    if (await run("delete", `/commission/plans/${p._id}`)) refetch();
  };

  return (
    <div className={pageCls}>
      <PageHeader
        icon={<MdFitnessCenter />}
        title="Commission & Incentive Plans"
        subtitle="How trainers and sales staff earn on top of salary: per PT session, a share of PT package, membership and supplement sales, and a bonus for reaching a monthly target."
        actions={
          <>
            <Link href="/dashboard/payroll/commissions"><Btn variant="ghost" className="whitespace-nowrap"><MdPointOfSale /> Monthly commission sheet</Btn></Link>
            {canAdd && <Btn variant="gold" className="whitespace-nowrap" onClick={() => setEditing({ ...EMPTY })}><FiPlus /> New plan</Btn>}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={<MdFitnessCenter />} label="Active plans" value={active.length} tone="green" />
        <StatCard icon={<FiTarget />} label="Plans with targets" value={active.filter((p) => p.slabs?.length).length} tone="amber" index={1} />
        <StatCard icon={<MdPointOfSale />} label="Approved so far" value={money(plans.reduce((s, p) => s + (p.approvedTotal || 0), 0), symbol)} tone="blue" index={2} />
      </div>

      {loading ? (
        <Card><Loading rows={4} /></Card>
      ) : !plans.length ? (
        <Card title="Start from a typical gym plan" subtitle="Opens the form with sample rates — change them to your own before saving.">
          <div className="grid sm:grid-cols-3 gap-3">
            {PRESETS.map((p) => (
              <button key={p.name} type="button" disabled={!canAdd} onClick={() => setEditing({ ...EMPTY, ...p })} className="text-left p-4 rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 hover:border-brand-gold hover:bg-brand-gold/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="text-xs font-black text-brand-black dark:text-brand-white">{p.name}</span>
                <span className="block mt-1.5 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">{planRates({ ...EMPTY, ...p }, symbol).join(" · ")}</span>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence initial={false}>
            {plans.map((p, i) => (
              <motion.div
                key={p._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.03 }}
                className={`flex flex-col justify-between gap-4 p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border shadow-sm ${p.status === "active" ? "border-brand-beige/50 dark:border-brand-dark-grey/50" : "border-dashed border-brand-beige dark:border-brand-dark-grey opacity-75"}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-black text-brand-black dark:text-brand-white">{p.name}</h3>
                    <Badge tone={p.status === "active" ? "green" : "slate"}>{p.status === "active" ? "Active" : "Paused"}</Badge>
                  </div>
                  <ul className="mt-3 space-y-1 text-[12px] font-bold text-brand-black dark:text-brand-white">
                    {planRates(p, symbol).map((t) => <li key={t}>{t}</li>)}
                  </ul>
                  {p.slabs?.length > 0 && (
                    <div className="mt-3 rounded-2xl bg-brand-gold/10 p-3">
                      <p className="text-[11px] font-black text-brand-black dark:text-brand-white flex items-center gap-1.5"><FiTarget className="text-brand-gold" /> Monthly target bonus</p>
                      <ul className="mt-1 space-y-0.5 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">
                        {p.slabs.map((s) => <li key={s.min}>{slabText(p, s, symbol)}</li>)}
                      </ul>
                    </div>
                  )}
                  <p className="mt-3 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">For: {appliesToText(p.appliesTo)}</p>
                  <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">{p.entries ? `Used in ${p.entries} monthly entr${p.entries === 1 ? "y" : "ies"} · ${money(p.approvedTotal, symbol)} approved` : "Not used yet"}</p>
                </div>
                <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                  {canEdit && <Btn size="sm" variant="ghost" onClick={() => toggle(p)}>{p.status === "active" ? <><FiPause /> Pause</> : <><FiPlay /> Switch on</>}</Btn>}
                  {canEdit && <Btn size="sm" variant="ghost" onClick={() => setEditing(p)}><FiEdit3 /> Edit</Btn>}
                  {canDelete && <Btn size="sm" variant="ghost" onClick={() => remove(p)} disabled={p.entries > 0} title={p.entries > 0 ? "In use — pause it instead" : "Delete"}><FiTrash2 /></Btn>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && plans.length > 0 && !active.length && (
        <Card><EmptyState icon={<FiPause />} title="Every plan is paused" text="Nobody appears on the monthly commission sheet until a plan is switched on." /></Card>
      )}

      <ModalShell isOpen={!!editing} onClose={() => setEditing(null)} size="2xl" title={editing?._id ? "Edit commission plan" : "New commission plan"}>
        {editing && <PlanForm key={editing._id || editing.name || "new"} plan={editing} symbol={symbol} permissions={permissions} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />}
      </ModalShell>
    </div>
  );
}

function PlanForm({ plan, symbol, permissions, onClose, onSaved }) {
  const allowed = plan._id ? permissions.canEdit : permissions.canAdd;
  const { run, busy } = useHrMutation();
  const sim = useHrMutation();
  const [f, setF] = useState(() => ({ ...EMPTY, ...plan, slabs: (plan.slabs || []).map((s) => ({ ...s })), appliesTo: plan.appliesTo || {} }));
  const [sample, setSample] = useState({ ptSessions: 40, ptMonthlyClients: 5, productItems: 25, ptSalesAmount: 60000, membershipSalesAmount: 150000, newMembers: 6, productSalesAmount: 20000 });
  const [result, setResult] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const target = COMMISSION_TARGETS.find((t) => t.value === f.targetMetric) || COMMISSION_TARGETS[0];
  const numbers = (x) => ({ ...x, ...Object.fromEntries(RATE_FIELDS.map(({ k }) => [k, Number(x[k]) || 0])), slabs: x.slabs.map((s) => ({ min: Number(s.min) || 0, bonus: Number(s.bonus) || 0 })) });
  const hasRate = RATE_FIELDS.some(({ k }) => Number(f[k]) > 0) || f.slabs.some((s) => Number(s.min) > 0 && Number(s.bonus) > 0);
  const tooHigh = RATE_FIELDS.some(({ k, unit }) => unit === "%" && Number(f[k]) > 100);
  const simRun = sim.run;

  // Try the plan on sample figures (worked out by the server, same as payroll).
  const simKey = JSON.stringify([numbers(f), sample]);
  useEffect(() => {
    const t = setTimeout(async () => {
      const [planBody, figures] = JSON.parse(simKey);
      const res = await simRun("post", "/commission/simulate", { plan: planBody, figures }, { silent: true });
      if (res?.data) setResult(res.data);
    }, 400);
    return () => clearTimeout(t);
  }, [simKey, simRun]);

  const save = async () => {
    const body = numbers(f);
    for (const k of ["_id", "createdAt", "updatedAt", "__v", "updatedBy", "entries", "approvedTotal"]) delete body[k];
    const res = plan._id ? await run("patch", `/commission/plans/${plan._id}`, body) : await run("post", "/commission/plans", body);
    if (res) onSaved();
  };

  return (
    <>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <fieldset disabled={!allowed} className="p-5 sm:p-6 space-y-5 min-w-0">
          <Field label="Plan name" required><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Personal trainer" className={inputCls} /></Field>

          <div>
            <p className="text-xs font-black text-brand-black dark:text-brand-white mb-2">Rates <span className="font-semibold text-brand-dark-grey dark:text-brand-gold-light">— leave 0 for anything this plan doesn&apos;t pay for</span></p>
            <div className="grid sm:grid-cols-2 gap-3">
              {RATE_FIELDS.map(({ k, label, unit, hint }) => (
                <Field key={k} label={`${label} (${unit === "%" ? "%" : symbol})`} hint={hint}>
                  <input type="number" min={0} max={unit === "%" ? 100 : undefined} step={unit === "%" ? 0.5 : 10} value={f[k]} onChange={(e) => set(k, e.target.value)} className={inputCls} />
                </Field>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-black text-brand-black dark:text-brand-white flex items-center gap-1.5"><FiTarget className="text-brand-gold" /> Monthly target bonus</p>
              <Select value={f.targetMetric} onChange={(v) => set("targetMetric", v)} options={COMMISSION_TARGETS} className="!w-auto !py-1.5 !text-[11px]" />
            </div>
            {f.slabs.length === 0 && <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">No target. Add a level to pay a bonus when someone reaches it; only the highest level reached is paid.</p>}
            {f.slabs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <Field label={i === 0 ? `Reach (${target.amount ? symbol : "count"})` : undefined}><input type="number" min={0} value={s.min} onChange={(e) => set("slabs", f.slabs.map((x, j) => (j === i ? { ...x, min: e.target.value } : x)))} className={inputCls} /></Field>
                <Field label={i === 0 ? `Bonus (${symbol})` : undefined}><input type="number" min={0} value={s.bonus} onChange={(e) => set("slabs", f.slabs.map((x, j) => (j === i ? { ...x, bonus: e.target.value } : x)))} className={inputCls} /></Field>
                <button type="button" onClick={() => set("slabs", f.slabs.filter((_, j) => j !== i))} className="mb-2 p-2 rounded-xl text-brand-dark-grey hover:text-brand-red hover:bg-brand-red/10 cursor-pointer" aria-label="Remove level"><FiX /></button>
              </div>
            ))}
            {f.slabs.length < 10 && <Btn size="sm" variant="ghost" onClick={() => set("slabs", [...f.slabs, { min: "", bonus: "" }])}><FiPlus /> Add level</Btn>}
          </div>

          <Field label="Who it is for"><AppliesToPicker value={f.appliesTo} onChange={(v) => set("appliesTo", v)} disabled={!allowed} /></Field>

          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <Field label="Note (optional)"><input value={f.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} /></Field>
            <label className="flex items-center gap-2 text-xs font-black cursor-pointer pb-2.5">
              <input type="checkbox" checked={f.status === "active"} onChange={(e) => set("status", e.target.checked ? "active" : "inactive")} className="accent-[#E6BB60]" />
              Active
            </label>
          </div>
          {tooHigh && <p className="text-[11px] font-bold text-brand-red">Percentages can&apos;t be more than 100.</p>}
        </fieldset>

        <aside className="p-5 sm:p-6 bg-brand-offwhite dark:bg-brand-midnight border-t lg:border-t-0 lg:border-l border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
          <p className="text-xs font-black text-brand-black dark:text-brand-white">Try it on a month</p>
          {[
            ["ptSessions", "PT sessions"],
            ["ptMonthlyClients", "Monthly PT clients"],
            ["ptSalesAmount", `PT package sales (${symbol})`],
            ["membershipSalesAmount", `Membership sales (${symbol})`],
            ["newMembers", "New members"],
            ["productSalesAmount", `Supplement sales (${symbol})`],
            ["productItems", "Products sold"],
          ].map(([k, l]) => (
            <label key={k} className="flex items-center justify-between gap-3 text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light">
              {l}
              <input type="number" min={0} value={sample[k]} onChange={(e) => setSample((x) => ({ ...x, [k]: e.target.value }))} className={`${inputCls} !w-28 !py-1.5 text-right`} />
            </label>
          ))}
          <div className="pt-3 border-t border-brand-beige/60 dark:border-brand-dark-grey/60">
            {result?.lines?.length ? (
              <ul className="space-y-1.5">
                {result.lines.map((l) => (
                  <li key={l.label} className="flex justify-between gap-3 text-[11px] font-semibold text-brand-black dark:text-brand-white">
                    <span className="min-w-0">{l.label}</span>
                    <span className="font-black whitespace-nowrap">{money(l.amount, symbol)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">Nothing earned with these figures.</p>
            )}
            <p className="mt-3 flex justify-between text-sm font-black text-brand-black dark:text-brand-white">
              Commission <span className="text-emerald-600 dark:text-emerald-400">{money(result?.total || 0, symbol)}</span>
            </p>
          </div>
        </aside>
      </div>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} disabled={!f.name.trim() || !hasRate || tooHigh} submitLabel={plan._id ? "Save changes" : "Save plan"} />
      </div>
    </>
  );
}
