"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Avatar from "@/components/Comon/Avatar";
import useAssetAssignmentApi from "@/hooks/useAssetAssignmentApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import { FiShield, FiCheckCircle, FiUserX, FiLoader } from "react-icons/fi";

export default function AssetClearancePage() {
  const { can } = useUserPermissions();
  const canView = can("asset-clearance", "view");
  const canEdit = can("asset-clearance", "edit");

  const assignmentApi = useAssetAssignmentApi();
  const { formatDate } = useSystemTimeZone();

  const [loading, setLoading] = useState(true);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [returningId, setReturningId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const data = await assignmentApi.getPendingReturns();
      setPendingReturns(data);
    } catch (err) {
      console.error("Failed to load pending returns:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleQuickReturn = async (assignment) => {
    const result = await Swal.fire({
      title: "Confirm return?",
      text: `Mark "${assignment.asset?.assetCode}" as returned by ${assignment.employee?.name}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
    });
    if (!result.isConfirmed) return;

    setReturningId(assignment._id);
    try {
      await assignmentApi.returnAsset(assignment._id, {
        returnDate: new Date().toISOString().split("T")[0],
        returnCondition: "Returned during exit clearance",
      });
      Swal.fire({ title: "Returned!", icon: "success", confirmButtonColor: "#FF1818", timer: 1500 });
      await loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to process return.";
      Swal.fire({ title: "Error!", text: msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setReturningId(null);
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

  // Group by employee
  const byEmployee = pendingReturns.reduce((acc, item) => {
    const empId = item.employee?._id || "unknown";
    if (!acc[empId]) acc[empId] = { employee: item.employee, items: [] };
    acc[empId].items.push(item);
    return acc;
  }, {});
  const groups = Object.values(byEmployee);

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      <Mtitle title="Exit Clearance" subtitle="Pending asset returns for resigned or terminated employees." />

      {loading ? (
        <SkeletonLoading variant="card" rows={3} />
      ) : groups.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiCheckCircle />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">All Clear</h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">No resigned or terminated employees have pending asset returns.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <motion.div key={group.employee?._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-3">
                <Avatar src={group.employee?.photo} name={group.employee?.name} size={11} />
                <div className="flex-1">
                  <h3 className="text-sm font-black text-brand-black dark:text-brand-white">{group.employee?.name}</h3>
                  <p className="text-[11px] text-brand-dark-grey flex items-center gap-1.5">
                    <FiUserX className="text-rose-500" /> <span className="capitalize">{group.employee?.status}</span> — {group.employee?.department}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[11px] font-extrabold border border-rose-500/20">{group.items.length} pending</span>
              </div>
              <div className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
                {group.items.map((item) => (
                  <div key={item._id} className="p-4 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-brand-black dark:text-brand-white">{item.asset?.assetCode}</p>
                      <p className="text-[10px] text-brand-dark-grey">{item.asset?.assetType?.name} · Issued {formatDate(item.issueDate)}</p>
                    </div>
                    {canEdit && (
                      <button onClick={() => handleQuickReturn(item)} disabled={returningId === item._id} className="px-4 py-2 rounded-xl bg-brand-black dark:bg-white text-white dark:text-brand-black font-bold text-[11px] cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                        {returningId === item._id ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                        Mark Returned
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
