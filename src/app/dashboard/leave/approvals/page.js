"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiPaperclip } from "react-icons/fi";
import { MdApproval } from "react-icons/md";
import { useHrQuery, fmtDate, titleCase } from "@/hooks/useHr";
import { Avatar, Badge, Btn, Card, EmptyState, Loading, PageHeader, Tabs } from "@/components/hr/HrUi";
import { LeaveStepper } from "@/components/hr/LeaveParts";
import LeaveDecisionModal from "@/components/hr/modals/LeaveDecisionModal";

const STAGE_LABEL = { branch: "Floor In-Charge / Branch", hr: "Manager (Admin & HR)", director: "Director" };

export default function LeaveApprovalsPage() {
  const { data, loading, refetch } = useHrQuery("/leave/pending-for-me");
  const [filter, setFilter] = useState("all");
  const [acting, setActing] = useState(null);
  const stages = data?.stages || [];
  const items = (data?.data || []).filter((a) => filter === "all" || a.status === `pending_${filter}`);

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader
        icon={<MdApproval />}
        title="Leave Approvals"
        subtitle={stages.length ? `You can act as: ${stages.map((s) => STAGE_LABEL[s]).join(", ")}` : "Your role is not configured for any leave approval stage."}
      />
      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[{ value: "all", label: "All", count: data?.data?.length || 0 }, ...["branch", "hr", "director"].map((s) => ({ value: s, label: STAGE_LABEL[s], count: (data?.data || []).filter((a) => a.status === `pending_${s}`).length }))]}
      />
      <Card bodyClassName="p-4">
        {loading ? (
          <Loading />
        ) : !items.length ? (
          <EmptyState icon={<FiCheckCircle />} title="All caught up" text="No applications are waiting for you." />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <AnimatePresence>
              {items.map((a, i) => (
                <motion.div key={a._id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }} className="p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={a.employeeName} photo={a.employeePhoto} />
                      <div>
                        <div className="text-sm font-black">{a.employeeName}</div>
                        <div className="text-[10px] text-brand-dark-grey">{a.designation} · {a.branch}</div>
                      </div>
                    </div>
                    <Badge status={a.status} />
                  </div>
                  <div className="text-xs font-bold">
                    {a.leaveTypeName} · <span className="text-brand-gold">{a.totalDays} day{a.totalDays === 1 ? "" : "s"}</span> · {fmtDate(a.fromDate)} → {fmtDate(a.toDate)}
                  </div>
                  <p className="text-[12px] text-brand-dark-grey dark:text-zinc-300 line-clamp-2">{a.reason}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold text-brand-dark-grey">
                    <span>Taken this year: {a.previousLeaveRecord?.totalTakenThisYear ?? 0} days</span>
                    {a.attachments?.length > 0 && <span className="flex items-center gap-1"><FiPaperclip /> {a.attachments.length} attachment(s)</span>}
                    {a.actions?.map((x) => <span key={x.stage}>{STAGE_LABEL[x.stage]}: {titleCase(x.decision)}</span>)}
                  </div>
                  <LeaveStepper app={a} compact />
                  <div className="flex gap-2 justify-end">
                    <Link href={`/dashboard/leave/${a._id}`}><Btn variant="ghost" size="sm">Open</Btn></Link>
                    <Btn size="sm" onClick={() => setActing(a._id)}>Decide</Btn>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Card>

      <LeaveDecisionModal applicationId={acting} onClose={() => setActing(null)} onDone={() => { setActing(null); refetch(); }} />
    </div>
  );
}
