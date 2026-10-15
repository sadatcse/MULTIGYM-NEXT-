"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useShiftApi from "@/hooks/useShiftApi";
import useWorkScheduleApi from "@/hooks/useWorkScheduleApi";
import useBranchApi from "@/hooks/useBranchApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import Mtitle from "@/components/Comon/Mtitle";
import ScrollHintX from "@/components/Comon/ScrollHintX";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import Swal from "sweetalert2";
import {
  FiClock,
  FiEdit,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiCalendar,
  FiMapPin,
  FiX,
  FiShield,
  FiUsers,
  FiList,
  FiGrid,
  FiLayers,
  FiPlus,
  FiTrash2,
  FiInfo,
} from "react-icons/fi";
import BranchScheduleInspectorModal from "@/components/modals/employee/BranchScheduleInspectorModal";
import DutyTimeEditModal from "@/components/modals/employee/DutyTimeEditModal";

const ALL_DAYS = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

// 24h to 12h formatting helper
function format12HourTime(time24) {
  if (!time24) return "—";
  if (time24.includes("AM") || time24.includes("PM")) return time24;
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h12)}:${pad(m)} ${period}`;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: "easeOut", delay: Math.min(i, 8) * 0.03 },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export default function EmployeeDutyTimePage() {
  const { hasPermission } = useUserPermissions();
  const canView =
    hasPermission("/dashboard/employee/duty-time", "view") ||
    hasPermission("/dashboard/employee", "view");
  const canEdit =
    hasPermission("/dashboard/employee/duty-time", "edit") ||
    hasPermission("/dashboard/employee", "edit");

  // Hooks for fetching APIs (default 50 items to view full roster)
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
  } = useEmployeeApi(50);

  const { branches } = useBranchApi(100);
  const { shifts } = useShiftApi(100);
  const { schedules } = useWorkScheduleApi(100);

  // Additional Filter States
  const [shiftFilter, setShiftFilter] = useState("all");
  const [scheduleFilter, setScheduleFilter] = useState("all");
  const [multiBranchOnly, setMultiBranchOnly] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  // Switch to grid on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode("grid");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    branch: "",
    shift: "",
    workSchedule: "",
    dutyInTime: "",
    dutyOutTime: "",
    isMultiBranch: false,
    branchSchedules: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-Branch Inspector Modal State
  const [viewMultiBranchEmp, setViewMultiBranchEmp] = useState(null);

  // Open Edit Modal
  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    const hasBranchSchedules =
      emp.branchSchedules && emp.branchSchedules.length > 0;
    const isMulti = hasBranchSchedules || (emp.branches && emp.branches.length > 1);

    const initialBranchSchedules = hasBranchSchedules
      ? JSON.parse(JSON.stringify(emp.branchSchedules))
      : (emp.branches || []).map((b) => ({
          branch: b,
          shift: emp.shift || "Morning Shift",
          workSchedule: emp.workSchedule || "",
          inTime: emp.dutyInTime || "08:00 AM",
          outTime: emp.dutyOutTime || "04:00 PM",
          days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
          notes: "",
        }));

    setFormData({
      branch: emp.branches?.[0] || "",
      shift: emp.shift || "",
      workSchedule: emp.workSchedule || "",
      dutyInTime: emp.dutyInTime || "",
      dutyOutTime: emp.dutyOutTime || "",
      isMultiBranch: isMulti,
      branchSchedules: initialBranchSchedules,
    });
    setIsModalOpen(true);
  };

  // When a Work Schedule is selected, auto-fill times and shift
  const handleScheduleSelect = (scheduleName) => {
    const selected = schedules.find((s) => s.scheduleName === scheduleName);
    if (selected) {
      const inTime12 = selected.startTime
        ? format12HourTime(selected.startTime)
        : formData.dutyInTime;
      const outTime12 = selected.endTime
        ? format12HourTime(selected.endTime)
        : formData.dutyOutTime;
      setFormData((prev) => ({
        ...prev,
        workSchedule: scheduleName,
        shift: selected.shiftType || prev.shift,
        dutyInTime: inTime12,
        dutyOutTime: outTime12,
      }));
    } else {
      setFormData((prev) => ({ ...prev, workSchedule: scheduleName }));
    }
  };

  // Branch Schedules helpers
  const handleAddBranchSlot = () => {
    const availableBranch =
      branches.find(
        (b) => !formData.branchSchedules.some((bs) => bs.branch === b.name)
      )?.name || branches[0]?.name || "";

    setFormData((prev) => ({
      ...prev,
      branchSchedules: [
        ...prev.branchSchedules,
        {
          branch: availableBranch,
          shift: prev.shift || "Morning Shift",
          workSchedule: prev.workSchedule || "",
          inTime: "08:00 AM",
          outTime: "04:00 PM",
          days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
          notes: "",
        },
      ],
    }));
  };

  const handleRemoveBranchSlot = (index) => {
    setFormData((prev) => ({
      ...prev,
      branchSchedules: prev.branchSchedules.filter((_, idx) => idx !== index),
    }));
  };

  const handleBranchSlotChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.branchSchedules];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, branchSchedules: updated };
    });
  };

  const handleToggleSlotDay = (index, dayName) => {
    setFormData((prev) => {
      const updated = [...prev.branchSchedules];
      const currentDays = updated[index]?.days || [];
      const hasDay = currentDays.includes(dayName);
      const newDays = hasDay
        ? currentDays.filter((d) => d !== dayName)
        : [...currentDays, dayName];
      updated[index] = { ...updated[index], days: newDays };
      return { ...prev, branchSchedules: updated };
    });
  };

  // Submit Duty Time Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setIsSubmitting(true);
    try {
      let finalBranches = [];
      if (formData.isMultiBranch && formData.branchSchedules?.length > 0) {
        const uniqueBranches = Array.from(
          new Set(formData.branchSchedules.map((bs) => bs.branch).filter(Boolean))
        );
        finalBranches =
          uniqueBranches.length > 0
            ? uniqueBranches
            : formData.branch
            ? [formData.branch]
            : [];
      } else {
        const additionalBranches = (editingEmployee.branches || []).slice(1);
        finalBranches = formData.branch
          ? [formData.branch, ...additionalBranches]
          : additionalBranches;
      }

      await updateEmployee(editingEmployee._id, {
        branches: finalBranches,
        shift: formData.shift,
        workSchedule: formData.workSchedule,
        dutyInTime: formData.dutyInTime,
        dutyOutTime: formData.dutyOutTime,
        branchSchedules: formData.isMultiBranch ? formData.branchSchedules : [],
      });

      Swal.fire({
        title: "Duty Time Configured!",
        text: `Schedule and timings for "${editingEmployee.name}" updated successfully.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
        timer: 2200,
      });

      setIsModalOpen(false);
      setEditingEmployee(null);
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text:
          err?.response?.data?.message ||
          "Failed to update employee duty time configuration.",
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Employees locally
  const filteredEmployees = employees.filter((emp) => {
    if (multiBranchOnly) {
      const isMulti =
        (emp.branches && emp.branches.length > 1) ||
        (emp.branchSchedules && emp.branchSchedules.length > 1);
      if (!isMulti) return false;
    }

    if (shiftFilter === "configured" && !emp.shift) return false;
    if (shiftFilter === "unconfigured" && emp.shift) return false;
    if (
      shiftFilter !== "all" &&
      shiftFilter !== "configured" &&
      shiftFilter !== "unconfigured"
    ) {
      if (emp.shift !== shiftFilter) return false;
    }

    if (scheduleFilter === "configured" && !emp.workSchedule) return false;
    if (scheduleFilter === "unconfigured" && emp.workSchedule) return false;
    if (
      scheduleFilter !== "all" &&
      scheduleFilter !== "configured" &&
      scheduleFilter !== "unconfigured"
    ) {
      if (emp.workSchedule !== scheduleFilter) return false;
    }

    return true;
  });

  // Calculate statistics
  const configuredShiftCount = employees.filter((e) => e.shift).length;
  const configuredScheduleCount = employees.filter((e) => e.workSchedule).length;
  const multiBranchCount = employees.filter(
    (e) =>
      (e.branches && e.branches.length > 1) ||
      (e.branchSchedules && e.branchSchedules.length > 1)
  ).length;

  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        <Mtitle
          title="Employee Duty Time"
          subtitle="Configure work shift schedules, in/out timings, and multi-branch duty rosters."
        />
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl" />
          </div>
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">
            Access Restricted
          </h2>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            You do not have view permission for Employee Duty Time configuration. Please contact your system administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      {/* Header */}
      <Mtitle
        title="Employee Duty Time & Rosters"
        subtitle="Manage daily in/out timings, work schedules, split shifts, and multi-branch rosters."
      />

      {/* KPI Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Employees */}
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Total Employees
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {totalItems || employees.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiUsers />
            </div>
          </div>
        </motion.div>

        {/* Configured Shifts */}
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Configured Shifts
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {configuredShiftCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiClock />
            </div>
          </div>
        </motion.div>

        {/* Configured Work Schedules */}
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Active Schedules
              </span>
              <span className="text-2xl font-black text-brand-gold mt-1 block">
                {configuredScheduleCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCalendar />
            </div>
          </div>
        </motion.div>

        {/* Multi-Branch Employees */}
        <motion.div
          variants={itemVariants}
          onClick={() => setMultiBranchOnly(!multiBranchOnly)}
          className={`p-5 rounded-3xl border shadow-sm transition-all duration-300 cursor-pointer group ${
            multiBranchOnly
              ? "bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-300"
              : "bg-brand-white dark:bg-brand-charcoal border-brand-beige/50 dark:border-brand-dark-grey/50 hover:border-purple-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Multi-Branch Staff
              </span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
                {multiBranchCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiLayers />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Action & Filter Toolbar */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left Side: Search & Branch Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search employee by name, ID..."
              className="w-full pl-9 pr-8 py-2 text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey rounded-2xl focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white placeholder:text-brand-dark-grey/60 outline-none transition-all"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
              >
                <FiX className="text-xs" />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-2xl px-3.5 py-2 outline-none cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Shift Filter */}
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-2xl px-3.5 py-2 outline-none cursor-pointer"
          >
            <option value="all">All Shifts</option>
            <option value="configured">Configured Only</option>
            <option value="unconfigured">Unconfigured Only</option>
            {shifts.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Multi-Branch Filter Button */}
          <button
            onClick={() => setMultiBranchOnly(!multiBranchOnly)}
            className={`px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
              multiBranchOnly
                ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                : "bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white border-brand-beige/50 dark:border-brand-dark-grey hover:border-purple-500"
            }`}
          >
            <FiLayers className="text-xs" />
            <span>Multi-Branch Staff</span>
            {multiBranchOnly && <FiX className="text-xs ml-1" />}
          </button>
        </div>

        {/* Right Side: Items Per Page & View Mode */}
        <div className="flex items-center justify-end gap-3">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          {/* Table / Grid Switcher */}
          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-brand-gold text-brand-midnight shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light"
              }`}
              title="Table View"
            >
              <FiList className="text-sm" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-brand-gold text-brand-midnight shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light"
              }`}
              title="Grid Card View"
            >
              <FiGrid className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <SkeletonLoading variant={viewMode === "table" ? "table" : "shimmer"} rows={8} />
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
        <>
          {/* Table View */}
          {viewMode === "table" && (
            <div
              className={`bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden transition-opacity ${
                isFetching ? "opacity-60" : ""
              }`}
            >
              <ScrollHintX>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                    <tr>
                      <th className="py-4 px-6 text-center w-14">SL</th>
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-6">Branch(es)</th>
                      <th className="py-4 px-6">Designation</th>
                      <th className="py-4 px-6">Shift Category</th>
                      <th className="py-4 px-6">Work Schedule</th>
                      <th className="py-4 px-6">Daily Duty Hours</th>
                      <th className="py-4 px-6 text-center w-24">Status</th>
                      <th className="py-4 px-6 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    <AnimatePresence initial={false}>
                      {filteredEmployees.map((emp, idx) => {
                        const rowNum = (currentPage - 1) * itemsPerPage + idx + 1;
                        const isMulti =
                          (emp.branches && emp.branches.length > 1) ||
                          (emp.branchSchedules && emp.branchSchedules.length > 1);

                        return (
                          <motion.tr
                            key={emp._id}
                            custom={idx}
                            variants={rowVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            layout
                            className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-150"
                          >
                            {/* SL Index */}
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-brand-gold/10 text-brand-gold font-black text-xs">
                                #{rowNum}
                              </span>
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
                                  <span className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light/90 font-mono font-bold block">
                                    {emp.employeeId || emp.email || "No ID"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Branch */}
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                {emp.branches?.length > 0 ? (
                                  emp.branches.map((b, bIdx) => (
                                    <span
                                      key={bIdx}
                                      className={`inline-flex items-center gap-1 mr-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                                        bIdx === 0
                                          ? "bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white border-brand-beige/60 dark:border-brand-dark-grey"
                                          : "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20"
                                      }`}
                                    >
                                      <FiMapPin className="text-[10px] text-brand-gold shrink-0" />
                                      <span>{b}</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-brand-dark-grey font-medium">
                                    General
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Department & Job Position */}
                            <td className="py-4 px-6">
                              <div className="text-brand-black dark:text-brand-white font-extrabold">
                                {emp.jobPosition || emp.role || "Employee"}
                              </div>
                              <div className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                                {emp.department || "General"}
                              </div>
                            </td>

                            {/* Assigned Shift */}
                            <td className="py-4 px-6">
                              {emp.shift ? (
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${
                                    emp.shift === "Split Shift"
                                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                      : emp.shift === "Flexible Shift"
                                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20"
                                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  }`}
                                >
                                  <FiClock className="text-xs shrink-0" />
                                  <span>{emp.shift}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-xs">
                                  <FiAlertCircle className="text-xs shrink-0" />
                                  <span>Not Configured</span>
                                </span>
                              )}
                            </td>

                            {/* Work Schedule */}
                            <td className="py-4 px-6">
                              {emp.workSchedule ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20 font-black text-xs">
                                  <FiCalendar className="text-xs shrink-0" />
                                  <span className="max-w-[180px] truncate" title={emp.workSchedule}>
                                    {emp.workSchedule}
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-xs">
                                  <FiAlertCircle className="text-xs shrink-0" />
                                  <span>Not Configured</span>
                                </span>
                              )}
                            </td>

                            {/* Daily Duty Hours & Multi-branch button */}
                            <td className="py-4 px-6">
                              {emp.dutyInTime ? (
                                <div className="space-y-1">
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20 font-mono font-black text-xs">
                                    <FiClock className="text-xs shrink-0" />
                                    <span>
                                      {emp.dutyInTime} – {emp.dutyOutTime || "—"}
                                    </span>
                                  </div>

                                  {/* Multi-Branch trigger if configured */}
                                  {isMulti && (
                                    <div>
                                      <button
                                        onClick={() => setViewMultiBranchEmp(emp)}
                                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-300 font-extrabold hover:bg-purple-500/25 transition-colors cursor-pointer"
                                      >
                                        <FiLayers className="text-[10px]" />
                                        <span>Multi-Branch Schedule</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-brand-dark-grey text-xs">—</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-6 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize border ${
                                  emp.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    emp.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                />
                                {emp.status || "active"}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-center">
                              {canEdit && (
                                <button
                                  onClick={() => handleOpenEdit(emp)}
                                  className="px-3.5 py-1.5 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 font-extrabold text-xs"
                                  title="Configure Duty Time"
                                >
                                  <FiEdit className="text-xs" />
                                  <span>Configure</span>
                                </button>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </ScrollHintX>
            </div>
          )}

          {/* Grid View */}
          {viewMode === "grid" && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence initial={false}>
                {filteredEmployees.map((emp, idx) => {
                  const rowNum = (currentPage - 1) * itemsPerPage + idx + 1;
                  const isMulti =
                    (emp.branches && emp.branches.length > 1) ||
                    (emp.branchSchedules && emp.branchSchedules.length > 1);

                  return (
                    <motion.div
                      key={emp._id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      layout
                      className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-black text-sm shrink-0">
                              {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                            </div>
                            <div>
                              <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                                {emp.name}
                              </h3>
                              <span className="text-[11px] text-brand-gold font-mono font-bold block">
                                {emp.employeeId || emp.email || "No ID"}
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 w-8 h-8 rounded-2xl bg-brand-gold/10 text-brand-gold font-black text-xs flex items-center justify-center">
                            #{rowNum}
                          </span>
                        </div>

                        {/* Dept and Branch */}
                        <div className="flex flex-col gap-1 text-[11px] text-brand-dark-grey dark:text-brand-gold-light py-2 border-y border-brand-beige/40 dark:border-brand-dark-grey/40 my-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-brand-black dark:text-brand-white">
                              {emp.jobPosition || emp.role || "Employee"}
                            </span>
                            <span className="text-brand-dark-grey">{emp.department || "General"}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {emp.branches?.map((b, bIdx) => (
                              <span
                                key={bIdx}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white border border-brand-beige/60 dark:border-brand-dark-grey font-bold"
                              >
                                <FiMapPin className="text-[10px] text-brand-gold" />
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Shift & Schedule info */}
                        <div className="space-y-2.5 my-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
                              Shift:
                            </span>
                            {emp.shift ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold">
                                <FiClock className="text-xs" /> {emp.shift}
                              </span>
                            ) : (
                              <span className="text-amber-500 font-bold text-[11px]">
                                Not configured
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
                              Schedule:
                            </span>
                            {emp.workSchedule ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-brand-gold/10 text-brand-gold font-bold max-w-[200px] truncate"
                                title={emp.workSchedule}
                              >
                                <FiCalendar className="text-xs shrink-0" /> {emp.workSchedule}
                              </span>
                            ) : (
                              <span className="text-amber-500 font-bold text-[11px]">
                                Not configured
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
                              Daily Hours:
                            </span>
                            {emp.dutyInTime ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-500 font-mono font-bold text-[11px]">
                                <FiClock className="text-xs" /> {emp.dutyInTime} – {emp.dutyOutTime || "—"}
                              </span>
                            ) : (
                              <span className="text-brand-dark-grey text-xs">—</span>
                            )}
                          </div>

                          {isMulti && (
                            <button
                              onClick={() => setViewMultiBranchEmp(emp)}
                              className="w-full mt-2 py-1 px-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 transition-colors font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <FiLayers className="text-xs" />
                              <span>View Multi-Branch Schedule</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize border ${
                            emp.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              emp.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {emp.status || "active"}
                        </span>

                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="px-3.5 py-1.5 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer font-extrabold text-xs flex items-center gap-1"
                          >
                            <FiEdit className="text-xs" />
                            <span>Configure</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
          />
        </>
      )}

      {/* Multi-Branch Schedule Inspector Modal */}
      <BranchScheduleInspectorModal ALL_DAYS={ALL_DAYS} setViewMultiBranchEmp={setViewMultiBranchEmp} viewMultiBranchEmp={viewMultiBranchEmp} permissions={{ canAdd: true, canEdit, canDelete: true }} />

      {/* Edit Duty Time Modal */}
      <DutyTimeEditModal ALL_DAYS={ALL_DAYS} branches={branches} editingEmployee={editingEmployee} formData={formData} handleAddBranchSlot={handleAddBranchSlot} handleBranchSlotChange={handleBranchSlotChange} handleRemoveBranchSlot={handleRemoveBranchSlot} handleScheduleSelect={handleScheduleSelect} handleSubmit={handleSubmit} handleToggleSlotDay={handleToggleSlotDay} isModalOpen={isModalOpen} isSubmitting={isSubmitting} schedules={schedules} setFormData={setFormData} setIsModalOpen={setIsModalOpen} shifts={shifts} permissions={{ canAdd: true, canEdit, canDelete: true }} />
    </div>
  );
}
