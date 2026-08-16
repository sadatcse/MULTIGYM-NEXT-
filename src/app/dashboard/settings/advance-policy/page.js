"use client";

import React, { useState } from "react";
import useAdvancePolicyApi from "@/hooks/useAdvancePolicyApi";
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
  FiX,
  FiShield,
} from "react-icons/fi";

const INITIAL_FORM = {
  policyName: "",
  maxAdvancePercent: 50,
  maxAdvanceCount: 2,
  defaultDeductionType: "salary_deduction",
  minServiceMonths: 3,
  status: "active",
};

export default function AdvancePolicyPage() {
  const { hasPermission } = useUserPermissions();
  const canView = hasPermission("/dashboard/settings/advance-policy", "view");
  const canAdd = hasPermission("/dashboard/settings/advance-policy", "add");
  const canEdit = hasPermission("/dashboard/settings/advance-policy", "edit");
  const canDelete = hasPermission("/dashboard/settings/advance-policy", "delete");

  const {
    advancePolicies,
    stats,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    createAdvancePolicy,
    updateAdvancePolicy,
    deleteAdvancePolicy,
  } = useAdvancePolicyApi(50);

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
      maxAdvancePercent: item.maxAdvancePercent !== undefined ? item.maxAdvancePercent : 50,
      maxAdvanceCount: item.maxAdvanceCount !== undefined ? item.maxAdvanceCount : 2,
      defaultDeductionType: item.defaultDeductionType || "salary_deduction",
      minServiceMonths: item.minServiceMonths !== undefined ? item.minServiceMonths : 3,
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
        await updateAdvancePolicy(editingItem._id, formData);
        Swal.fire("Policy Updated!", `"${formData.policyName}" has been updated.`, "success");
      } else {
        await createAdvancePolicy(formData);
        Swal.fire("Policy Created!", `"${formData.policyName}" has been created.`, "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save advance policy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    if (!canDelete) return;
    Swal.fire({
      title: "Delete Advance Policy?",
      text: `Delete "${item.policyName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteAdvancePolicy(item._id);
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
        title="Salary Advance Policy Configuration"
        subtitle="Configure max advance percentage of basic salary, maximum advance requests per year, default deduction type, and minimum service months."
      />

      {/* SEARCH & ACTIONS */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
            <input
              type="text"
              placeholder="Search advance policies..."
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
            <span>Add Advance Policy</span>
          </button>
        )}
      </div>

      {/* POLICY CARDS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {advancePolicies.map((policy) => (
          <div key={policy._id} className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
                  <FiDollarSign />
                </div>
                <div>
                  <h4 className="text-sm font-black text-brand-black dark:text-brand-white">{policy.policyName}</h4>
                  <span className="text-[10px] text-brand-dark-grey uppercase font-bold">Deduction: {policy.defaultDeductionType}</span>
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
                <span className="text-[10px] text-brand-dark-grey block">Max Advance %</span>
                <span className="text-emerald-500 font-black">{policy.maxAdvancePercent}% of Basic</span>
              </div>

              <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                <span className="text-[10px] text-brand-dark-grey block">Max Requests / Year</span>
                <span>{policy.maxAdvanceCount} Times</span>
              </div>

              <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight col-span-2">
                <span className="text-[10px] text-brand-dark-grey block">Min Service Required</span>
                <span>{policy.minServiceMonths} Months of Employment</span>
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
                {editingItem ? "Edit Advance Policy" : "Add Advance Policy"}
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
                  placeholder="e.g. Standard Salary Advance Policy"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Max Advance %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.maxAdvancePercent}
                    onChange={(e) => setFormData({ ...formData, maxAdvancePercent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Max Requests / Year</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxAdvanceCount}
                    onChange={(e) => setFormData({ ...formData, maxAdvanceCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Deduction Method</label>
                  <select
                    value={formData.defaultDeductionType}
                    onChange={(e) => setFormData({ ...formData, defaultDeductionType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                  >
                    <option value="salary_deduction">Salary Deduction</option>
                    <option value="monthly_installment">Monthly Installment</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Min Service Months</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minServiceMonths}
                    onChange={(e) => setFormData({ ...formData, minServiceMonths: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  />
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
                  {isSubmitting ? "Saving..." : editingItem ? "Update Advance Policy" : "Create Advance Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
