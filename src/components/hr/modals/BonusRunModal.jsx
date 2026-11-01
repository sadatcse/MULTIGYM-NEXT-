"use client";

import { useCallback, useEffect, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiSend, FiTrash2 } from "react-icons/fi";
import ModalShell from "@/components/modals/ModalShell";
import { Badge, Btn, EmptyState, Loading, Table, Tabs, Td } from "@/components/hr/HrUi";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, monthISO, money, fmtDateTime } from "@/hooks/useHr";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthLabel = (m) => (m ? new Date(`${m}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "");

// The policy's payout month this year (or the current month when it has none).
function defaultMonth(policy) {
  const idx = MONTH_NAMES.indexOf(policy?.applicableMonth);
  const now = monthISO();
  return idx < 0 ? now : `${now.slice(0, 4)}-${String(idx + 1).padStart(2, "0")}`;
}

// Works out a bonus policy for everyone it covers in a month, then posts the
// eligible amounts as "bonus" lines of that month's payroll. Posting again
// replaces the earlier figures for the same people.
export default function BonusRunModal({ policy, canPost, onClose }) {
  return (
    <ModalShell isOpen={!!policy} onClose={onClose} size="2xl" title={policy ? `Run "${policy.policyName}"` : ""}>
      {policy && <Body key={policy._id} policy={policy} canPost={canPost} />}
    </ModalShell>
  );
}

function Body({ policy, canPost }) {
  const { me, config } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const symbol = config?.payroll?.currency || "৳";
  const [month, setMonth] = useState(() => defaultMonth(policy));
  const [branch, setBranch] = useState(me?.scope === "branch" ? me.branches?.[0] || "all" : "all");
  const [view, setView] = useState("eligible");
  const [skip, setSkip] = useState([]); // employee ids left out of this posting
  const [data, setData] = useState(null);
  const preview = useHrMutation();
  const post = useHrMutation();
  const history = useHrQuery(`/payroll/bonus/history/${policy._id}`);
  const previewRun = preview.run;

  const load = useCallback(async () => {
    const res = await previewRun("post", "/payroll/bonus/preview", { policyId: policy._id, month, branch }, { silent: true });
    setData(res?.data || null);
  }, [previewRun, policy._id, month, branch]);
  useEffect(() => {
    // Legitimate fetch when the month or branch changes; setState inside is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSkip([]);
    load();
  }, [load]);

  const rows = data?.rows || [];
  const eligible = rows.filter((r) => r.eligible);
  const chosen = eligible.filter((r) => !skip.includes(String(r.employee._id)));
  const total = chosen.reduce((s, r) => s + r.amount, 0);
  const shown = rows.filter((r) => (view === "eligible" ? r.eligible : view === "not" ? !r.eligible : true));
  const st = data?.stats || {};
  const locked = (data?.locks || []).length > 0;
  const branchOptions = me?.scope === "branch" ? me.branches || [] : ["all", ...branches];

  const doPost = async () => {
    const whole = chosen.length === eligible.length;
    if (!confirm(`Post ${money(total, symbol)} for ${chosen.length} people to the ${monthLabel(month)} payroll?${st.postedCount ? " Earlier figures from this policy for them are replaced." : ""}`)) return;
    const res = await post.run("post", "/payroll/bonus/post", { policyId: policy._id, month, branch, ...(whole ? {} : { employeeIds: chosen.map((r) => r.employee._id) }) });
    if (res) {
      load();
      history.refetch();
    }
  };
  const doUnpost = async () => {
    if (!confirm(`Remove this policy's bonus from the ${monthLabel(month)} payroll for ${branch === "all" ? "all branches" : branch}?`)) return;
    if (await post.run("post", "/payroll/bonus/unpost", { policyId: policy._id, month, branch })) {
      load();
      history.refetch();
    }
  };

  return (
    <>
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50 dark:[color-scheme:dark]" aria-label="Payroll month" />
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer" aria-label="Branch">
            {branchOptions.map((b) => <option key={b} value={b}>{b === "all" ? "All branches" : b}</option>)}
          </select>
          <span className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">Service and attendance are checked for {monthLabel(month)}.</span>
        </div>

        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              ["Covered", st.covered],
              ["Eligible", st.eligible],
              ["Not eligible", st.notEligible],
              ["Bonus total", money(st.total, symbol)],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-brand-offwhite dark:bg-brand-midnight px-3 py-2.5">
                <div className="text-[10px] font-black uppercase tracking-wide text-brand-dark-grey dark:text-brand-gold-light">{l}</div>
                <div className="text-base font-black text-brand-black dark:text-brand-white">{v ?? 0}</div>
              </div>
            ))}
          </div>
        )}

        {locked && (
          <p className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 text-xs font-bold text-amber-700 dark:text-amber-400"><FiAlertTriangle /> {data.locks.join("; ")} — bonus can no longer be posted to {monthLabel(month)}.</p>
        )}
        {st.postedCount > 0 && (
          <p className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:text-emerald-400"><FiCheckCircle /> Already posted for {st.postedCount} {st.postedCount === 1 ? "person" : "people"} ({money(st.postedTotal, symbol)}). Posting again replaces those figures.</p>
        )}

        <Tabs value={view} onChange={setView} tabs={[{ value: "eligible", label: "Eligible", count: st.eligible ?? 0 }, { value: "not", label: "Not eligible", count: st.notEligible ?? 0 }, { value: "all", label: "Everyone covered", count: st.covered ?? 0 }]} />

        <div className="rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 overflow-hidden">
          {preview.busy && !data ? (
            <Loading rows={5} />
          ) : !shown.length ? (
            <EmptyState title={view === "eligible" ? "Nobody is eligible" : "Nobody here"} text={st.notCovered ? `${st.notCovered} people are outside this policy's designations, branches or types.` : undefined} />
          ) : (
            <Table head={["", "Employee", "Service", "Worked out as", { label: "Amount", className: "text-right" }, "Status"]}>
              {shown.map((r) => {
                const id = String(r.employee._id);
                return (
                  <tr key={id}>
                    <Td className="w-8">
                      {r.eligible && canPost && !locked && (
                        <input type="checkbox" aria-label={`Include ${r.employee.name}`} checked={!skip.includes(id)} onChange={(e) => setSkip((s) => (e.target.checked ? s.filter((x) => x !== id) : [...s, id]))} className="accent-[#E6BB60] cursor-pointer" />
                      )}
                    </Td>
                    <Td>
                      <div className="font-black">{r.employee.name}</div>
                      <div className="text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">{[r.employee.employeeId, r.employee.jobPosition, r.employee.branch].filter(Boolean).join(" · ")}</div>
                    </Td>
                    <Td className="whitespace-nowrap">{r.service === null ? "No joining date" : `${r.service} mo`}</Td>
                    <Td className="text-[11px] font-semibold">{r.basis}</Td>
                    <Td className="text-right font-black whitespace-nowrap">{r.eligible ? money(r.amount, symbol) : "—"}</Td>
                    <Td>
                      {r.eligible ? <Badge tone="green">Eligible</Badge> : <span className="text-[11px] font-bold text-brand-red">{r.reasons.join("; ")}</span>}
                      {r.posted && <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Posted {money(r.posted.amount, symbol)}</div>}
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </div>

        {(history.data?.data || []).length > 0 && (
          <div>
            <p className="text-xs font-black text-brand-black dark:text-brand-white mb-1.5">Posted before</p>
            <ul className="space-y-1 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">
              {history.data.data.map((h) => (
                <li key={h.month}>{monthLabel(h.month)}: {h.people} people, {money(h.total, symbol)}{h.by ? ` — by ${h.by}, ${fmtDateTime(h.lastAt)}` : ""}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2">
        <div>{canPost && st.postedCount > 0 && !locked && <Btn variant="ghost" loading={post.busy} onClick={doUnpost}><FiTrash2 /> Remove posted bonus</Btn>}</div>
        {canPost ? (
          <Btn loading={post.busy} disabled={!chosen.length || locked} onClick={doPost}>
            <FiSend /> Post {money(total, symbol)} for {chosen.length} {chosen.length === 1 ? "person" : "people"}
          </Btn>
        ) : (
          <span className="text-[11px] font-bold text-brand-dark-grey">View only — you can&apos;t post bonuses.</span>
        )}
      </div>
    </>
  );
}
