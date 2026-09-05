"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useTaskApi from "@/hooks/useTaskApi";
import { toast } from "react-toastify";
import {
  FiAlertTriangle,
  FiClock,
  FiCalendar,
  FiEye,
  FiArrowRight,
  FiCheckCircle,
  FiRefreshCw,
  FiSend,
  FiFilter,
} from "react-icons/fi";
import { MdPendingActions, MdPriorityHigh } from "react-icons/md";

export default function TaskFollowUpPage() {
  const { getFollowUpList } = useTaskApi();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const fetchFollowUp = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFollowUpList();
      setTasks(data || []);
    } catch (err) {
      console.error("Failed to load follow up tasks:", err);
      toast.error("Failed to load follow-up directives");
    } finally {
      setLoading(false);
    }
  }, [getFollowUpList]);

  useEffect(() => {
    fetchFollowUp();
  }, [fetchFollowUp]);

  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const overdueTasks = tasks.filter((t) => new Date(t.deadline) < now && t.status !== "COMPLETED");
  const dueTodayTasks = tasks.filter((t) => {
    const d = new Date(t.deadline);
    return d >= now && d <= endOfDay && t.status !== "COMPLETED";
  });
  const waitingApprovalTasks = tasks.filter((t) => t.status === "WAITING_FOR_APPROVAL");
  const criticalPendingTasks = tasks.filter(
    (t) => (t.priority === "CRITICAL" || t.priority === "URGENT") && t.status === "PENDING"
  );

  const displayedTasks =
    activeTab === "overdue"
      ? overdueTasks
      : activeTab === "dueToday"
      ? dueTodayTasks
      : activeTab === "waitingApproval"
      ? waitingApprovalTasks
      : activeTab === "criticalPending"
      ? criticalPendingTasks
      : tasks;

  return (
    <div className="space-y-6 w-full max-w-[1500px] mx-auto pb-16">
      <Mtitle
        title="Directives Requiring Management Follow-Up"
        subtitle="Primary follow-up dashboard for overdue tasks, directives due today, and submissions awaiting approval."
        rightcontent={
          <button
            onClick={fetchFollowUp}
            className="p-2.5 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold hover:border-brand-gold transition-colors flex items-center gap-1.5"
          >
            <FiRefreshCw className="text-brand-gold" /> Refresh
          </button>
        }
      />

      {/* Tabs / Priority Categories */}
      <div className="flex items-center gap-2 overflow-x-auto p-1 bg-brand-white dark:bg-brand-charcoal rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-brand-gold text-brand-black shadow-sm"
              : "text-brand-dark-grey hover:text-brand-gold"
          }`}
        >
          All Requiring Follow-Up ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "overdue"
              ? "bg-red-500 text-white shadow-sm"
              : "text-red-500 hover:bg-red-500/10"
          }`}
        >
          🔴 Overdue ({overdueTasks.length})
        </button>

        <button
          onClick={() => setActiveTab("dueToday")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "dueToday"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-amber-500 hover:bg-amber-500/10"
          }`}
        >
          🟠 Due Today ({dueTodayTasks.length})
        </button>

        <button
          onClick={() => setActiveTab("waitingApproval")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "waitingApproval"
              ? "bg-purple-500 text-white shadow-sm"
              : "text-purple-500 hover:bg-purple-500/10"
          }`}
        >
          🟣 Waiting Approval ({waitingApprovalTasks.length})
        </button>

        <button
          onClick={() => setActiveTab("criticalPending")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "criticalPending"
              ? "bg-blue-500 text-white shadow-sm"
              : "text-blue-500 hover:bg-blue-500/10"
          }`}
        >
          🔵 Critical Pending ({criticalPendingTasks.length})
        </button>
      </div>

      {/* Tasks List */}
      {loading ? (
        <SkeletonLoading count={5} />
      ) : displayedTasks.length > 0 ? (
        <div className="space-y-3">
          {displayedTasks.map((t) => {
            const deadline = new Date(t.deadline);
            const isOverdue = deadline < now && t.status !== "COMPLETED";
            const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={t._id}
                className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isOverdue
                          ? "bg-red-500 text-white"
                          : t.status === "WAITING_FOR_APPROVAL"
                          ? "bg-purple-500 text-white"
                          : "bg-brand-gold text-brand-black"
                      }`}
                    >
                      {isOverdue
                        ? `Overdue by ${Math.abs(diffDays)}d`
                        : t.status === "WAITING_FOR_APPROVAL"
                        ? "Awaiting Approval"
                        : "Follow-Up Needed"}
                    </span>

                    <span className="text-[10px] font-bold text-brand-gold">
                      {t.instructionSource}
                    </span>

                    <span className="text-[10px] text-brand-dark-grey">
                      Branch: <strong>{t.branch}</strong> • Dept: <strong>{t.department}</strong>
                    </span>
                  </div>

                  <Link
                    href={`/dashboard/tasks/${t._id}`}
                    className="font-extrabold text-base text-brand-black dark:text-brand-white hover:text-brand-gold transition-colors block"
                  >
                    {t.title}
                  </Link>

                  <div className="flex items-center gap-3 text-xs text-brand-dark-grey flex-wrap">
                    <span>Deadline: {deadline.toLocaleDateString()}</span>
                    <span>Progress: {t.progress || 0}%</span>
                    <span>Assignees: {t.assignees?.map((a) => a.employee?.name).join(", ") || "Staff"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/tasks/${t._id}`}
                    className="px-4 py-2 rounded-xl bg-brand-gold text-brand-black text-xs font-black shadow-sm hover:bg-brand-gold-light transition-all flex items-center gap-1.5"
                  >
                    Review Directive <FiArrowRight />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3">
          <FiCheckCircle className="text-4xl mx-auto text-emerald-500" />
          <h4 className="font-extrabold text-sm text-brand-black dark:text-brand-white">
            No directives requiring follow-up in this filter
          </h4>
          <p className="text-xs text-brand-dark-grey">All management instructions are moving smoothly.</p>
        </div>
      )}
    </div>
  );
}
