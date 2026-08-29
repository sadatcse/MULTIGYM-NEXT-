"use client";

import React, { useState } from "react";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useShiftApi from "@/hooks/useShiftApi";
import useWorkScheduleApi from "@/hooks/useWorkScheduleApi";
import useBranchApi from "@/hooks/useBranchApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import Swal from "sweetalert2";
import {
  FiClock,
  FiEdit,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiUserCheck,
  FiAlertCircle,
  FiCalendar,
  FiMapPin,
  FiX,
  FiLayers,
  FiShield,
  FiUsers,
} from "react-icons/fi";

export default function EmployeeDutyTimePage() {
  const { hasPermission } = useUserPermissions();
  const canView =
    hasPermission("/dashboard/employee/duty-time", "view") ||
    hasPermission("/dashboard/employee", "view");
  const canEdit =
    hasPermission("/dashboard/employee/duty-time", "edit") ||
    hasPermission("/dashboard/employee", "edit");

  // Hooks for fetching APIs
  const {
    employees,
    totalItems,
    totalPages,
    loading,
    isFetching,
    searchInput,
    setSearchInput,
    branchFilter,
    setBranchFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    updateEmployee,
  } = useEmployeeApi();

  const { branches } = useBranchApi(100);
  const { shifts } = useShiftApi(100);
  const { schedules } = useWorkScheduleApi(100);

  // Additional Filter States
  const [shiftFilter, setShiftFilter] = useState("all");
  const [scheduleFilter, setScheduleFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    branch: "",
    shift: "",
    workSchedule: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open Edit Modal
  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      branch: emp.branch || "",
      shift: emp.shift || "",
      workSchedule: emp.workSchedule || "",
    });
    setIsModalOpen(true);
  };

  // Submit Duty Time Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setIsSubmitting(true);
    try {
      await updateEmployee(editingEmployee._id, {
        branch: formData.branch,
        shift: formData.shift,
        workSchedule: formData.workSchedule,
      });

      Swal.fire({
        title: "Duty Time Configured!",
        text: `Shift and work schedule for "${editingEmployee.name}" updated successfully.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
        timer: 2200,
      });

      setIsModalOpen(false);
      setEditingEmployee(null);
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: err?.response?.data?.message || "Failed to update employee duty time configuration.",
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Employees locally based on shift and schedule filters
  const filteredEmployees = employees.filter((emp) => {
    if (shiftFilter === "configured" && !emp.shift) return false;
    if (shiftFilter === "unconfigured" && emp.shift) return false;
    if (shiftFilter !== "all" && shiftFilter !== "configured" && shiftFilter !== "unconfigured") {
      if (emp.shift !== shiftFilter) return false;
    }

    if (scheduleFilter === "configured" && !emp.workSchedule) return false;
    if (scheduleFilter === "unconfigured" && emp.workSchedule) return false;
    if (scheduleFilter !== "all" && scheduleFilter !== "configured" && scheduleFilter !== "unconfigured") {
      if (emp.workSchedule !== scheduleFilter) return false;
    }

    return true;
  });

  // Calculate statistics
  const configuredShiftCount = employees.filter((e) => e.shift).length;
  const configuredScheduleCount = employees.filter((e) => e.workSchedule).length;
  const fullyConfiguredCount = employees.filter((e) => e.shift && e.workSchedule).length;
  const pendingConfigCount = employees.filter((e) => !e.shift || !e.workSchedule).length;

  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 font-sans">
        <Mtitle
          title="Employee Duty Time"
          subtitle="Configure work shift schedules and weekly work schedule assignments for employees."
        />
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl" />
          </div>
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">
            Access Restricted
          </h2>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            You do not have view permission for Employee Duty Time configuration. Please contact your system administrator to update your role privileges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 font-sans">
      {/* Header */}
      <Mtitle
        title="Employee Duty Time Management"
        subtitle="Configure work shift schedules and weekly work schedule assignments for employees."
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
              Total Employees
            </span>
            <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
              {totalItems || employees.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold">
            <FiUsers />
          </div>
        </div>

        {/* Configured Shifts */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
              Configured Shifts
            </span>
            <span className="text-2xl font-black text-emerald-500 mt-1 block">
              {configuredShiftCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold">
            <FiClock />
          </div>
        </div>

        {/* Configured Work Schedules */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
              Configured Schedules
            </span>
            <span className="text-2xl font-black text-brand-gold mt-1 block">
              {configuredScheduleCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold">
            <FiCalendar />
          </div>
        </div>

        {/* Pending Configuration */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
              Pending Setup
            </span>
            <span className="text-2xl font-black text-amber-500 mt-1 block">
              {pendingConfigCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold">
            <FiAlertCircle />
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Branch Filter + Shift Filter + Work Schedule Filter + Page Limit */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search employee name or ID..."
            className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
            >
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-2xl px-3.5 py-2.5 outline-none cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b.branchName}>
                {b.branchName}
              </option>
            ))}
          </select>

          {/* Shift Filter */}
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-2xl px-3.5 py-2.5 outline-none cursor-pointer"
          >
            <option value="all">All Shifts</option>
            <option value="configured">Shift Configured</option>
            <option value="unconfigured">Shift Not Configured</option>
            {shifts.map((s) => (
              <option key={s._id} value={s.name}>
                Shift: {s.name}
              </option>
            ))}
          </select>

          {/* Work Schedule Filter */}
          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-2xl px-3.5 py-2.5 outline-none cursor-pointer"
          >
            <option value="all">All Schedules</option>
            <option value="configured">Schedule Configured</option>
            <option value="unconfigured">Schedule Not Configured</option>
            {schedules.map((sch) => (
              <option key={sch._id} value={sch.scheduleName}>
                Schedule: {sch.scheduleName}
              </option>
            ))}
          </select>

          {/* Items Per Page */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-2xl px-3.5 py-2.5 outline-none cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <SkeletonLoading variant="table" rows={6} />
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiClock />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">
            No Employee Records Found
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-4">
            No employees match your selected search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                <tr>
                  <th className="py-4 px-6 text-center w-16">#</th>
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-6">Branch</th>
                  <th className="py-4 px-6">Department & Title</th>
                  <th className="py-4 px-6">Assigned Shift</th>
                  <th className="py-4 px-6">Work Schedule</th>
                  <th className="py-4 px-6 text-center w-24">Status</th>
                  <th className="py-4 px-6 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs font-bold">
                {filteredEmployees.map((emp, idx) => {
                  const rowNum = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr
                      key={emp._id}
                      className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-colors"
                    >
                      {/* # Index */}
                      <td className="py-4 px-6 text-center text-brand-dark-grey font-bold">
                        {rowNum}
                      </td>

                      {/* Employee Name & ID */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-black text-xs shrink-0">
                            {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                          </div>
                          <div>
                            <span className="font-black text-brand-black dark:text-brand-white text-sm block">
                              {emp.name}
                            </span>
                            <span className="text-[11px] text-brand-dark-grey block">
                              {emp.employeeId || emp.email || "No ID"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white border border-brand-beige dark:border-brand-dark-grey text-xs font-bold">
                          <FiMapPin className="text-brand-gold text-xs" />
                          <span>{emp.branch || "General Branch"}</span>
                        </span>
                      </td>

                      {/* Department & Job Position */}
                      <td className="py-4 px-6">
                        <div className="text-brand-black dark:text-brand-white font-bold">
                          {emp.department || "—"}
                        </div>
                        <div className="text-[11px] text-brand-dark-grey font-medium">
                          {emp.jobPosition || emp.role || "Employee"}
                        </div>
                      </td>

                      {/* Assigned Shift */}
                      <td className="py-4 px-6">
                        {emp.shift ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black text-xs">
                            <FiClock className="text-xs shrink-0" />
                            <span>{emp.shift}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-xs">
                            <FiAlertCircle className="text-xs shrink-0" />
                            <span>not configure yet</span>
                          </span>
                        )}
                      </td>

                      {/* Work Schedule */}
                      <td className="py-4 px-6">
                        {emp.workSchedule ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20 font-black text-xs">
                            <FiCalendar className="text-xs shrink-0" />
                            <span>{emp.workSchedule}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-xs">
                            <FiAlertCircle className="text-xs shrink-0" />
                            <span>not configure yet</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            emp.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          }`}
                        >
                          {emp.status === "active" ? (
                            <FiCheckCircle className="text-xs" />
                          ) : (
                            <FiXCircle className="text-xs" />
                          )}
                          <span>{emp.status || "active"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="px-3.5 py-1.5 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto font-extrabold text-xs"
                            title="Configure Duty Time"
                          >
                            <FiEdit className="text-xs" />
                            <span>Configure</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* Edit Duty Time Modal */}
      {isModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                  <FiClock className="text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    Configure Duty Time
                  </h3>
                  <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                    Assign shift & work schedule for {editingEmployee.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Employee Summary Card */}
              <div className="p-3.5 bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs">
                <div className="font-black text-brand-black dark:text-brand-white text-sm">
                  {editingEmployee.name}
                </div>
                <div className="text-[11px] text-brand-dark-grey font-medium mt-0.5 flex flex-wrap gap-x-3">
                  <span>ID: {editingEmployee.employeeId || "N/A"}</span>
                  <span>Branch: {editingEmployee.branch || "General"}</span>
                  <span>Dept: {editingEmployee.department || "N/A"}</span>
                </div>
              </div>

              {/* Select Employee Branch */}
              <div>
                <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                  Employee Branch
                </label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white outline-none cursor-pointer"
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b.branchName}>
                      {b.branchName}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-brand-dark-grey mt-1">
                  Assign location branch for this employee
                </p>
              </div>

              {/* Select Shift Configuration */}
              <div>
                <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                  Shift Configuration <span className="text-brand-red">*</span>
                </label>
                <select
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white outline-none cursor-pointer"
                >
                  <option value="">-- Not Configured Yet --</option>
                  {shifts.map((s) => (
                    <option key={s._id} value={s.name}>
                      {s.name} {s.status === "inactive" ? "(Inactive)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-brand-dark-grey mt-1">
                  Configured shifts from{" "}
                  <a
                    href="/dashboard/settings/shifts"
                    target="_blank"
                    className="text-brand-gold underline font-bold"
                  >
                    Shift Configuration
                  </a>
                </p>
              </div>

              {/* Select Work Schedule List */}
              <div>
                <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                  Work Schedule <span className="text-brand-red">*</span>
                </label>
                <select
                  value={formData.workSchedule}
                  onChange={(e) => setFormData({ ...formData, workSchedule: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white outline-none cursor-pointer"
                >
                  <option value="">-- Not Configured Yet --</option>
                  {schedules.map((sch) => (
                    <option key={sch._id} value={sch.scheduleName}>
                      {sch.scheduleName} ({sch.workHoursPerDay} hrs/day, {sch.workDaysPerWeek} days/wk)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-brand-dark-grey mt-1">
                  Configured schedules from{" "}
                  <a
                    href="/dashboard/settings/work-schedules"
                    target="_blank"
                    className="text-brand-gold underline font-bold"
                  >
                    Work Schedule List
                  </a>
                </p>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-2xl text-xs font-bold bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light hover:bg-brand-beige/60 dark:hover:bg-brand-dark-grey transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-2xl text-xs font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? "Saving..." : "Save Duty Time"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
