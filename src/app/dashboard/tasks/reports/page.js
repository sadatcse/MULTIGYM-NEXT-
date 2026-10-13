"use client";

import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import ScrollHintX from "@/components/Comon/ScrollHintX";
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
  FiClock,
  FiCalendar,
  FiAlertTriangle,
  FiTrendingUp,
} from "react-icons/fi";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut", delay: Math.min(i, 8) * 0.035 },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export default function TaskReportsPage() {
  const { user } = useContext(AuthContext);
  const { getReports } = useTaskApi();
  const { branches } = useBranchApi(100);

  const [activeReport, setActiveReport] = useState("source-wise");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Active branches configured in Settings
  const branchOptions = useMemo(() => {
    if (!branches || !Array.isArray(branches)) return [];
    return branches
      .filter((b) => b.status !== "inactive")
      .map((b) => (b.name || b.branchName)?.trim())
      .filter(Boolean);
  }, [branches]);

  // Dynamically generate last 12 months
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

  // Filter report data based on selected branch for employee-wise
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

  // Aggregate KPI metrics
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { total: 0, completed: 0, inProgress: 0, overdue: 0, completionRate: 0 };
    }
    const total = filteredData.reduce((acc, r) => acc + (Number(r.totalTasks) || 0), 0);
    const completed = filteredData.reduce((acc, r) => acc + (Number(r.completed) || 0), 0);
    const inProgress = filteredData.reduce((acc, r) => acc + (Number(r.inProgress) || 0), 0);
    const overdue = filteredData.reduce((acc, r) => acc + (Number(r.overdue) || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, overdue, completionRate };
  }, [filteredData]);

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
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      <Mtitle
        title="Directive & Task Analytics Reports"
        subtitle="Executive operational audit reports grouped by instruction source, branch operations, and staff completion metrics."
        rightcontent={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleExport("excel")}
              className="px-3.5 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FiDownload className="text-brand-gold" /> Excel
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="px-3.5 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FiDownload className="text-brand-gold" /> CSV
            </button>
            <button
              onClick={() => handleExport("print")}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <FiPrinter className="text-sm" />
              <span>Print A4 Report</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Total Directives
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {stats.total}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiLayers />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Completed
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {stats.completed}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-blue-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                In Progress
              </span>
              <span className="text-2xl font-black text-blue-500 mt-1 block">
                {stats.inProgress}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiClock />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Completion Rate
              </span>
              <span className="text-2xl font-black text-brand-gold mt-1 block">
                {stats.completionRate}%
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiTrendingUp />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Report Selector Tabs & Filter Bar */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Report Selector Tabs */}
        <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setActiveReport("source-wise")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeReport === "source-wise"
                ? "bg-brand-gold text-brand-midnight shadow-xs font-black"
                : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
            }`}
          >
            <FiLayers /> Instruction Source
          </button>

          <button
            onClick={() => setActiveReport("branch-wise")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeReport === "branch-wise"
                ? "bg-brand-gold text-brand-midnight shadow-xs font-black"
                : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
            }`}
          >
            <FiMapPin /> Branch Directive
          </button>

          <button
            onClick={() => setActiveReport("employee-wise")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeReport === "employee-wise"
                ? "bg-brand-gold text-brand-midnight shadow-xs font-black"
                : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
            }`}
          >
            <FiUsers /> Staff Operational Workload
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {activeReport === "employee-wise" && (
            <>
              {/* Branch Filter */}
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="all">All Branches</option>
                {branchOptions.map((bName) => (
                  <option key={bName} value={bName}>
                    {bName}
                  </option>
                ))}
              </select>

              {/* Month Filter */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="all">All Months</option>
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} {m.isCurrent ? "(Current)" : ""}
                  </option>
                ))}
              </select>

              {(selectedBranch !== "all" || selectedMonth !== "all") && (
                <button
                  onClick={() => {
                    setSelectedBranch("all");
                    setSelectedMonth("all");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-brand-red/10 text-brand-red font-bold text-xs hover:bg-brand-red hover:text-white transition-all cursor-pointer flex items-center gap-1"
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
            className="p-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 text-brand-dark-grey hover:text-brand-gold hover:border-brand-gold transition-colors text-xs cursor-pointer"
            title="Reload report data"
          >
            <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-brand-gold" : ""}`} />
          </button>
        </div>
      </div>

      {/* Report Table */}
      {loading ? (
        <SkeletonLoading variant="table" rows={6} />
      ) : filteredData.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiFileText />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">
            No Report Records Found
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-4">
            {activeReport === "employee-wise" && (selectedBranch !== "all" || selectedMonth !== "all")
              ? "No workload records found for the selected branch / month filters."
              : "No report records are currently available for this category."}
          </p>
        </div>
      ) : (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
          <ScrollHintX>
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                <tr>
                  <th className="py-4 px-6 text-center w-16">SL</th>
                  {activeReport === "source-wise" && <th className="py-4 px-6">Directive Source</th>}
                  {activeReport === "branch-wise" && <th className="py-4 px-6">Branch Location</th>}
                  {activeReport === "employee-wise" && (
                    <>
                      <th className="py-4 px-6">Employee ID & Name</th>
                      <th className="py-4 px-6">Department</th>
                      <th className="py-4 px-6">Branch</th>
                    </>
                  )}
                  <th className="py-4 px-6 text-center">Total Tasks</th>
                  <th className="py-4 px-6 text-center">Completed</th>
                  <th className="py-4 px-6 text-center">In Progress</th>
                  <th className="py-4 px-6 text-center">Pending</th>
                  <th className="py-4 px-6 text-center">Overdue</th>
                  <th className="py-4 px-6 text-center w-32">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                <AnimatePresence initial={false}>
                  {filteredData.map((row, idx) => (
                    <motion.tr
                      key={idx}
                      custom={idx}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      layout
                      className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-150"
                    >
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gold/10 text-brand-gold font-black text-xs">
                          #{idx + 1}
                        </span>
                      </td>

                      {activeReport === "source-wise" && (
                        <td className="py-4 px-6 font-extrabold text-brand-black dark:text-brand-white text-sm">
                          {row.source}
                        </td>
                      )}

                      {activeReport === "branch-wise" && (
                        <td className="py-4 px-6 font-extrabold text-brand-black dark:text-brand-white text-sm">
                          {row.branch}
                        </td>
                      )}

                      {activeReport === "employee-wise" && (
                        <>
                          <td className="py-4 px-6 font-extrabold text-brand-black dark:text-brand-white">
                            <div className="font-black text-sm">{row.name}</div>
                            <div className="text-[10px] text-brand-gold font-mono font-bold mt-0.5">
                              {row.employeeId}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-brand-dark-grey dark:text-brand-gold-light/90">
                            {row.department}
                          </td>
                          <td className="py-4 px-6 font-medium text-brand-dark-grey dark:text-brand-gold-light/90">
                            {row.branch}
                          </td>
                        </>
                      )}

                      <td className="py-4 px-6 text-center font-black text-sm text-brand-black dark:text-brand-white">
                        {row.totalTasks}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-emerald-500 text-sm">
                        {row.completed}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-blue-500 text-sm">
                        {row.inProgress}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-gray-500 text-sm">
                        {row.pending}
                      </td>
                      <td className="py-4 px-6 text-center font-black text-rose-500 text-sm">
                        {row.overdue}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-brand-gold/15 text-brand-gold border border-brand-gold/30 font-mono">
                          {row.completionRate}%
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </ScrollHintX>
        </div>
      )}
    </div>
  );
}
