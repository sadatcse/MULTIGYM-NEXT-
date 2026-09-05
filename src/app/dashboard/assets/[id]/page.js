"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import useAssetApi from "@/hooks/useAssetApi";
import useAssetAssignmentApi from "@/hooks/useAssetAssignmentApi";
import useAssetReportApi from "@/hooks/useAssetReportApi";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import Avatar from "@/components/Comon/Avatar";
import IssueAssetModal from "@/components/Assets/IssueAssetModal";
import {
  FiArrowLeft,
  FiPackage,
  FiUserCheck,
  FiUsers,
  FiX,
  FiLoader,
  FiTag,
  FiLayers,
  FiClock,
  FiGrid,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";

const STATUS_BADGE = {
  active: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  returned: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  partially_returned: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getAssetById } = useAssetApi();
  const assignmentApi = useAssetAssignmentApi();
  const { getAssetTransactions } = useAssetReportApi();
  const { formatDate } = useSystemTimeZone();

  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("assignments"); // "assignments" | "sizes" | "transactions"
  const [loading, setLoading] = useState(true);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueModalInitialMode, setIssueModalInitialMode] = useState("single");

  const loadData = useCallback(async () => {
    try {
      const [assetData, historyData] = await Promise.all([getAssetById(id), assignmentApi.getByAsset(id)]);
      setAsset(assetData);
      setHistory(historyData);

      if (assetData?.assetCode) {
        const txnRes = await getAssetTransactions({ assetCode: assetData.assetCode, limit: 100 });
        setTransactions(txnRes?.data || []);
      }
    } catch (err) {
      console.error("Failed to load asset:", err);
    } finally {
      setLoading(false);
    }
  }, [id, getAssetById, assignmentApi, getAssetTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [returnTarget, setReturnTarget] = useState(null);
  const [returnForm, setReturnForm] = useState({
    returnDate: new Date().toISOString().split("T")[0],
    returnQuantity: 1,
    returnCondition: "Good",
    returnedTo: "",
    returnNotes: "",
    damageOrLoss: "none",
  });
  const [isReturning, setIsReturning] = useState(false);

  const handleOpenReturn = (assignment) => {
    setReturnTarget(assignment);
    const pendingQty = assignment.quantityPending || assignment.quantity - (assignment.quantityReturned || 0);
    setReturnForm({
      returnDate: new Date().toISOString().split("T")[0],
      returnQuantity: pendingQty,
      returnCondition: "Good",
      returnedTo: "",
      returnNotes: "",
      damageOrLoss: "none",
    });
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (isReturning || !returnTarget) return;
    setIsReturning(true);
    try {
      await assignmentApi.returnAsset(returnTarget._id, returnForm);
      Swal.fire({ title: "Returned!", text: "Item return processed successfully.", icon: "success", confirmButtonColor: "#FF1818", timer: 1800 });
      setReturnTarget(null);
      await loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to process return.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsReturning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg text-brand-primary"></span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-20">
        <p className="text-brand-dark-grey text-sm">Asset not found.</p>
        <button onClick={() => router.push("/dashboard/assets")} className="mt-4 px-5 py-2 rounded-2xl bg-brand-red text-white text-xs font-bold cursor-pointer">
          Back to Assets
        </button>
      </div>
    );
  }

  const isReturnable = asset.assetType?.returnable !== false;
  const hasSizes = asset.sizeVariants && asset.sizeVariants.length > 0;

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/assets")} className="p-2.5 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 text-brand-dark-grey hover:text-brand-black dark:hover:text-white cursor-pointer shadow-sm">
            <FiArrowLeft className="text-lg" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center text-xl font-bold">
              <FiPackage />
            </div>
            <div>
              <h1 className="text-xl font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                {asset.assetCode}
                {asset.isLowStock && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <FiAlertTriangle /> Low Stock
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light font-bold text-[10px] border border-brand-beige/40 dark:border-brand-dark-grey/50">
                  <FiTag className="text-brand-gold text-[10px]" />
                  {asset.assetType?.name}
                </span>
                {!isReturnable && <span className="text-[10px] font-bold text-brand-dark-grey">One-time issue item</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Issue Asset to Staff */}
        {asset.quantityAvailable > 0 && (
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-brand-black dark:bg-white text-white dark:text-brand-black font-extrabold text-xs hover:bg-brand-gold hover:text-brand-midnight dark:hover:bg-brand-gold dark:hover:text-brand-midnight transition-all cursor-pointer flex items-center gap-2 shadow-md shrink-0"
          >
            <FiUserCheck className="text-base" /> Issue Asset to Staff
          </button>
        )}
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey block">Available / Total</span>
          <span className="text-xl font-black text-brand-gold mt-1 block">{asset.quantityAvailable} / {asset.quantityTotal}</span>
        </div>
        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey block">Assigned / Returned</span>
          <span className="text-xl font-black text-blue-500 mt-1 block">{asset.quantityAssigned || 0}</span>
        </div>
        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey block">Serial / Size Variations</span>
          {hasSizes ? (
            <div>
              <span className="text-xl font-black text-brand-black dark:text-brand-white mt-0.5 block">
                {asset.sizeVariants.length} Variations
              </span>
              <span className="text-[10px] text-brand-gold font-bold truncate block mt-0.5" title={asset.sizeVariants.map((v) => v.size || v.variantName).filter(Boolean).join(", ")}>
                ({asset.sizeVariants.map((v) => v.size || v.variantName).filter(Boolean).join(", ")})
              </span>
            </div>
          ) : (
            <span className="text-xl font-black text-brand-black dark:text-brand-white mt-1 block">
              {asset.serialNumber || asset.size || "—"}
            </span>
          )}
        </div>
        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey block">Condition</span>
          <span className="text-xl font-black text-brand-black dark:text-brand-white mt-1 block">{asset.condition || "New"}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 pb-2">
        <button
          onClick={() => setActiveTab("assignments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
            activeTab === "assignments"
              ? "bg-brand-gold text-brand-midnight shadow-md shadow-brand-gold/20"
              : "text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
          }`}
        >
          <FiUserCheck className="text-sm" /> Employee Assignments ({history.length})
        </button>

        {hasSizes && (
          <button
            onClick={() => setActiveTab("sizes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
              activeTab === "sizes"
                ? "bg-brand-gold text-brand-midnight shadow-md shadow-brand-gold/20"
                : "text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
            }`}
          >
            <FiLayers className="text-sm" /> Size Inventory Breakdown ({asset.sizeVariants.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
            activeTab === "transactions"
              ? "bg-brand-gold text-brand-midnight shadow-md shadow-brand-gold/20"
              : "text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
          }`}
        >
          <FiClock className="text-sm" /> Audit Ledger ({transactions.length})
        </button>
      </div>

      {/* TAB 1: EMPLOYEE ASSIGNMENTS */}
      {activeTab === "assignments" && (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-brand-beige/50 dark:border-brand-dark-grey/50">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-gold">Assignment History</h3>
            <p className="text-[11px] text-brand-dark-grey mt-0.5">Historical employee assignment snapshots are permanently retained.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4 text-center">Size</th>
                  <th className="py-3.5 px-4 text-center">Issued / Pending</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Return Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-brand-dark-grey">No assignment history records found.</td>
                  </tr>
                ) : (
                  history.map((h) => {
                    const pendingQty = h.quantityPending ?? (h.quantity - (h.quantityReturned || 0));
                    return (
                      <tr key={h._id} className="hover:bg-brand-gold/5">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={h.employee?.photo} name={h.employeeName || h.employee?.name} size={8} />
                            <div>
                              <p className="font-bold text-brand-black dark:text-brand-white">{h.employeeName || h.employee?.name || "Archived Staff"}</p>
                              <p className="text-[10px] text-brand-dark-grey">{h.employeeCode || "N/A"} • {h.departmentName || h.employee?.department || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">{h.size || "—"}</td>
                        <td className="py-3.5 px-4 text-center font-black text-brand-gold">{h.quantity} issued ({pendingQty} pending)</td>
                        <td className="py-3.5 px-4 text-brand-dark-grey">{formatDate(h.issueDate)} <span className="text-[10px]">({h.issueCondition || "Good"})</span></td>
                        <td className="py-3.5 px-4 text-brand-dark-grey">{h.returnDate ? `${formatDate(h.returnDate)} (${h.returnCondition || "Good"})` : "—"}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${STATUS_BADGE[h.status] || "bg-brand-beige/30 text-brand-dark-grey"}`}>{h.status}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {(h.status === "active" || h.status === "partially_returned") && isReturnable && (
                            <button onClick={() => handleOpenReturn(h)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-brand-black dark:bg-white text-white dark:text-brand-black cursor-pointer flex items-center gap-1 mx-auto shadow-xs">
                              <FiUserCheck className="text-xs" /> Return
                            </button>
                          )}
                          {(h.status === "active" || h.status === "partially_returned") && !isReturnable && (
                            <span className="text-[10px] text-brand-dark-grey">One-time issue</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SIZE INVENTORY BREAKDOWN */}
      {activeTab === "sizes" && hasSizes && (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-gold">Size Variant Stock Inventory</h3>
            <span className="text-[10px] font-bold text-brand-dark-grey">Total Sizes: {asset.sizeVariants.length}</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                <tr>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4 text-center">Total Stock</th>
                  <th className="py-3.5 px-4 text-center">Available</th>
                  <th className="py-3.5 px-4 text-center">Assigned</th>
                  <th className="py-3.5 px-4 text-center">Damaged</th>
                  <th className="py-3.5 px-4 text-center">Lost</th>
                  <th className="py-3.5 px-4 text-center">Under Repair</th>
                  <th className="py-3.5 px-4 text-center">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 font-medium">
                {asset.sizeVariants.map((v) => {
                  const isLow = v.quantityAvailable <= (v.minStockThreshold || 0);
                  return (
                    <tr key={v.size} className="hover:bg-brand-gold/5">
                      <td className="py-3.5 px-4 font-black text-brand-black dark:text-brand-white text-sm">Size {v.size}</td>
                      <td className="py-3.5 px-4 text-center font-extrabold">{v.quantityTotal}</td>
                      <td className="py-3.5 px-4 text-center font-black text-emerald-500">{v.quantityAvailable}</td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-blue-500">{v.quantityAssigned}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-rose-500">{v.quantityDamaged || 0}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-rose-500">{v.quantityLost || 0}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-500">{v.quantityUnderRepair || 0}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isLow ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          {isLow ? "Low Stock" : "In Stock"}
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

      {/* TAB 3: AUDIT LEDGER */}
      {activeTab === "transactions" && (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-brand-beige/50 dark:border-brand-dark-grey/50">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-gold">Asset Transaction Audit Log</h3>
            <p className="text-[11px] text-brand-dark-grey mt-0.5">Immutable movement ledger tracking purchase, issuance, returns, and damages.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                <tr>
                  <th className="py-3.5 px-4">TXN ID</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4 text-center">Size</th>
                  <th className="py-3.5 px-4 text-center">Qty</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Performed By</th>
                  <th className="py-3.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-brand-dark-grey">No transaction log entries found.</td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-brand-gold/5">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-gold">{t.transactionId}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          t.transactionType === "ISSUE" ? "bg-blue-500/10 text-blue-500" : t.transactionType === "RETURN" ? "bg-emerald-500/10 text-emerald-500" : "bg-brand-gold/10 text-brand-gold"
                        }`}>
                          {t.transactionType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-brand-black dark:text-brand-white">
                        {t.employeeName || "—"}
                        {t.employeeCode && <span className="block text-[10px] text-brand-dark-grey font-normal">{t.employeeCode}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">{t.size || "—"}</td>
                      <td className="py-3.5 px-4 text-center font-black">{t.quantity}</td>
                      <td className="py-3.5 px-4 text-brand-dark-grey">{formatDate(t.date)}</td>
                      <td className="py-3.5 px-4 text-brand-dark-grey">{t.performedBy || "System Admin"}</td>
                      <td className="py-3.5 px-4 text-brand-dark-grey truncate max-w-xs">{t.notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Asset Modal */}
      <AnimatePresence>
        {returnTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">Return Asset</h3>
                <button onClick={() => setReturnTarget(null)} disabled={isReturning} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={handleReturnSubmit} className="p-6 space-y-4 text-xs">
                <p className="text-brand-dark-grey">Returning from <span className="font-bold text-brand-black dark:text-brand-white">{returnTarget.employeeName || returnTarget.employee?.name}</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Return Quantity</label>
                    <input type="number" min={1} max={returnTarget.quantityPending || returnTarget.quantity} value={returnForm.returnQuantity} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, returnQuantity: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Return Date</label>
                    <input type="date" value={returnForm.returnDate} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, returnDate: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Damage / Loss Assessment</label>
                  <select value={returnForm.damageOrLoss} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, damageOrLoss: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer">
                    <option value="none">None (Returned in Good Condition)</option>
                    <option value="damaged">Damaged (Requires Repair / Write-off)</option>
                    <option value="lost">Lost Item</option>
                    <option value="repair">Send for Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Returned To</label>
                  <input type="text" value={returnForm.returnedTo} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, returnedTo: e.target.value }))} placeholder="Admin name" className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Remarks</label>
                  <textarea rows={2} value={returnForm.returnNotes} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, returnNotes: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none" />
                </div>
                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setReturnTarget(null)} disabled={isReturning} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isReturning} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isReturning ? <FiLoader className="animate-spin" /> : "Confirm Return"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reusable Issue Asset Modal Component */}
      <IssueAssetModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        preselectedAsset={asset}
        initialMode={issueModalInitialMode}
        onSuccess={loadData}
      />
    </div>
  );
}
