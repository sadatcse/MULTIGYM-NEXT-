"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiCheckSquare, FiFileText, FiLock, FiPlus, FiPrinter, FiUnlock } from "react-icons/fi";
import { MdGavel } from "react-icons/md";
import { AuthContext } from "@/providers/AuthProvider";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, fmtDate, fmtDateTime, titleCase } from "@/hooks/useHr";
import { Attachments, Avatar, Badge, Btn, Card, Loading, PageHeader, Timeline } from "@/components/hr/HrUi";
import CaseEntryModal from "@/components/hr/modals/CaseEntryModal";
import CaseDecisionModal from "@/components/hr/modals/CaseDecisionModal";
import { printDocument, tableHtml, escapeHtml as esc } from "@/lib/hrPrint";

const ENTRY_DOT = { warning_issued: "bg-amber-500", show_cause_issued: "bg-purple-500", reply_received: "bg-blue-500", investigation: "bg-cyan-500", hearing: "bg-cyan-500", management_decision: "bg-red-500", administrative_action: "bg-red-400", closed: "bg-zinc-500" };

export default function CaseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { company } = useContext(AuthContext);
  const permissions = usePagePermission();
  const { canEdit } = permissions;
  const { me } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const { data, loading, error, refetch } = useHrQuery(`/discipline/${id}`);
  const { run } = useHrMutation();
  const [entry, setEntry] = useState(null);
  const [decision, setDecision] = useState(null);
  const c = data?.data;

  if (loading) return <Loading rows={8} />;
  if (error || !c) return <Card><p className="text-sm font-bold text-red-500">{error || "Not found"}</p></Card>;
  const closed = c.status === "closed";

  const print = () =>
    printDocument({
      title: `Disciplinary Case ${c.caseNo}`,
      subtitle: `${titleCase(c.caseType)} — ${c.subject}`,
      company,
      bodyHtml: `<div class="grid"><div><b>Employee:</b> ${esc(c.employeeName)} (${esc(c.employeeCode)})</div><div><b>Designation:</b> ${esc(c.designation)}</div><div><b>Branch:</b> ${esc(c.branch)}</div><div><b>Incident date:</b> ${esc(fmtDate(c.incidentDate))}</div><div><b>Severity:</b> ${esc(c.severity)}</div><div><b>Status:</b> ${esc(titleCase(c.status))}</div><div style="grid-column:span 2"><b>Description:</b> ${esc(c.description)}</div></div>
      <h2>Case history</h2>${tableHtml(["Date", "Entry", "Details", "By"], c.entries.map((e) => [fmtDate(e.date), titleCase(e.type), e.text, e.by?.name]))}
      ${c.decision ? `<h2>Management decision</h2><div class="grid"><div><b>Action:</b> ${esc(titleCase(c.decision.action))}</div><div><b>Effective:</b> ${esc(fmtDate(c.decision.effectiveDate))}</div><div style="grid-column:span 2"><b>Summary:</b> ${esc(c.decision.summary)}</div><div><b>Decided by:</b> ${esc(c.decision.decidedBy?.name)}</div></div>` : ""}
      <div class="sign"><div>Employee</div><div>HR</div><div>Management</div></div>`,
    });

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      <PageHeader
        icon={<MdGavel />}
        title={`${c.caseNo} · ${c.subject}`}
        subtitle={`${titleCase(c.caseType)} · incident ${fmtDate(c.incidentDate)} · opened by ${c.createdBy?.name || "—"}`}
        actions={
          <>
            <Btn variant="glass" size="sm" onClick={() => router.back()}><FiArrowLeft /> Back</Btn>
            <Btn variant="gold" size="sm" onClick={print}><FiPrinter /> Print</Btn>
            <Link href="/dashboard/hr-letters/create"><Btn variant="glass" size="sm"><FiFileText /> Issue letter</Btn></Link>
          </>
        }
      />
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-3">
              <Avatar name={c.employeeName} photo={c.employeePhoto} size={52} />
              <div>
                <Link href={`/dashboard/employee/history?employee=${c.employee}`} className="text-base font-black hover:text-brand-gold">{c.employeeName}</Link>
                <div className="text-[11px] text-brand-dark-grey">{c.employeeCode} · {c.designation} · {c.branch}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge status={c.status} /> <Badge status={c.severity}>{c.severity} severity</Badge> {c.confidential && <Badge tone="red">Confidential</Badge>}
            </div>
            <p className="text-sm font-semibold mt-4 whitespace-pre-wrap">{c.description || "—"}</p>
            <div className="text-[11px] font-bold text-brand-dark-grey mt-3 space-y-1">
              {c.complainant && <div>Complainant: {c.complainant}</div>}
              {c.replyDeadline && <div>Reply deadline: {fmtDate(c.replyDeadline)}</div>}
              {c.letterNumber && <div>Letter no: {c.letterNumber}</div>}
            </div>
            <div className="mt-4"><Attachments value={c.attachments} readOnly /></div>
          </Card>

          {c.decision && (
            <Card title="Management decision">
              <div className="text-lg font-black text-red-500">{titleCase(c.decision.action)}</div>
              <p className="text-sm font-semibold mt-1">{c.decision.summary}</p>
              <p className="text-[11px] text-brand-dark-grey mt-2">Effective {fmtDate(c.decision.effectiveDate)} · {c.decision.decidedBy?.name} ({c.decision.decidedBy?.role}) · {fmtDateTime(c.decision.decidedAt)}</p>
            </Card>
          )}

          <Card title={`Prior cases (${c.priorCases?.length || 0})`}>
            {!c.priorCases?.length ? <p className="text-xs font-bold text-brand-dark-grey">No previous record.</p> : (
              <ul className="space-y-2">
                {c.priorCases.map((p) => (
                  <li key={p._id}><Link href={`/dashboard/discipline/${p._id}`} className="text-xs font-black hover:text-brand-gold">{p.caseNo} · {titleCase(p.caseType)}</Link><div className="text-[10px] text-brand-dark-grey">{p.subject} · {titleCase(p.status)}{p.decision ? ` · ${titleCase(p.decision.action)}` : ""}</div></li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card
          className="lg:col-span-2"
          title="Case history"
          actions={
            canEdit && (
              <>
                {!closed && <Btn size="sm" variant="ghost" onClick={() => setEntry(true)}><FiPlus /> Add entry</Btn>}
                {!closed && me?.scope === "all" && <Btn size="sm" variant="primary" onClick={() => setDecision(true)}><FiCheckSquare /> Record decision</Btn>}
                {me?.scope === "all" && (closed
                  ? <Btn size="sm" variant="ghost" onClick={async () => { if (await run("post", `/discipline/${c._id}/status`, { status: "open", remarks: "Case reopened" })) refetch(); }}><FiUnlock /> Reopen</Btn>
                  : <Btn size="sm" variant="ghost" onClick={async () => { const r = prompt("Closing remarks:"); if (r !== null && (await run("post", `/discipline/${c._id}/status`, { status: "closed", remarks: r || "Case closed" }))) refetch(); }}><FiLock /> Close case</Btn>)}
              </>
            )
          }
        >
          <Timeline
            items={[...c.entries].reverse().map((e) => ({
              key: e._id,
              title: titleCase(e.type),
              meta: `${fmtDate(e.date)} · ${e.by?.name} (${e.by?.role})`,
              dot: ENTRY_DOT[e.type],
              body: (
                <>
                  <p className="whitespace-pre-wrap">{e.text}</p>
                  {e.attachments?.length > 0 && <div className="mt-1.5"><Attachments value={e.attachments} readOnly /></div>}
                </>
              ),
            }))}
          />
        </Card>
      </div>

      <CaseEntryModal open={!!entry} caseId={c._id} permissions={permissions} onClose={() => setEntry(null)} onSaved={() => { setEntry(null); refetch(); }} />

      <CaseDecisionModal open={!!decision} caseId={c._id} branches={branches} isManagement={me?.scope === "all"} permissions={permissions} onClose={() => setDecision(null)} onSaved={() => { setDecision(null); refetch(); }} />
    </div>
  );
}
