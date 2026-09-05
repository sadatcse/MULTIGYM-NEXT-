"use client";

import React, { useState, useEffect, useMemo, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  FiX,
  FiUserCheck,
  FiUsers,
  FiLoader,
  FiPackage,
  FiMapPin,
  FiSearch,
  FiCheckSquare,
  FiSquare,
  FiAlertTriangle,
} from "react-icons/fi";
import useAssetAssignmentApi from "@/hooks/useAssetAssignmentApi";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useBranchApi from "@/hooks/useBranchApi";
import { AuthContext } from "@/providers/AuthProvider";

export default function IssueAssetModal({
  isOpen,
  onClose,
  preselectedAsset = null,
  availableAssets = [],
  initialMode = "single",
  onSuccess,
}) {
  const { user } = useContext(AuthContext);
  const { employees } = useEmployeeApi(100);
  const { branches } = useBranchApi(100);
  const { issueAsset, bulkIssueAsset } = useAssetAssignmentApi();

  const [issueMode, setIssueMode] = useState(initialMode); // "single" | "bulk"
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  // Per-employee size/variant override for bulk issue — e.g. one staff
  // member needs Small, another needs Large from the same batch. Keyed by
  // employee id; a missing entry falls back to the batch default size.
  const [employeeVariants, setEmployeeVariants] = useState({});

  const [issueForm, setIssueForm] = useState({
    employee: "",
    asset: "",
    size: "",
    quantity: 1,
    issueDate: new Date().toISOString().split("T")[0],
    issueCondition: "New",
    issuedBy: "",
    issueNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed early (not just before the JSX return) so the bulk-issue
  // employee checklist below can reference sizeVariants per-row.
  const currentAsset = preselectedAsset || availableAssets.find((a) => a._id === issueForm.asset);
  const sizeVariants = currentAsset?.sizeVariants || [];
  const maxAvailable = currentAsset?.quantityAvailable || 1;

  const filteredEmployees = employees.filter((e) => {
    let matchBranch = selectedBranch === "all";

    if (!matchBranch && selectedBranch) {
      const selBranchObj = branches.find((b) => b._id === selectedBranch || b.name === selectedBranch);
      const targetId = (selBranchObj?._id || selectedBranch).toString().trim();
      const targetName = (selBranchObj?.name || selectedBranch).trim().toLowerCase();

      const empBranchObj = e.branch && typeof e.branch === "object" ? e.branch : null;
      const empBranchId = (empBranchObj?._id || (typeof e.branch === "string" ? e.branch : "")).toString().trim();
      const empBranchName = (empBranchObj?.name || e.branchName || (typeof e.branch === "string" ? e.branch : "")).trim().toLowerCase();

      matchBranch =
        (targetId && empBranchId === targetId) ||
        (targetName && empBranchName === targetName) ||
        (targetName && empBranchName.includes(targetName)) ||
        (targetName && targetName.includes(empBranchName));
    }

    const searchLower = employeeSearch.toLowerCase().trim();
    const matchSearch =
      !searchLower ||
      (e.name && e.name.toLowerCase().includes(searchLower)) ||
      (e.employeeId && e.employeeId.toLowerCase().includes(searchLower)) ||
      (e.department?.name && e.department.name.toLowerCase().includes(searchLower)) ||
      (e.departmentName && e.departmentName.toLowerCase().includes(searchLower));

    return matchBranch && matchSearch;
  });

  useEffect(() => {
    if (!isOpen) return;

    setIssueMode(initialMode || "single");
    setSelectedBranch("all");
    setEmployeeSearch("");
    setSelectedEmployeeIds([]);
    setEmployeeVariants({});

    const currentUserName = user?.name || user?.email || "Admin";
    const initialAssetId = preselectedAsset?._id || (availableAssets.length > 0 ? availableAssets[0]._id : "");
    const initialAssetObj = preselectedAsset || availableAssets.find((a) => a._id === initialAssetId);
    const defaultSize = initialAssetObj?.sizeVariants?.[0]?.size || initialAssetObj?.size || "";

    setIssueForm({
      employee: "",
      asset: initialAssetId,
      size: defaultSize,
      quantity: 1,
      issueDate: new Date().toISOString().split("T")[0],
      issueCondition: initialAssetObj?.condition || "New",
      issuedBy: currentUserName,
      issueNotes: "",
    });
    // Intentionally reset ONLY on the closed->open transition, not on every
    // reference change of preselectedAsset/availableAssets/user while the
    // modal is already open — the parent's asset object legitimately gets a
    // new reference on any background refresh (even React Strict Mode's dev
    // double-effect), and depending on it here would silently wipe whatever
    // the user had already selected mid-form (confirmed: this caused the
    // Issue Asset modal to reject submission with "Employee Required" even
    // right after picking someone).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMode]);

  const handleAssetSelect = (assetId) => {
    const selectedObj = preselectedAsset || availableAssets.find((a) => a._id === assetId);
    const defaultSize = selectedObj?.sizeVariants?.[0]?.size || selectedObj?.size || "";
    setIssueForm((f) => ({
      ...f,
      asset: assetId,
      size: defaultSize,
      issueCondition: selectedObj?.condition || f.issueCondition,
    }));
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredEmployees.map((e) => e._id);
    const combined = Array.from(new Set([...selectedEmployeeIds, ...allFilteredIds]));
    setSelectedEmployeeIds(combined);
    // Newly-added staff default to the batch size; anyone already selected
    // keeps whatever size they were already set to.
    setEmployeeVariants((prev) => {
      const next = { ...prev };
      allFilteredIds.forEach((id) => {
        if (!next[id]) next[id] = issueForm.size;
      });
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    const filteredSet = new Set(filteredEmployees.map((e) => e._id));
    setSelectedEmployeeIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    setEmployeeVariants((prev) => {
      const next = { ...prev };
      filteredSet.forEach((id) => delete next[id]);
      return next;
    });
  };

  const handleToggleEmployee = (empId) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
    setEmployeeVariants((prev) => {
      if (prev[empId] !== undefined) {
        // Deselecting — drop their override so it doesn't linger if re-selected later with a different batch default.
        const { [empId]: _removed, ...rest } = prev;
        return rest;
      }
      // Selecting — default to the current batch size.
      return { ...prev, [empId]: issueForm.size };
    });
  };

  const handleEmployeeVariantChange = (empId, size) => {
    setEmployeeVariants((prev) => ({ ...prev, [empId]: size }));
  };

  // Real-time requested quantities per size variant in Bulk Mode
  const requestedVariantCounts = useMemo(() => {
    if (issueMode !== "bulk" || !currentAsset?.sizeVariants || currentAsset.sizeVariants.length === 0) {
      return {};
    }
    const qty = Number(issueForm.quantity) || 1;
    const counts = {};

    selectedEmployeeIds.forEach((empId) => {
      const selectedSize = employeeVariants[empId] || issueForm.size;
      if (selectedSize) {
        counts[selectedSize] = (counts[selectedSize] || 0) + qty;
      }
    });

    return counts;
  }, [issueMode, currentAsset, selectedEmployeeIds, employeeVariants, issueForm.size, issueForm.quantity]);

  // Check if any variant's requested quantity exceeds available stock
  const variantStockViolations = useMemo(() => {
    if (issueMode !== "bulk" || !currentAsset?.sizeVariants || currentAsset.sizeVariants.length === 0) {
      return [];
    }

    const violations = [];
    currentAsset.sizeVariants.forEach((v) => {
      const vName = v.variantName || v.size;
      const key = v.size || v.variantName;
      const requested = requestedVariantCounts[key] || 0;
      const available = typeof v.quantityAvailable === "number" ? v.quantityAvailable : (v.quantityTotal || 0);

      if (requested > available) {
        violations.push({
          variantName: vName,
          requested,
          available,
          exceededBy: requested - available,
        });
      }
    });

    return violations;
  }, [issueMode, currentAsset, requestedVariantCounts]);

  const totalSelectedQty = useMemo(() => {
    return selectedEmployeeIds.length * (Number(issueForm.quantity) || 1);
  }, [selectedEmployeeIds.length, issueForm.quantity]);

  const totalStockExceeded = useMemo(() => {
    if (issueMode !== "bulk" || !currentAsset) return false;
    return totalSelectedQty > (currentAsset.quantityAvailable || 0);
  }, [issueMode, currentAsset, totalSelectedQty]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!issueForm.asset) {
      Swal.fire({ title: "Asset Required", text: "Please select an asset to issue.", icon: "warning", confirmButtonColor: "#FF1818" });
      return;
    }

    if (issueMode === "single" && !issueForm.employee) {
      Swal.fire({ title: "Employee Required", text: "Please select an employee to issue the asset.", icon: "warning", confirmButtonColor: "#FF1818" });
      return;
    }

    if (issueMode === "bulk" && selectedEmployeeIds.length === 0) {
      Swal.fire({ title: "No Staff Selected", text: "Please select at least one employee for bulk issue.", icon: "warning", confirmButtonColor: "#FF1818" });
      return;
    }

    if (issueMode === "bulk" && sizeVariants.length > 0 && selectedEmployeeIds.some((id) => !employeeVariants[id])) {
      Swal.fire({ title: "Size Missing", text: "Please choose a size/variant for every selected staff member.", icon: "warning", confirmButtonColor: "#FF1818" });
      return;
    }

    if (issueMode === "bulk" && variantStockViolations.length > 0) {
      const errorDetails = variantStockViolations
        .map((v) => `• "${v.variantName}": ${v.requested} requested for selected staff, but only ${v.available} available (${v.exceededBy} over limit)`)
        .join("\n");
      Swal.fire({
        title: "Stock Limit Exceeded",
        text: `Requested size variant quantities exceed available stock:\n\n${errorDetails}\n\nPlease adjust staff size selections or reduce selected staff count.`,
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
      return;
    }

    if (issueMode === "bulk" && totalStockExceeded) {
      Swal.fire({
        title: "Total Stock Exceeded",
        text: `Total requested quantity (${totalSelectedQty}) exceeds total available asset stock (${currentAsset.quantityAvailable}).`,
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (issueMode === "bulk") {
        const res = await bulkIssueAsset({
          employees: selectedEmployeeIds.map((id) => ({
            employee: id,
            size: sizeVariants.length > 0 ? employeeVariants[id] || issueForm.size : undefined,
          })),
          asset: issueForm.asset,
          size: issueForm.size || undefined,
          quantity: Number(issueForm.quantity) || 1,
          issueDate: issueForm.issueDate,
          issueCondition: issueForm.issueCondition || "New",
          issuedBy: issueForm.issuedBy || undefined,
          issueNotes: issueForm.issueNotes || undefined,
        });

        const count = res?.data?.successfulCount || selectedEmployeeIds.length;
        Swal.fire({
          title: "Bulk Issue Complete!",
          text: `Successfully issued asset items to ${count} staff member(s).`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2200,
        });
      } else {
        await issueAsset({
          employee: issueForm.employee,
          asset: issueForm.asset,
          size: issueForm.size || undefined,
          quantity: Number(issueForm.quantity) || 1,
          issueDate: issueForm.issueDate,
          issueCondition: issueForm.issueCondition || "New",
          issuedBy: issueForm.issuedBy || undefined,
          issueNotes: issueForm.issueNotes || undefined,
        });

        Swal.fire({
          title: "Asset Issued!",
          text: "The asset has been successfully assigned to the employee.",
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      }

      if (onSuccess) await onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to issue asset.";
      Swal.fire({
        title: "Error!",
        text: Array.isArray(msg) ? msg.join(", ") : msg,
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-brand-white dark:bg-brand-charcoal w-full max-w-4xl sm:max-w-5xl rounded-3xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                {issueMode === "bulk" ? <FiUsers className="text-base" /> : <FiUserCheck className="text-base" />}
              </div>
              <div>
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                  {issueMode === "bulk" ? "Bulk Issue Asset to Staff" : "Issue Asset to Staff"}
                </h3>
                <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                  {issueMode === "bulk"
                    ? "Assign equipment or uniform to multiple staff members simultaneously"
                    : "Assign equipment, uniform, or key to employee"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Issue Mode Switcher Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60">
              <button
                type="button"
                onClick={() => setIssueMode("single")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  issueMode === "single"
                    ? "bg-brand-gold text-brand-midnight shadow-xs"
                    : "text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
                }`}
              >
                <FiUserCheck className="text-sm" /> Single Issue
              </button>
              <button
                type="button"
                onClick={() => setIssueMode("bulk")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  issueMode === "bulk"
                    ? "bg-brand-gold text-brand-midnight shadow-xs"
                    : "text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
                }`}
              >
                <FiUsers className="text-sm" /> Bulk Issue (Multi-Staff)
              </button>
            </div>

            {/* Stock Limit Exceeded Warning Alert Card */}
            {issueMode === "bulk" && (variantStockViolations.length > 0 || totalStockExceeded) && (
              <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 flex items-start gap-3 text-xs font-bold shadow-sm animate-pulse">
                <FiAlertTriangle className="text-lg shrink-0 mt-0.5 text-red-500" />
                <div className="space-y-0.5">
                  <span className="font-black uppercase tracking-wider block text-red-600 dark:text-red-400">
                    Stock Limit Exceeded!
                  </span>
                  {variantStockViolations.map((v) => (
                    <p key={v.variantName} className="text-[11px] font-medium leading-relaxed">
                      Variant <span className="font-black text-brand-black dark:text-white">"{v.variantName}"</span>: <span className="text-red-600 dark:text-red-400 font-black">{v.requested} requested</span> for selected staff, but only <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{v.available} available</span> in stock ({v.exceededBy} short).
                    </p>
                  ))}
                  {totalStockExceeded && variantStockViolations.length === 0 && (
                    <p className="text-[11px] font-medium leading-relaxed">
                      Total requested quantity (<span className="font-black">{totalSelectedQty}</span>) exceeds total available stock (<span className="font-black">{currentAsset?.quantityAvailable || 0}</span>).
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Branch Filter & Quick Search Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-brand-offwhite/80 dark:bg-brand-midnight/80 border border-brand-beige/60 dark:border-brand-dark-grey/60">
              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-brand-gold mb-1 flex items-center gap-1">
                  <FiMapPin className="text-[10px]" /> Filter by Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none cursor-pointer"
                >
                  <option value="all">All Branches ({employees.length} Staff)</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-brand-gold mb-1 flex items-center gap-1">
                  <FiSearch className="text-[10px]" /> Search Employee Name / ID
                </label>
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Name, ID or Dept..."
                  className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                />
              </div>
            </div>

            {/* SINGLE ISSUE: Employee Selection Dropdown */}
            {issueMode === "single" ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey">
                    Select Employee *
                  </label>
                  <span className="text-[10px] text-brand-gold font-bold">
                    Showing {filteredEmployees.length} of {employees.length} Staff
                  </span>
                </div>
                <select
                  value={issueForm.employee}
                  disabled={isSubmitting}
                  onChange={(e) => setIssueForm((f) => ({ ...f, employee: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                >
                  <option value="">-- Choose Employee ({filteredEmployees.length} Available) --</option>
                  {filteredEmployees.map((e) => {
                    const branchName = e.branch?.name || (typeof e.branch === "string" ? e.branch : "");
                    const deptName = e.department?.name || (typeof e.department === "string" ? e.department : "");
                    return (
                      <option key={e._id} value={e._id}>
                        {e.name} {e.employeeId ? `(${e.employeeId})` : ""} {branchName ? `[${branchName}]` : ""} {deptName ? `— ${deptName}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              /* BULK ISSUE: Multi-Employee Checkbox Selection Panel */
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-gold">
                    Select Multiple Employees ({selectedEmployeeIds.length} Selected) *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-2.5 py-1 rounded-lg bg-brand-gold/15 text-brand-gold hover:bg-brand-gold hover:text-brand-midnight font-bold text-[10px] cursor-pointer transition-all"
                    >
                      Select All Filtered ({filteredEmployees.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllFiltered}
                      className="px-2.5 py-1 rounded-lg bg-brand-dark-grey/15 text-brand-dark-grey hover:bg-brand-dark-grey hover:text-white font-bold text-[10px] cursor-pointer transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto p-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey space-y-1 divide-y divide-brand-beige/20 dark:divide-brand-dark-grey/20">
                  {filteredEmployees.length === 0 ? (
                    <p className="text-center py-6 text-brand-dark-grey text-xs font-bold">No employees match your branch/search filter.</p>
                  ) : (
                    filteredEmployees.map((e) => {
                      const isSelected = selectedEmployeeIds.includes(e._id);
                      const branchName = e.branch?.name || (typeof e.branch === "string" ? e.branch : "");
                      const deptName = e.department?.name || (typeof e.department === "string" ? e.department : "");
                      return (
                        <div
                          key={e._id}
                          className={`flex items-center justify-between gap-2 p-2.5 rounded-xl transition-all ${
                            isSelected
                              ? "bg-brand-gold/15 border-l-4 border-brand-gold text-brand-black dark:text-brand-white shadow-xs"
                              : "hover:bg-brand-gold/5 text-brand-black dark:text-brand-white opacity-85 hover:opacity-100"
                          }`}
                        >
                          {/* Note: this is a div (not a <label>) wrapping the checkbox so a
                              click on the per-employee size <select> below can't also
                              toggle the checkbox via the browser's implicit label behavior. */}
                          <div
                            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                            onClick={() => handleToggleEmployee(e._id)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              // Toggling is handled by the wrapping div's onClick (which
                              // this click event also bubbles up to) — an onChange here
                              // too would fire handleToggleEmployee twice per click and
                              // cancel itself out. React still requires a change handler
                              // on a controlled input, hence the no-op.
                              onChange={() => {}}
                              className="w-4 h-4 accent-brand-gold cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-extrabold text-xs block text-brand-black dark:text-brand-white truncate">
                                {e.name} {e.employeeId ? `(${e.employeeId})` : ""}
                              </span>
                              <span className="text-[10px] text-brand-dark-grey font-medium block truncate">
                                {branchName ? `Branch: ${branchName}` : ""} {deptName ? `• Dept: ${deptName}` : ""}
                              </span>
                            </div>
                          </div>

                          {isSelected && sizeVariants.length > 0 && (
                            <select
                              value={employeeVariants[e._id] || ""}
                              onClick={(ev) => ev.stopPropagation()}
                              onChange={(ev) => handleEmployeeVariantChange(e._id, ev.target.value)}
                              className="shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-gold/50 text-brand-black dark:text-brand-white outline-none cursor-pointer"
                            >
                              <option value="">-- Size --</option>
                              {sizeVariants.map((v) => {
                                const vKey = v.size || v.variantName;
                                const req = requestedVariantCounts[vKey] || 0;
                                const avail = typeof v.quantityAvailable === "number" ? v.quantityAvailable : (v.quantityTotal || 0);
                                const isOver = req > avail;
                                return (
                                  <option key={vKey} value={vKey} disabled={avail <= 0}>
                                    {v.variantName || v.size} ({avail} avail{req > 0 ? ` • ${req} sel` : ""}){isOver ? " ⚠️ OVER" : ""}
                                  </option>
                                );
                              })}
                            </select>
                          )}
                          {isSelected && sizeVariants.length === 0 && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-brand-gold bg-brand-gold/20 px-2 py-0.5 rounded-md shrink-0">
                              Selected
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Asset Selection & Variant Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                  Asset *
                </label>
                {preselectedAsset ? (
                  <div className="px-3.5 py-2.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 text-brand-black dark:text-brand-white flex items-center justify-between font-bold h-[42px]">
                    <div className="flex items-center gap-2 truncate">
                      <FiPackage className="text-brand-gold text-sm shrink-0" />
                      <span className="truncate">{preselectedAsset.assetCode} — {preselectedAsset.description || preselectedAsset.assetType?.name}</span>
                    </div>
                    <span className="text-[10px] bg-brand-gold text-brand-midnight font-black px-2 py-0.5 rounded-md shrink-0">
                      {preselectedAsset.quantityAvailable} Available
                    </span>
                  </div>
                ) : (
                  <select
                    value={issueForm.asset}
                    disabled={isSubmitting}
                    onChange={(e) => handleAssetSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer h-[42px]"
                  >
                    <option value="">-- Select Asset --</option>
                    {availableAssets.filter((a) => a.quantityAvailable > 0).map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.assetCode} — {a.description || a.assetType?.name} ({a.quantityAvailable} available)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Variant / Size Matrix Selector */}
              {sizeVariants.length > 0 ? (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-gold mb-1">
                    {issueMode === "bulk" ? "Default Size (for newly selected staff) *" : "Select Size / Variant Combination *"}
                  </label>
                  <select
                    value={issueForm.size}
                    disabled={isSubmitting}
                    onChange={(e) => setIssueForm((f) => ({ ...f, size: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-gold/10 border border-brand-gold/40 text-brand-black dark:text-brand-white outline-none cursor-pointer h-[42px]"
                  >
                    <option value="">-- Select Variant --</option>
                    {sizeVariants.map((v) => {
                      const vKey = v.size || v.variantName;
                      const req = requestedVariantCounts[vKey] || 0;
                      const avail = typeof v.quantityAvailable === "number" ? v.quantityAvailable : (v.quantityTotal || 0);
                      const isOver = req > avail;
                      return (
                        <option key={vKey} value={vKey} disabled={avail <= 0}>
                          {v.variantName || v.size} ({avail} available{req > 0 ? ` • ${req} requested` : ""}){isOver ? " ⚠️ OVER LIMIT" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {issueMode === "bulk" && (
                    <p className="text-[9px] text-brand-dark-grey mt-1">
                      Each staff member below can be given a different size — use their row&apos;s dropdown to override this default.
                    </p>
                  )}
                </div>
              ) : currentAsset?.assetType?.requiresSize || currentAsset?.size ? (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                    Size / Spec
                  </label>
                  <input
                    type="text"
                    value={issueForm.size}
                    disabled={isSubmitting}
                    onChange={(e) => setIssueForm((f) => ({ ...f, size: e.target.value }))}
                    placeholder="e.g. S, M, L, XL or custom spec"
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 h-[42px]"
                  />
                </div>
              ) : null}
            </div>

            {/* Quantity & Issue Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                  {issueMode === "bulk" ? "Quantity Per Staff" : `Quantity (Max: ${maxAvailable})`}
                </label>
                <input
                  type="number"
                  min={1}
                  max={maxAvailable}
                  value={issueForm.quantity}
                  disabled={isSubmitting}
                  onChange={(e) => setIssueForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueForm.issueDate}
                  disabled={isSubmitting}
                  onChange={(e) => setIssueForm((f) => ({ ...f, issueDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </div>
            </div>

            {/* Condition & Issued By */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                  Condition
                </label>
                <input
                  type="text"
                  value={issueForm.issueCondition}
                  disabled={isSubmitting}
                  onChange={(e) => setIssueForm((f) => ({ ...f, issueCondition: e.target.value }))}
                  placeholder="New / Good / Fair"
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                  Issued By
                </label>
                <input
                  type="text"
                  value={issueForm.issuedBy}
                  disabled={isSubmitting}
                  onChange={(e) => setIssueForm((f) => ({ ...f, issuedBy: e.target.value }))}
                  placeholder="Admin Name"
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                Issue Notes
              </label>
              <textarea
                rows={2}
                value={issueForm.issueNotes}
                disabled={isSubmitting}
                onChange={(e) => setIssueForm((f) => ({ ...f, issueNotes: e.target.value }))}
                placeholder="Optional assignment notes or instructions..."
                className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (issueMode === "bulk" && (variantStockViolations.length > 0 || totalStockExceeded))}
                className="px-6 py-2 rounded-2xl font-bold bg-brand-black dark:bg-white text-white dark:text-brand-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <FiLoader className="animate-spin" />
                ) : issueMode === "bulk" ? (
                  variantStockViolations.length > 0 ? (
                    `Stock Limit Exceeded (${variantStockViolations[0].variantName})`
                  ) : totalStockExceeded ? (
                    "Total Stock Exceeded"
                  ) : (
                    `Bulk Issue Asset (${selectedEmployeeIds.length} Staff)`
                  )
                ) : (
                  "Issue Asset"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
