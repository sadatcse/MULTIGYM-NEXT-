"use client";

import React, { useState } from "react";
import useLatePolicyApi from "@/hooks/useLatePolicyApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import Mtitle from "@/components/Comon/Mtitle";
import Swal from "sweetalert2";
import {
  FiClock,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiDollarSign,
  FiX,
} from "react-icons/fi";

const INITIAL_FORM = {
  policyName: "",
  matchingMethod: "window",
  presentRule: "both_punches",
  graceBeforeStart: 15,
  graceAfterEnd: 15,
  lateTolerance: 15,
  deductionType: "per_minute",
  deductionAmount: 5,
  maxLateAllowedPerMonth: 3,
  lateCountAsAbsent: "no",
  compensatedLate: "yes",
  earlyExitTolerance: 15,
  maxEarlyExitsAllowedPerMonth: 3,
  compensatedEarlyExit: "yes",
  status: "active",
};

export default function LatePolicyPage() {
  const { settings } = useSystemTimeZone();
  const currencySymbol = settings.currencySymbol || "৳";
  const { hasPermission } = useUserPermissions();
  const canView = hasPermission("/dashboard/settings/late-policy", "view");
  const canAdd = hasPermission("/dashboard/settings/late-policy", "add");
  const canEdit = hasPermission("/dashboard/settings/late-policy", "edit");
  const canDelete = hasPermission("/dashboard/settings/late-policy", "delete");

  const {
    latePolicies,
    stats,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    createLatePolicy,
    updateLatePolicy,
    deleteLatePolicy,
  } = useLatePolicyApi(50);

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
      matchingMethod: item.matchingMethod || "window",
      presentRule: item.presentRule || "both_punches",
      graceBeforeStart: item.graceBeforeStart !== undefined ? item.graceBeforeStart : 15,
      graceAfterEnd: item.graceAfterEnd !== undefined ? item.graceAfterEnd : 15,
      lateTolerance: item.lateTolerance !== undefined ? item.lateTolerance : 15,
      deductionType: item.deductionType || "per_minute",
      deductionAmount: item.deductionAmount !== undefined ? item.deductionAmount : 5,
      maxLateAllowedPerMonth: item.maxLateAllowedPerMonth !== undefined ? item.maxLateAllowedPerMonth : 3,
      lateCountAsAbsent: item.lateCountAsAbsent || "no",
      compensatedLate: item.compensatedLate || "yes",
      earlyExitTolerance: item.earlyExitTolerance !== undefined ? item.earlyExitTolerance : 15,
      maxEarlyExitsAllowedPerMonth: item.maxEarlyExitsAllowedPerMonth !== undefined ? item.maxEarlyExitsAllowedPerMonth : 3,
      compensatedEarlyExit: item.compensatedEarlyExit || "yes",
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
        await updateLatePolicy(editingItem._id, formData);
        Swal.fire("Policy Updated!", `"${formData.policyName}" has been updated.`, "success");
      } else {
        await createLatePolicy(formData);
        Swal.fire("Policy Created!", `"${formData.policyName}" has been created.`, "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save late policy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    if (!canDelete) return;
    Swal.fire({
      title: "Delete Policy?",
      text: `Delete "${item.policyName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteLatePolicy(item._id);
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
        title="Late & Attendance Policy Configuration"
        subtitle="Configure matching method (Window/Nearest shift), present rules, grace times, deduction rates, monthly limits, and compensated work hour rules."
      />

      {/* SEARCH & ACTIONS */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
            <input
              type="text"
              placeholder="Search policies..."
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
            <span>Add Late Policy</span>
          </button>
        )}
      </div>

      {/* POLICY CARDS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {latePolicies.map((policy) => (
          <div key={policy._id} className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center font-black">
                  <FiClock />
                </div>
                <div>
                  <h4 className="text-sm font-black text-brand-black dark:text-brand-white">{policy.policyName}</h4>
                  <span className="text-[10px] text-brand-dark-grey uppercase font-bold">Matching: {policy.matchingMethod} | Present: {policy.presentRule}</span>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
              <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                <span className="text-[10px] text-brand-dark-grey block">Grace Before / After</span>
                <span>{policy.graceBeforeStart}m / {policy.graceAfterEnd}m</span>
              </div>

              <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                <span className="text-[10px] text-brand-dark-grey block">Late Tolerance</span>
                <span className="text-amber-500">{policy.lateTolerance} Minutes</span>
              </div>

              <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                <span className="text-[10px] text-brand-dark-grey block">Deduction Type</span>
                <span className="uppercase text-brand-red">{policy.deductionType} ({policy.deductionAmount})</span>
              </div>

              <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                <span className="text-[10px] text-brand-dark-grey block">Max Late / Mo</span>
                <span>{policy.maxLateAllowedPerMonth} Times</span>
              </div>

              <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                <span className="text-[10px] text-brand-dark-grey block">Count as Absent</span>
                <span className="uppercase">{policy.lateCountAsAbsent}</span>
              </div>

              <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                <span className="text-[10px] text-brand-dark-grey block">Compensate Hours</span>
                <span className="uppercase text-emerald-500">{policy.compensatedLate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
              <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                {editingItem ? "Edit Late Policy" : "Add Late Policy"}
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
                  placeholder="e.g. Standard Corporate Late Policy"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Matching Method</label>
                  <select
                    value={formData.matchingMethod}
                    onChange={(e) => setFormData({ ...formData, matchingMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                  >
                    <option value="window">Window (Grace Time)</option>
                    <option value="nearest_shift">Nearest Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Present Rule</label>
                  <select
                    value={formData.presentRule}
                    onChange={(e) => setFormData({ ...formData, presentRule: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                  >
                    <option value="both_punches">Both Punches (Check-In AND Check-Out)</option>
                    <option value="any_punch">Any Punch (Check-In OR Check-Out)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Grace Before Start (min)</label>
                  <input
                    type="number"
                    value={formData.graceBeforeStart}
                    onChange={(e) => setFormData({ ...formData, graceBeforeStart: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Grace After End (min)</label>
                  <input
                    type="number"
                    value={formData.graceAfterEnd}
                    onChange={(e) => setFormData({ ...formData, graceAfterEnd: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Late Tolerance (min)</label>
                  <input
                    type="number"
                    value={formData.lateTolerance}
                    onChange={(e) => setFormData({ ...formData, lateTolerance: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Deduction Type</label>
                  <select
                    value={formData.deductionType}
                    onChange={(e) => setFormData({ ...formData, deductionType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                  >
                    <option value="per_minute">Per Minute</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="per_day">Per Day</option>
                    <option value="salary_wise">Salary Wise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Deduction Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    value={formData.deductionAmount}
                    onChange={(e) => setFormData({ ...formData, deductionAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Max Late Allowed / Month</label>
                  <input
                    type="number"
                    value={formData.maxLateAllowedPerMonth}
                    onChange={(e) => setFormData({ ...formData, maxLateAllowedPerMonth: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Late Count as Absent?</label>
                  <select
                    value={formData.lateCountAsAbsent}
                    onChange={(e) => setFormData({ ...formData, lateCountAsAbsent: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Compensated Late (Waive if full hrs worked)?</label>
                  <select
                    value={formData.compensatedLate}
                    onChange={(e) => setFormData({ ...formData, compensatedLate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                  >
                    <option value="yes">Yes (Waive Late)</option>
                    <option value="no">No</option>
                  </select>
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
                  {isSubmitting ? "Saving..." : editingItem ? "Update Late Policy" : "Create Late Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
