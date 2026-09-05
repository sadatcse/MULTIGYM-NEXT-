"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useTaskApi from "@/hooks/useTaskApi";
import { toast } from "react-toastify";
import {
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiUsers,
  FiActivity,
  FiArrowRight,
  FiArrowUpRight,
  FiFileText,
  FiRefreshCw,
  FiCalendar,
  FiFilter,
} from "react-icons/fi";
import { MdAssignment, MdPendingActions, MdPriorityHigh } from "react-icons/md";

const SOURCE_COLORS = {
  "MD Sir": "from-purple-900/40 to-purple-600/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
  "Director Sir": "from-indigo-900/40 to-indigo-600/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400",
  Management: "from-blue-900/40 to-blue-600/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  "Admin & HR": "from-amber-900/40 to-amber-600/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
};

export default function TaskExecutiveDashboard() {
  const { getDashboardStats } = useTaskApi();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setData(res);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      toast.error("Failed to load task dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, [getDashboardStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const overview = data?.overview || {
    total: 0,
    pending: 0,
    inProgress: 0,
    waitingApproval: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
    dueSoon: 0,
  };

  const sources = data?.sourceBreakdown || [];
  const criticalTasks = data?.criticalTasks || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6 w-full max-w-[1700px] mx-auto pb-16 font-sans">
      {/* Header */}
      <Mtitle
        title="Management Instruction Dashboard"
        subtitle="Executive command center for monitoring directives from MD Sir, Director Sir, and Management."
        rightcontent={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              className="p-2.5 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold hover:border-brand-gold transition-colors flex items-center gap-1.5"
            >
              <FiRefreshCw className="text-brand-gold" /> Refresh
            </button>
            <Link
              href="/dashboard/tasks/follow-up"
              className="px-4 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-black shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all flex items-center gap-1.5"
            >
              <FiAlertTriangle /> Follow-Up Queue ({overview.overdue + overview.waitingApproval})
            </Link>
          </div>
        }
      />

      {loading ? (
        <SkeletonLoading count={4} />
      ) : (
        <>
          {/* Summary Metric Cards (6 KPI Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Tasks */}
            <Link
              href="/dashboard/tasks"
              className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/60 transition-all flex flex-col justify-between"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
                Total Directives
              </span>
              <span className="text-3xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {overview.total}
              </span>
              <span className="text-[10px] font-bold text-brand-gold mt-1 flex items-center gap-1">
                View Master List <FiArrowRight />
              </span>
            </Link>

            {/* Pending */}
            <Link
              href="/dashboard/tasks?status=PENDING"
              className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/60 transition-all flex flex-col justify-between"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
                Pending
              </span>
              <span className="text-3xl font-black text-gray-500 mt-1 block">
                {overview.pending}
              </span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">Not started yet</span>
            </Link>

            {/* In Progress */}
            <Link
              href="/dashboard/tasks?status=IN_PROGRESS"
              className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 shadow-sm hover:border-blue-500/50 transition-all flex flex-col justify-between"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                In Progress
              </span>
              <span className="text-3xl font-black text-blue-500 mt-1 block">
                {overview.inProgress}
              </span>
              <span className="text-[10px] font-bold text-blue-500/80 mt-1">Active execution</span>
            </Link>

            {/* Awaiting Approval */}
            <Link
              href="/dashboard/tasks?status=WAITING_FOR_APPROVAL"
              className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 shadow-sm hover:border-amber-500/50 transition-all flex flex-col justify-between"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Waiting Approval
              </span>
              <span className="text-3xl font-black text-amber-500 mt-1 block">
                {overview.waitingApproval}
              </span>
              <span className="text-[10px] font-bold text-amber-500/80 mt-1">Ready for review</span>
            </Link>

            {/* Completed */}
            <Link
              href="/dashboard/tasks?status=COMPLETED"
              className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm hover:border-emerald-500/50 transition-all flex flex-col justify-between"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Completed
              </span>
              <span className="text-3xl font-black text-emerald-500 mt-1 block">
                {overview.completed}
              </span>
              <span className="text-[10px] font-bold text-emerald-500/80 mt-1">Directives fulfilled</span>
            </Link>

            {/* Overdue */}
            <Link
              href="/dashboard/tasks/follow-up"
              className="p-4 rounded-3xl bg-red-500/10 border border-red-500/30 shadow-sm hover:border-red-500/60 transition-all flex flex-col justify-between"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 block">
                Overdue
              </span>
              <span className="text-3xl font-black text-red-500 mt-1 block">
                {overview.overdue}
              </span>
              <span className="text-[10px] font-black text-red-500/80 mt-1 animate-pulse">Action required</span>
            </Link>
          </div>

          {/* Section 2: Source-Wise Directive Breakdown (MD Sir, Director Sir, Management, Admin & HR) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-dark-grey flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-gold" /> Directive Source Distribution
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {["MD Sir", "Director Sir", "Management", "Admin & HR"].map((src) => {
                const srcData = sources.find((s) => s._id === src) || {
                  count: 0,
                  completed: 0,
                  inProgress: 0,
                  overdue: 0,
                };
                const style = SOURCE_COLORS[src] || SOURCE_COLORS["Management"];
                const compRate = srcData.count > 0 ? Math.round((srcData.completed / srcData.count) * 100) : 0;

                return (
                  <Link
                    key={src}
                    href={`/dashboard/tasks?source=${encodeURIComponent(src)}`}
                    className={`p-5 rounded-3xl bg-gradient-to-br ${style} border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-brand-black dark:text-brand-white">
                        {src}
                      </span>
                      <FiArrowUpRight className="text-lg opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>

                    <div>
                      <span className="text-3xl font-black text-brand-black dark:text-brand-white block">
                        {srcData.count} <span className="text-xs font-bold text-brand-dark-grey">Tasks</span>
                      </span>
                    </div>

                    <div className="pt-2 border-t border-brand-beige/20 dark:border-brand-dark-grey/20 flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-500 font-extrabold">{srcData.completed} Done</span>
                      <span className="text-blue-500 font-extrabold">{srcData.inProgress} In Prog</span>
                      {srcData.overdue > 0 && (
                        <span className="text-red-500 font-black">{srcData.overdue} Overdue</span>
                      )}
                      <span className="text-brand-dark-grey font-mono">{compRate}%</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section 3: Critical Directives (Left) + Live Activity Stream (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Critical Tasks */}
            <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiAlertTriangle className="text-red-500 text-lg" /> Critical & Urgent Directives
                </h3>
                <Link
                  href="/dashboard/tasks/follow-up"
                  className="text-xs font-extrabold text-brand-gold hover:underline flex items-center gap-1"
                >
                  View Follow-Up <FiArrowRight />
                </Link>
              </div>

              {criticalTasks.length > 0 ? (
                <div className="space-y-3">
                  {criticalTasks.map((t) => (
                    <Link
                      key={t._id}
                      href={`/dashboard/tasks/${t._id}`}
                      className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 hover:border-brand-gold/60 transition-all flex items-center justify-between gap-3 text-xs block"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500 text-white">
                            {t.priority}
                          </span>
                          <span className="text-[9px] font-bold text-brand-gold">
                            {t.instructionSource}
                          </span>
                        </div>
                        <div className="font-extrabold text-sm text-brand-black dark:text-brand-white truncate">
                          {t.title}
                        </div>
                        <div className="text-[10px] text-brand-dark-grey">
                          Deadline: {new Date(t.deadline).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-brand-beige/30 dark:bg-brand-charcoal text-brand-dark-grey">
                          {t.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-brand-dark-grey">
                  No critical tasks pending. All high priority instructions are on track.
                </div>
              )}
            </div>

            {/* Recent Activity Audit Stream */}
            <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
                <FiActivity className="text-brand-gold text-lg" /> Real-Time Directive Activity Stream
              </h3>

              {recentActivity.length > 0 ? (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {recentActivity.map((act) => (
                    <div
                      key={act._id}
                      className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/30 dark:border-brand-dark-grey/30 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="font-extrabold text-brand-black dark:text-brand-white">
                          {act.actor?.name || "Staff"}
                        </span>{" "}
                        <span className="text-brand-dark-grey font-medium">
                          {act.comment || act.eventType?.replace(/_/g, " ")}
                        </span>
                        {act.task?.title && (
                          <span className="text-[10px] text-brand-gold block font-bold truncate">
                            Task: {act.task.title}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-brand-dark-grey shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-brand-dark-grey">
                  No recent audit events logged.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
