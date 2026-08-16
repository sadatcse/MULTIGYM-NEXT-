"use client";

import React, { useState } from "react";
import useWorkScheduleApi from "@/hooks/useWorkScheduleApi";
import useUserPermissions from "@/hooks/useUserPermissions";
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
  FiUsers,
  FiGrid,
  FiList,
  FiX,
  FiBriefcase,
} from "react-icons/fi";

const INITIAL_FORM = {
  scheduleName: "",
  shiftType: "General Day Shift",
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  lateToleranceMinutes: 15,
  halfDayHours: 4,
  status: "active",
  assignedEmployees: [],
  order: 1,
};

export default function WorkSchedulesPage() {
  const { hasPermission } = useUserPermissions();
  const canView = hasPermission("/dashboard/settings/work-schedules", "view");
  const canAdd = hasPermission("/dashboard/settings/work-schedules", "add");
  const canEdit = hasPermission("/dashboard/settings/work-schedules", "edit");
  const canDelete = hasPermission("/dashboard/settings/work-schedules", "delete");

  const {
    schedules,
    stats,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useWorkScheduleApi(50);

  const [viewMode, setViewMode] = useState("table");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    if (!canAdd) return;
    setEditingItem(null);
    setFormData({ ...INITIAL_FORM, order: schedules.length + 1 });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) return;
    setEditingItem(item);
    setFormData({
      scheduleName: item.scheduleName || "",
      shiftType: item.shiftType || "General Day Shift",
      workHoursPerDay: item.workHoursPerDay || 8,
      workDaysPerWeek: item.workDaysPerWeek || 5,
      lateToleranceMinutes: item.lateToleranceMinutes || 15,
      halfDayHours: item.halfDayHours || 4,
      status: item.status || "active",
      assignedEmployees: item.assignedEmployees || [],
      order: item.order || 1,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.scheduleName.trim()) {
      setFormError("Schedule name is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      if (editingItem) {
        await updateSchedule(editingItem._id, formData);
        Swal.fire({
          title: "Work Schedule Updated!",
          text: `"${formData.scheduleName}" has been updated.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      } else {
        await createSchedule(formData);
        Swal.fire({
          title: "Work Schedule Created!",
          text: `"${formData.scheduleName}" has been created.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save work schedule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    if (!canDelete) return;
    Swal.fire({
      title: "Delete Work Schedule?",
      text: `Are you sure you want to delete "${item.scheduleName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteSchedule(item._id);
          Swal.fire("Deleted!", `"${item.scheduleName}" has been removed.`, "success");
        } catch (err) {
          Swal.fire("Error", err?.response?.data?.message || "Failed to delete work schedule.", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 font-sans">
      <Mtitle
        title="Work Schedule Configuration"
        subtitle="Configure weekly working schedules, daily hours, shift types, late tolerances, half-day thresholds, and employee assignments."
      />

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold">
            <FiClock />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light">Total Schedules</span>
            <p className="text-2xl font-black text-brand-black dark:text-brand-white">{stats.totalSchedules || schedules.length}</p>
          </div>
        </div>

        <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold">
            <FiCheckCircle />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light">Active Schedules</span>
            <p className="text-2xl font-black text-emerald-500">{stats.activeCount || schedules.filter((s) => s.status === "active").length}</p>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
            <input
              type="text"
              placeholder="Search schedules..."
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

        {canAdd && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <FiPlus />
            <span>Add Work Schedule</span>
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
                <th className="py-3.5 px-4">Schedule Name</th>
                <th className="py-3.5 px-4">Shift Type</th>
                <th className="py-3.5 px-4">Daily Work Hours</th>
                <th className="py-3.5 px-4">Weekly Days</th>
                <th className="py-3.5 px-4">Late Tolerance</th>
                <th className="py-3.5 px-4">Half Day Hours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs font-bold">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-brand-dark-grey">
                    No work schedules found. Click "Add Work Schedule" to create one.
                  </td>
                </tr>
              ) : (
                schedules.map((item, idx) => (
                  <tr key={item._id} className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/30 transition-colors">
                    <td className="py-3.5 px-4 text-brand-dark-grey">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-black text-brand-black dark:text-brand-white">{item.scheduleName}</td>
                    <td className="py-3.5 px-4 text-brand-gold">{item.shiftType}</td>
                    <td className="py-3.5 px-4">{item.workHoursPerDay} Hrs / Day</td>
                    <td className="py-3.5 px-4">{item.workDaysPerWeek} Days / Wk</td>
                    <td className="py-3.5 px-4 text-amber-500">{item.lateToleranceMinutes} Mins</td>
                    <td className="py-3.5 px-4">{item.halfDayHours} Hrs</td>
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

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
              <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                {editingItem ? "Edit Work Schedule" : "Add Work Schedule"}
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
                  Schedule Name <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={formData.scheduleName}
                  onChange={(e) => setFormData({ ...formData, scheduleName: e.target.value })}
                  placeholder="e.g. Enterprise 5-Day Schedule"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Shift Type
                  </label>
                  <input
                    type="text"
                    value={formData.shiftType}
                    onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                    placeholder="General Day Shift"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Work Hours / Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.workHoursPerDay}
                    onChange={(e) => setFormData({ ...formData, workHoursPerDay: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Work Days / Week
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={formData.workDaysPerWeek}
                    onChange={(e) => setFormData({ ...formData, workDaysPerWeek: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Late Tolerance (Mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lateToleranceMinutes}
                    onChange={(e) => setFormData({ ...formData, lateToleranceMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Half Day Threshold (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.halfDayHours}
                    onChange={(e) => setFormData({ ...formData, halfDayHours: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
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
                  {isSubmitting ? "Saving..." : editingItem ? "Update Schedule" : "Create Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
