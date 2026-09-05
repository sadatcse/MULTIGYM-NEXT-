"use client";

import React, { useState, useEffect, useCallback, useContext, useMemo } from "react";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import ExportButtons from "@/components/Comon/ExportButtons";
import useMaintenanceApi from "@/hooks/useMaintenanceApi";
import useSettingApi from "@/hooks/useSettingApi";
import { AuthContext } from "@/providers/AuthProvider";
import { exportToExcel, exportToCsv, printHtmlReport, copyTableToClipboard } from "@/lib/exportHelper";
import { FiFileText } from "react-icons/fi";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "branch-wise", label: "Branch" },
  { id: "category-wise", label: "Category" },
  { id: "employee-wise", label: "Employee" },
  { id: "completion", label: "Completed / Pending" },
  { id: "overdue", label: "Overdue" },
  { id: "cost", label: "Cost" },
  { id: "vendor-wise", label: "Vendor / Assigned Person" },
];

export default function MaintenanceReportsPage() {
  const { user } = useContext(AuthContext);
  const { getReports } = useMaintenanceApi();
  const { settings } = useSettingApi();

  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getReports(activeTab, { startDate, endDate });
      setData(result);
    } catch (err) {
      console.error("Failed to load maintenance report:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [getReports, activeTab, startDate, endDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport();
  }, [fetchReport]);

  // Normalizes the current tab's data into headers/rows for print/export.
  const { headers, rows, statCards } = useMemo(() => {
    if (!data) return { headers: [], rows: [], statCards: [] };

    if (activeTab === "summary") {
      return {
        headers: ["Metric", "Value"],
        rows: [
          ["Total Requests", data.total],
          ["Completed", data.completed],
          ["Pending", data.pending],
          ["In Progress", data.inProgress],
          ["Overdue", data.overdue],
          ["Rejected", data.rejected],
          ["Cancelled", data.cancelled],
          ["Estimated Cost", `৳${data.estimatedCost}`],
          ["Actual Cost", `৳${data.actualCost}`],
          ["Cost Variance", `৳${data.costVariance}`],
        ],
        statCards: [
          { label: "Total", value: data.total },
          { label: "Completed", value: data.completed },
          { label: "Pending", value: data.pending },
          { label: "Overdue", value: data.overdue },
        ],
      };
    }
    if (activeTab === "branch-wise") {
      return {
        headers: ["Branch", "Total", "Completed", "Pending", "Overdue", "Est. Cost", "Actual Cost"],
        rows: data.map((r) => [r.branch, r.total, r.completed, r.pending, r.overdue, `৳${r.estimatedCost}`, `৳${r.actualCost}`]),
        statCards: [],
      };
    }
    if (activeTab === "category-wise") {
      return {
        headers: ["Category", "Requests", "Completed", "Pending", "Est. Cost", "Actual Cost"],
        rows: data.map((r) => [r.category, r.total, r.completed, r.pending, `৳${r.estimatedCost}`, `৳${r.actualCost}`]),
        statCards: [],
      };
    }
    if (activeTab === "employee-wise") {
      return {
        headers: ["Employee", "Branch", "Total", "Completed", "Pending", "In Progress", "Overdue"],
        rows: data.map((r) => [r.name, r.branch, r.total, r.completed, r.pending, r.inProgress, r.overdue]),
        statCards: [],
      };
    }
    if (activeTab === "completion") {
      return {
        headers: ["Metric", "Value"],
        rows: [
          ["Total Requests", data.total],
          ["Completed", data.completed],
          ["Pending", data.pending],
          ["In Progress", data.inProgress],
          ["Overdue", data.overdue],
          ["Completion Rate", `${data.completionRate}%`],
        ],
        statCards: [
          { label: "Total", value: data.total },
          { label: "Completion Rate", value: `${data.completionRate}%` },
        ],
      };
    }
    if (activeTab === "overdue") {
      return {
        headers: ["Issue", "Branch", "Priority", "Deadline", "Days Overdue", "Assigned"],
        rows: data.map((r) => [
          r.issue,
          r.branch,
          r.priority,
          r.deadline ? new Date(r.deadline).toLocaleDateString() : "—",
          r.daysOverdue,
          r.assignedToEmployee?.name || r.assignedToVendor?.name || "Unassigned",
        ]),
        statCards: [{ label: "Overdue Requests", value: data.length }],
      };
    }
    if (activeTab === "cost") {
      const rowsCombined = [
        ...data.byBranch.map((r) => [`Branch: ${r.branch}`, `৳${r.estimatedCost}`, `৳${r.actualCost}`]),
        ...data.byCategory.map((r) => [`Category: ${r.category}`, `৳${r.estimatedCost}`, `৳${r.actualCost}`]),
      ];
      return { headers: ["Breakdown", "Estimated Cost", "Actual Cost"], rows: rowsCombined, statCards: [] };
    }
    if (activeTab === "vendor-wise") {
      const rowsCombined = [
        ...data.byVendor.map((r) => [r.name, "Vendor", r.total, r.completed, r.pending, r.overdue, `৳${r.totalCost}`]),
        ...data.byEmployee.map((r) => [r.name, "Employee", r.total, r.completed, r.pending, r.overdue, `৳${r.totalCost}`]),
      ];
      return { headers: ["Name", "Type", "Assigned", "Completed", "Pending", "Overdue", "Total Cost"], rows: rowsCombined, statCards: [] };
    }
    return { headers: [], rows: [], statCards: [] };
  }, [activeTab, data]);

  const reportTitle = `Maintenance ${TABS.find((t) => t.id === activeTab)?.label} Report`;

  const handleExportExcel = () => {
    const asObjects = rows.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
    exportToExcel(asObjects, `maintenance_${activeTab}`, "Report");
  };
  const handleExportCsv = () => {
    const asObjects = rows.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
    exportToCsv(asObjects, `maintenance_${activeTab}`);
  };
  const handleCopy = () => copyTableToClipboard(headers, rows);
  const handlePrint = () => {
    printHtmlReport({
      title: reportTitle,
      preparedBy: `${user?.name || "System"} (${user?.role || ""})`,
      branchFilter: "All Branches",
      departmentFilter: "All Depts",
      headers,
      rows,
      stats: statCards.map((s) => ({ label: s.label, value: s.value })),
      settings,
    });
  };

  return (
    <div className="space-y-6 w-full max-w-[1300px] mx-auto pb-16">
      <Mtitle title="Maintenance Reports" subtitle="Summary, branch, category, employee, cost, overdue, and vendor performance reports." />

      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1 p-1 bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === t.id ? "bg-brand-red text-white shadow-sm" : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey outline-none" />
          <span className="text-xs text-brand-dark-grey">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey outline-none" />
        </div>
      </div>

      {loading ? (
        <SkeletonLoading variant="table" rows={5} />
      ) : (
        <>
          {statCards.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((s) => (
                <div key={s.label} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">{s.label}</span>
                  <span className="text-2xl font-black text-brand-gold mt-1 block">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-brand-black dark:text-brand-white flex items-center gap-2">
              <FiFileText className="text-brand-gold" /> {reportTitle}
            </h3>
            <ExportButtons onCopy={handleCopy} onExportExcel={handleExportExcel} onExportCsv={handleExportCsv} onPrint={handlePrint} />
          </div>

          <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-extrabold tracking-widest text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                  <tr>{headers.map((h) => <th key={h} className="py-4 px-6">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs">
                  {rows.length > 0 ? (
                    rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10">
                        {row.map((cell, i) => (
                          <td key={i} className="py-3.5 px-6 text-brand-black dark:text-brand-white">{cell}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={headers.length || 1} className="py-12 text-center text-brand-dark-grey dark:text-brand-gold-light text-xs font-semibold">
                        No data available for this report yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
