"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiAlertTriangle, FiArrowRight, FiClock, FiGift, FiInfo, FiMinusCircle, FiPlusCircle, FiSettings, FiWatch } from "react-icons/fi";
import { MdAccountBalanceWallet, MdCalculate, MdFitnessCenter, MdLocalAtm } from "react-icons/md";
import { useHrConfig, useHrLookups, useHrQuery, monthISO, money } from "@/hooks/useHr";
import { Avatar, Badge, Card, EmptyState, EmployeePicker, Field, Loading, PageHeader, pageCls } from "@/components/hr/HrUi";
import { appliesToText } from "@/components/hr/AppliesToPicker";
import { planRates, ruleSentence } from "@/components/hr/payrollRules";

const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export default function PayrollPoliciesPage() {
  const { config } = useHrConfig();
  const symbol = config?.payroll?.currency || "৳";
  const { staff } = useHrLookups();
  const summary = useHrQuery("/payroll/policy-summary");
  const s = summary.data?.data;

  return (
    <div className={pageCls}>
      <PageHeader
        icon={<MdCalculate />}
        title="Payroll Policies"
        subtitle="What payroll uses right now, and a simulator that shows exactly how one person's salary is worked out."
      />

      <Simulator staff={staff} symbol={symbol} />

      {summary.loading && !s ? (
        <Card><Loading rows={4} /></Card>
      ) : s ? (
        <PolicyGrid s={s} symbol={symbol} />
      ) : (
        <Card><EmptyState icon={<FiAlertTriangle />} title="Couldn't load the policies" text={summary.error || "Try again in a moment."} /></Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Salary simulator
// ---------------------------------------------------------------------------

function Simulator({ staff, symbol }) {
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(monthISO());
  const { data, loading, error } = useHrQuery(employeeId ? "/payroll/preview" : null, { employeeId, month }, { enabled: !!employeeId });
  const d = data?.data;
  const r = d?.result;

  return (
    <Card title="Salary simulator" subtitle="Works out a payslip with today's attendance, roster, commission and policies. Nothing is saved — use it to check a rule before running payroll." bodyClassName="p-0">
      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-brand-beige/40 dark:border-brand-dark-grey/40">
          <Field label="Employee"><EmployeePicker staff={staff} value={employeeId} onChange={setEmployeeId} /></Field>
          <Field label="Month">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50 dark:[color-scheme:dark]" />
          </Field>
          {d && (
            <div className="space-y-2 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">
              <p>Late policy: <b className="text-brand-black dark:text-brand-white">{d.policies.late || "none active"}</b></p>
              <p>Overtime policy: <b className="text-brand-black dark:text-brand-white">{d.policies.overtime || "none active (×1.5 default)"}</b></p>
              <p>Allowance rules for this person: <b className="text-brand-black dark:text-brand-white">{d.policies.allowanceRules.length ? d.policies.allowanceRules.join(", ") : "none"}</b></p>
            </div>
          )}
        </div>

        <div className="p-5 min-w-0">
          {!employeeId ? (
            <EmptyState icon={<MdCalculate />} title="Pick someone to simulate" text="Choose an employee and a month. You'll see each figure on their payslip and the rule behind it." />
          ) : loading && !d ? (
            <Loading rows={6} />
          ) : error ? (
            <EmptyState icon={<FiAlertTriangle />} title="Couldn't work it out" text={error} />
          ) : r?.skipped ? (
            <EmptyState icon={<FiAlertTriangle />} title="No salary set" text="This person has no salary structure and no basic/gross salary on their profile, so payroll skips them. Set it in Salary Structures." action={<Link href="/dashboard/payroll/structures" className="text-xs font-black text-brand-gold underline">Open Salary Structures</Link>} />
          ) : d && r ? (
            <SimResult d={d} r={r} month={month} symbol={symbol} />
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function SimResult({ d, r, month, symbol }) {
  const a = r.attendance || {};
  const linesOf = (kind, group) => (r.lines || []).filter((l) => l.kind === kind && (!group || l.group === group));
  const earnings = [
    ["Basic", r.basic],
    ["House rent", r.houseRent],
    ["Medical", r.medical],
    ["Conveyance", r.conveyance],
    ["Other allowances (structure)", r.otherAllowances],
    ...linesOf("earning", "overtime").map((l) => [l.label, l.amount]),
    ...linesOf("earning", "allowance").map((l) => [l.label, l.amount]),
    ...linesOf("earning", "commission").map((l) => [`Commission: ${l.label}`, l.amount]),
    ...linesOf("earning", "adjustment").map((l) => [l.label, l.amount]),
  ].filter(([, v]) => v);
  const deductions = [
    ...linesOf("deduction", "late").map((l) => [l.label, l.amount]),
    ["Absent / unpaid leave / half day", r.absentDeduction],
    ...linesOf("deduction", "loan").map((l) => [l.label, l.amount]),
    ...linesOf("deduction", "fixed").map((l) => [l.label, l.amount]),
    ...linesOf("deduction", "adjustment").map((l) => [l.label, l.amount]),
  ].filter(([, v]) => v);
  const diff = d.sheet ? Math.round(r.netSalary - d.sheet.netSalary) : 0;

  return (
    <motion.div key={`${d.employee._id}-${month}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={d.employee.name} photo={d.employee.photo} size={44} />
          <div className="min-w-0">
            <div className="text-sm font-black text-brand-black dark:text-brand-white truncate">{d.employee.name}</div>
            <div className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light truncate">{[d.employee.employeeId, d.employee.jobPosition, d.employee.branch].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark-grey dark:text-brand-gold-light">Net salary · {monthLabel(month)}</div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{money(r.netSalary, symbol)}</div>
        </div>
      </div>

      {!d.inMonth && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-[12px] font-bold text-amber-700 dark:text-amber-400">
          <FiAlertTriangle className="mt-0.5 shrink-0" /> Not employed during {monthLabel(month)}, so payroll would leave them out.
        </p>
      )}
      {d.sheet && (
        <p className={`flex items-start gap-2 rounded-xl px-3 py-2 text-[12px] font-bold ${diff === 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-blue-500/10 text-blue-700 dark:text-blue-300"}`}>
          <FiInfo className="mt-0.5 shrink-0" />
          {diff === 0
            ? `Matches the ${d.sheet.status} salary sheet for this month.`
            : `The ${d.sheet.status} salary sheet shows ${money(d.sheet.netSalary, symbol)} — ${money(Math.abs(diff), symbol)} ${diff > 0 ? "less" : "more"} than with today's data.${d.sheet.status === "draft" ? " Regenerate the sheet to bring it up to date." : ""}`}
        </p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          ["Present", a.present],
          ["Absent", (a.absent || 0) + (a.unpaidLeave || 0)],
          ["Late", a.late],
          ["Early exit", a.earlyLeave],
          ["Leave", a.leave],
          ["OT hours", a.overtimeHours],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-brand-offwhite dark:bg-brand-midnight px-3 py-2 text-center">
            <div className="text-base font-black text-brand-black dark:text-brand-white tabular-nums">{v ?? 0}</div>
            <div className="text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light">{l}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Ledger title="Earnings" icon={<FiPlusCircle />} rows={earnings} total={r.totalEarnings} tone="text-emerald-600 dark:text-emerald-400" symbol={symbol} />
        <Ledger title="Deductions" icon={<FiMinusCircle />} rows={deductions} total={r.totalDeductions} tone="text-brand-red" symbol={symbol} empty="No deductions" />
      </div>

      <div>
        <p className="text-xs font-black text-brand-black dark:text-brand-white mb-2">Why each figure is what it is</p>
        <ol className="space-y-1.5">
          {(r.explain || []).map((x, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl px-3 py-2 bg-brand-offwhite/70 dark:bg-brand-midnight/70">
              <span className={`mt-0.5 shrink-0 ${x.kind === "deduction" ? "text-brand-red" : x.kind === "earning" ? "text-emerald-500" : "text-brand-dark-grey"}`}>
                {x.kind === "deduction" ? <FiMinusCircle /> : x.kind === "earning" ? <FiPlusCircle /> : <FiInfo />}
              </span>
              <span className="min-w-0 flex-1 text-[12px] font-semibold text-brand-black dark:text-brand-white">
                <b>{x.area}:</b> <span className="text-brand-dark-grey dark:text-brand-gold-light">{x.text}</span>
              </span>
              {x.amount ? <span className={`shrink-0 text-[12px] font-black tabular-nums ${x.kind === "deduction" ? "text-brand-red" : "text-brand-black dark:text-brand-white"}`}>{x.kind === "deduction" ? "−" : ""}{money(x.amount, symbol)}</span> : null}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">Day rate {money(r.perDay, symbol)} · hourly rate for overtime {money(r.hourly, symbol)}.</p>
      </div>
    </motion.div>
  );
}

function Ledger({ title, icon, rows, total, tone, symbol, empty }) {
  return (
    <div className="rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 overflow-hidden">
      <div className={`px-4 py-2.5 flex items-center gap-2 text-xs font-black bg-brand-offwhite dark:bg-brand-midnight ${tone}`}>{icon} {title}</div>
      <ul className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40">
        {rows.length ? (
          rows.map(([l, v], i) => (
            <li key={i} className="px-4 py-2 flex justify-between gap-4 text-[12px] font-semibold text-brand-black dark:text-brand-white">
              <span className="min-w-0">{l}</span>
              <span className="font-black tabular-nums whitespace-nowrap">{money(v, symbol)}</span>
            </li>
          ))
        ) : (
          <li className="px-4 py-3 text-[12px] font-semibold text-brand-dark-grey">{empty}</li>
        )}
      </ul>
      <div className="px-4 py-2.5 flex justify-between text-xs font-black border-t border-brand-beige/60 dark:border-brand-dark-grey/60">
        <span>Total</span>
        <span className={`tabular-nums ${tone}`}>{money(total, symbol)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Policies in use
// ---------------------------------------------------------------------------

function PolicyCard({ icon, title, href, status, children, warning }) {
  return (
    <div className="flex flex-col justify-between gap-4 p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
      <div>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 shrink-0 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-lg">{icon}</span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-brand-black dark:text-brand-white">{title}</h3>
            <div className="mt-0.5">{status}</div>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-[12px] font-semibold text-brand-black dark:text-brand-white">{children}</div>
        {warning && <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 p-2.5 text-[11px] font-bold text-amber-700 dark:text-amber-400"><FiAlertTriangle className="mt-0.5 shrink-0" /> {warning}</p>}
      </div>
      <Link href={href} className="inline-flex items-center gap-1.5 self-start text-[11px] font-black text-brand-gold hover:underline">Open settings <FiArrowRight /></Link>
    </div>
  );
}

const used = (x, word) =>
  x?.used ? <Badge tone="green">Using “{x.used.policyName}”</Badge> : <Badge tone="slate">No active {word}</Badge>;
const others = (x) => (x?.others?.length ? `${x.others.length} other active ${x.others.length === 1 ? "policy is" : "policies are"} ignored (${x.others.join(", ")}). Payroll uses the most recently updated one — pause the rest to avoid confusion.` : null);

function PolicyGrid({ s, symbol }) {
  const lp = s.late?.used;
  const op = s.overtime?.used;
  const ap = s.advance?.used;
  const lateMethod = lp
    ? lp.deductionType === "fixed"
      ? `${money(lp.deductionAmount, symbol)} for each late arrival after ${lp.maxLateAllowedPerMonth} a month`
      : lp.deductionType === "per_minute"
        ? `${money(lp.deductionAmount, symbol)} per late minute after the first ${lp.maxLateAllowedPerMonth} late days`
        : `every ${lp.maxLateAllowedPerMonth || 3} late arrivals = 1 day's pay`
    : null;
  const missingStructures = Math.max(0, (s.coverage?.staff || 0) - (s.coverage?.structures || 0));

  return (
    <div className="space-y-3">
      <h2 className="text-base font-black text-brand-black dark:text-brand-white">Policies in use</h2>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <PolicyCard icon={<FiWatch />} title="Late & attendance" href="/dashboard/settings/late-policy" status={used(s.late, "late policy")} warning={others(s.late) || (!lp ? "Late arrivals are counted but nothing is deducted." : null)}>
          <p>Late after {s.attendance?.graceMinutes ?? 15} min grace; early leave after {s.attendance?.earlyLeaveToleranceMinutes ?? 15} min.</p>
          {lateMethod && <p>{lateMethod}.</p>}
          {lp && <p>{lp.earlyExitDeduction === "yes" ? `Early exits deducted the same way after ${lp.maxEarlyExitsAllowedPerMonth} a month.` : "Early exits are not deducted."}</p>}
          <p className="text-brand-dark-grey dark:text-brand-gold-light">Absent and unpaid-leave days cost one day&apos;s pay; a half day costs half.</p>
        </PolicyCard>

        <PolicyCard icon={<FiClock />} title="Overtime" href="/dashboard/settings/overtime" status={used(s.overtime, "overtime policy")} warning={others(s.overtime) || (!op ? "Without a policy overtime is paid at ×1.5 with no monthly cap." : null)}>
          {op && (
            <>
              <p>×{op.ratePerHour} the hourly rate{op.offDayRate > 0 ? `, ×${op.offDayRate} on holidays / days off` : ""}.</p>
              <p>At least {op.minOvertimeMinutes} min a day{op.roundingMinutes > 0 ? `, rounded down to ${op.roundingMinutes} min` : ""}; {op.maxHoursPerMonth > 0 ? `up to ${op.maxHoursPerMonth} h a month` : "no monthly cap"}.</p>
            </>
          )}
          <p className="text-brand-dark-grey dark:text-brand-gold-light">Overtime starts {s.attendance?.overtimeAfterMinutes ?? 30} min after the shift ends.</p>
        </PolicyCard>

        <PolicyCard icon={<MdAccountBalanceWallet />} title="Salary advance" href="/dashboard/settings/advance-policy" status={used(s.advance, "advance policy")} warning={others(s.advance) || (!ap ? "Advances are recorded without any limit check." : null)}>
          {ap && (
            <>
              <p>Up to {ap.maxAdvancePercent}% of basic{ap.maxAmount > 0 ? `, max ${money(ap.maxAmount, symbol)}` : ""}; {ap.maxAdvanceCount} a year.</p>
              <p>After {ap.minServiceMonths} months of service; repaid within {ap.maxInstallments > 0 ? `${ap.maxInstallments} months` : "any period"}.</p>
              <p>{ap.allowConcurrent === "yes" ? "A second advance may overlap." : "One advance at a time."} {ap.allowDuringProbation === "yes" ? "Probation staff allowed." : "Not during probation."}</p>
            </>
          )}
        </PolicyCard>

        <PolicyCard icon={<FiGift />} title="Bonuses" href="/dashboard/settings/bonus-policy" status={s.bonus?.length ? <Badge tone="green">{s.bonus.length} active</Badge> : <Badge tone="slate">None active</Badge>}>
          {s.bonus?.length ? (
            s.bonus.slice(0, 4).map((b) => (
              <p key={b._id}>{b.policyName}: {b.calculationType === "fixed_amount" ? money(b.bonusRate, symbol) : `${b.bonusRate}% of ${b.calculationType === "percentage_of_gross" ? "gross" : "basic"}`}{b.applicableMonth && b.applicableMonth !== "All Months" ? ` in ${b.applicableMonth}` : ""}</p>
            ))
          ) : (
            <p className="text-brand-dark-grey dark:text-brand-gold-light">Add festival or attendance bonuses, then run them into a payroll month.</p>
          )}
          <p className="text-brand-dark-grey dark:text-brand-gold-light">Bonuses are paid only after you run them from the bonus page.</p>
        </PolicyCard>

        <PolicyCard icon={<MdLocalAtm />} title="Allowances & duty pay" href="/dashboard/settings/allowance-policy" status={s.allowanceRules?.length ? <Badge tone="green">{s.allowanceRules.length} active</Badge> : <Badge tone="slate">None active</Badge>}>
          {s.allowanceRules?.length ? (
            s.allowanceRules.slice(0, 4).map((r) => (
              <p key={r._id}><b>{r.name}</b> — {ruleSentence(r, symbol)}{appliesToText(r.appliesTo) !== "Everyone" ? ` (${appliesToText(r.appliesTo)})` : ""}</p>
            ))
          ) : (
            <p className="text-brand-dark-grey dark:text-brand-gold-light">Pay opening/closing duty, holiday work, perfect attendance or meal money automatically.</p>
          )}
          {s.allowanceRules?.length > 4 && <p className="text-brand-dark-grey dark:text-brand-gold-light">and {s.allowanceRules.length - 4} more.</p>}
        </PolicyCard>

        <PolicyCard icon={<MdFitnessCenter />} title="Commission & incentives" href="/dashboard/settings/commission-policy" status={s.commissionPlans?.length ? <Badge tone="green">{s.commissionPlans.length} active</Badge> : <Badge tone="slate">None active</Badge>}>
          {s.commissionPlans?.length ? (
            s.commissionPlans.slice(0, 3).map((p) => (
              <p key={p._id}><b>{p.name}</b> — {planRates(p, symbol).slice(0, 2).join(", ") || "target bonus only"}</p>
            ))
          ) : (
            <p className="text-brand-dark-grey dark:text-brand-gold-light">Pay trainers per PT session and sales staff a share of what they sell.</p>
          )}
          <p className="text-brand-dark-grey dark:text-brand-gold-light">Only figures approved on the monthly commission sheet are paid.</p>
        </PolicyCard>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <PolicyCard icon={<FiSettings />} title="Payroll basis" href="/dashboard/settings/hr-workflow" status={<Badge tone="blue">HR Workflow Settings</Badge>}>
          <p>Day rate = {s.payroll?.perDayBasis === "basic" ? "basic" : "gross"} ÷ {s.payroll?.daysBasis === "fixed30" ? "30" : "days in the month"}.</p>
          <p>Overtime hourly rate = basic ÷ days ÷ {s.payroll?.standardHoursPerDay || 8} h.</p>
          <p>Proxy duty pay from Proxy Duty Management is added to the cover&apos;s salary for the duty month.</p>
        </PolicyCard>
        <PolicyCard icon={<MdCalculate />} title="Salary structures" href="/dashboard/payroll/structures" status={missingStructures ? <Badge tone="amber">{missingStructures} missing</Badge> : <Badge tone="green">All set</Badge>} warning={missingStructures ? `${missingStructures} of ${s.coverage.staff} current staff have no salary structure — payroll uses the basic/gross on their profile, or skips them when that is empty.` : null}>
          <p>{s.coverage?.structures || 0} of {s.coverage?.staff || 0} current staff have a salary structure.</p>
        </PolicyCard>
      </div>
    </div>
  );
}
