"use client";

import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useAssetAssignmentApi from "@/hooks/useAssetAssignmentApi";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useSettingApi from "@/hooks/useSettingApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import { AuthContext } from "@/providers/AuthProvider";
import { printHtmlReport } from "@/lib/exportHelper";
import {
  FiPackage,
  FiPrinter,
  FiRefreshCw,
  FiTag,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiGrid,
  FiList,
  FiSearch,
  FiFilter,
  FiShield,
  FiLayers,
} from "react-icons/fi";
import { toast } from "react-toastify";

export default function MyAssetsPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { can } = useUserPermissions();

  const { getByEmployee } = useAssetAssignmentApi();
  const { employees } = useEmployeeApi(100);
  const { settings } = useSettingApi();

  const [loading, setLoading] = useState(true);
  const [myAssignments, setMyAssignments] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [statusTab, setStatusTab] = useState("active"); // "active" | "returned" | "all"
  const [returnableFilter, setReturnableFilter] = useState("all"); // "all" | "returnable" | "non_returnable"
  const [searchTerm, setSearchTerm] = useState("");

  // Selected Employee ID (locked to logged-in user)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  // Auto-detect logged-in employee ID from AuthContext
  useEffect(() => {
    if (user) {
      const matchedEmp = employees.find(
        (e) =>
          e._id === user.employeeId ||
          e._id === user._id ||
          e.employeeId === user.employeeId ||
          (e.name && user.name && e.name.trim().toLowerCase() === user.name.trim().toLowerCase())
      );
      if (matchedEmp) {
        setSelectedEmployeeId(matchedEmp._id);
      } else if (!selectedEmployeeId) {
        if (user.employeeId) setSelectedEmployeeId(user.employeeId);
        else if (user._id) setSelectedEmployeeId(user._id);
      }
    }
  }, [user, employees, selectedEmployeeId]);

  // Fetch assignments for logged-in employee
  const fetchMyAssets = useCallback(async () => {
    if (!selectedEmployeeId) return;
    setLoading(true);
    try {
      const data = await getByEmployee(selectedEmployeeId);
      setMyAssignments(data || []);
    } catch (err) {
      console.error("Failed to load my assets:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, getByEmployee]);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchMyAssets();
    }
  }, [selectedEmployeeId, fetchMyAssets]);

  // Selected Employee Details
  const currentEmpObj = useMemo(() => {
    return employees.find((e) => e._id === selectedEmployeeId) || {
      name: user?.name || "Staff Member",
      employeeId: user?.employeeId || "N/A",
      department: "General",
      branch: "Main Branch",
    };
  }, [employees, selectedEmployeeId, user]);

  // Filtered List
  const filteredAssets = useMemo(() => {
    return myAssignments.filter((item) => {
      // Tab filter
      if (statusTab === "active" && item.status !== "active" && item.status !== "partially_returned") {
        return false;
      }
      if (statusTab === "returned" && item.status !== "returned") {
        return false;
      }

      // Returnable filter
      const isReturnable = item.returnable !== false && item.asset?.returnable !== false && item.asset?.assetType?.returnable !== false;
      if (returnableFilter === "returnable" && !isReturnable) {
        return false;
      }
      if (returnableFilter === "non_returnable" && isReturnable) {
        return false;
      }

      // Search filter
      const s = searchTerm.toLowerCase();
      if (!s) return true;

      const code = item.assetCode || item.asset?.assetCode || "";
      const name = item.assetName || item.asset?.description || "";
      const cat = item.asset?.assetType?.category || "";
      const size = item.size || "";

      return (
        code.toLowerCase().includes(s) ||
        name.toLowerCase().includes(s) ||
        cat.toLowerCase().includes(s) ||
        size.toLowerCase().includes(s)
      );
    });
  }, [myAssignments, statusTab, returnableFilter, searchTerm]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const activeItems = myAssignments.filter((a) => a.status === "active" || a.status === "partially_returned");
    const returnedItems = myAssignments.filter((a) => a.status === "returned");
    const returnableCount = activeItems.filter(
      (a) => a.asset?.returnable !== false && a.asset?.assetType?.returnable !== false
    ).length;

    const totalQty = activeItems.reduce((sum, a) => sum + (a.quantityPending || a.quantity || 1), 0);

    return {
      activeCount: activeItems.length,
      totalQty,
      returnedCount: returnedItems.length,
      returnableCount,
    };
  }, [myAssignments]);

  // Print Personal Asset Statement
  const handlePrintStatement = () => {
    const headers = ["SL", "Asset Code", "Description / Category", "Size / Variant", "Qty", "Issue Date", "Condition", "Status"];

    const rows = filteredAssets.map((item, idx) => {
      const assetObj = item.asset || {};
      const cat = assetObj.assetType?.category || "Equipment";
      const desc = assetObj.description || item.assetName || item.assetCode || "—";

      return [
        idx + 1,
        item.assetCode || assetObj.assetCode || "—",
        `${desc} (${cat})`,
        item.size || "—",
        item.quantityPending || item.quantity || 1,
        item.issueDate ? new Date(item.issueDate).toLocaleDateString() : "N/A",
        item.issueCondition || "Good",
        (item.status || "ACTIVE").toUpperCase(),
      ];
    });

    const stats = [
      { label: "Active Equipment", value: kpis.activeCount },
      { label: "Total Quantity Held", value: kpis.totalQty },
      { label: "Returnable Assets", value: kpis.returnableCount },
      { label: "Returned Items", value: kpis.returnedCount },
    ];

    printHtmlReport({
      title: `Personal Asset Statement: ${currentEmpObj.name} (${currentEmpObj.employeeId || "N/A"})`,
      preparedBy: user?.name || "System Admin",
      branchFilter: currentEmpObj.branchName || currentEmpObj.branch || "All Branches",
      departmentFilter: currentEmpObj.departmentName || currentEmpObj.department || "All Depts",
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
          title="My Issued Assets"
          subtitle={`View and manage all company equipment, uniforms, keys, and assets assigned to ${currentEmpObj.name}.`}
        />

        <div className="flex items-center gap-2 flex-wrap">
          {/* Logged-In User Badge */}
          <div className="px-3.5 py-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-extrabold text-brand-black dark:text-brand-white flex items-center gap-2 shadow-sm">
            <FiUser className="text-brand-gold text-sm" />
            <span>{currentEmpObj.name} {currentEmpObj.employeeId ? `(${currentEmpObj.employeeId})` : ""}</span>
          </div>

          <button
            onClick={fetchMyAssets}
            disabled={loading}
            className="p-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors"
            title="Refresh List"
          >
            <FiRefreshCw className={`text-base ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handlePrintStatement}
            disabled={filteredAssets.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gold text-brand-black font-extrabold text-xs shadow-md shadow-brand-gold/20 hover:bg-brand-gold-dark transition-all disabled:opacity-50"
          >
            <FiPrinter className="text-sm" /> Print My Asset Statement
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
            Active Equipment
          </span>
          <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
            {kpis.activeCount}
          </span>
          <span className="text-[10px] font-extrabold text-emerald-500 mt-0.5 block">
            Currently in your possession
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold block">
            Total Units Issued
          </span>
          <span className="text-2xl font-black text-brand-gold mt-1 block">
            {kpis.totalQty}
          </span>
          <span className="text-[10px] font-extrabold text-brand-dark-grey dark:text-brand-gold-light mt-0.5 block">
            Combined quantity count
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Returnable Assets
          </span>
          <span className="text-2xl font-black text-emerald-500 mt-1 block">
            {kpis.returnableCount}
          </span>
          <span className="text-[10px] font-extrabold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">
            Must return upon clearance
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            Returned Items
          </span>
          <span className="text-2xl font-black text-purple-500 mt-1 block">
            {kpis.returnedCount}
          </span>
          <span className="text-[10px] font-extrabold text-purple-600/80 dark:text-purple-400/80 mt-0.5 block">
            Handed back to HR
          </span>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-brand-white dark:bg-brand-charcoal p-3.5 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
          <button
            onClick={() => setStatusTab("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusTab === "active"
                ? "bg-brand-gold text-brand-black shadow-sm"
                : "text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white"
            }`}
          >
            Currently Held ({myAssignments.filter((a) => a.status === "active" || a.status === "partially_returned").length})
          </button>
          <button
            onClick={() => setStatusTab("returned")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusTab === "returned"
                ? "bg-brand-gold text-brand-black shadow-sm"
                : "text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white"
            }`}
          >
            Returned ({kpis.returnedCount})
          </button>
          <button
            onClick={() => setStatusTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusTab === "all"
                ? "bg-brand-gold text-brand-black shadow-sm"
                : "text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white"
            }`}
          >
            All Ledger ({myAssignments.length})
          </button>
        </div>

        {/* Right Controls: Returnable Filter, Search & Grid/Table Switcher */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Returnable Filter Dropdown */}
          <select
            value={returnableFilter}
            onChange={(e) => setReturnableFilter(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="all">All Returnability (Yes & No)</option>
            <option value="returnable">Returnable Only (Yes)</option>
            <option value="non_returnable">Non-Returnable Only (No)</option>
          </select>
          {/* Search Box */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark-grey text-xs" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search my assets..."
              className="pl-8 pr-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-brand-gold text-brand-black" : "text-brand-dark-grey"
              }`}
              title="Card Grid View"
            >
              <FiGrid className="text-sm" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table" ? "bg-brand-gold text-brand-black" : "text-brand-dark-grey"
              }`}
              title="Table View"
            >
              <FiList className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <SkeletonLoading count={6} />
      ) : filteredAssets.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 text-center border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-3">
          <FiPackage className="text-4xl text-brand-gold mx-auto" />
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white">No Assets Found</h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light max-w-sm mx-auto">
            {statusTab === "active"
              ? "You currently do not have any active company equipment, keys, or uniforms assigned to you."
              : "No historical asset assignment records match your filter criteria."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((item) => {
            const assetObj = item.asset || {};
            const isReturnable = item.returnable !== false && assetObj.returnable !== false && assetObj.assetType?.returnable !== false;
            const category = assetObj.assetType?.category || "Equipment";
            const qty = item.quantityPending || item.quantity || 1;

            return (
              <div
                key={item._id}
                className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-5 border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-md shadow-black/5 hover:border-brand-gold/50 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Category & Status Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-brand-gold/10 text-brand-gold border border-brand-gold/20 flex items-center gap-1">
                      <FiTag className="text-[9px]" /> {category}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                        item.status === "returned"
                          ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                          : item.status === "partially_returned"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      }`}
                    >
                      {item.status || "ACTIVE"}
                    </span>
                  </div>

                  {/* Asset Title & Code */}
                  <div>
                    <h4 className="text-base font-extrabold text-brand-black dark:text-brand-white line-clamp-1">
                      {assetObj.description || item.assetName || item.assetCode}
                    </h4>
                    <p className="text-xs font-mono font-bold text-brand-dark-grey mt-0.5">
                      Code: <span className="text-brand-gold">{item.assetCode || assetObj.assetCode}</span>
                    </p>
                  </div>

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-brand-offwhite dark:bg-brand-midnight p-3 rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
                    <div>
                      <span className="text-[9px] font-black uppercase text-brand-dark-grey block">Size / Variant</span>
                      <span className="font-extrabold text-brand-black dark:text-brand-white">{item.size || "Standard"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-brand-dark-grey block">Quantity</span>
                      <span className="font-extrabold text-brand-black dark:text-brand-white">{qty} Unit(s)</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-brand-dark-grey block">Issue Condition</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{item.issueCondition || "Good"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-brand-dark-grey block">Returnable</span>
                      <span
                        className={`font-extrabold ${
                          isReturnable ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {isReturnable ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>

                  {/* Issue Date & Issued By */}
                  <div className="space-y-1 text-[11px] text-brand-dark-grey dark:text-brand-gold-light">
                    <div className="flex items-center gap-1.5">
                      <FiClock className="text-brand-gold text-xs" />
                      <span>Issued: {item.issueDate ? new Date(item.issueDate).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FiUser className="text-brand-gold text-xs" />
                      <span>Issued By: {item.issuedBy || "HR Administration"}</span>
                    </div>
                  </div>

                  {/* Issue Notes */}
                  {item.issueNotes && (
                    <p className="text-[11px] italic text-brand-dark-grey bg-brand-beige/20 dark:bg-brand-dark-grey/20 p-2.5 rounded-xl border border-brand-beige/30 dark:border-brand-dark-grey/30">
                      &quot;{item.issueNotes}&quot;
                    </p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end">
                  <button
                    onClick={() =>
                      printHtmlReport({
                        title: `Asset Issuance Slip - ${item.assetCode}`,
                        preparedBy: user?.name || "HR Admin",
                        headers: ["Attribute", "Details"],
                        rows: [
                          ["Employee Name", currentEmpObj.name],
                          ["Employee Code", currentEmpObj.employeeId || "N/A"],
                          ["Asset Code", item.assetCode || assetObj.assetCode],
                          ["Asset Description", assetObj.description || item.assetName],
                          ["Size / Variant", item.size || "Standard"],
                          ["Quantity Issued", qty],
                          ["Issue Date", item.issueDate ? new Date(item.issueDate).toLocaleDateString() : "N/A"],
                          ["Condition", item.issueCondition || "Good"],
                          ["Returnable", isReturnable ? "Yes" : "No"],
                          ["Issued By", item.issuedBy || "HR Admin"],
                        ],
                        settings,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight hover:bg-brand-gold/10 text-brand-dark-grey hover:text-brand-gold border border-brand-beige/60 dark:border-brand-dark-grey transition-colors flex items-center gap-1.5 text-xs font-bold"
                    title="Print Individual Slip"
                  >
                    <FiPrinter className="text-xs text-brand-gold" /> Print Issuance Slip
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                <tr>
                  <th className="py-4 px-6 text-center w-12">SL</th>
                  <th className="py-4 px-6">Asset Code & Description</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6 text-center">Size / Variant</th>
                  <th className="py-4 px-6 text-center w-20">Qty</th>
                  <th className="py-4 px-6 text-center">Issue Date</th>
                  <th className="py-4 px-6 text-center">Returnable</th>
                  <th className="py-4 px-6 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                {filteredAssets.map((item, idx) => {
                  const assetObj = item.asset || {};
                  const isReturnable = item.returnable !== false && assetObj.returnable !== false && assetObj.assetType?.returnable !== false;

                  return (
                    <tr key={item._id} className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-colors">
                      <td className="py-4 px-6 text-center font-bold text-brand-dark-grey">{idx + 1}</td>

                      <td className="py-4 px-6">
                        <p className="font-extrabold text-brand-black dark:text-brand-white text-sm">
                          {assetObj.description || item.assetName || item.assetCode}
                        </p>
                        <p className="text-[10px] font-mono text-brand-gold">
                          {item.assetCode || assetObj.assetCode}
                        </p>
                      </td>

                      <td className="py-4 px-6 font-bold text-brand-dark-grey">
                        {assetObj.assetType?.category || "Equipment"}
                      </td>

                      <td className="py-4 px-6 text-center font-extrabold text-brand-black dark:text-brand-white">
                        {item.size || "Standard"}
                      </td>

                      <td className="py-4 px-6 text-center font-extrabold text-brand-gold">
                        {item.quantityPending || item.quantity || 1}
                      </td>

                      <td className="py-4 px-6 text-center text-brand-dark-grey font-bold">
                        {item.issueDate ? new Date(item.issueDate).toLocaleDateString() : "N/A"}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            isReturnable
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {isReturnable ? "Yes" : "No"}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span
                          className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                            item.status === "returned"
                              ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                              : item.status === "partially_returned"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          }`}
                        >
                          {item.status || "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
