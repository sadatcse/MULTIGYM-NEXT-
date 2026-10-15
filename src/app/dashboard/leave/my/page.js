"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiPlus, FiXCircle } from "react-icons/fi";
import { MdEventAvailable } from "react-icons/md";
import { useHrLookups, useHrMutation, useHrQuery, fmtDate } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Loading, PageHeader } from "@/components/hr/HrUi";
import { BalanceStrip, LeaveStepper } from "@/components/hr/LeaveParts";
import LeaveApplyModal from "@/components/hr/modals/LeaveApplyModal";

export default function MyLeavePage() {
  const { leaveTypes } = useHrLookups({ employees: false });
  const [open, setOpen] = useState(false);
  const balance = useHrQuery("/leave/my-balance");
  const list = useHrQuery("/leave/my", { limit: 50 });
  const { run } = useHrMutation();
  const apps = list.data?.data || [];

  const refresh = () => {
    balance.refetch();
    list.refetch();
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      <PageHeader
        icon={<MdEventAvailable />}
        title="My Leave"
        subtitle="Apply for leave and follow it through Floor In-Charge → Manager (Admin & HR) → Director approval."
        actions={<Btn variant="gold" onClick={() => setOpen(true)}><FiPlus /> Apply for leave</Btn>}
      />
      {balance.loading ? <Loading rows={2} /> : <BalanceStrip balances={balance.data?.data || []} />}

      <Card title="My applications" bodyClassName="p-4">
        {list.loading ? (
          <Loading />
        ) : !apps.length ? (
          <EmptyState title="No leave applications yet" action={<Btn onClick={() => setOpen(true)}><FiPlus /> Apply now</Btn>} />
        ) : (
          <div className="space-y-3">
            {apps.map((a, i) => (
              <motion.div key={a._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 hover:border-brand-gold/60 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <Link href={`/dashboard/leave/${a._id}`} className="text-sm font-black hover:text-brand-gold">{a.leaveTypeName} · {a.totalDays} day{a.totalDays === 1 ? "" : "s"}</Link>
                    <div className="text-[11px] text-brand-dark-grey">{a.applicationNo} · {fmtDate(a.fromDate)} → {fmtDate(a.toDate)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={a.status} />
                    {a.status === "approved" && a.approvedDays !== a.totalDays && <Badge tone="amber">{a.approvedDays} days approved</Badge>}
                    {a.status.startsWith("pending") && (
                      <Btn size="sm" variant="ghost" onClick={async () => { if (confirm("Withdraw this application?") && (await run("post", `/leave/${a._id}/cancel`, { reason: "Withdrawn by employee" }))) refresh(); }}>
                        <FiXCircle /> Withdraw
                      </Btn>
                    )}
                  </div>
                </div>
                <LeaveStepper app={a} />
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <LeaveApplyModal isOpen={open} onClose={() => setOpen(false)} leaveTypes={leaveTypes} onSaved={() => { setOpen(false); refresh(); }} />
    </div>
  );
}
