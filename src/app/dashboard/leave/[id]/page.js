"use client";

import { useContext } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiPrinter, FiXCircle } from "react-icons/fi";
import { MdBeachAccess } from "react-icons/md";
import { AuthContext } from "@/providers/AuthProvider";
import { useHrConfig, useHrMutation, useHrQuery, fmtDate, fmtDateTime, titleCase } from "@/hooks/useHr";
import { Attachments, Avatar, Badge, Btn, Card, Loading, PageHeader, Table, Td, Timeline } from "@/components/hr/HrUi";
import { DECISION_TONE, LeaveDecisionPanel, LeaveStepper, printLeaveForm } from "@/components/hr/LeaveParts";

const STAGE_LABEL = { branch: "Floor In-Charge / Branch Verification", hr: "Manager (Admin & HR) Verification", director: "Director Approval" };

export default function LeaveDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { company } = useContext(AuthContext);
  const { me } = useHrConfig();
  const { data, loading, error, refetch } = useHrQuery(`/leave/${id}`);
  const { run } = useHrMutation();
  const a = data?.data;

  if (loading) return <Loading rows={8} />;
  if (error || !a) return <Card><p className="text-sm font-bold text-red-500">{error || "Not found"}</p></Card>;

  const own = me?.id === String(a.employee);
  const canCancel = (own && a.status.startsWith("pending")) || (me?.scope === "all" && ["pending_branch", "pending_hr", "pending_director", "approved"].includes(a.status));
  const rec = a.previousLeaveRecord;

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      <PageHeader
        icon={<MdBeachAccess />}
        title={`${a.leaveTypeName} — ${a.totalDays} day${a.totalDays === 1 ? "" : "s"}`}
        subtitle={`${a.applicationNo} · applied ${fmtDateTime(a.createdAt)}${a.appliedBy?.onBehalf ? ` by ${a.appliedBy.name} on behalf` : ""}`}
        actions={
          <>
            <Btn variant="glass" size="sm" onClick={() => router.back()}><FiArrowLeft /> Back</Btn>
            <Btn variant="gold" size="sm" onClick={() => printLeaveForm(a, company)}><FiPrinter /> Print / PDF</Btn>
            {canCancel && (
              <Btn variant="danger" size="sm" onClick={async () => { const r = prompt("Reason for cancellation:"); if (r !== null && (await run("post", `/leave/${a._id}/cancel`, { reason: r }))) refetch(); }}>
                <FiXCircle /> Cancel
              </Btn>
            )}
          </>
        }
      />

      <Card bodyClassName="p-5"><LeaveStepper app={a} /></Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card title="Application">
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={a.employeeName} photo={a.employeePhoto} size={48} />
              <div>
                <Link href={`/dashboard/employee/history?employee=${a.employee}`} className="text-base font-black hover:text-brand-gold">{a.employeeName}</Link>
                <div className="text-[11px] text-brand-dark-grey">{a.employeeCode} · {a.designation} · {a.department} · {a.branch}</div>
              </div>
              <div className="ml-auto"><Badge status={a.status} /></div>
            </div>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              {[
                ["Leave type", `${a.leaveTypeName}${a.isPaid ? "" : " (unpaid)"}`],
                ["Leave date", `${fmtDate(a.fromDate)} → ${fmtDate(a.toDate)}${a.halfDay ? " (half day)" : ""}`],
                ["Total days", a.totalDays],
                ["Approved", a.status === "approved" ? `${a.approvedDays} day(s) · ${fmtDate(a.approvedFromDate)} → ${fmtDate(a.approvedToDate)}` : "—"],
                ["Contact during leave", a.contactDuringLeave || "—"],
                ["Duty handover to", a.handoverTo || "—"],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-dashed border-brand-beige/60 dark:border-brand-dark-grey/60 pb-2">
                  <dt className="text-[10px] font-black uppercase text-brand-dark-grey dark:text-brand-gold-light">{k}</dt>
                  <dd className="font-bold mt-0.5">{v}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-black uppercase text-brand-dark-grey dark:text-brand-gold-light">Reason</dt>
                <dd className="font-semibold mt-0.5 whitespace-pre-wrap">{a.reason}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-black uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">Attachments</dt>
                <Attachments value={a.attachments || []} readOnly />
              </div>
              {a.cancelReason && <div className="sm:col-span-2 text-red-500 font-bold">Cancelled: {a.cancelReason}</div>}
            </dl>
          </Card>

          <Card title={`Previous leave record (${rec?.year || ""})`} subtitle={rec?.lastLeave ? `Last leave: ${fmtDate(rec.lastLeave.fromDate)} → ${fmtDate(rec.lastLeave.toDate)} · ${rec.lastLeave.days} days ${rec.lastLeave.leaveTypeName}` : "No earlier approved leave"} bodyClassName="p-0">
            <Table head={["Leave type", "Allowed", "Taken (at application)", "Remaining"]}>
              {(rec?.balances || []).map((b) => (
                <tr key={b.leaveTypeId}><Td>{b.leaveTypeName}</Td><Td>{b.allowed}</Td><Td>{b.taken}</Td><Td className={b.remaining <= 0 ? "text-red-500" : ""}>{b.remaining}</Td></tr>
              ))}
            </Table>
          </Card>
        </div>

        <div className="space-y-5">
          {a.canAct && (
            <Card title="Your decision"><LeaveDecisionPanel app={a} onDone={refetch} /></Card>
          )}
          <Card title="Remarks & recommendation trail">
            {a.actions?.length ? (
              <Timeline
                items={a.actions.map((x, i) => ({
                  key: i,
                  title: STAGE_LABEL[x.stage],
                  badge: <span className={`text-[10px] font-black ${DECISION_TONE[x.decision] || ""}`}>{titleCase(x.decision)}{x.recommendedDays && x.decision.startsWith("partially") ? ` · ${x.recommendedDays} days` : ""}</span>,
                  meta: `${x.actorName} (${x.actorRole}) · ${fmtDateTime(x.actedAt)}`,
                  body: x.remarks,
                  dot: /not_|rejected/.test(x.decision) ? "bg-red-500" : x.decision.startsWith("partially") ? "bg-amber-500" : "bg-emerald-500",
                }))}
              />
            ) : (
              <p className="text-xs text-brand-dark-grey font-bold">Waiting for the first verification.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
