"use client";

import React, { useState } from "react";
import useProxyDutyApi from "@/hooks/useProxyDutyApi";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import Mtitle from "@/components/Comon/Mtitle";
import Swal from "sweetalert2";
import {
  FiUsers,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiDollarSign,
  FiX,
} from "react-icons/fi";

const INITIAL_FORM = {
  originalEmployeeName: "",
  originalEmployeeId: "",
  proxyEmployeeName: "",
  proxyEmployeeId: "",
  dutyDate: new Date().toISOString().split("T")[0],
  proxyPayAmount: 1000,
  status: "active",
  remarks: "",
};

export default function ProxyDutyPage() {
  const { hasPermission } = useUserPermissions();
  const canView = hasPermission("/dashboard/settings/proxy-duty", "view");
  const canAdd = hasPermission("/dashboard/settings/proxy-duty", "add");
  const canEdit = hasPermission("/dashboard/settings/proxy-duty", "edit");
  const canDelete = hasPermission("/dashboard/settings/proxy-duty", "delete");

  const { employees } = useEmployeeApi(100);
  const {
    proxyDuties,
    stats,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    createProxyDuty,
    updateProxyDuty,
    deleteProxyDuty,
  } = useProxyDutyApi(50);

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
      originalEmployeeName: item.originalEmployeeName || "",
      originalEmployeeId: item.originalEmployeeId || "",
      proxyEmployeeName: item.proxyEmployeeName || "",
      proxyEmployeeId: item.proxyEmployeeId || "",
      dutyDate: item.dutyDate || new Date().toISOString().split("T")[0],
      proxyPayAmount: item.proxyPayAmount !== undefined ? item.proxyPayAmount : 1000,
      status: item.status || "active",
      remarks: item.remarks || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSelectOriginal = (empName) => {
    const found = employees.find((e) => e.name === empName);
    setFormData((prev) => ({
      ...prev,
      originalEmployeeName: empName,
      originalEmployeeId: found ? found.employeeId : "",
    }));
  };

  const handleSelectProxy = (empName) => {
    const found = employees.find((e) => e.name === empName);
    setFormData((prev) => ({
      ...prev,
      proxyEmployeeName: empName,
      proxyEmployeeId: found ? found.employeeId : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.originalEmployeeName.trim() || !formData.proxyEmployeeName.trim()) {
      setFormError("Both Original and Proxy employees must be selected.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      if (editingItem) {
        await updateProxyDuty(editingItem._id, formData);
        Swal.fire("Proxy Duty Updated!", "Duty swap record updated successfully.", "success");
      } else {
        await createProxyDuty(formData);
        Swal.fire("Proxy Duty Created!", "Duty swap recorded successfully.", "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save proxy duty.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    if (!canDelete) return;
    Swal.fire({
      title: "Delete Duty Swap Record?",
      text: `Remove record for ${item.originalEmployeeName} -> ${item.proxyEmployeeName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteProxyDuty(item._id);
          Swal.fire("Deleted!", "Proxy duty record removed.", "success");
        } catch (err) {
          Swal.fire("Error", err?.response?.data?.message || "Failed to delete record.", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 font-sans">
      <Mtitle
        title="Proxy Duty & Shift Swap Management"
        subtitle="Track employee duty swaps, assign substitute proxy staff, record duty dates, and manage proxy pay allowances."
      />

      {/* SEARCH & ACTIONS */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
            <input
              type="text"
              placeholder="Search proxy records..."
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
            <span>Record Proxy Duty Swap</span>
          </button>
        )}
      </div>

      {/* TABLE VIEW */}
      <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-offwhite dark:bg-brand-midnight/60 border-b border-brand-beige/50 dark:border-brand-dark-grey/50 text-[11px] font-black uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Original Employee</th>
                <th className="py-3.5 px-4">Proxy Employee (Sub)</th>
                <th className="py-3.5 px-4">Duty Date</th>
                <th className="py-3.5 px-4">Proxy Pay Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Remarks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs font-bold">
              {proxyDuties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-brand-dark-grey">
                    No proxy duty records found. Click "Record Proxy Duty Swap" to create one.
                  </td>
                </tr>
              ) : (
                proxyDuties.map((item, idx) => (
                  <tr key={item._id} className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/30 transition-colors">
                    <td className="py-3.5 px-4 text-brand-dark-grey">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-black text-brand-black dark:text-brand-white">
                      {item.originalEmployeeName}
                      {item.originalEmployeeId && <span className="block text-[10px] text-brand-dark-grey">({item.originalEmployeeId})</span>}
                    </td>
                    <td className="py-3.5 px-4 font-black text-brand-gold">
                      {item.proxyEmployeeName}
                      {item.proxyEmployeeId && <span className="block text-[10px] text-brand-dark-grey">({item.proxyEmployeeId})</span>}
                    </td>
                    <td className="py-3.5 px-4 text-brand-black dark:text-brand-white">{item.dutyDate}</td>
                    <td className="py-3.5 px-4 text-emerald-500 font-black">৳{item.proxyPayAmount}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${item.status === "completed" ? "bg-blue-500/10 text-blue-500" : item.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-brand-dark-grey">{item.remarks || "N/A"}</td>
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

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
              <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                {editingItem ? "Edit Proxy Duty" : "Record Proxy Duty Swap"}
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
                  Original Employee (On Leave) <span className="text-brand-red">*</span>
                </label>
                <select
                  value={formData.originalEmployeeName}
                  onChange={(e) => handleSelectOriginal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Select Original Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp.name}>
                      {emp.name} ({emp.employeeId || emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Proxy Employee (Substitute) <span className="text-brand-red">*</span>
                </label>
                <select
                  value={formData.proxyEmployeeName}
                  onChange={(e) => handleSelectProxy(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Select Proxy Substitute Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp.name}>
                      {emp.name} ({emp.employeeId || emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Duty Date</label>
                  <input
                    type="date"
                    value={formData.dutyDate}
                    onChange={(e) => setFormData({ ...formData, dutyDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Proxy Pay Amount (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.proxyPayAmount}
                    onChange={(e) => setFormData({ ...formData, proxyPayAmount: Number(e.target.value) })}
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
                  <option value="completed">Completed</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Remarks / Note</label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Duty swap reason..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold resize-none"
                />
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
                  {isSubmitting ? "Saving..." : editingItem ? "Update Record" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
