"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Avatar from "@/components/Comon/Avatar";
import useAssetAssignmentApi from "@/hooks/useAssetAssignmentApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import { FiShield, FiCheckCircle, FiUserX, FiLoader, FiCheckSquare, FiUser, FiSearch } from "react-icons/fi";

export default function AssetClearancePage() {
  const { can } = useUserPermissions();
  const canView = can("asset-clearance", "view");
  const canEdit = can("asset-clearance", "edit");

  const assignmentApi = useAssetAssignmentApi();
  const { formatDate } = useSystemTimeZone();

  const [loading, setLoading] = useState(true);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [selectedEmployeeKey, setSelectedEmployeeKey] = useState("");
  const [returningId, setReturningId] = useState(null);
  const [clearingEmpId, setClearingEmpId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await assignmentApi.getPendingReturns();
      setPendingReturns(data);
    } catch (err) {
      console.error("Failed to load pending returns:", err);
    } finally {
      setLoading(false);
    }
  }, [assignmentApi]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group pending returns by employee
  const byEmployee = useMemo(() => {
    return pendingReturns.reduce((acc, item) => {
      const key = item.employeeCode || item.employeeName || item.employee?._id || "unknown";
      if (!acc[key]) {
        acc[key] = {
          key,
          employeeName: item.employeeName || item.employee?.name || "Staff Member",
          employeeCode: item.employeeCode || item.employee?.employeeId || "N/A",
          departmentName: item.departmentName || item.employee?.department || "General",
          branchName: item.branchName || item.employee?.branch || "All Branches",
          employeeStatus: item.employee?.status || "resigned",
          photo: item.employee?.photo,
          items: [],
        };
      }
      acc[key].items.push(item);
      return acc;
    }, {});
  }, [pendingReturns]);

  const groups = useMemo(() => Object.values(byEmployee), [byEmployee]);

  // Selected Group
  const selectedGroup = useMemo(() => {
    if (!selectedEmployeeKey) return null;
    return byEmployee[selectedEmployeeKey] || null;
  }, [byEmployee, selectedEmployeeKey]);

  const handleQuickReturn = async (assignment) => {
    const result = await Swal.fire({
      title: "Confirm Return?",
      text: `Mark "${assignment.asset?.description || assignment.assetCode || 'Asset'}" as returned by ${assignment.employeeName || assignment.employee?.name}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
    });
    if (!result.isConfirmed) return;

    setReturningId(assignment._id);
    try {
      await assignmentApi.returnAsset(assignment._id, {
        returnDate: new Date().toISOString().split("T")[0],
        returnCondition: "Good (Exit Clearance)",
        returnedTo: "System Admin",
      });
      Swal.fire({ title: "Returned!", icon: "success", confirmButtonColor: "#FF1818", timer: 1500 });
      await loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to process return.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setReturningId(null);
    }
  };

  const handleReturnAllForEmployee = async (group) => {
    const empName = group.employeeName || "Staff Member";
    const result = await Swal.fire({
      title: `Return All (${group.items.length} items)?`,
      text: `Process exit clearance return for all ${group.items.length} pending items assigned to ${empName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      confirmButtonText: "Yes, Return All",
    });
    if (!result.isConfirmed) return;

    setClearingEmpId(group.key);
    try {
      for (const item of group.items) {
        await assignmentApi.returnAsset(item._id, {
          returnDate: new Date().toISOString().split("T")[0],
          returnCondition: "Returned during full exit clearance",
          returnedTo: "System Admin",
        });
      }
      Swal.fire({ title: "Cleared!", text: `All assets for ${empName} have been cleared.`, icon: "success", confirmButtonColor: "#FF1818", timer: 2000 });
      setSelectedEmployeeKey("");
      await loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to clear all assets.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setClearingEmpId(null);
    }
  };

  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        <Mtitle title="Exit Clearance" subtitle="Pending asset returns for resigned or terminated employees." />
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl" />
          </div>
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">Access Restricted</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      <Mtitle title="Exit Clearance" subtitle="Select an employee to process asset exit clearance returns." />

      {/* Mandatory Employee Selector Bar */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-2">
        <label className="block text-xs font-black uppercase tracking-wider text-brand-gold">
          Select Employee For Exit Clearance *
        </label>
        <div className="flex items-center gap-3 flex-col sm:flex-row">
          <div className="relative flex-1 w-full">
            <select
              value={selectedEmployeeKey}
              onChange={(e) => setSelectedEmployeeKey(e.target.value)}
              className="w-full bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-2xl px-4 py-3 outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
            >
              <option value="">-- Choose Employee to View Exit Clearance Assets --</option>
              {groups.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.employeeName} ({g.employeeCode}) — {g.items.length} Pending Item{g.items.length !== 1 ? "s" : ""} [{g.departmentName}]
                </option>
              ))}
            </select>
          </div>

          {selectedEmployeeKey && (
            <button
              onClick={() => setSelectedEmployeeKey("")}
              className="px-4 py-3 rounded-2xl bg-brand-beige/30 dark:bg-brand-midnight text-brand-dark-grey hover:text-brand-black dark:hover:text-white font-bold text-xs cursor-pointer transition-colors shrink-0"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonLoading variant="card" rows={2} />
      ) : groups.length === 0 ? (
        /* State 0: Nothing pending system-wide — an empty dropdown alone
           looks identical to a broken page, so this state must say
           explicitly that zero resigned/terminated employees currently
           have anything outstanding (this is the normal, expected state
           whenever nobody has recently left). */
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiCheckCircle />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">All Clear</h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
            No resigned or terminated employees currently have pending asset returns. This list only ever includes staff whose status is Resigned or Terminated — an active employee holding equipment is normal and won&apos;t appear here.
          </p>
        </div>
      ) : !selectedEmployeeKey ? (
        /* State 1: No Employee Selected */
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiUser />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">Select an Employee</h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
            Please choose an employee from the dropdown above to view and process their pending asset exit clearance returns.
          </p>
          <div className="mt-4 pt-4 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
            <span className="text-[10px] font-black uppercase text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full">
              {groups.length} Employee{groups.length !== 1 ? "s" : ""} Require Exit Clearance
            </span>
          </div>
        </div>
      ) : !selectedGroup ? (
        /* State 2: Selected Employee Has No Pending Assets */
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiCheckCircle />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">Exit Clearance Cleared</h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
            This employee has no pending returnable assets. Exit clearance for assets is fully complete.
          </p>
        </div>
      ) : (
        /* State 3: Selected Employee Assets Details */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar src={selectedGroup.photo} name={selectedGroup.employeeName} size={11} />
              <div>
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">{selectedGroup.employeeName}</h3>
                <p className="text-[11px] text-brand-dark-grey flex items-center gap-1.5 mt-0.5">
                  <span className="font-bold text-brand-gold">{selectedGroup.employeeCode}</span> • {selectedGroup.departmentName} ({selectedGroup.branchName})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[11px] font-extrabold border border-rose-500/20">
                {selectedGroup.items.length} Asset{selectedGroup.items.length !== 1 ? "s" : ""} Pending Return
              </span>
              {canEdit && (
                <button
                  onClick={() => handleReturnAllForEmployee(selectedGroup)}
                  disabled={clearingEmpId === selectedGroup.key}
                  className="px-4 py-2 rounded-2xl bg-brand-gold text-brand-midnight font-black text-xs cursor-pointer hover:bg-brand-gold-hover transition-all flex items-center gap-1.5 shadow-md shadow-brand-gold/20 disabled:opacity-50"
                >
                  {clearingEmpId === selectedGroup.key ? <FiLoader className="animate-spin text-sm" /> : <FiCheckSquare className="text-sm" />}
                  Return All ({selectedGroup.items.length})
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
            {selectedGroup.items.map((item) => (
              <div key={item._id} className="p-4 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-extrabold text-brand-black dark:text-brand-white">
                    {item.asset?.description || item.assetCode || item.asset?.assetCode}
                    {item.size && <span className="ml-2 px-2 py-0.5 rounded-md bg-brand-gold/10 text-brand-gold font-bold text-[10px]">Size: {item.size}</span>}
                  </p>
                  <p className="text-[10px] text-brand-dark-grey mt-0.5">
                    Category: {item.asset?.assetType?.category || "Company Asset"} • Quantity Pending: <strong className="text-brand-gold">{item.quantityPending || item.quantity}</strong> • Issued {formatDate(item.issueDate)}
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleQuickReturn(item)}
                    disabled={returningId === item._id || clearingEmpId === selectedGroup.key}
                    className="px-4 py-2 rounded-xl bg-brand-black dark:bg-white text-white dark:text-brand-black font-bold text-[11px] cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                  >
                    {returningId === item._id ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                    Mark Returned
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
