"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useAccountabilityApi from "@/hooks/useAccountabilityApi";
import AttentionQueueCard from "@/components/accountability/AttentionQueueCard";
import CommunicationBadge from "@/components/accountability/CommunicationBadge";
import { toast } from "react-toastify";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiLayers,
  FiList,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiArrowRight,
} from "react-icons/fi";

export default function ManagementCommandCenterPage() {
  const router = useRouter();
  const { getDashboard, getAttentionQueue, processReminders } = useAccountabilityApi();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [attentionItems, setAttentionItems] = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, att] = await Promise.all([
        getDashboard(),
        getAttentionQueue("all"),
      ]);
      setDashboardData(dash);
      setAttentionItems(att?.items || []);
    } catch (err) {
      console.error("Failed to load Command Center:", err);
      toast.error("Failed to load Command Center metrics");
    } finally {
      setLoading(false);
    }
  }, [getDashboard, getAttentionQueue]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProcessReminders = async () => {
    setEvaluating(true);
    try {
      const res = await processReminders();
      toast.success(res?.message || "Reminder and overdue evaluation finished!");
      loadData();
    } catch (err) {
      console.error("Failed to evaluate reminders:", err);
      toast.error("Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/accountability/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const overview = dashboardData?.overview || {
    totalCommunications: 0,
    totalTasks: 0,
    activeTasks: 0,
    totalNotices: 0,
    unseenNotices: 0,
    pendingAcknowledgements: 0,
    dueToday: 0,
    overdue: 0,
    waitingApproval: 0,
    completed: 0,
    complianceHealthRate: 100,
  };

  const sourceBreakdown = dashboardData?.sourceBreakdown || [];
  const recentActivity = dashboardData?.recentActivity || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
              Enterprise Governance
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Health: {overview.complianceHealthRate}% Compliance
            </span>
          </div>
          <Mtitle
            title="Management Command Center"
            desc="Unified accountability, instruction lifecycle tracking, attention queue, and audit governance across MD Sir, Director, Management, and HR directives."
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-xs" />
            <input
              type="text"
              placeholder="Search all directives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white focus:outline-none focus:border-brand-gold w-48 sm:w-60"
            />
          </form>

          <button
            onClick={handleProcessReminders}
            disabled={evaluating}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 text-white font-black text-xs shadow-md hover:bg-emerald-600 transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Evaluate deadlines, reminders, and overdue escalations"
          >
            <FiClock className={evaluating ? "animate-spin" : ""} />
            <span>{evaluating ? "Evaluating..." : "Run Reminder Engine"}</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-dark-grey hover:text-brand-gold transition-colors"
            title="Refresh Command Center"
          >
            <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-brand-gold" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoading count={8} />
      ) : (
        <>
          {/* Top 8 KPI Overview Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-4 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
                Total Directives
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {overview.totalCommunications}
              </span>
              <span className="text-[10px] font-extrabold text-brand-gold mt-0.5 block">
                Notices & Tasks
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Active Tasks
              </span>
              <span className="text-2xl font-black text-indigo-500 mt-1 block">
                {overview.activeTasks}
              </span>
              <span className="text-[10px] font-extrabold text-indigo-600/80 dark:text-indigo-400/80 mt-0.5 block">
                In progress
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                Unseen Notices
              </span>
              <span className="text-2xl font-black text-blue-500 mt-1 block">
                {overview.unseenNotices}
              </span>
              <span className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-400/80 mt-0.5 block">
                Deliveries unread
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                Pending Ack
              </span>
              <span className="text-2xl font-black text-purple-500 mt-1 block">
                {overview.pendingAcknowledgements}
              </span>
              <span className="text-[10px] font-extrabold text-purple-600/80 dark:text-purple-400/80 mt-0.5 block">
                Awaiting staff sign
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Due Today
              </span>
              <span className="text-2xl font-black text-amber-500 mt-1 block">
                {overview.dueToday}
              </span>
              <span className="text-[10px] font-extrabold text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">
                Directives due
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                Overdue
              </span>
              <span className="text-2xl font-black text-rose-500 mt-1 block">
                {overview.overdue}
              </span>
              <span className="text-[10px] font-extrabold text-rose-600/80 dark:text-rose-400/80 mt-0.5 block">
                Action required
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Awaiting Signoff
              </span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {overview.waitingApproval}
              </span>
              <span className="text-[10px] font-extrabold text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">
                Proof submitted
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Completed
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {overview.completed}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">
                Fully verified
              </span>
            </div>
          </div>

          {/* Core Layout: Attention Queue & Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Requires Attention Priority Queue */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    Unified Attention Queue ({attentionItems.length})
                  </h3>
                </div>

                <Link
                  href="/dashboard/accountability/attention"
                  className="text-xs font-black text-brand-gold hover:underline flex items-center gap-1"
                >
                  <span>View Full Queue</span>
                  <FiArrowRight className="text-xs" />
                </Link>
              </div>

              {attentionItems.length === 0 ? (
                <div className="p-8 text-center bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-2">
                  <FiCheckCircle className="text-4xl text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-black text-brand-black dark:text-brand-white">
                    All Directives On Track
                  </h4>
                  <p className="text-xs text-brand-dark-grey">
                    No overdue tasks, pending acknowledgements, or waiting approvals at this time.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attentionItems.slice(0, 6).map((item) => (
                    <AttentionQueueCard key={`${item.type}-${item.id}`} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Source Breakdown & Live Activity Stream */}
            <div className="space-y-6">
              {/* Management Source Breakdown */}
              <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                  Instruction Sources
                </h4>

                <div className="space-y-2.5">
                  {sourceBreakdown.length === 0 ? (
                    <p className="text-xs text-brand-dark-grey">No source metrics recorded yet</p>
                  ) : (
                    sourceBreakdown.map((src) => (
                      <div
                        key={src.source}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40"
                      >
                        <span className="text-xs font-black text-brand-black dark:text-brand-white">
                          {src.source}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-brand-gold">
                            {src.total} total
                          </span>
                          {src.overdue > 0 && (
                            <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                              {src.overdue} overdue
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Activity Stream */}
              <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey flex items-center gap-1.5">
                    <FiActivity className="text-brand-gold text-sm" />
                    <span>Recent Activity</span>
                  </h4>

                  <Link
                    href="/dashboard/accountability/activity"
                    className="text-[11px] font-black text-brand-gold hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-2">
                  {recentActivity.length === 0 ? (
                    <p className="text-xs text-brand-dark-grey">No recent events logged</p>
                  ) : (
                    recentActivity.slice(0, 5).map((evt) => (
                      <div
                        key={evt._id}
                        className="p-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-black text-brand-gold truncate">
                            {evt.actor?.name || "System"}
                          </span>
                          <span className="text-[9px] text-brand-dark-grey">
                            {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-brand-black dark:text-brand-white line-clamp-1">
                          {evt.comment || evt.title}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
