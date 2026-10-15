"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiTool, FiUserX, FiUsers } from "react-icons/fi";
import { MdApproval, MdAssignment, MdBeachAccess, MdGavel, MdShoppingCart } from "react-icons/md";
import { useHrQuery } from "@/hooks/useHr";

// Animated count-up number.
function CountUp({ value }) {
  return (
    <motion.span key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
      {value ?? "—"}
    </motion.span>
  );
}

function Tile({ href, icon, label, value, tone, index }) {
  // [icon tile, value colour, hover border]
  const tones = {
    gold: ["bg-brand-gold/10 text-brand-gold", "text-brand-black dark:text-brand-white", "hover:border-brand-gold/50"],
    green: ["bg-emerald-500/10 text-emerald-500", "text-emerald-500", "hover:border-emerald-500/50"],
    red: ["bg-rose-500/10 text-rose-500", "text-rose-500", "hover:border-rose-500/50"],
    blue: ["bg-blue-500/10 text-blue-500", "text-blue-500", "hover:border-blue-500/50"],
    amber: ["bg-amber-500/10 text-amber-500", "text-amber-500", "hover:border-amber-500/50"],
    purple: ["bg-purple-500/10 text-purple-500", "text-purple-500", "hover:border-purple-500/50"],
    slate: ["bg-zinc-500/10 text-zinc-500", "text-brand-black dark:text-brand-white", "hover:border-zinc-500/50"],
  };
  const [iconCls, valueCls, hoverCls] = tones[tone] || tones.gold;
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.05 }}>
      <Link href={href} className={`group block p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite dark:bg-brand-midnight transition-all duration-300 ${hoverCls}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block truncate">{label}</span>
            <span className={`text-2xl font-black mt-1 block ${valueCls}`}><CountUp value={value} /></span>
          </div>
          <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform ${iconCls}`}>{icon}</span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HrSummaryWidget() {
  const { data, loading } = useHrQuery("/hr-dashboard/summary");
  const s = data?.data;
  const t = s?.totals || {};
  if (loading && !s) {
    return <div className="h-48 rounded-3xl bg-brand-white dark:bg-brand-charcoal animate-pulse" />;
  }
  if (!s) return null;
  const self = s.scope === "self";

  return (
    <div className="bg-brand-white dark:bg-brand-charcoal p-5 sm:p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-brand-black dark:text-brand-white">Today at a glance</h2>
          <p className="text-xs text-brand-dark-grey">{s.date} · {s.scope === "all" ? "All branches" : s.scope === "branch" ? "Your branch" : "Your records"}</p>
        </div>
        {!self && <Link href="/dashboard/branches" className="text-xs font-black text-brand-gold hover:underline">Branch overview →</Link>}
      </div>

      {!self && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Tile index={0} href="/dashboard/employee" icon={<FiUsers />} label="Total Employees" value={t.totalEmployees} tone="gold" />
          <Tile index={1} href="/dashboard/attendance" icon={<FiCheckCircle />} label="Present Today" value={t.present} tone="green" />
          <Tile index={2} href="/dashboard/attendance" icon={<FiUserX />} label="Absent / Not In" value={t.absent} tone="red" />
          <Tile index={3} href="/dashboard/leave" icon={<MdBeachAccess />} label="On Leave" value={t.onLeave} tone="blue" />
          <Tile index={4} href="/dashboard/attendance" icon={<FiClock />} label="Late" value={t.late} tone="amber" />
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Tile index={5} href={self ? "/dashboard/leave/my" : "/dashboard/leave/approvals"} icon={<MdApproval />} label="Pending Leave" value={t.pendingLeave} tone="purple" />
        <Tile index={6} href="/dashboard/tasks/my-tasks" icon={<MdAssignment />} label="Pending Tasks" value={t.pendingTasks} tone="blue" />
        <Tile index={7} href="/dashboard/tasks/follow-up" icon={<FiAlertTriangle />} label="Overdue Tasks" value={t.overdueTasks} tone="red" />
        <Tile index={8} href="/dashboard/maintenance/requests" icon={<FiTool />} label="Open Maintenance" value={t.openMaintenance} tone="amber" />
        {!self && <Tile index={9} href="/dashboard/requisitions" icon={<MdShoppingCart />} label="Open Requisitions" value={t.openRequisitions} tone="slate" />}
        {!self && <Tile index={10} href="/dashboard/discipline" icon={<MdGavel />} label="Open Cases" value={t.openCases} tone="slate" />}
      </div>

      {!self && s.byBranch?.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
              <tr>
                {["Branch", "Staff", "Present", "Absent", "Leave", "Late", "Missing punch", "Pending leave", "Attendance"].map((h) => <th key={h} className="py-4 px-4 whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 font-bold [&>tr:hover]:bg-brand-gold/5 dark:[&>tr:hover]:bg-brand-gold/10">
              {s.byBranch.map((b, i) => {
                const pct = b.totalEmployees ? Math.round((b.present / b.totalEmployees) * 100) : 0;
                return (
                  <motion.tr key={b.branch} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                    <td className="py-3.5 px-4 font-black">{b.branch}</td>
                    <td className="px-4">{b.totalEmployees}</td>
                    <td className="px-4 text-emerald-500">{b.present}</td>
                    <td className="px-4 text-red-500">{b.absent}</td>
                    <td className="px-4 text-blue-500">{b.onLeave}</td>
                    <td className="px-4 text-amber-500">{b.late}</td>
                    <td className="px-4">{b.missingPunch}</td>
                    <td className="px-4">{b.pendingLeave}</td>
                    <td className="px-4 w-40">
                      <div className="h-2 rounded-full bg-brand-offwhite dark:bg-brand-midnight overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }} className="h-full bg-emerald-500" />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
