"use client";

import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useTaskApi from "@/hooks/useTaskApi";
import useBranchApi from "@/hooks/useBranchApi";
import { AuthContext } from "@/providers/AuthProvider";
import { exportToExcel, exportToCsv, printHtmlReport } from "@/lib/exportHelper";
import { toast } from "react-toastify";
import {
  FiDownload,
  FiPrinter,
  FiRefreshCw,
  FiFileText,
  FiUsers,
  FiLayers,
  FiMapPin,
  FiCheckCircle,
  FiX,
  FiFilter,
  FiCalendar,
} from "react-icons/fi";

export default function TaskReportsPage() {
  const { user } = useContext(AuthContext);
  const { getReports } = useTaskApi();
  const { branches } = useBranchApi(100);

  const [activeReport, setActiveReport] = useState("source-wise");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Strictly display only active branches configured in Settings > Branches (http://localhost:3000/dashboard/settings/branches)
  const branchOptions = useMemo(() => {
    if (!branches || !Array.isArray(branches)) return [];
    return branches
      .filter((b) => b.status !== "inactive")
      .map((b) => (b.name || b.branchName)?.trim())
      .filter(Boolean);
  }, [branches]);

  // Dynamically generate last 12 months for total item / workload filtering
  const monthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const value = `${year}-${month}`;
      months.push({ value, label, isCurrent: i === 0 });
    }
    return months;
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      // ONLY Staff Operational Workload has branch and month filters
      if (activeReport === "employee-wise") {
        if (selectedBranch && selectedBranch !== "all") {
          params.branch = selectedBranch;
        }
        if (selectedMonth && selectedMonth !== "all") {
          params.month = selectedMonth;
        }
      }
      const data = await getReports(activeReport, params);
      setReportData(data || []);
    } catch (err) {
      console.error("Failed to load report:", err);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [activeReport, selectedBranch, selectedMonth, getReports]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport();
  }, [fetchReport]);

  // Filter report data based on selected branch (strictly for Staff Operational Workload)
  const filteredData = useMemo(() => {
    if (activeReport !== "employee-wise") return reportData;
    if (!selectedBranch || selectedBranch === "all") return reportData;

    const norm = (str) =>
      String(str || "")
        .toLowerCase()
        .replace(/[\s—–-]+/g, "")
        .trim();

    const target = norm(selectedBranch);

    return reportData.filter((row) => {
      const rowBranch = norm(row.branch);
      if (target === "multigym") {
        return rowBranch.startsWith("multigym");
      }
      return rowBranch === target;
    });
  }, [reportData, selectedBranch, activeReport]);

  const handleExport = (type) => {
    if (!filteredData || filteredData.length === 0) {
      toast.warning("No data available to export");
      return;
    }

    const titleMap = {
      "source-wise": "Source_Wise_Directive_Report",
      "branch-wise": "Branch_Wise_Task_Report",
      "employee-wise": "Employee_Task_Workload_Report",
    };
    const branchSuffix =
      activeReport === "employee-wise" && selectedBranch !== "all"
        ? `_${selectedBranch.replace(/[^a-zA-Z0-9]/g, "_")}`
        : "";
    const monthSuffix =
      activeReport === "employee-wise" && selectedMonth !== "all"
        ? `_${selectedMonth}`
        : "";
    const fileName = `${titleMap[activeReport] || "Task_Report"}${branchSuffix}${monthSuffix}`;

    if (type === "excel") {
      exportToExcel(filteredData, fileName);
    } else if (type === "csv") {
      exportToCsv(filteredData, fileName);
    } else if (type === "print") {
      let headers = [];
      let rows = [];

      if (activeReport === "source-wise") {
        headers = ["Source", "Total Tasks", "Completed", "In Progress", "Pending", "Overdue", "Completion Rate"];
        rows = filteredData.map((r) => [
          r.source,
          r.totalTasks,
          r.completed,
          r.inProgress,
          r.pending,
          r.overdue,
          `${r.completionRate}%`,
        ]);
      } else if (activeReport === "branch-wise") {
        headers = ["Branch", "Total Tasks", "Completed", "In Progress", "Pending", "Overdue", "Completion Rate"];
        rows = filteredData.map((r) => [
          r.branch,
          r.totalTasks,
          r.completed,
          r.inProgress,
          r.pending,
          r.overdue,
          `${r.completionRate}%`,
        ]);
      } else if (activeReport === "employee-wise") {
        headers = ["Employee ID", "Name", "Department", "Branch", "Total", "Completed", "In Progress", "Overdue", "Rate"];
        rows = filteredData.map((r) => [
          r.employeeId,
          r.name,
          r.department,
          r.branch,
          r.totalTasks,
          r.completed,
          r.inProgress,
          r.overdue,
          `${r.completionRate}%`,
        ]);
      }

      const branchTitleText =
        activeReport === "employee-wise" && selectedBranch !== "all"
          ? ` - Branch: ${selectedBranch}`
          : "";
      const monthLabel =
        activeReport === "employee-wise" && selectedMonth !== "all"
          ? ` - Month: ${monthOptions.find((m) => m.value === selectedMonth)?.label || selectedMonth}`
          : "";
      printHtmlReport({
        title: `Management Directive Report (${activeReport.replace(/-/g, " ").toUpperCase()}${branchTitleText}${monthLabel})`,
        preparedBy: user?.name || "Administrator",
        headers,
        rows,
      });
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-16">
      <Mtitle
        title="Directive & Task Analytics Reports"
        subtitle="Executive operational audit reports grouped by instruction source, branch operations, and staff completion metrics."
        rightcontent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("excel")}
              className="px-3.5 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold hover:border-brand-gold flex items-center gap-1.5"
            >
              <FiDownload className="text-brand-gold" /> Excel
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="px-3.5 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold hover:border-brand-gold flex items-center gap-1.5"
            >
              <FiDownload className="text-brand-gold" /> CSV
            </button>
            <button
              onClick={() => handleExport("print")}
              className="px-4 py-2 rounded-xl bg-brand-gold text-brand-black font-black text-xs shadow-md hover:bg-brand-gold-light flex items-center gap-1.5"
            >
              <FiPrinter /> Print A4 Report
            </button>
          </div>
        }
      />

      {/* Report Selector Tabs & Branch Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-brand-white dark:bg-brand-charcoal p-2 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
        {/* Report Selector Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveReport("source-wise")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeReport === "source-wise"
                ? "bg-brand-gold text-brand-black shadow-sm"
                : "text-brand-dark-grey hover:text-brand-gold"
            }`}
          >
            <FiLayers /> Instruction Source Report
          </button>

          <button
            onClick={() => setActiveReport("branch-wise")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeReport === "branch-wise"
                ? "bg-brand-gold text-brand-black shadow-sm"
                : "text-brand-dark-grey hover:text-brand-gold"
            }`}
          >
            <FiMapPin /> Branch Directive Report
          </button>

          <button
            onClick={() => setActiveReport("employee-wise")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeReport === "employee-wise"
                ? "bg-brand-gold text-brand-black shadow-sm"
                : "text-brand-dark-grey hover:text-brand-gold"
            }`}
          >
            <FiUsers /> Staff Operational Workload
          </button>
        </div>

        {/* Filter Controls (Branch & Month shown strictly for Staff Operational Workload) */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
          {activeReport === "employee-wise" && (
            <>
              {/* Branch Filter */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 text-xs shadow-inner">
                <FiMapPin className="text-brand-gold shrink-0 text-sm" />
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-dark-grey">
                  Branch:
                </span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent font-extrabold text-xs text-brand-black dark:text-brand-white focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-white dark:bg-brand-charcoal text-brand-black dark:text-brand-white">
                    All Branches
                  </option>
                  {branchOptions.map((bName) => (
                    <option
                      key={bName}
                      value={bName}
                      className="bg-white dark:bg-brand-charcoal text-brand-black dark:text-brand-white"
                    >
                      {bName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 text-xs shadow-inner">
                <FiCalendar className="text-brand-gold shrink-0 text-sm" />
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-dark-grey">
                  Month:
                </span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent font-extrabold text-xs text-brand-black dark:text-brand-white focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-white dark:bg-brand-charcoal text-brand-black dark:text-brand-white">
                    All Months
                  </option>
                  {monthOptions.map((m) => (
                    <option
                      key={m.value}
                      value={m.value}
                      className="bg-white dark:bg-brand-charcoal text-brand-black dark:text-brand-white"
                    >
                      {m.label} {m.isCurrent ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {(selectedBranch !== "all" || selectedMonth !== "all") && (
                <button
                  onClick={() => {
                    setSelectedBranch("all");
                    setSelectedMonth("all");
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-brand-red/10 text-brand-red font-bold text-xs hover:bg-brand-red/20 transition-all cursor-pointer flex items-center gap-1"
                  title="Reset filters"
                >
                  <FiX className="text-xs" /> Clear
                </button>
              )}
            </>
          )}

          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 text-brand-dark-grey hover:text-brand-gold hover:border-brand-gold transition-colors text-xs"
            title="Reload report data"
          >
            <FiRefreshCw className={`text-xs ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Report Table */}
      {loading ? (
        <SkeletonLoading count={6} />
      ) : (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                <tr>
                  <th className="py-4 px-5 text-center w-12">SL</th>
                  {activeReport === "source-wise" && <th className="py-4 px-5">Directive Source</th>}
                  {activeReport === "branch-wise" && <th className="py-4 px-5">Branch Location</th>}
                  {activeReport === "employee-wise" && (
                    <>
                      <th className="py-4 px-5">Employee ID & Name</th>
                      <th className="py-4 px-5">Department</th>
                      <th className="py-4 px-5">Branch</th>
                    </>
                  )}
                  <th className="py-4 px-5 text-center">Total Tasks</th>
                  <th className="py-4 px-5 text-center">Completed</th>
                  <th className="py-4 px-5 text-center">In Progress</th>
                  <th className="py-4 px-5 text-center">Pending</th>
                  <th className="py-4 px-5 text-center">Overdue</th>
                  <th className="py-4 px-5 text-center">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs">
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/50">
                      <td className="py-4 px-5 text-center font-bold text-brand-dark-grey">{idx + 1}</td>

                      {activeReport === "source-wise" && (
                        <td className="py-4 px-5 font-black text-brand-black dark:text-brand-white text-sm">
                          {row.source}
                        </td>
                      )}

                      {activeReport === "branch-wise" && (
                        <td className="py-4 px-5 font-black text-brand-black dark:text-brand-white text-sm">
                          {row.branch}
                        </td>
                      )}

                      {activeReport === "employee-wise" && (
                        <>
                          <td className="py-4 px-5 font-extrabold text-brand-black dark:text-brand-white">
                            <div>{row.name}</div>
                            <div className="text-[10px] text-brand-gold font-mono">{row.employeeId}</div>
                          </td>
                          <td className="py-4 px-5 font-semibold text-brand-dark-grey">{row.department}</td>
                          <td className="py-4 px-5 font-semibold text-brand-dark-grey">{row.branch}</td>
                        </>
                      )}

                      <td className="py-4 px-5 text-center font-black text-sm">{row.totalTasks}</td>
                      <td className="py-4 px-5 text-center font-bold text-emerald-500">{row.completed}</td>
                      <td className="py-4 px-5 text-center font-bold text-blue-500">{row.inProgress}</td>
                      <td className="py-4 px-5 text-center font-bold text-gray-500">{row.pending}</td>
                      <td className="py-4 px-5 text-center font-black text-red-500">{row.overdue}</td>
                      <td className="py-4 px-5 text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-brand-gold/20 text-brand-gold font-mono">
                          {row.completionRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={activeReport === "employee-wise" ? 10 : 8} className="py-12 text-center text-brand-dark-grey font-medium">
                      {activeReport === "employee-wise" && (selectedBranch !== "all" || selectedMonth !== "all")
                        ? "No workload records found for the selected branch / month filters."
                        : "No report records available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

