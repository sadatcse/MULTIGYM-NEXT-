"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useAccountabilityApi from "@/hooks/useAccountabilityApi";
import CommunicationBadge from "@/components/accountability/CommunicationBadge";
import AccountabilityStatusBadge from "@/components/accountability/AccountabilityStatusBadge";
import DeadlineBadge from "@/components/accountability/DeadlineBadge";
import { toast } from "react-toastify";
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiList,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckSquare,
  FiRefreshCw,
} from "react-icons/fi";

export default function MyObligationsPage() {
  const { getMyObligations } = useAccountabilityApi();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyObligations();
      setData(res);
    } catch (err) {
      console.error("Failed to load personal obligations:", err);
      toast.error("Failed to load your personal obligations");
    } finally {
      setLoading(false);
    }
  }, [getMyObligations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = data?.summary || {
    totalObligations: 0,
    unreadNotices: 0,
    pendingAcknowledgements: 0,
    activeTasks: 0,
    dueToday: 0,
    overdue: 0,
  };

  const notices = data?.notices || [];
  const tasks = data?.tasks || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-brand-gold/10 text-brand-gold border border-brand-gold/20 mb-2 inline-block">
            Personal Accountability
          </span>
          <Mtitle
            title="My Responsibilities & Directives"
            desc="Single pane of accountability for all official instructions, notices requiring your acknowledgement, and active tasks assigned to you."
          />
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-dark-grey hover:text-brand-gold transition-colors self-start sm:self-auto"
          title="Refresh"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-brand-gold" : ""}`} />
        </button>
      </div>

      {loading ? (
        <SkeletonLoading count={6} />
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
                Total Obligations
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {summary.totalObligations}
              </span>
              <span className="text-[10px] font-extrabold text-brand-gold mt-0.5 block">
                All duties
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                Unread Notices
              </span>
              <span className="text-2xl font-black text-blue-500 mt-1 block">
                {summary.unreadNotices}
              </span>
              <span className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-400/80 mt-0.5 block">
                Need your review
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                Pending Ack
              </span>
              <span className="text-2xl font-black text-purple-500 mt-1 block">
                {summary.pendingAcknowledgements}
              </span>
              <span className="text-[10px] font-extrabold text-purple-600/80 dark:text-purple-400/80 mt-0.5 block">
                Signature required
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Active Tasks
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {summary.activeTasks}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">
                In progress
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Due Today
              </span>
              <span className="text-2xl font-black text-amber-500 mt-1 block">
                {summary.dueToday}
              </span>
              <span className="text-[10px] font-extrabold text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">
                Priority deadline
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                Overdue
              </span>
              <span className="text-2xl font-black text-rose-500 mt-1 block">
                {summary.overdue}
              </span>
              <span className="text-[10px] font-extrabold text-rose-600/80 dark:text-rose-400/80 mt-0.5 block">
                Urgent attention
              </span>
            </div>
          </div>

          {/* Section 1: Notices Requiring Acknowledgement */}
          <div className="p-6 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                <FiFileText className="text-brand-gold text-base" />
                <span>Notices Requiring Acknowledgement ({notices.length})</span>
              </h3>

              <Link
                href="/dashboard/notices/my-notices"
                className="text-xs font-black text-brand-gold hover:underline flex items-center gap-1"
              >
                <span>Go to My Notices</span>
                <FiArrowRight />
              </Link>
            </div>

            {notices.length === 0 ? (
              <p className="text-xs text-brand-dark-grey italic">
                You have acknowledged all required notices. No action pending.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {notices.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <CommunicationBadge type="NOTICE" size="xs" />
                        <DeadlineBadge deadline={n.deadline} />
                      </div>

                      <h4 className="text-xs font-black text-brand-black dark:text-brand-white line-clamp-2">
                        {n.title}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-brand-dark-grey">
                        {n.isSeen ? "Opened" : "Not Opened Yet"}
                      </span>

                      <Link
                        href={n.actionUrl}
                        className="text-xs font-black text-brand-gold hover:underline flex items-center gap-1"
                      >
                        <span>Acknowledge</span>
                        <FiArrowRight className="text-xs" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Active Assigned Tasks */}
          <div className="p-6 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                <FiCheckSquare className="text-emerald-500 text-base" />
                <span>Active Directives & Tasks ({tasks.length})</span>
              </h3>

              <Link
                href="/dashboard/tasks/my-tasks"
                className="text-xs font-black text-brand-gold hover:underline flex items-center gap-1"
              >
                <span>Go to My Tasks</span>
                <FiArrowRight />
              </Link>
            </div>

            {tasks.length === 0 ? (
              <p className="text-xs text-brand-dark-grey italic">
                You have no active tasks currently pending execution.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                            {t.source}
                          </span>
                          <AccountabilityStatusBadge status={t.myStatus} size="xs" />
                        </div>

                        <DeadlineBadge deadline={t.deadline} />
                      </div>

                      <h4 className="text-xs font-black text-brand-black dark:text-brand-white line-clamp-2">
                        {t.title}
                      </h4>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-extrabold text-brand-dark-grey">
                          <span>My Progress</span>
                          <span className="text-brand-black dark:text-brand-white font-black">
                            {t.myProgress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-brand-beige/50 dark:bg-brand-dark-grey/50 overflow-hidden">
                          <div
                            className="h-full bg-brand-gold transition-all duration-300"
                            style={{ width: `${t.myProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end">
                      <Link
                        href={t.actionUrl}
                        className="text-xs font-black text-brand-gold hover:underline flex items-center gap-1"
                      >
                        <span>Update Progress / Proof</span>
                        <FiArrowRight className="text-xs" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
