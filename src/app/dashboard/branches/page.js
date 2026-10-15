"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiCheckCircle, FiClock, FiUserX, FiUsers } from "react-icons/fi";
import { MdBeachAccess, MdDomain } from "react-icons/md";
import { useHrQuery } from "@/hooks/useHr";
import { Card, Loading, PageHeader, StatCard } from "@/components/hr/HrUi";

const Bar = ({ label, value, max, tone = "bg-brand-gold" }) => (
  <div className="text-[11px] font-bold">
    <div className="flex justify-between"><span className="truncate">{label}</span><span>{value}</span></div>
    <div className="h-1.5 rounded-full bg-brand-offwhite dark:bg-brand-midnight overflow-hidden mt-0.5">
      <motion.div initial={{ width: 0 }} animate={{ width: `${max ? (value / max) * 100 : 0}%` }} transition={{ duration: 0.6 }} className={`h-full ${tone}`} />
    </div>
  </div>
);

export default function BranchOverviewPage() {
  const summary = useHrQuery("/hr-dashboard/summary");
  const strength = useHrQuery("/hr-dashboard/staff-strength");
  const s = summary.data?.data;
  const t = s?.totals || {};
  const strengthMap = useMemo(() => Object.fromEntries((strength.data?.data || []).map((b) => [b.branch, b])), [strength.data]);

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
      <PageHeader icon={<MdDomain />} title="Branch Overview" subtitle={`All branches combined — staff strength, today's attendance and leave (${s?.date || ""}).`} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={<FiUsers />} label="Total staff" value={t.totalEmployees ?? "—"} />
        <StatCard icon={<FiCheckCircle />} label="Present" value={t.present ?? "—"} tone="green" index={1} />
        <StatCard icon={<FiClock />} label="Late" value={t.late ?? "—"} tone="amber" index={2} />
        <StatCard icon={<FiUserX />} label="Absent / not in" value={t.absent ?? "—"} tone="red" index={3} />
        <StatCard icon={<MdBeachAccess />} label="On leave" value={t.onLeave ?? "—"} tone="blue" index={4} />
      </div>
      {summary.loading || strength.loading ? <Card><Loading rows={6} /></Card> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(s?.byBranch || []).map((b, i) => {
            const st = strengthMap[b.branch];
            const depts = Object.entries(st?.byDepartment || {}).sort((x, y) => y[1] - x[1]);
            const desig = Object.entries(st?.byDesignation || {}).sort((x, y) => y[1] - x[1]).slice(0, 6);
            const pct = b.totalEmployees ? Math.round((b.present / b.totalEmployees) * 100) : 0;
            return (
              <motion.div key={b.branch} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Card
                  title={b.branch}
                  subtitle={`${st?.active ?? b.totalEmployees} active staff${st?.multiBranch ? ` · ${st.multiBranch} multi-branch` : ""}`}
                  actions={<Link href="/dashboard/attendance" className="text-[11px] font-black text-brand-gold flex items-center gap-1">Attendance <FiArrowRight /></Link>}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5" className="stroke-brand-offwhite dark:stroke-brand-midnight" />
                        <motion.circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5" strokeLinecap="round" className="stroke-emerald-500" initial={{ strokeDasharray: "0 100" }} animate={{ strokeDasharray: `${pct} 100` }} transition={{ duration: 1 }} />
                      </svg>
                      <span className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-lg font-black">{pct}%</span><span className="text-[8px] font-black uppercase text-brand-dark-grey">present</span></span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-bold flex-1">
                      <span className="text-emerald-500">Present {b.present}</span>
                      <span className="text-amber-500">Late {b.late}</span>
                      <span className="text-red-500">Absent {b.absent}</span>
                      <span className="text-blue-500">Leave {b.onLeave}</span>
                      <span className="text-purple-500">Missing {b.missingPunch}</span>
                      <span className="text-brand-dark-grey">Pending leave {b.pendingLeave}</span>
                    </div>
                  </div>
                  {depts.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <div className="text-[10px] font-black uppercase text-brand-dark-grey">By department</div>
                      {depts.map(([k, v]) => <Bar key={k} label={k} value={v} max={depts[0][1]} />)}
                    </div>
                  )}
                  {desig.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {desig.map(([k, v]) => <span key={k} className="px-2 py-1 rounded-lg bg-brand-offwhite dark:bg-brand-midnight text-[10px] font-black">{k} · {v}</span>)}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
