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
} from "react-icons/fi";

export default function TaskReportsPage() {
  const { user } = useContext(AuthContext);
  const { getReports } = useTaskApi();
  const { branches } = useBranchApi(100);

  const [activeReport, setActiveReport] = useState("source-wise");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");

  // Derive consolidated list of branches from API and report records
  const branchOptions = useMemo(() => {
    const set = new Set();
    if (branches && Array.isArray(branches)) {
      branches.forEach((b) => {
        const name = b?.name || b?.branchName;
        if (name) set.add(name.trim());
      });
    }
    if (reportData && Array.isArray(reportData)) {
      reportData.forEach((r) => {
        if (r?.branch && r.branch !== "All Branches" && r.branch !== "N/A") {
          set.add(r.branch.trim());
        }
      });
    }
    return Array.from(set).sort();
  }, [branches, reportData]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBranch && selectedBranch !== "all") {
        params.branch = selectedBranch;
      }
      const data = await getReports(activeReport, params);
      setReportData(data || []);
    } catch (err) {
      console.error("Failed to load report:", err);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [activeReport, selectedBranch, getReports]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport();
  }, [fetchReport]);

  const handleExport = (type) => {
    if (!reportData || reportData.length === 0) {
      toast.warning("No data available to export");
      return;
    }

    const titleMap = {
      "source-wise": "Source_Wise_Directive_Report",
      "branch-wise": "Branch_Wise_Task_Report",
      "employee-wise": "Employee_Task_Workload_Report",
    };
    const branchSuffix = selectedBranch !== "all" ? `_${selectedBranch.replace(/[^a-zA-Z0-9]/g, "_")}` : "";
    const fileName = `${titleMap[activeReport] || "Task_Report"}${branchSuffix}`;

    if (type === "excel") {
      exportToExcel(reportData, fileName);
    } else if (type === "csv") {
      exportToCsv(reportData, fileName);
    } else if (type === "print") {
      let headers = [];
      let rows = [];

      if (activeReport === "source-wise") {
        headers = ["Source", "Total Tasks", "Completed", "In Progress", "Pending", "Overdue", "Completion Rate"];
        rows = reportData.map((r) => [
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
        rows = reportData.map((r) => [
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
        rows = reportData.map((r) => [
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

      const branchTitleText = selectedBranch !== "all" ? ` - Branch: ${selectedBranch}` : "";
      printHtmlReport({
        title: `Management Directive Report (${activeReport.replace(/-/g, " ").toUpperCase()}${branchTitleText})`,
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

        {/* Branch Filter & Refresh Controls */}
        <div className="flex items-center gap-2 self-start md:self-center">
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

          {selectedBranch !== "all" && (
            <button
              onClick={() => setSelectedBranch("all")}
              className="px-2.5 py-1.5 rounded-xl bg-brand-red/10 text-brand-red font-bold text-xs hover:bg-brand-red/20 transition-all cursor-pointer flex items-center gap-1"
              title="Reset branch filter"
            >
              <FiX className="text-xs" /> Clear
            </button>
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
                {reportData.length > 0 ? (
                  reportData.map((row, idx) => (
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
                      {selectedBranch !== "all"
                        ? `No report records found for branch "${selectedBranch}".`
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

