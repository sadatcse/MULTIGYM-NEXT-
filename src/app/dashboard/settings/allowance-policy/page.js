"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiAward, FiCalendar, FiEdit3, FiPause, FiPlay, FiPlus, FiSun, FiTrash2 } from "react-icons/fi";
import { MdLocalAtm } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrMutation, useHrQuery } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Field, inputCls, Loading, PageHeader, pageCls, StatCard, Tabs } from "@/components/hr/HrUi";
import ModalShell from "@/components/modals/ModalShell";
import ModalFooter from "@/components/hr/modals/ModalFooter";
import AppliesToPicker, { appliesToText } from "@/components/hr/AppliesToPicker";
import { ALLOWANCE_KINDS, DUTY_TYPES, ruleSentence } from "@/components/hr/payrollRules";

const PRESETS = [
  { name: "Opening & closing duty allowance", kind: "roster_duty", dutyTypes: ["opening", "closing"], amount: 100 },
  { name: "Night shift allowance", kind: "roster_duty", dutyTypes: ["night"], amount: 150 },
  { name: "Friday & special duty pay", kind: "roster_duty", dutyTypes: ["friday", "special"], amountType: "day_rate", amount: 1 },
  { name: "Holiday duty pay", kind: "off_day_work", dayTypes: ["holiday"], amountType: "day_rate", amount: 1, replacesOvertime: true },
  { name: "Weekly-off duty pay", kind: "off_day_work", dayTypes: ["weekend"], amountType: "fixed", amount: 500, replacesOvertime: true },
  { name: "Perfect attendance bonus", kind: "perfect_attendance", amount: 1000, maxAbsent: 0, maxLate: 2 },
  { name: "Meal allowance", kind: "per_present_day", amount: 60 },
];

const EMPTY = { name: "", kind: "roster_duty", amountType: "fixed", amount: "", dutyTypes: [], dayTypes: [], replacesOvertime: true, maxAbsent: 0, maxLate: 2, appliesTo: {}, notes: "", status: "active" };

export default function AllowancePolicyPage() {
  const permissions = usePagePermission();
  const { canAdd, canEdit, canDelete } = permissions;
  const { config } = useHrConfig();
  const symbol = config?.payroll?.currency || "৳";
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null); // rule object (new rules have no _id)
  const { data, loading, refetch } = useHrQuery("/allowance-rules", { status: "all" });
  const { run } = useHrMutation();
  const rules = data?.data || [];
  const shown = rules.filter((r) => filter === "all" || r.status === filter);
  const activeRules = rules.filter((r) => r.status === "active");

  const toggle = async (r) => {
    if (await run("patch", `/allowance-rules/${r._id}`, { status: r.status === "active" ? "inactive" : "active" }, { success: r.status === "active" ? "Rule paused" : "Rule switched on" })) refetch();
  };
  const remove = async (r) => {
    if (!confirm(`Delete "${r.name}"? Payslips already generated keep their amounts.`)) return;
    if (await run("delete", `/allowance-rules/${r._id}`)) refetch();
  };

  return (
    <div className={pageCls}>
      <PageHeader
        icon={<MdLocalAtm />}
        title="Allowances & Duty Pay"
        subtitle="Extra pay that payroll adds on its own from attendance and the duty roster: opening and closing duty, night shifts, holiday work, perfect attendance and meal money."
        actions={canAdd && <Btn variant="gold" className="whitespace-nowrap" onClick={() => setEditing({ ...EMPTY })}><FiPlus /> Add rule</Btn>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<MdLocalAtm />} label="Active rules" value={activeRules.length} tone="green" />
        <StatCard icon={<FiCalendar />} label="Duty allowances" value={activeRules.filter((r) => r.kind === "roster_duty").length} tone="blue" index={1} />
        <StatCard icon={<FiSun />} label="Off-day pay rules" value={activeRules.filter((r) => r.kind === "off_day_work").length} tone="amber" index={2} />
        <StatCard icon={<FiAward />} label="Attendance & daily" value={activeRules.filter((r) => ["perfect_attendance", "per_present_day", "monthly_fixed"].includes(r.kind)).length} tone="purple" index={3} />
      </div>

      {loading ? (
        <Card><Loading rows={4} /></Card>
      ) : !rules.length ? (
        <Card title="Start from a common gym allowance" subtitle="Pick one to open it with typical values filled in. Nothing is saved until you press Save.">
          <PresetGrid symbol={symbol} onPick={(p) => setEditing({ ...EMPTY, ...p })} disabled={!canAdd} />
        </Card>
      ) : (
        <>
          <Tabs value={filter} onChange={setFilter} tabs={[{ value: "all", label: "All", count: rules.length }, { value: "active", label: "Active", count: activeRules.length }, { value: "inactive", label: "Paused", count: rules.length - activeRules.length }]} />
          {!shown.length ? (
            <Card><EmptyState icon={<MdLocalAtm />} title="No rules here" text="Switch tabs to see the others." /></Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence initial={false}>
                {shown.map((r, i) => (
                  <motion.div
                    key={r._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.03 }}
                    className={`flex flex-col justify-between gap-4 p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border shadow-sm ${r.status === "active" ? "border-brand-beige/50 dark:border-brand-dark-grey/50" : "border-dashed border-brand-beige dark:border-brand-dark-grey opacity-75"}`}
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <span className="w-10 h-10 shrink-0 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-lg">{ALLOWANCE_KINDS[r.kind]?.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-brand-black dark:text-brand-white line-clamp-2">{r.name}</h3>
                          <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">{ALLOWANCE_KINDS[r.kind]?.label}</p>
                        </div>
                        <Badge tone={r.status === "active" ? "green" : "slate"}>{r.status === "active" ? "Active" : "Paused"}</Badge>
                      </div>
                      <p className="mt-3 text-[13px] font-bold text-brand-black dark:text-brand-white leading-snug">{ruleSentence(r, symbol)}</p>
                      <p className="mt-2 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">Applies to: {appliesToText(r.appliesTo)}</p>
                      {r.notes && <p className="mt-1 text-[11px] text-brand-dark-grey dark:text-brand-gold-light/80">{r.notes}</p>}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                      {canEdit && <Btn size="sm" variant="ghost" onClick={() => toggle(r)}>{r.status === "active" ? <><FiPause /> Pause</> : <><FiPlay /> Switch on</>}</Btn>}
                      {canEdit && <Btn size="sm" variant="ghost" onClick={() => setEditing(r)}><FiEdit3 /> Edit</Btn>}
                      {canDelete && <Btn size="sm" variant="ghost" onClick={() => remove(r)} title="Delete"><FiTrash2 /></Btn>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          {canAdd && (
            <Card title="Add another from a template">
              <PresetGrid symbol={symbol} onPick={(p) => setEditing({ ...EMPTY, ...p })} compact />
            </Card>
          )}
        </>
      )}

      <RuleModal rule={editing} symbol={symbol} permissions={permissions} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
    </div>
  );
}

function PresetGrid({ symbol, onPick, disabled, compact }) {
  return (
    <div className={`grid gap-3 ${compact ? "sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {PRESETS.map((p) => (
        <button
          key={p.name}
          type="button"
          disabled={disabled}
          onClick={() => onPick(p)}
          className="text-left p-4 rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 hover:border-brand-gold hover:bg-brand-gold/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2 text-brand-gold text-base">{ALLOWANCE_KINDS[p.kind].icon}<span className="text-xs font-black text-brand-black dark:text-brand-white">{p.name}</span></span>
          {!compact && <span className="block mt-1.5 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">{ruleSentence(p, symbol)}</span>}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onClick, children, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={on}
      className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-colors cursor-pointer disabled:cursor-not-allowed ${on ? "bg-brand-gold text-brand-midnight border-brand-gold" : "border-brand-beige dark:border-brand-dark-grey text-brand-dark-grey dark:text-brand-gold-light hover:border-brand-gold"}`}
    >
      {children}
    </button>
  );
}

function RuleModal({ rule, symbol, permissions, onClose, onSaved }) {
  return (
    <ModalShell isOpen={!!rule} onClose={onClose} size="xl" title={rule?._id ? "Edit allowance rule" : "New allowance rule"}>
      {rule && <RuleForm key={rule._id || rule.name || "new"} rule={rule} symbol={symbol} permissions={permissions} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

function RuleForm({ rule, symbol, permissions, onClose, onSaved }) {
  const allowed = rule._id ? permissions.canEdit : permissions.canAdd;
  const { run, busy } = useHrMutation();
  const [f, setF] = useState(() => ({ ...EMPTY, ...rule, appliesTo: rule.appliesTo || {} }));
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const flip = (k, v) => set(k, (f[k] || []).includes(v) ? f[k].filter((x) => x !== v) : [...(f[k] || []), v]);
  const amount = Number(f.amount);
  const valid =
    f.name.trim() &&
    amount > 0 &&
    (f.kind !== "roster_duty" || f.dutyTypes.length) &&
    (f.kind !== "off_day_work" || f.dayTypes.length) &&
    !(f.amountType === "day_rate" && amount > 5);

  const save = async () => {
    const body = { ...f, amount, maxAbsent: Number(f.maxAbsent) || 0, maxLate: Number(f.maxLate) || 0 };
    for (const k of ["_id", "createdAt", "updatedAt", "__v", "updatedBy"]) delete body[k];
    const res = rule._id ? await run("patch", `/allowance-rules/${rule._id}`, body) : await run("post", "/allowance-rules", body);
    if (res) onSaved();
  };

  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 space-y-5">
        <div>
          <p className="text-xs font-black text-brand-black dark:text-brand-white mb-2">What is it paid for?</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2" role="radiogroup">
            {Object.entries(ALLOWANCE_KINDS).map(([k, v]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={f.kind === k}
                onClick={() => setF((x) => ({ ...x, kind: k, amountType: ["off_day_work", "roster_duty"].includes(k) ? x.amountType : "fixed" }))}
                className={`text-left p-3 rounded-2xl border transition-colors cursor-pointer ${f.kind === k ? "border-brand-gold bg-brand-gold/10" : "border-brand-beige/60 dark:border-brand-dark-grey/60 hover:border-brand-gold/60"}`}
              >
                <span className="flex items-center gap-2 text-sm text-brand-gold">{v.icon}<span className="text-xs font-black text-brand-black dark:text-brand-white">{v.label}</span></span>
                <span className="block mt-1 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light leading-snug">{v.help}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name" required><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Opening duty allowance" className={inputCls} /></Field>
          {["off_day_work", "roster_duty"].includes(f.kind) ? (
            <Field label="Pay" required hint={f.amountType === "day_rate" ? "1 = one day's pay, 1.5 = one and a half" : undefined}>
              <div className="flex gap-2">
                <select value={f.amountType} onChange={(e) => set("amountType", e.target.value)} className={`${inputCls} w-40 cursor-pointer`}>
                  <option value="fixed">Fixed {symbol}</option>
                  <option value="day_rate">× day&apos;s pay</option>
                </select>
                <input type="number" min={0} step={f.amountType === "day_rate" ? 0.25 : 10} value={f.amount} onChange={(e) => set("amount", e.target.value)} className={inputCls} />
              </div>
            </Field>
          ) : (
            <Field label={`Amount (${symbol})`} required hint={f.kind === "roster_duty" ? "Per duty" : f.kind === "per_present_day" ? "Per day worked" : "Per month"}>
              <input type="number" min={0} step={10} value={f.amount} onChange={(e) => set("amount", e.target.value)} className={inputCls} />
            </Field>
          )}
        </div>

        {f.kind === "roster_duty" && (
          <Field label="Roster duties that earn it" required hint="Counted only on days the person punched in.">
            <div className="flex flex-wrap gap-2">
              {DUTY_TYPES.map(([k, l]) => <Toggle key={k} on={f.dutyTypes.includes(k)} onClick={() => flip("dutyTypes", k)}>{l}</Toggle>)}
            </div>
          </Field>
        )}

        {f.kind === "off_day_work" && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Days" required>
              <div className="flex flex-wrap gap-2">
                <Toggle on={f.dayTypes.includes("holiday")} onClick={() => flip("dayTypes", "holiday")}>Public holidays</Toggle>
                <Toggle on={f.dayTypes.includes("weekend")} onClick={() => flip("dayTypes", "weekend")}>Weekly offs</Toggle>
              </div>
            </Field>
            <Field label="Overtime for those days" hint="Attendance counts all off-day hours as overtime.">
              <label className="flex items-start gap-2 text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={f.replacesOvertime !== false} onChange={(e) => set("replacesOvertime", e.target.checked)} className="mt-0.5 accent-[#E6BB60]" />
                Pay this instead of overtime (recommended — avoids paying twice)
              </label>
            </Field>
          </div>
        )}

        {f.kind === "perfect_attendance" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Absences allowed" hint="Unpaid leave counts as absence"><input type="number" min={0} value={f.maxAbsent} onChange={(e) => set("maxAbsent", e.target.value)} className={inputCls} /></Field>
            <Field label="Late arrivals allowed"><input type="number" min={0} value={f.maxLate} onChange={(e) => set("maxLate", e.target.value)} className={inputCls} /></Field>
          </div>
        )}

        <Field label="Who gets it">
          <AppliesToPicker value={f.appliesTo} onChange={(v) => set("appliesTo", v)} disabled={!allowed} />
        </Field>

        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <Field label="Note (optional)"><input value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Shown on this page only" className={inputCls} /></Field>
          <label className="flex items-center gap-2 text-xs font-black cursor-pointer pb-2.5">
            <input type="checkbox" checked={f.status === "active"} onChange={(e) => set("status", e.target.checked ? "active" : "inactive")} className="accent-[#E6BB60]" />
            Active
          </label>
        </div>

        <div className="rounded-2xl bg-brand-offwhite dark:bg-brand-midnight p-4">
          <p className="text-[11px] font-black uppercase tracking-wide text-brand-dark-grey dark:text-brand-gold-light">Payroll will pay</p>
          <p className="mt-1 text-sm font-black text-brand-black dark:text-brand-white">{amount > 0 ? ruleSentence({ ...f, amount }, symbol) : "Enter an amount to see the rule in words."}</p>
          <p className="mt-1 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">To: {appliesToText(f.appliesTo)}. It shows on the payslip under Allowances.</p>
        </div>
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} disabled={!valid} submitLabel={rule._id ? "Save changes" : "Save rule"} />
      </div>
    </>
  );
}
