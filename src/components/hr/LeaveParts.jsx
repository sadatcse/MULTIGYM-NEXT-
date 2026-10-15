"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiCheck, FiX } from "react-icons/fi";
import { useHrMutation, fmtDate, fmtDateTime, titleCase } from "@/hooks/useHr";
import { Btn, Field, inputCls } from "@/components/hr/HrUi";
import { printDocument, tableHtml, escapeHtml as esc } from "@/lib/hrPrint";

export const STAGES = [
  { key: "applied", label: "Applied" },
  { key: "branch", label: "Branch / Floor In-Charge" },
  { key: "hr", label: "Manager (Admin & HR)" },
  { key: "director", label: "Director Approval" },
];

const STAGE_INDEX = { pending_branch: 1, pending_hr: 2, pending_director: 3, approved: 4, rejected: 4, cancelled: 4 };

export const DECISION_TONE = {
  recommended: "text-emerald-500",
  partially_recommended: "text-amber-500",
  not_recommended: "text-red-500",
  approved: "text-emerald-500",
  partially_approved: "text-amber-500",
  rejected: "text-red-500",
};

// Horizontal 4-step progress for a leave application.
export function LeaveStepper({ app, compact }) {
  const current = STAGE_INDEX[app.status] ?? 1;
  const actionFor = (k) => (app.actions || []).find((a) => a.stage === k);
  const failed = app.status === "rejected" || app.status === "cancelled";
  return (
    <div className="flex items-start w-full">
      {STAGES.map((s, i) => {
        const act = s.key === "applied" ? null : actionFor(s.key);
        const done = i === 0 || !!act || current > i;
        const isCurrent = current === i && !failed;
        const negative = act && /not_|rejected/.test(act.decision);
        return (
          <div key={s.key} className="flex-1 flex flex-col items-center relative">
            {i > 0 && (
              <div className="absolute top-3.5 right-1/2 w-full h-0.5 bg-brand-beige/60 dark:bg-brand-dark-grey">
                <motion.div initial={{ width: 0 }} animate={{ width: done ? "100%" : "0%" }} transition={{ duration: 0.5, delay: i * 0.12 }} className="h-full bg-brand-gold" />
              </div>
            )}
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: isCurrent ? [1, 1.12, 1] : 1 }}
              transition={isCurrent ? { repeat: Infinity, duration: 1.6 } : { duration: 0.3 }}
              className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 ${
                negative ? "bg-red-500 border-red-500 text-white" : done ? "bg-brand-gold border-brand-gold text-brand-black" : isCurrent ? "bg-brand-white dark:bg-brand-charcoal border-brand-gold text-brand-gold" : "bg-brand-white dark:bg-brand-charcoal border-brand-beige dark:border-brand-dark-grey text-brand-dark-grey"
              }`}
            >
              {negative ? <FiX /> : done ? <FiCheck /> : i + 1}
            </motion.div>
            {!compact && (
              <div className="mt-1.5 text-center px-1">
                <div className="text-[10px] font-black leading-tight">{s.label}</div>
                {act && <div className={`text-[9px] font-bold ${DECISION_TONE[act.decision] || ""}`}>{titleCase(act.decision)}</div>}
                {act && <div className="text-[9px] text-brand-dark-grey truncate max-w-[110px]">{act.actorName}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BalanceStrip({ balances = [] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {balances.map((b, i) => {
        const pct = b.allowed ? Math.min(100, (b.taken / b.allowed) * 100) : 0;
        return (
          <motion.div key={b.leaveTypeId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-black uppercase tracking-wide text-brand-dark-grey dark:text-brand-gold-light">{b.leaveTypeName}</span>
              {!b.isPaid && <span className="text-[9px] font-black text-red-500">UNPAID</span>}
            </div>
            <div className="text-2xl font-black mt-1">{b.remaining}<span className="text-xs text-brand-dark-grey font-bold"> / {b.allowed} left</span></div>
            <div className="h-1.5 mt-2 rounded-full bg-brand-offwhite dark:bg-brand-midnight overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} className={`h-full ${pct > 80 ? "bg-red-500" : "bg-brand-gold"}`} />
            </div>
            <div className="text-[10px] text-brand-dark-grey mt-1">Taken {b.taken}{b.pending ? ` · Pending ${b.pending}` : ""}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Recommendation / approval form for the actor's current stage.
export function LeaveDecisionPanel({ app, onDone }) {
  const { run, busy } = useHrMutation();
  const isDirector = app.actingStage === "director";
  const [decision, setDecision] = useState(isDirector ? "approved" : "recommended");
  const [remarks, setRemarks] = useState("");
  const [days, setDays] = useState(Math.max(1, Math.floor(app.totalDays) - 1));
  const [from, setFrom] = useState(app.fromDate);
  const [to, setTo] = useState(app.toDate);

  const options = isDirector
    ? [
        { v: "approved", l: "Approve", c: "bg-emerald-600" },
        { v: "partially_approved", l: "Partially approve", c: "bg-amber-500" },
        { v: "rejected", l: "Reject", c: "bg-red-600" },
      ]
    : [
        { v: "recommended", l: "Recommended", c: "bg-emerald-600" },
        { v: "partially_recommended", l: "Partially recommended", c: "bg-amber-500" },
        { v: "not_recommended", l: "Not recommended", c: "bg-red-600" },
      ];

  const submit = async () => {
    const body = { decision, remarks };
    if (decision === "partially_recommended") body.recommendedDays = Number(days);
    if (decision === "partially_approved") Object.assign(body, { approvedFromDate: from, approvedToDate: to });
    const res = await run("post", `/leave/${app._id}/act`, body);
    if (res) onDone?.();
  };

  const stageName = STAGES.find((s) => s.key === app.actingStage)?.label;
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-brand-dark-grey">
        You are acting as <span className="text-brand-gold">{stageName}</span>
        {app.actingStage === "director" && app.status !== "pending_director" ? " (fast-track final decision)" : ""}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button key={o.v} type="button" onClick={() => setDecision(o.v)} className={`py-2.5 rounded-2xl text-[11px] font-black transition-all cursor-pointer ${decision === o.v ? `${o.c} text-white shadow-lg scale-[1.02]` : "bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey"}`}>
            {o.l}
          </button>
        ))}
      </div>
      {decision === "partially_recommended" && (
        <Field label="Recommended days"><input type="number" min={0.5} step={0.5} max={app.totalDays - 0.5} value={days} onChange={(e) => setDays(e.target.value)} className={inputCls} /></Field>
      )}
      {decision === "partially_approved" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Approved from"><input type="date" value={from} min={app.fromDate} max={app.toDate} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></Field>
          <Field label="Approved to"><input type="date" value={to} min={from} max={app.toDate} onChange={(e) => setTo(e.target.value)} className={inputCls} /></Field>
        </div>
      )}
      <Field label="Remarks" required={decision !== "recommended" && decision !== "approved"}>
        <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={inputCls} placeholder="Your remarks for the record" />
      </Field>
      <Btn onClick={submit} loading={busy} className="w-full">Submit decision</Btn>
    </div>
  );
}

// Paper-style leave form for print / PDF.
export function printLeaveForm(app, company) {
  const rec = app.previousLeaveRecord;
  const stageRow = (key, label) => {
    const a = (app.actions || []).find((x) => x.stage === key);
    return [label, a ? titleCase(a.decision) : "—", a?.recommendedDays ?? "", a?.remarks || "", a ? `${a.actorName} (${a.actorRole})` : "", a ? fmtDateTime(a.actedAt) : ""];
  };
  const body = `
    <div class="grid">
      <div><b>Application No:</b> ${esc(app.applicationNo)}</div><div><b>Applied on:</b> ${esc(fmtDateTime(app.createdAt))}</div>
      <div><b>Employee:</b> ${esc(app.employeeName)} (${esc(app.employeeCode)})</div><div><b>Designation:</b> ${esc(app.designation)}</div>
      <div><b>Branch:</b> ${esc(app.branch)}</div><div><b>Department:</b> ${esc(app.department)}</div>
      <div><b>Leave Type:</b> ${esc(app.leaveTypeName)}${app.isPaid ? "" : " (Unpaid)"}</div><div><b>Total Days:</b> ${esc(app.totalDays)}</div>
      <div><b>Leave Date:</b> ${esc(fmtDate(app.fromDate))} to ${esc(fmtDate(app.toDate))}</div><div><b>Contact:</b> ${esc(app.contactDuringLeave || "—")}</div>
      <div style="grid-column: span 2"><b>Reason:</b> ${esc(app.reason)}</div>
      <div style="grid-column: span 2"><b>Attachments:</b> ${esc((app.attachments || []).map((a) => a.name).join(", ") || "None")}</div>
    </div>
    <h2>Previous Leave Record (${esc(rec?.year || "")})</h2>
    ${tableHtml(["Leave Type", "Allowed", "Taken", "Remaining"], (rec?.balances || []).map((b) => [b.leaveTypeName, b.allowed, b.taken, b.remaining]))}
    <p class="sub">Last leave: ${rec?.lastLeave ? esc(`${fmtDate(rec.lastLeave.fromDate)} – ${fmtDate(rec.lastLeave.toDate)} (${rec.lastLeave.days} days, ${rec.lastLeave.leaveTypeName})`) : "None"}</p>
    <h2>Remarks & Recommendation</h2>
    ${tableHtml(["Stage", "Recommendation / Decision", "Days", "Remarks", "By", "Date"], [stageRow("branch", "Floor In-Charge / Branch"), stageRow("hr", "Manager (Admin & HR)"), stageRow("director", "Director (Final Approval)")])}
    <div class="grid">
      <div><b>Final Status:</b> ${esc(titleCase(app.status))}</div>
      <div><b>Approved Days:</b> ${esc(app.approvedDays || 0)} ${app.approvedFromDate ? esc(`(${fmtDate(app.approvedFromDate)} – ${fmtDate(app.approvedToDate)})`) : ""}</div>
    </div>
    <div class="sign"><div>Applicant</div><div>Floor In-Charge</div><div>Manager (Admin & HR)</div><div>Director</div></div>`;
  printDocument({ title: "Leave Application Form", subtitle: app.applicationNo, company, bodyHtml: body });
}

export function useLeaveTypesActive(leaveTypes) {
  return useMemo(() => (leaveTypes || []).filter((t) => t.status !== "inactive"), [leaveTypes]);
}
