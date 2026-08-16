"use client";

import React, { useState } from "react";
import useBonusPolicyApi from "@/hooks/useBonusPolicyApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import Mtitle from "@/components/Comon/Mtitle";
import Swal from "sweetalert2";
import {
  FiDollarSign,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiGift,
  FiX,
} from "react-icons/fi";

const INITIAL_FORM = {
  policyName: "",
  bonusType: "Festival",
  calculationType: "percentage_of_basic",
  bonusRate: 50,
  applicableMonth: "March",
  status: "active",
};

export default function BonusPolicyPage() {
  const { hasPermission } = useUserPermissions();
  const canView = hasPermission("/dashboard/settings/bonus-policy", "view");
  const canAdd = hasPermission("/dashboard/settings/bonus-policy", "add");
  const canEdit = hasPermission("/dashboard/settings/bonus-policy", "edit");
  const canDelete = hasPermission("/dashboard/settings/bonus-policy", "delete");

  const {
    bonusPolicies,
    stats,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    createBonusPolicy,
    updateBonusPolicy,
    deleteBonusPolicy,
  } = useBonusPolicyApi(50);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    if (!canAdd) return;
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) return;
    setEditingItem(item);
    setFormData({
      policyName: item.policyName || "",
      bonusType: item.bonusType || "Festival",
      calculationType: item.calculationType || "percentage_of_basic",
      bonusRate: item.bonusRate !== undefined ? item.bonusRate : 50,
      applicableMonth: item.applicableMonth || "",
      status: item.status || "active",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.policyName.trim()) {
      setFormError("Policy name is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      if (editingItem) {
        await updateBonusPolicy(editingItem._id, formData);
        Swal.fire("Bonus Policy Updated!", `"${formData.policyName}" updated.`, "success");
      } else {
        await createBonusPolicy(formData);
        Swal.fire("Bonus Policy Created!", `"${formData.policyName}" created.`, "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save bonus policy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    if (!canDelete) return;
    Swal.fire({
      title: "Delete Bonus Policy?",
      text: `Delete "${item.policyName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteBonusPolicy(item._id);
          Swal.fire("Deleted!", `"${item.policyName}" deleted.`, "success");
        } catch (err) {
          Swal.fire("Error", err?.response?.data?.message || "Failed to delete policy.", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 font-sans">
      <Mtitle
        title="Bonus Policy Configuration"
        subtitle="Configure festival, performance, and attendance bonuses, bonus calculation types (% of basic, % of gross, or fixed amount), and applicable payout months."
      />

      {/* SEARCH & ACTIONS */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
            <input
              type="text"
              placeholder="Search bonus policies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
            />
          </div>
        </div>

        {canAdd && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <FiPlus />
            <span>Add Bonus Policy</span>
          </button>
        )}
      </div>

      {/* POLICY CARDS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bonusPolicies.map((policy) => (
          <div key={policy._id} className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center font-black">
                  <FiGift />
                </div>
                <div>
                  <h4 className="text-sm font-black text-brand-black dark:text-brand-white">{policy.policyName}</h4>
                  <span className="text-[10px] text-brand-dark-grey uppercase font-bold">Type: {policy.bonusType}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${policy.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                  {policy.status}
                </span>
                {canEdit && (
                  <button onClick={() => handleOpenEdit(policy)} className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-all cursor-pointer">
                    <FiEdit />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(policy)} className="p-2 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red/20 transition-all cursor-pointer">
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                <span className="text-[10px] text-brand-dark-grey block">Calculation Type</span>
                <span className="uppercase text-brand-gold">{policy.calculationType.replace(/_/g, " ")}</span>
              </div>

              <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                <span className="text-[10px] text-brand-dark-grey block">Bonus Rate / Amount</span>
                <span className="text-emerald-500 font-black">
                  {policy.calculationType === "fixed_amount" ? `৳${policy.bonusRate}` : `${policy.bonusRate}%`}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight col-span-2">
                <span className="text-[10px] text-brand-dark-grey block">Applicable Month</span>
                <span>{policy.applicableMonth || "Manual / On-Demand"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
              <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                {editingItem ? "Edit Bonus Policy" : "Add Bonus Policy"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-brand-dark-grey hover:text-brand-red cursor-pointer">
                <FiX />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Policy Name <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={formData.policyName}
                  onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                  placeholder="e.g. Eid-ul-Fitr Festival Bonus"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Bonus Type</label>
                  <select
                    value={formData.bonusType}
                    onChange={(e) => setFormData({ ...formData, bonusType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                  >
                    <option value="Festival">Festival Bonus</option>
                    <option value="Performance">Performance Bonus</option>
                    <option value="Attendance">Attendance Bonus</option>
                    <option value="Annual">Annual Bonus</option>
                    <option value="Custom">Custom Bonus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Calculation Type</label>
                  <select
                    value={formData.calculationType}
                    onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                  >
                    <option value="percentage_of_basic">% of Basic Salary</option>
                    <option value="percentage_of_gross">% of Gross Salary</option>
                    <option value="fixed_amount">Fixed Amount (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Bonus Rate / Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bonusRate}
                    onChange={(e) => setFormData({ ...formData, bonusRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Applicable Month</label>
                  <select
                    value={formData.applicableMonth}
                    onChange={(e) => setFormData({ ...formData, applicableMonth: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                  >
                    <option value="">Manual / On-Demand</option>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-2xl bg-brand-offwhite border text-xs font-bold text-brand-dark-grey cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : editingItem ? "Update Bonus Policy" : "Create Bonus Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
