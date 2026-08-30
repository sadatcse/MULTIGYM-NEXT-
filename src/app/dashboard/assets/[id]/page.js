"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import useAssetApi from "@/hooks/useAssetApi";
import useAssetAssignmentApi from "@/hooks/useAssetAssignmentApi";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import Avatar from "@/components/Comon/Avatar";
import { FiArrowLeft, FiPackage, FiUserCheck, FiX, FiLoader, FiTag } from "react-icons/fi";

const STATUS_BADGE = {
  active: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  returned: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getAssetById } = useAssetApi();
  const assignmentApi = useAssetAssignmentApi();
  const { formatDate } = useSystemTimeZone();

  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [assetData, historyData] = await Promise.all([getAssetById(id), assignmentApi.getByAsset(id)]);
      setAsset(assetData);
      setHistory(historyData);
    } catch (err) {
      console.error("Failed to load asset:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const [returnTarget, setReturnTarget] = useState(null);
  const [returnForm, setReturnForm] = useState({ returnDate: new Date().toISOString().split("T")[0], returnCondition: "", returnedTo: "", returnNotes: "", damageOrLoss: "none" });
  const [isReturning, setIsReturning] = useState(false);

  const handleOpenReturn = (assignment) => {
    setReturnTarget(assignment);
    setReturnForm({ returnDate: new Date().toISOString().split("T")[0], returnCondition: "", returnedTo: "", returnNotes: "", damageOrLoss: "none" });
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (isReturning || !returnTarget) return;
    setIsReturning(true);
    try {
      await assignmentApi.returnAsset(returnTarget._id, returnForm);
      Swal.fire({ title: "Returned!", text: "Item marked as returned.", icon: "success", confirmButtonColor: "#FF1818", timer: 1800 });
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

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/dashboard/assets")} className="p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 text-brand-dark-grey hover:text-brand-black dark:hover:text-white cursor-pointer">
          <FiArrowLeft />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl">
            <FiPackage />
          </div>
          <div>
            <h1 className="text-xl font-black text-brand-black dark:text-brand-white">{asset.assetCode}</h1>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Available / Total</span>
          <span className="text-xl font-black text-brand-gold mt-1 block">{asset.quantityAvailable} / {asset.quantityTotal}</span>
        </div>
        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Status</span>
          <span className="text-xl font-black text-brand-black dark:text-brand-white mt-1 block capitalize">{asset.status}</span>
        </div>
        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Serial / Size</span>
          <span className="text-xl font-black text-brand-black dark:text-brand-white mt-1 block">{asset.serialNumber || asset.size || "—"}</span>
        </div>
        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Condition</span>
          <span className="text-xl font-black text-brand-black dark:text-brand-white mt-1 block">{asset.condition || "—"}</span>
        </div>
      </div>

      <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-brand-beige/50 dark:border-brand-dark-grey/50">
          <h3 className="text-xs font-black uppercase tracking-wider text-brand-gold">Assignment History</h3>
          <p className="text-[11px] text-brand-dark-grey mt-1">Every employee who has held this item, in order — nothing is ever deleted.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Issued</th>
                <th className="py-3 px-4">Returned</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-brand-dark-grey">No assignment history yet.</td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h._id} className="hover:bg-brand-gold/5">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={h.employee?.photo} name={h.employee?.name} size={8} />
                        <div>
                          <p className="font-bold text-brand-black dark:text-brand-white">{h.employee?.name || "Unknown"}</p>
                          <p className="text-[10px] text-brand-dark-grey">{h.employee?.department || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-brand-dark-grey">{formatDate(h.issueDate)} <span className="text-[10px]">({h.issueCondition || "—"})</span></td>
                    <td className="py-3 px-4 text-brand-dark-grey">{h.returnDate ? `${formatDate(h.returnDate)} (${h.returnCondition || "—"})` : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize border ${STATUS_BADGE[h.status]}`}>{h.status}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {h.status === "active" && isReturnable && (
                        <button onClick={() => handleOpenReturn(h)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-brand-black dark:bg-white text-white dark:text-brand-black cursor-pointer flex items-center gap-1 mx-auto">
                          <FiUserCheck className="text-xs" /> Return
                        </button>
                      )}
                      {h.status === "active" && !isReturnable && <span className="text-[10px] text-brand-dark-grey">No return needed</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <p className="text-brand-dark-grey">Returning from <span className="font-bold text-brand-black dark:text-brand-white">{returnTarget.employee?.name}</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Return Date</label>
                    <input type="date" value={returnForm.returnDate} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, returnDate: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Return Condition</label>
                    <input type="text" value={returnForm.returnCondition} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, returnCondition: e.target.value }))} placeholder="Good / Used / Damaged" className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Damage / Loss</label>
                  <select value={returnForm.damageOrLoss} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, damageOrLoss: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer">
                    <option value="none">None</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost">Lost</option>
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
    </div>
  );
}
