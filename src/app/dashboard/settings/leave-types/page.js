"use client";

import React, { useState } from "react";
import useLeaveTypeApi from "@/hooks/useLeaveTypeApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import Mtitle from "@/components/Comon/Mtitle";
import Swal from "sweetalert2";
import {
  FiCalendar,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiUsers,
  FiGrid,
  FiList,
  FiX,
  FiCheck,
} from "react-icons/fi";

const INITIAL_FORM = {
  name: "",
  description: "",
  isPaid: "yes",
  status: "active",
  daysAllowed: 12,
  carryForward: "no",
  applicableFor: "All",
  policyYear: 2026,
  order: 1,
};

export default function LeaveTypesPage() {
  const { hasPermission } = useUserPermissions();
  const canView = hasPermission("/dashboard/settings/leave-types", "view");
  const canAdd = hasPermission("/dashboard/settings/leave-types", "add");
  const canEdit = hasPermission("/dashboard/settings/leave-types", "edit");
  const canDelete = hasPermission("/dashboard/settings/leave-types", "delete");

  const {
    leaveTypes,
    stats,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
  } = useLeaveTypeApi(50);

  const [viewMode, setViewMode] = useState("table");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    if (!canAdd) return;
    setEditingItem(null);
    setFormData({ ...INITIAL_FORM, order: leaveTypes.length + 1 });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) return;
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      description: item.description || "",
      isPaid: item.isPaid || "yes",
      status: item.status || "active",
      daysAllowed: item.daysAllowed !== undefined ? item.daysAllowed : 12,
      carryForward: item.carryForward || "no",
      applicableFor: item.applicableFor || "All",
      policyYear: item.policyYear || 2026,
      order: item.order || 1,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Leave type name is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      if (editingItem) {
        await updateLeaveType(editingItem._id, formData);
        Swal.fire({
          title: "Leave Type Updated!",
          text: `"${formData.name}" has been updated successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      } else {
        await createLeaveType(formData);
        Swal.fire({
          title: "Leave Type Created!",
          text: `"${formData.name}" has been added to leave policy defaults.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save leave type.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    if (!canDelete) return;
    Swal.fire({
      title: "Delete Leave Type?",
      text: `Are you sure you want to delete "${item.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteLeaveType(item._id);
          Swal.fire("Deleted!", `"${item.name}" has been removed.`, "success");
        } catch (err) {
          Swal.fire("Error", err?.response?.data?.message || "Failed to delete leave type.", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 font-sans">
      <Mtitle
        title="Employee Leave Type Configuration"
        subtitle="Manage leave categories, paid/unpaid status, annual entitlements, carry-forward policies, and gender applicability."
      />

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold">
            <FiCalendar />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light">Total Leave Types</span>
            <p className="text-2xl font-black text-brand-black dark:text-brand-white">{stats.totalLeaveTypes || leaveTypes.length}</p>
          </div>
        </div>

        <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold">
            <FiCheckCircle />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light">Active Policies</span>
            <p className="text-2xl font-black text-emerald-500">{stats.activeCount || leaveTypes.filter((l) => l.status === "active").length}</p>
          </div>
        </div>

        <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl font-bold">
            <FiDollarSign />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light">Paid Leave Types</span>
            <p className="text-2xl font-black text-blue-500">{stats.paidCount || leaveTypes.filter((l) => l.isPaid === "yes").length}</p>
          </div>
        </div>
      </div>

      {/* SEARCH & ACTIONS BAR */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
            <input
              type="text"
              placeholder="Search leave types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige dark:border-brand-dark-grey">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === "table" ? "bg-brand-red text-white" : "text-brand-dark-grey"}`}
            >
              <FiList />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === "grid" ? "bg-brand-red text-white" : "text-brand-dark-grey"}`}
            >
              <FiGrid />
            </button>
          </div>

          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <FiPlus />
              <span>Add Leave Type</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-offwhite dark:bg-brand-midnight/60 border-b border-brand-beige/50 dark:border-brand-dark-grey/50 text-[11px] font-black uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Leave Name</th>
                  <th className="py-3.5 px-4">Days Allowed</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Carry Forward</th>
                  <th className="py-3.5 px-4">Applicable For</th>
                  <th className="py-3.5 px-4">Policy Year</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs font-bold">
                {leaveTypes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-brand-dark-grey dark:text-brand-gold-light">
                      No leave types found. Click "Add Leave Type" to create one.
                    </td>
                  </tr>
                ) : (
                  leaveTypes.map((item, idx) => (
                    <tr key={item._id} className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/30 transition-colors">
                      <td className="py-3.5 px-4 text-brand-dark-grey">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-black text-brand-black dark:text-brand-white">
                        {item.name}
                        {item.description && <span className="block text-[10px] text-brand-dark-grey font-normal">{item.description}</span>}
                      </td>
                      <td className="py-3.5 px-4 font-black text-brand-black dark:text-brand-white">{item.daysAllowed} Days</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${item.isPaid === "yes" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                          {item.isPaid === "yes" ? "Paid Leave" : "Unpaid Leave"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 uppercase">{item.carryForward}</td>
                      <td className="py-3.5 px-4">{item.applicableFor}</td>
                      <td className="py-3.5 px-4">{item.policyYear}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${item.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                          {item.status === "active" ? <FiCheckCircle /> : <FiXCircle />}
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {canEdit && (
                          <button onClick={() => handleOpenEdit(item)} className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-all cursor-pointer">
                            <FiEdit />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(item)} className="p-2 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red/20 transition-all cursor-pointer">
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaveTypes.map((item) => (
            <div key={item._id} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-brand-black dark:text-brand-white">{item.name}</h4>
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${item.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">{item.description || "No description provided."}</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                <div>
                  <span className="text-[10px] text-brand-dark-grey block">Days Allowed</span>
                  <span>{item.daysAllowed} Days</span>
                </div>
                <div>
                  <span className="text-[10px] text-brand-dark-grey block">Leave Type</span>
                  <span className={item.isPaid === "yes" ? "text-emerald-500" : "text-amber-500"}>{item.isPaid === "yes" ? "Paid" : "Unpaid"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-brand-dark-grey block">Carry Forward</span>
                  <span className="uppercase">{item.carryForward}</span>
                </div>
                <div>
                  <span className="text-[10px] text-brand-dark-grey block">Applicable For</span>
                  <span>{item.applicableFor}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                {canEdit && (
                  <button onClick={() => handleOpenEdit(item)} className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-all cursor-pointer">
                    <FiEdit />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(item)} className="p-2 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red/20 transition-all cursor-pointer">
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
              <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                {editingItem ? "Edit Leave Type" : "Add Leave Type"}
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
                  Leave Name <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Casual Leave"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Leave policy details..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Days Allowed / Year
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.daysAllowed}
                    onChange={(e) => setFormData({ ...formData, daysAllowed: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Is Paid Leave?
                  </label>
                  <select
                    value={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                  >
                    <option value="yes">Yes (Paid)</option>
                    <option value="no">No (Unpaid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Carry Forward?
                  </label>
                  <select
                    value={formData.carryForward}
                    onChange={(e) => setFormData({ ...formData, carryForward: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Applicable For
                  </label>
                  <select
                    value={formData.applicableFor}
                    onChange={(e) => setFormData({ ...formData, applicableFor: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                  >
                    <option value="All">All Employees</option>
                    <option value="Male">Male Only</option>
                    <option value="Female">Female Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Policy Year
                  </label>
                  <input
                    type="number"
                    value={formData.policyYear}
                    onChange={(e) => setFormData({ ...formData, policyYear: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
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
                  className="px-5 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-dark-grey hover:text-brand-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingItem ? "Update Leave Type" : "Create Leave Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
