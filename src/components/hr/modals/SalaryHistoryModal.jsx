"use client";

import { useContext, useState } from "react";
import { FiPrinter } from "react-icons/fi";
import ModalShell from "@/components/modals/ModalShell";
import { AuthContext } from "@/providers/AuthProvider";
import { Badge, Btn, EmptyState, Loading, Table, Tabs, Td } from "@/components/hr/HrUi";
import { useHrQuery, money, fmtDate, fmtDateTime, titleCase } from "@/hooks/useHr";
import { printDocument, tableHtml, escapeHtml as esc } from "@/lib/hrPrint";

const sumList = (l = []) => l.reduce((s, x) => s + (Number(x.amount) || 0), 0);
const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const TYPE = {
  initial: { label: "First salary", tone: "blue" },
  increment: { label: "Increment", tone: "green" },
  decrement: { label: "Decrement", tone: "red" },
  revision: { label: "Revision", tone: "amber" },
};
const RUN = { draft: { label: "Draft", tone: "amber" }, finalized: { label: "Finalized", tone: "blue" }, paid: { label: "Paid", tone: "green" } };

/** Salary parts other than basic, e.g. "House rent ৳5,000 · Medical ৳1,000"; "Basic only" when there are none. */
function partsText(s, symbol) {
  if (!s) return "";
  const parts = [
    ["House rent", s.houseRent],
    ["Medical", s.medical],
    ["Conveyance", s.conveyance],
    ...(s.otherAllowances || []).map((x) => [x.name || "Other", x.amount]),
  ].filter(([, v]) => Number(v));
  const ded = sumList(s.fixedDeductions);
  const text = parts.map(([k, v]) => `${k} ${money(v, symbol)}`).join(" · ") || "Basic only";
  return ded ? `${text} · Fixed deductions ${money(ded, symbol)}` : text;
}

const diffText = (r, symbol) => {
  if (!r.previousGross) return "";
  const d = (r.newGross || 0) - r.previousGross;
  if (!d) return "No change in gross";
  const pct = ((d / r.previousGross) * 100).toFixed(1).replace(/\.0$/, "");
  return `${d > 0 ? "+" : "−"}${money(Math.abs(d), symbol)} (${d > 0 ? "+" : "−"}${Math.abs(pct)}%)`;
};

// Every salary an employee has had (structure changes, newest first) and the
// salary of each payroll month, with a printable salary record.
export default function SalaryHistoryModal({ employee, symbol = "৳", onClose }) {
  return (
    <ModalShell isOpen={!!employee} onClose={onClose} size="2xl" title={employee ? `Salary history — ${employee.name}` : ""}>
      {employee && <Body key={employee._id} employee={employee} symbol={symbol} />}
    </ModalShell>
  );
}

function Body({ employee, symbol }) {
  const { company } = useContext(AuthContext);
  const [tab, setTab] = useState("changes");
  const q = useHrQuery(`/payroll/structures/${employee._id}/history`);
  const d = q.data?.data;

  if (q.loading && !d) return <div className="p-6"><Loading rows={5} /></div>;
  if (!d) return <div className="p-6"><EmptyState title="Couldn't load the salary history" text={q.error} action={<Btn size="sm" variant="ghost" onClick={q.refetch}>Try again</Btn>} /></div>;

  const e = d.employee;
  const s = d.structure;
  const revisions = d.revisions || [];
  const payslips = d.payslips || [];
  const paid = payslips.filter((p) => p.runStatus !== "draft");
  const current = s
    ? [
        ["Basic", s.basic],
        ["House rent", s.houseRent],
        ["Medical", s.medical],
        ["Conveyance", s.conveyance],
        ...(s.otherAllowances || []).map((x) => [x.name || "Other allowance", x.amount]),
      ]
    : [];

  const print = () => {
    const info = `<div class="grid">
      <div><b>Employee</b>${esc(e.name)} (${esc(e.employeeId || "—")})</div>
      <div><b>Designation</b>${esc(e.jobPosition || "—")}</div>
      <div><b>Branch</b>${esc(e.branches?.[0] || "—")}</div>
      <div><b>Joining date</b>${esc(fmtDate(e.joiningDate))}</div>
    </div>`;
    const now = s
      ? `<h2>Current salary (since ${esc(fmtDate(s.effectiveFrom))})</h2>${tableHtml(
          ["Component", "Amount"],
          [...current.map(([k, v]) => [k, money(v, symbol)]), ...(s.fixedDeductions || []).map((x) => [`Less: ${x.name || "Deduction"}`, `−${money(x.amount, symbol)}`])],
          { totals: ["Gross salary", money(s.gross, symbol)] },
        )}<p class="sub">Payment: ${esc(titleCase(s.paymentMode || "cash"))}${s.accountNumber ? ` · ${esc(s.accountNumber)}` : ""}</p>`
      : "<p>No salary structure set.</p>";
    const changes = revisions.length
      ? `<h2>Salary changes</h2>${tableHtml(
          ["Effective from", "Change", "Basic", "Gross", "Difference", "Breakdown", "Note", "By"],
          revisions.map((r) => [
            fmtDate(r.effectiveFrom),
            TYPE[r.type]?.label || titleCase(r.type),
            r.previousBasic ? `${money(r.previousBasic, symbol)} → ${money(r.newBasic, symbol)}` : money(r.newBasic, symbol),
            r.previousGross ? `${money(r.previousGross, symbol)} → ${money(r.newGross, symbol)}` : money(r.newGross, symbol),
            diffText(r, symbol),
            partsText(r.snapshot, symbol),
            r.remarks || "",
            `${r.by?.name || ""}${r.at ? `, ${fmtDate(r.at)}` : ""}`,
          ]),
        )}`
      : "";
    const months = payslips.length
      ? `<h2>Monthly salary</h2>${tableHtml(
          ["Month", "Gross", "Earnings", "Deductions", "Net salary", "Status"],
          payslips.map((p) => [monthLabel(p.month), money(p.gross, symbol), money(p.totalEarnings, symbol), money(p.totalDeductions, symbol), money(p.netSalary, symbol), RUN[p.runStatus]?.label || titleCase(p.runStatus)]),
          { totals: ["Total (finalized + paid)", "", money(paid.reduce((t, p) => t + (p.totalEarnings || 0), 0), symbol), money(paid.reduce((t, p) => t + (p.totalDeductions || 0), 0), symbol), money(paid.reduce((t, p) => t + (p.netSalary || 0), 0), symbol), ""] },
        )}`
      : "";
    printDocument({ title: "Salary Record", subtitle: `${e.name} — ${e.employeeId || ""}`, company, bodyHtml: info + now + changes + months, landscape: true });
  };

  return (
    <div className="p-5 sm:p-6 space-y-5 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-xs font-semibold text-brand-dark-grey dark:text-brand-gold-light">
          {[e.employeeId, e.jobPosition, e.branches?.[0], e.joiningDate && `Joined ${fmtDate(e.joiningDate)}`].filter(Boolean).join(" · ")}
        </div>
        <Btn variant="gold" size="sm" onClick={print}><FiPrinter /> Print salary record</Btn>
      </div>

      {s ? (
        <section className="rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h4 className="text-sm font-black">Current salary</h4>
            <span className="text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light">Since {fmtDate(s.effectiveFrom)} · {titleCase(s.paymentMode || "cash")}</span>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
            {current.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light truncate">{k}</dt>
                <dd className="text-sm font-black">{money(v, symbol)}</dd>
              </div>
            ))}
            <div>
              <dt className="text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light">Gross</dt>
              <dd className="text-sm font-black text-emerald-600">{money(s.gross, symbol)}</dd>
            </div>
            {sumList(s.fixedDeductions) > 0 && (
              <div>
                <dt className="text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light">Fixed deductions</dt>
                <dd className="text-sm font-black text-red-500">{money(sumList(s.fixedDeductions), symbol)}</dd>
              </div>
            )}
          </dl>
        </section>
      ) : (
        <p className="text-xs font-bold text-brand-dark-grey">No salary structure set yet.</p>
      )}

      <Tabs value={tab} onChange={setTab} tabs={[{ value: "changes", label: `Salary changes (${revisions.length})` }, { value: "months", label: `Monthly salary (${payslips.length})` }]} />

      <div className="rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 overflow-hidden">
        {tab === "changes" ? (
          !revisions.length ? (
            <EmptyState title="No salary changes yet" text="Each time the salary is set or revised, the old and new salary are kept here." />
          ) : (
            <Table head={["Effective from", "Change", "Basic", "Gross", "Note"]}>
              {revisions.map((r, i) => (
                <tr key={i}>
                  <Td className="whitespace-nowrap">{fmtDate(r.effectiveFrom)}</Td>
                  <Td><Badge tone={TYPE[r.type]?.tone}>{TYPE[r.type]?.label || titleCase(r.type)}</Badge></Td>
                  <Td className="whitespace-nowrap">
                    {r.previousBasic ? <span className="text-brand-dark-grey line-through mr-1.5">{money(r.previousBasic, symbol)}</span> : null}
                    {money(r.newBasic, symbol)}
                  </Td>
                  <Td>
                    <div className="whitespace-nowrap">
                      {r.previousGross ? <span className="text-brand-dark-grey line-through mr-1.5">{money(r.previousGross, symbol)}</span> : null}
                      <span className="font-black">{money(r.newGross, symbol)}</span>
                    </div>
                    {diffText(r, symbol) && <div className={`text-[10px] ${r.newGross >= r.previousGross ? "text-emerald-600" : "text-red-500"}`}>{diffText(r, symbol)}</div>}
                    {r.snapshot && <div className="text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80 max-w-[260px] whitespace-normal">{partsText(r.snapshot, symbol)}</div>}
                  </Td>
                  <Td className="whitespace-normal">
                    <div className="max-w-[220px]">{r.remarks || <span className="text-brand-dark-grey">—</span>}</div>
                    <div className="text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">{r.by?.name}{r.at ? ` · ${fmtDateTime(r.at)}` : ""}</div>
                  </Td>
                </tr>
              ))}
            </Table>
          )
        ) : !payslips.length ? (
          <EmptyState title="No payroll months yet" text="Salary paid each month appears here once payroll is generated." />
        ) : (
          <Table
            head={["Month", "Gross", "Earnings", "Deductions", "Net salary", "Status"]}
            footer={
              <tfoot className="text-xs font-black border-t border-brand-beige/60 dark:border-brand-dark-grey/60">
                <tr>
                  <Td>Total paid</Td>
                  <Td />
                  <Td>{money(paid.reduce((t, p) => t + (p.totalEarnings || 0), 0), symbol)}</Td>
                  <Td className="text-red-500">{money(paid.reduce((t, p) => t + (p.totalDeductions || 0), 0), symbol)}</Td>
                  <Td className="text-emerald-600">{money(paid.reduce((t, p) => t + (p.netSalary || 0), 0), symbol)}</Td>
                  <Td className="text-[10px] text-brand-dark-grey">Finalized + paid</Td>
                </tr>
              </tfoot>
            }
          >
            {payslips.map((p) => (
              <tr key={p._id}>
                <Td className="whitespace-nowrap">{monthLabel(p.month)}</Td>
                <Td>{money(p.gross, symbol)}</Td>
                <Td>{money(p.totalEarnings, symbol)}</Td>
                <Td className="text-red-500">{money(p.totalDeductions, symbol)}</Td>
                <Td className="font-black text-emerald-600">{money(p.netSalary, symbol)}</Td>
                <Td><Badge tone={RUN[p.runStatus]?.tone}>{RUN[p.runStatus]?.label || titleCase(p.runStatus || "—")}</Badge></Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}
