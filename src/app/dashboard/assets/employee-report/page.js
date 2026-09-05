"use client";

import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ExportButtons from "@/components/Comon/ExportButtons";
import useAssetReportApi from "@/hooks/useAssetReportApi";
import useBranchApi from "@/hooks/useBranchApi";
import useDepartmentApi from "@/hooks/useDepartmentApi";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useSettingApi from "@/hooks/useSettingApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import { AuthContext } from "@/providers/AuthProvider";
import { exportToExcel, exportToCsv, printHtmlReport } from "@/lib/exportHelper";
import {
  FiAssessment,
  FiFilter,
  FiRefreshCw,
  FiLayers,
  FiUsers,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiPrinter,
  FiDownload,
  FiPackage,
  FiGrid,
  FiList,
  FiClock,
  FiTag,
  FiUser,
} from "react-icons/fi";

export default function EmployeeAssetReportPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { can } = useUserPermissions();
  const canView = can("assets", "view");

  const { getEmployeeAssetReport, getAssetTransactions } = useAssetReportApi();
  const { branches } = useBranchApi(100);
  const { departments } = useDepartmentApi(100);
  const { employees } = useEmployeeApi(100);
  const { settings } = useSettingApi();

  const [loading, setLoading] = useState(true);

  // View Mode: "current" (Currently Assigned Assets) | "history" (Complete Audit Ledger)
  const [reportMode, setReportMode] = useState("current");

  // Raw Report Data
  const [reportData, setReportData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    employeesWithAssets: 0,
    totalAssignedItems: 0,
    pendingReturns: 0,
    damagedAssets: 0,
    lostAssets: 0,
  });

  // Filter States
  const [branchFilter, setBranchFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Grouping Mode: "none" | "employee" | "department" | "branch"
  const [groupBy, setGroupBy] = useState("none");

  // Client-Side Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch Report Data (branches/departments are auto-fetched by their own hooks)
  //
  // This report fetches everything matching the active filters (not a single
  // page) so the client-side filter/group/print layer below has the full
  // dataset to work with. A single request with a hardcoded limit silently
  // truncated past that limit with no indication to the user — instead, page
  // through using each endpoint's own `meta.total`/`meta.limit` (asset-
  // transaction hard-caps its own limit at 100 server-side) until every
  // matching record is retrieved, capped at a safety ceiling so a runaway
  // filter can never trigger unbounded requests.
  const fetchReport = useCallback(async () => {
    setLoading(true);
    const MAX_PAGES = 40;
    try {
      if (reportMode === "current") {
        let page = 1;
        let allData = [];
        let summary = null;
        for (; page <= MAX_PAGES; page++) {
          const res = await getEmployeeAssetReport({
            mode: "current",
            branch: branchFilter,
            department: departmentFilter,
            category: categoryFilter,
            status: statusFilter,
            search: searchTerm,
            page,
            limit: 500,
          });
          allData = allData.concat(res.data || []);
          if (res.summary) summary = res.summary;
          const meta = res.meta || {};
          if (!meta.total || allData.length >= meta.total) break;
        }
        setReportData(allData);
        if (summary) setSummaryStats(summary);
      } else {
        let page = 1;
        let allData = [];
        for (; page <= MAX_PAGES; page++) {
          const res = await getAssetTransactions({
            search: searchTerm,
            transactionType: statusFilter,
            page,
            limit: 100,
          });
          allData = allData.concat(res.data || []);
          const meta = res.meta || {};
          if (!meta.total || allData.length >= meta.total) break;
        }
        setReportData(allData);
      }
    } catch (err) {
      console.error("Failed to load employee asset report:", err);
    } finally {
      setLoading(false);
    }
  }, [reportMode, branchFilter, departmentFilter, categoryFilter, statusFilter, searchTerm, getEmployeeAssetReport, getAssetTransactions]);

  useEffect(() => {
    // Legitimate data fetch whenever filters/mode change; setState inside is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport();
  }, [fetchReport]);

  // Reset pagination when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [reportMode, branchFilter, departmentFilter, categoryFilter, employeeFilter, statusFilter, searchTerm, groupBy]);

  // Filtered Items (Client-Side Filter Layer)
  const filteredItems = useMemo(() => {
    return reportData.filter((item) => {
      let matchEmployee = employeeFilter === "all";
      if (!matchEmployee && employeeFilter) {
        const selEmp = employees.find((emp) => emp._id === employeeFilter || emp.name === employeeFilter);
        const selId = (selEmp?._id || employeeFilter).toString().trim();
        const selName = (selEmp?.name || employeeFilter).trim().toLowerCase();

        const itemEmpId = (item.employee?._id || item.employee || "").toString().trim();
        const itemEmpName = (item.employeeName || item.employee?.name || "").trim().toLowerCase();

        matchEmployee =
          (selId && itemEmpId === selId) ||
          (selName && itemEmpName === selName) ||
          (selName && itemEmpName.includes(selName));
      }

      if (reportMode === "current") {
        const matchBranch = branchFilter === "all" || item.branchName === branchFilter;
        const matchDept = departmentFilter === "all" || item.departmentName === departmentFilter;
        const matchCategory = categoryFilter === "all" || item.asset?.assetType?.category === categoryFilter;
        const matchStatus = statusFilter === "all" || item.status === statusFilter;
        const s = searchTerm.toLowerCase();
        const matchSearch =
          !searchTerm ||
          (item.employeeName && item.employeeName.toLowerCase().includes(s)) ||
          (item.employeeCode && item.employeeCode.toLowerCase().includes(s)) ||
          (item.asset?.assetCode && item.asset.assetCode.toLowerCase().includes(s)) ||
          (item.asset?.description && item.asset.description.toLowerCase().includes(s));
        return matchBranch && matchDept && matchCategory && matchEmployee && matchStatus && matchSearch;
      } else {
        const s = searchTerm.toLowerCase();
        const matchSearch =
          !searchTerm ||
          (item.employeeName && item.employeeName.toLowerCase().includes(s)) ||
          (item.employeeCode && item.employeeCode.toLowerCase().includes(s)) ||
          (item.assetCode && item.assetCode.toLowerCase().includes(s)) ||
          (item.assetName && item.assetName.toLowerCase().includes(s));
        return matchEmployee && matchSearch;
      }
    });
  }, [reportData, reportMode, branchFilter, departmentFilter, categoryFilter, employeeFilter, employees, statusFilter, searchTerm]);

  // Real-time calculated summary stats based on active filtered items
  const activeSummaryStats = useMemo(() => {
    const activeStaffSet = new Set();
    let totalAssigned = 0;
    let pendingRet = 0;
    let damaged = 0;
    let lost = 0;

    filteredItems.forEach((item) => {
      const staffKey = (
        item.employee?._id ||
        item.employeeId ||
        item.employeeCode ||
        (typeof item.employee === "string" ? item.employee : item.employeeName) ||
        ""
      )
        .toString()
        .trim()
        .toLowerCase();

      if (staffKey && staffKey !== "n/a" && staffKey !== "unassigned") {
        activeStaffSet.add(staffKey);
      }

      const qty = item.quantityPending || item.quantity || 1;
      totalAssigned += qty;

      if (item.status === "partially_returned" || item.status === "RETURN_PENDING" || item.isExitClearancePending) {
        pendingRet += qty;
      }
      if (item.damageOrLoss === "damaged" || item.status === "damaged" || item.status === "DAMAGED") {
        damaged += qty;
      }
      if (item.damageOrLoss === "lost" || item.status === "lost" || item.status === "LOST") {
        lost += qty;
      }
    });

    return {
      employeesWithAssets: activeStaffSet.size,
      totalAssignedItems: totalAssigned,
      pendingReturns: pendingRet,
      damagedAssets: damaged,
      lostAssets: lost,
    };
  }, [filteredItems]);

  // Grouped Data
  const groupedData = useMemo(() => {
    if (groupBy === "none") return null;

    const map = new Map();
    filteredItems.forEach((item) => {
      let key = "Other";
      if (groupBy === "employee") key = `${item.employeeName || "Unassigned"} (${item.employeeCode || "N/A"})`;
      else if (groupBy === "department") key = item.departmentName || "General Dept";
      else if (groupBy === "branch") key = item.branchName || "All Branches";

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [filteredItems, groupBy]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Export & Print Handlers
  const handleExportExcel = () => {
    const exportData = filteredItems.map((item, idx) => ({
      SL: idx + 1,
      "Employee Name": item.employeeName || "N/A",
      "Employee Code": item.employeeCode || "N/A",
      Department: item.departmentName || "N/A",
      Branch: item.branchName || "N/A",
      Asset: item.asset?.description || item.assetCode || "N/A",
      Category: item.asset?.assetType?.category || "N/A",
      Size: item.size || "—",
      Quantity: item.quantityPending || item.quantity || 1,
      "Issue Date": item.issueDate ? new Date(item.issueDate).toLocaleDateString() : "N/A",
      Condition: item.issueCondition || item.condition || "Good",
      Status: item.status || item.transactionType || "N/A",
    }));
    exportToExcel(exportData, `Employee_Asset_Report_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportCsv = () => {
    const exportData = filteredItems.map((item, idx) => ({
      SL: idx + 1,
      "Employee Name": item.employeeName || "N/A",
      "Employee Code": item.employeeCode || "N/A",
      Department: item.departmentName || "N/A",
      Branch: item.branchName || "N/A",
      Asset: item.asset?.description || item.assetCode || "N/A",
      Size: item.size || "—",
      Quantity: item.quantityPending || item.quantity || 1,
      "Issue Date": item.issueDate ? new Date(item.issueDate).toLocaleDateString() : "N/A",
      Status: item.status || item.transactionType || "N/A",
    }));
    exportToCsv(exportData, `Employee_Asset_Report_${new Date().toISOString().slice(0, 10)}`);
  };

  const handlePrint = () => {
    const headers = ["SL", "Employee Name", "Code", "Dept / Branch", "Asset Description", "Size", "Qty", "Issue Date", "Status"];

    const rows = filteredItems.map((item, i) => [
      i + 1,
      item.employeeName || "N/A",
      item.employeeCode || "N/A",
      `${item.departmentName || "N/A"} / ${item.branchName || "N/A"}`,
      item.asset?.description || item.assetCode || item.assetName || "N/A",
      item.size || "—",
      item.quantityPending || item.quantity || 1,
      item.issueDate ? new Date(item.issueDate).toLocaleDateString() : "N/A",
      (item.status || item.transactionType || "N/A").toUpperCase(),
    ]);

    const stats = [
      { label: "Employees With Assets", value: summaryStats.employeesWithAssets || 0 },
      { label: "Total Assigned Items", value: summaryStats.totalAssignedItems || 0 },
      { label: "Pending Returns", value: summaryStats.pendingReturns || 0 },
      { label: "Damaged / Lost", value: (summaryStats.damagedAssets || 0) + (summaryStats.lostAssets || 0) },
    ];

    const selectedEmpObj = employees.find((e) => e._id === employeeFilter);
    const empLabel = selectedEmpObj ? `${selectedEmpObj.name} (${selectedEmpObj.employeeId || "N/A"})` : "All Staff";

    printHtmlReport({
      title: employeeFilter === "all" ? "Employee Asset Audit & Inventory Report" : `Asset Report for ${empLabel}`,
      preparedBy: user?.name || "Super Admin",
      branchFilter: branchFilter === "all" ? "All Gym Branches" : branchFilter,
      departmentFilter: employeeFilter === "all" ? (departmentFilter === "all" ? "All Departments" : departmentFilter) : `Staff: ${empLabel}`,
      headers,
      rows,
      stats,
      settings,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Mtitle
          title="Employee Asset Report"
          subtitle="Audit and track company assets, uniforms, and equipment issued across all staff"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <ExportButtons onExcel={handleExportExcel} onCsv={handleExportCsv} />
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-midnight text-white hover:bg-brand-black dark:bg-brand-charcoal dark:hover:bg-brand-midnight rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FiPrinter className="text-sm" /> Print Report
          </button>
        </div>
      </div>

      {/* Mode Switcher Buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-brand-white dark:bg-brand-charcoal p-2.5 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportMode("current")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
              reportMode === "current"
                ? "bg-brand-gold text-brand-midnight shadow-md shadow-brand-gold/20"
                : "bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
            }`}
          >
            <FiPackage className="text-sm" /> Current Assigned Assets
          </button>
          <button
            onClick={() => setReportMode("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
              reportMode === "history"
                ? "bg-brand-gold text-brand-midnight shadow-md shadow-brand-gold/20"
                : "bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
            }`}
          >
            <FiClock className="text-sm" /> Complete Audit Ledger
          </button>
        </div>

        {/* Grouping Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey">Group By:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="none">No Grouping (Flat Table)</option>
            <option value="employee">By Employee</option>
            <option value="department">By Department</option>
            <option value="branch">By Gym Branch</option>
          </select>
        </div>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
            Employees With Assets
          </span>
          <span className="text-xl font-black text-brand-black dark:text-brand-white mt-1 block">
            {activeSummaryStats.employeesWithAssets}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold block">
            Total Assigned Items
          </span>
          <span className="text-xl font-black text-brand-gold mt-1 block">
            {activeSummaryStats.totalAssignedItems}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
            Pending Returns
          </span>
          <span className="text-xl font-black text-amber-500 mt-1 block">
            {activeSummaryStats.pendingReturns}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
            Damaged Assets
          </span>
          <span className="text-xl font-black text-rose-500 mt-1 block">
            {activeSummaryStats.damagedAssets}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-brand-red/10 border border-brand-red/20 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-red block">
            Lost Assets
          </span>
          <span className="text-xl font-black text-brand-red mt-1 block">
            {activeSummaryStats.lostAssets}
          </span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-brand-gold">
          <FiFilter /> Filter Asset Records
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Employee Filter */}
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="all">All Staff Members ({employees.length})</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name} {e.employeeId ? `(${e.employeeId})` : ""}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {[
              "Uniform & Identification",
              "Keys & Access",
              "Company Assets",
              "IT & Electronics",
              "Office Equipment & Furniture",
              "Vehicles & Transport",
              "Fitness & Gym Equipment",
              "Safety & Security Equipment",
            ].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer capitalize"
          >
            <option value="all">All Statuses</option>
            {reportMode === "current" ? (
              <>
                <option value="active">Issued / Active</option>
                <option value="partially_returned">Partially Returned</option>
              </>
            ) : (
              <>
                <option value="ISSUE">Issued</option>
                <option value="RETURN">Returned</option>
                <option value="TRANSFER">Transferred</option>
                <option value="DAMAGED">Damaged</option>
                <option value="LOST">Lost</option>
                <option value="REPAIR">Repair</option>
              </>
            )}
          </select>

          {/* Search Box */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee or asset..."
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none w-full"
          />
        </div>
      </div>

      {/* Report Table View */}
      {loading ? (
        <SkeletonLoading variant="table" rows={8} />
      ) : (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-6 border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-xl space-y-4">
          {/* GROUPED VIEW */}
          {groupBy !== "none" && groupedData ? (
            <div className="space-y-6">
              {Array.from(groupedData.entries()).map(([groupTitle, items]) => (
                <div key={groupTitle} className="space-y-2">
                  <div className="bg-brand-gold/10 px-4 py-2 rounded-2xl border border-brand-gold/30 flex items-center justify-between">
                    <h3 className="text-xs font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                      <FiTag className="text-brand-gold" /> {groupTitle}
                    </h3>
                    <span className="text-[10px] font-black uppercase text-brand-gold bg-brand-gold/20 px-2 py-0.5 rounded-full">
                      {items.length} Record{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                        <tr>
                          <th className="py-2.5 px-3">Employee</th>
                          <th className="py-2.5 px-3">Asset Description</th>
                          <th className="py-2.5 px-3 text-center">Size</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3">Issue Date</th>
                          <th className="py-2.5 px-3">Branch / Dept</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 font-medium">
                        {items.map((item, idx) => (
                          <tr key={item._id || idx} className="hover:bg-brand-gold/5">
                            <td className="py-2.5 px-3 font-bold text-brand-black dark:text-brand-white">
                              {item.employeeName || "N/A"}
                              <span className="block text-[10px] text-brand-dark-grey font-normal">{item.employeeCode || "N/A"}</span>
                            </td>
                            <td className="py-2.5 px-3 font-extrabold text-brand-black dark:text-brand-white">
                              {item.asset?.description || item.assetCode || item.assetName || "N/A"}
                              {item.asset?.assetCode && <span className="block text-[10px] text-brand-gold font-mono">{item.asset.assetCode}</span>}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">{item.size || "—"}</td>
                            <td className="py-2.5 px-3 text-center font-black text-brand-gold">{item.quantityPending || item.quantity || 1}</td>
                            <td className="py-2.5 px-3 text-[11px]">{item.issueDate ? new Date(item.issueDate).toLocaleDateString() : item.date ? new Date(item.date).toLocaleDateString() : "N/A"}</td>
                            <td className="py-2.5 px-3 text-[10px]">
                              <div>{item.branchName || "All Branches"}</div>
                              <div className="text-brand-dark-grey">{item.departmentName || "All Depts"}</div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                item.status === "active" || item.transactionType === "ISSUE" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {item.status || item.transactionType}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* FLAT TABLE VIEW */
            <>
              {filteredItems.length === 0 ? (
                <div className="p-10 text-center bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <p className="text-xs font-bold text-brand-dark-grey">No asset assignment records match the selected filter criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                      <tr>
                        <th className="py-3 px-4 w-10 text-center">SL</th>
                        <th className="py-3 px-4">Employee Name</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Asset Description</th>
                        <th className="py-3 px-4 text-center">Size</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4">Issue Date</th>
                        <th className="py-3 px-4">Branch / Dept</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 font-medium">
                      {paginatedItems.map((item, idx) => {
                        const slNo = (currentPage - 1) * itemsPerPage + idx + 1;
                        return (
                          <tr key={item._id || idx} className="hover:bg-brand-gold/5">
                            <td className="py-3 px-4 text-center font-bold text-brand-dark-grey">{slNo}</td>
                            <td className="py-3 px-4 font-black text-brand-black dark:text-brand-white">
                              {item.employeeName || "N/A"}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] font-bold text-brand-dark-grey">
                              {item.employeeCode || "N/A"}
                            </td>
                            <td className="py-3 px-4 font-extrabold text-brand-black dark:text-brand-white">
                              {item.asset?.description || item.assetCode || item.assetName || "N/A"}
                              {item.asset?.assetCode && (
                                <span className="block text-[10px] text-brand-gold font-mono font-bold">
                                  Code: {item.asset.assetCode}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-bold">{item.size || "—"}</td>
                            <td className="py-3 px-4 text-center font-black text-brand-gold">
                              {item.quantityPending || item.quantity || 1}
                            </td>
                            <td className="py-3 px-4 text-[11px]">
                              {item.issueDate ? new Date(item.issueDate).toLocaleDateString() : item.date ? new Date(item.date).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="py-3 px-4 text-[10px]">
                              <div>{item.branchName || "All Branches"}</div>
                              <div className="text-brand-dark-grey">{item.departmentName || "All Depts"}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                item.status === "active" || item.transactionType === "ISSUE"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {item.status || item.transactionType || "assigned"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Client-side Pagination */}
              {groupBy === "none" && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredItems.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => setCurrentPage(page)}
                  onItemsPerPageChange={(limit) => {
                    setItemsPerPage(limit);
                    setCurrentPage(1);
                  }}
                  itemsPerPageOptions={[5, 10, 25, 50, 100]}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
