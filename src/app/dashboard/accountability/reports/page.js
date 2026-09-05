"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useAccountabilityApi from "@/hooks/useAccountabilityApi";
import useSettingApi from "@/hooks/useSettingApi";
import { exportToExcel, exportToCSV, printHtmlReport } from "@/lib/exportHelper";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiBarChart2,
  FiUsers,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";

const REPORT_TABS = [
  { id: "communication-summary", label: "Executive Summary", icon: FiBarChart2 },
  { id: "employee-accountability", label: "Staff Accountability Matrix", icon: FiUsers },
  { id: "deadline-compliance", label: "Deadline Compliance", icon: FiClock },
];

export default function AccountabilityReportsPage() {
  const { getReports } = useAccountabilityApi();
  const { settings } = useSettingApi();

  const [activeTab, setActiveTab] = useState("employee-accountability");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReports(activeTab);
      setData(res);
    } catch (err) {
      console.error("Failed to load report:", err);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  }, [activeTab, getReports]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExport = (format) => {
    if (!data) {
      toast.warning("No report data available to export");
      return;
    }

    if (activeTab === "employee-accountability") {
      const rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) {
        toast.warning("No records found to export");
        return;
      }

      if (format === "excel") {
        exportToExcel(rows, "Staff_Accountability_Matrix");
      } else if (format === "csv") {
        exportToCSV(rows, "Staff_Accountability_Matrix");
      } else if (format === "print") {
        const headers = ["SL", "Name", "ID", "Dept", "Branch", "Notices Recv", "Notices Ack", "Tasks Assigned", "Tasks Completed", "Overdue", "Rate%"];
        const printRows = rows.map((r) => [
          r.sl,
          r.name,
          r.employeeId,
          r.department,
          r.branch,
          r.noticesReceived,
          r.noticesAcknowledged,
          r.tasksAssigned,
          r.tasksCompleted,
          r.tasksOverdue,
          `${r.taskCompletionRate}%`,
        ]);

        printHtmlReport({
          title: "Staff Directive Accountability & Compliance Matrix",
          preparedBy: "Management & Governance",
          headers,
          rows: printRows,
          settings,
        });
      }
    } else {
      toast.info("Excel/CSV export is optimized for the Staff Accountability Matrix tab.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/accountability"
            className="flex items-center gap-1.5 text-xs font-black text-brand-dark-grey hover:text-brand-gold transition-colors mb-2"
          >
            <FiArrowLeft /> Back to Command Center
          </Link>
          <Mtitle
            title="Management Accountability & Compliance Reports"
            desc="Auditable reports across instruction sources, staff task completion rates, notice acknowledgements, and deadline compliance."
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleExport("excel")}
            className="px-3.5 py-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors text-xs font-black flex items-center gap-1.5"
          >
            <FiDownload className="text-brand-gold" /> Export Excel
          </button>

          <button
            onClick={() => handleExport("print")}
            className="px-4 py-2.5 rounded-xl bg-brand-gold text-brand-black font-black text-xs shadow-md shadow-brand-gold/20 hover:bg-brand-gold-dark transition-all flex items-center gap-1.5"
          >
            <FiPrinter className="text-sm" /> Print A4 Report
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-1.5 bg-brand-white dark:bg-brand-charcoal p-1.5 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 overflow-x-auto shadow-sm">
        {REPORT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? "bg-brand-gold text-brand-black shadow-sm"
                  : "text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white"
              }`}
            >
              <Icon className="text-xs" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      {loading ? (
        <SkeletonLoading count={8} />
      ) : activeTab === "employee-accountability" ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-offwhite dark:bg-brand-midnight text-[10px] font-black uppercase text-brand-dark-grey border-b border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <th className="py-3 px-4">SL</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Dept & Branch</th>
                  <th className="py-3 px-4 text-center">Notices Recv</th>
                  <th className="py-3 px-4 text-center">Notices Ack</th>
                  <th className="py-3 px-4 text-center">Tasks Assigned</th>
                  <th className="py-3 px-4 text-center">Tasks Completed</th>
                  <th className="py-3 px-4 text-center">Overdue</th>
                  <th className="py-3 px-4 text-right">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((row) => (
                    <tr key={row.sl} className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/50">
                      <td className="py-3 px-4 font-extrabold text-brand-dark-grey">{row.sl}</td>
                      <td className="py-3 px-4">
                        <span className="font-black text-brand-black dark:text-brand-white block">
                          {row.name}
                        </span>
                        <span className="text-[10px] text-brand-dark-grey">{row.employeeId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-brand-black dark:text-brand-white block">
                          {row.department}
                        </span>
                        <span className="text-[10px] text-brand-dark-grey">{row.branch}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{row.noticesReceived}</td>
                      <td className="py-3 px-4 text-center font-bold text-purple-600">
                        {row.noticesAcknowledged}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{row.tasksAssigned}</td>
                      <td className="py-3 px-4 text-center font-black text-emerald-600">
                        {row.tasksCompleted}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.tasksOverdue > 0 ? (
                          <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                            {row.tasksOverdue}
                          </span>
                        ) : (
                          <span className="text-brand-dark-grey">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-brand-gold">
                        {row.taskCompletionRate}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-brand-dark-grey">
                      No employee accountability records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "communication-summary" ? (
        <div className="space-y-6">
          {/* Source Breakdown Table */}
          <div className="p-6 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-4 shadow-sm">
            <h4 className="text-sm font-black text-brand-black dark:text-brand-white">
              Source Directive Performance
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-beige/40 dark:border-brand-dark-grey/40 text-[10px] font-black uppercase text-brand-dark-grey">
                    <th className="py-2.5 px-3">Instruction Source</th>
                    <th className="py-2.5 px-3 text-center">Total</th>
                    <th className="py-2.5 px-3 text-center">Completed</th>
                    <th className="py-2.5 px-3 text-center">In Progress</th>
                    <th className="py-2.5 px-3 text-center">Overdue</th>
                    <th className="py-2.5 px-3 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
                  {data?.sourceBreakdown?.map((s) => (
                    <tr key={s.source}>
                      <td className="py-3 px-3 font-black text-brand-black dark:text-brand-white">
                        {s.source}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">{s.total}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">
                        {s.completed}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-indigo-600">
                        {s.inProgress}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {s.overdue > 0 ? (
                          <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                            {s.overdue}
                          </span>
                        ) : (
                          <span className="text-brand-dark-grey">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-brand-gold">
                        {s.completionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Deadline Compliance */
        <div className="p-6 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-4 shadow-sm">
          <h4 className="text-sm font-black text-brand-black dark:text-brand-white">
            Deadline & On-Time Performance Summary
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-black uppercase text-emerald-600 block">
                On-Time Completed
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {data?.summary?.onTimeCompleted || 0}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-black uppercase text-amber-600 block">
                Late Completed
              </span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {data?.summary?.lateCompleted || 0}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-black uppercase text-rose-600 block">
                Active Overdue
              </span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">
                {data?.summary?.overdueActive || 0}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] font-black uppercase text-blue-600 block">
                On-Schedule Active
              </span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">
                {data?.summary?.onScheduleActive || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
