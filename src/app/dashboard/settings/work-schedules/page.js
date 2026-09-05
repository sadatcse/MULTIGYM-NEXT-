"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useWorkScheduleApi from "@/hooks/useWorkScheduleApi";
import useShiftApi from "@/hooks/useShiftApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import Swal from "sweetalert2";
import {
  FiClock,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiGrid,
  FiList,
  FiLoader,
  FiShield,
  FiLayers,
  FiCalendar,
  FiMinus,
} from "react-icons/fi";

// Helper to format 24h time ("09:00", "14:00") into 12h time ("09:00 AM", "02:00 PM")
function format12HourTime(time24) {
  if (!time24) return "—";
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h12)}:${pad(m)} ${period}`;
}

// Parses "8.30", "8:30", "8.45", "8.59", "8.5" -> { decimalHours, formattedText, hours, minutes }
function parseWorkHoursInput(inputVal) {
  if (inputVal === "" || inputVal === null || inputVal === undefined) {
    return { decimalHours: 8, formattedText: "8 hrs 0 mins", hours: 8, minutes: 0 };
  }
  const strVal = String(inputVal).trim();
  if (!strVal) {
    return { decimalHours: 8, formattedText: "8 hrs 0 mins", hours: 8, minutes: 0 };
  }

  let hours = 0;
  let minutes = 0;

  if (strVal.includes(":")) {
    const parts = strVal.split(":");
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
  } else if (strVal.includes(".")) {
    const parts = strVal.split(".");
    hours = parseInt(parts[0], 10) || 0;
    const decimalsStr = parts[1] || "";
    if (decimalsStr.length === 1) {
      minutes = Math.round((parseInt(decimalsStr, 10) / 10) * 60);
    } else {
      const mVal = parseInt(decimalsStr.slice(0, 2), 10) || 0;
      if (mVal < 60) {
        minutes = mVal;
      } else {
        minutes = Math.round((parseInt(decimalsStr, 10) / Math.pow(10, decimalsStr.length)) * 60);
      }
    }
  } else {
    hours = parseInt(strVal, 10) || 0;
    minutes = 0;
  }

  const decimalHours = Math.round((hours + minutes / 60) * 100) / 100;
  const formattedText = `${hours} hrs ${minutes} mins`;
  return { decimalHours, formattedText, hours, minutes };
}

// Calculate duration between startTime and endTime in minutes
function calculateSlotDurationMinutes(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [h1, m1] = startTime.split(":").map((n) => parseInt(n, 10) || 0);
  const [h2, m2] = endTime.split(":").map((n) => parseInt(n, 10) || 0);
  let startMins = h1 * 60 + m1;
  let endMins = h2 * 60 + m2;
  if (endMins <= startMins) {
    endMins += 24 * 60;
  }
  return endMins - startMins;
}

const DEFAULT_SLOTS = [
  { slotName: "Morning Slot", startTime: "09:00", endTime: "11:00" },
  { slotName: "Evening Slot", startTime: "15:00", endTime: "17:00" },
  { slotName: "Night Slot", startTime: "20:00", endTime: "22:00" },
];

const INITIAL_FORM = {
  scheduleName: "",
  shiftType: "General Day Shift",
  startTime: "09:00",
  endTime: "17:00",
  workHoursInput: "8.30",
  workHoursPerDay: 8.5,
  workHoursFormatted: "8 hrs 30 mins",
  isMultiSlot: false,
  timeSlots: DEFAULT_SLOTS,
  workDaysPerWeek: 5,
  lateToleranceMinutes: 15,
  halfDayHours: 4,
  status: "active",
  assignedEmployees: [],
  order: 1,
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut", delay: Math.min(i, 8) * 0.035 },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
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
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useWorkScheduleApi(50);

  const { shifts: availableShifts } = useShiftApi(100);

  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode("grid");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const submitLockRef = useRef(false);
  const deleteLockRef = useRef(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isSubmitting]);

  const totalSchedules = stats.totalSchedules || schedules.length;
  const activeSchedules = stats.activeCount || schedules.filter((s) => s.status === "active").length;
  const inactiveSchedules = Math.max(0, totalSchedules - activeSchedules);
  const multiSlotCount = schedules.filter((s) => s.isMultiSlot).length;

  const recalculateMultiSlotHours = (slots) => {
    let totalMins = 0;
    const updatedSlots = slots.map((s) => {
      const duration = calculateSlotDurationMinutes(s.startTime, s.endTime);
      totalMins += duration;
      return { ...s, durationMinutes: duration };
    });
    const totalHours = Math.round((totalMins / 60) * 100) / 100;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return {
      updatedSlots,
      workHoursPerDay: totalHours,
      workHoursFormatted: `${h} hrs ${m} mins`,
      workHoursInput: m > 0 ? `${h}.${String(m).padStart(2, "0")}` : `${h}`,
    };
  };

  const handleOpenAdd = () => {
    if (!canAdd) return;
    setEditingItem(null);
    const initialShift = availableShifts?.[0]?.name || "General Day Shift";
    setFormData({
      ...INITIAL_FORM,
      shiftType: initialShift,
      order: schedules.length + 1,
      workHoursInput: "8.30",
      workHoursPerDay: 8.5,
      workHoursFormatted: "8 hrs 30 mins",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) return;
    setEditingItem(item);

    const parsed = parseWorkHoursInput(item.workHoursPerDay || 8);
    const slots = item.timeSlots && item.timeSlots.length > 0 ? item.timeSlots : DEFAULT_SLOTS;

    setFormData({
      scheduleName: item.scheduleName || "",
      shiftType: item.shiftType || "General Day Shift",
      startTime: item.startTime || "09:00",
      endTime: item.endTime || "17:00",
      workHoursInput: item.workHoursFormatted || String(item.workHoursPerDay || 8),
      workHoursPerDay: item.workHoursPerDay || parsed.decimalHours,
      workHoursFormatted: item.workHoursFormatted || parsed.formattedText,
      isMultiSlot: item.isMultiSlot || false,
      timeSlots: slots,
      workDaysPerWeek: item.workDaysPerWeek || 5,
      lateToleranceMinutes: item.lateToleranceMinutes || 15,
      halfDayHours: item.halfDayHours || 4,
      status: item.status || "active",
      assignedEmployees: item.assignedEmployees || [],
      order: item.order || 1,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleStartTimeChange = (newStartTime) => {
    const duration = calculateSlotDurationMinutes(newStartTime, formData.endTime);
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    const dec = Math.round((duration / 60) * 100) / 100;
    const inputStr = m > 0 ? `${h}.${String(m).padStart(2, "0")}` : `${h}`;
    setFormData({
      ...formData,
      startTime: newStartTime,
      workHoursPerDay: dec,
      workHoursFormatted: `${h} hrs ${m} mins`,
      workHoursInput: inputStr,
    });
  };

  const handleEndTimeChange = (newEndTime) => {
    const duration = calculateSlotDurationMinutes(formData.startTime, newEndTime);
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    const dec = Math.round((duration / 60) * 100) / 100;
    const inputStr = m > 0 ? `${h}.${String(m).padStart(2, "0")}` : `${h}`;
    setFormData({
      ...formData,
      endTime: newEndTime,
      workHoursPerDay: dec,
      workHoursFormatted: `${h} hrs ${m} mins`,
      workHoursInput: inputStr,
    });
  };

  const handleWorkHoursInputChange = (val) => {
    const parsed = parseWorkHoursInput(val);
    setFormData({
      ...formData,
      workHoursInput: val,
      workHoursPerDay: parsed.decimalHours,
      workHoursFormatted: parsed.formattedText,
    });
  };

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...formData.timeSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    const calc = recalculateMultiSlotHours(newSlots);
    setFormData({
      ...formData,
      timeSlots: calc.updatedSlots,
      workHoursPerDay: calc.workHoursPerDay,
      workHoursFormatted: calc.workHoursFormatted,
      workHoursInput: calc.workHoursInput,
    });
  };

  const handleAddSlot = () => {
    const nextIndex = formData.timeSlots.length + 1;
    const newSlots = [
      ...formData.timeSlots,
      { slotName: `Slot ${nextIndex}`, startTime: "09:00", endTime: "11:00" },
    ];
    const calc = recalculateMultiSlotHours(newSlots);
    setFormData({
      ...formData,
      timeSlots: calc.updatedSlots,
      workHoursPerDay: calc.workHoursPerDay,
      workHoursFormatted: calc.workHoursFormatted,
      workHoursInput: calc.workHoursInput,
    });
  };

  const handleRemoveSlot = (index) => {
    if (formData.timeSlots.length <= 1) return;
    const newSlots = formData.timeSlots.filter((_, idx) => idx !== index);
    const calc = recalculateMultiSlotHours(newSlots);
    setFormData({
      ...formData,
      timeSlots: calc.updatedSlots,
      workHoursPerDay: calc.workHoursPerDay,
      workHoursFormatted: calc.workHoursFormatted,
      workHoursInput: calc.workHoursInput,
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.scheduleName.trim()) {
      errors.scheduleName = "Schedule name is required.";
    }

    const duplicate = schedules.find(
      (s) =>
        s.scheduleName.trim().toLowerCase() === formData.scheduleName.trim().toLowerCase() &&
        s._id !== editingItem?._id
    );
    if (duplicate) {
      errors.scheduleName = `Schedule "${formData.scheduleName}" already exists.`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    if (!validateForm()) return;

    submitLockRef.current = true;
    setIsSubmitting(true);

    const payload = {
      scheduleName: formData.scheduleName.trim(),
      shiftType: formData.shiftType,
      startTime: formData.startTime,
      endTime: formData.endTime,
      workHoursPerDay: Number(formData.workHoursPerDay),
      workHoursFormatted: formData.workHoursFormatted,
      isMultiSlot: formData.isMultiSlot,
      timeSlots: formData.isMultiSlot
        ? formData.timeSlots.map((s) => ({
            slotName: s.slotName || "",
            startTime: s.startTime,
            endTime: s.endTime,
            durationMinutes: calculateSlotDurationMinutes(s.startTime, s.endTime),
          }))
        : [],
      workDaysPerWeek: Number(formData.workDaysPerWeek),
      lateToleranceMinutes: Number(formData.lateToleranceMinutes),
      halfDayHours: Number(formData.halfDayHours),
      status: formData.status,
      assignedEmployees: formData.assignedEmployees,
      order: Number(formData.order) || 1,
    };

    try {
      if (editingItem) {
        await updateSchedule(editingItem._id, payload);
        Swal.fire({
          title: "Updated!",
          text: `Work schedule "${payload.scheduleName}" updated successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      } else {
        await createSchedule(payload);
        Swal.fire({
          title: "Created!",
          text: `Work schedule "${payload.scheduleName}" created successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save work schedule.";
      Swal.fire({
        title: "Error!",
        text: Array.isArray(msg) ? msg.join(", ") : msg,
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const handleOpenDelete = (item) => {
    if (!canDelete) return;
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem || isDeleting || deleteLockRef.current) return;

    deleteLockRef.current = true;
    setIsDeleting(true);
    try {
      await deleteSchedule(deletingItem._id);
      Swal.fire({
        title: "Deleted!",
        text: `Work schedule "${deletingItem.scheduleName}" has been deleted.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
        timer: 2000,
      });
      setIsDeleteModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete work schedule.";
      Swal.fire({
        title: "Error!",
        text: Array.isArray(msg) ? msg.join(", ") : msg,
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
      deleteLockRef.current = false;
    }
  };

  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
        <Mtitle
          title="Work Schedules"
          subtitle="Configure weekly working schedules, hours & minutes duration, split-shifts with multiple time slots, and employee assignments."
        />
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl" />
          </div>
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">Access Restricted</h2>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            You do not have view permission for Work Schedules. Please contact your system administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <Mtitle
        title="Work Schedules"
        subtitle="Configure weekly working schedules, hours & minutes duration, split-shifts with multiple time slots, and employee assignments."
        rightcontent={
          canAdd ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <FiPlus className="text-base" />
              <span>Add Schedule</span>
            </button>
          ) : null
        }
      />

      {/* 4 STAT METRIC CARDS */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Total Schedules
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {totalSchedules}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiClock />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Active Schedules
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {activeSchedules}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-rose-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Inactive Schedules
              </span>
              <span className="text-2xl font-black text-rose-500 mt-1 block">
                {inactiveSchedules}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiXCircle />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-sky-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Multi-Slot Split Shifts
              </span>
              <span className="text-2xl font-black text-sky-500 mt-1 block">
                {multiSlotCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiLayers />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* CONTROL BAR */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schedule name..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white font-bold"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
            >
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            {["all", "active", "inactive"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === tab
                    ? "bg-brand-gold text-brand-midnight shadow-xs"
                    : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

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

      {/* SCHEDULES LIST */}
      {loading ? (
        <SkeletonLoading variant={viewMode === "table" ? "table" : "card"} rows={5} />
      ) : schedules.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiClock />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">
            No Work Schedules Found
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            {search || statusFilter !== "all"
              ? "No schedules match your active filters."
              : "No weekly work schedules have been configured yet."}
          </p>
          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-2xl shadow-md hover:bg-brand-red-dark transition-all cursor-pointer"
            >
              + Add First Schedule
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "table" && (
            <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                    <tr>
                      <th className="py-4 px-6 text-center w-20">Order</th>
                      <th className="py-4 px-6">Schedule Name</th>
                      <th className="py-4 px-6">Timing / Slots</th>
                      <th className="py-4 px-6">Daily Hours</th>
                      <th className="py-4 px-6">Days / Wk & Half-Day</th>
                      <th className="py-4 px-6 text-center w-28">Status</th>
                      <th className="py-4 px-6 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    <AnimatePresence initial={false}>
                      {schedules.map((item, idx) => {
                        const rowBusy = isDeleting && deletingItem?._id === item._id;
                        return (
                          <motion.tr
                            key={item._id}
                            custom={idx}
                            variants={rowVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            layout
                            className={`hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-150 ${
                              rowBusy ? "opacity-50 pointer-events-none" : ""
                            }`}
                          >
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gold/10 text-brand-gold font-black text-xs">
                                #{item.order || idx + 1}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-extrabold text-brand-black dark:text-brand-white text-sm">
                                {item.scheduleName}
                              </div>
                              <div className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold mt-0.5">
                                Shift: {item.shiftType || "General Day Shift"}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              {item.isMultiSlot ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-500 font-extrabold text-[11px]">
                                  <FiLayers className="text-xs" /> {item.timeSlots?.length || 0} Split Slots
                                </span>
                              ) : (
                                <span className="font-bold text-brand-black dark:text-brand-white">
                                  {format12HourTime(item.startTime)} — {format12HourTime(item.endTime)}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 font-extrabold text-emerald-500">
                              {item.workHoursFormatted || `${item.workHoursPerDay} hrs`}
                            </td>
                            <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light/90 font-medium">
                              <div>{item.workDaysPerWeek} Days / Week</div>
                              <div className="text-[10px] text-brand-dark-grey mt-0.5">Half-Day: {item.halfDayHours}h • Tol: {item.lateToleranceMinutes}m</div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                                  item.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    item.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                />
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {canEdit && (
                                  <button
                                    onClick={() => handleOpenEdit(item)}
                                    disabled={rowBusy}
                                    className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Edit Schedule"
                                  >
                                    <FiEdit3 className="text-sm" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleOpenDelete(item)}
                                    disabled={rowBusy}
                                    className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete Schedule"
                                  >
                                    {rowBusy ? (
                                      <span className="block w-3.5 h-3.5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <FiTrash2 className="text-sm" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === "grid" && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence initial={false}>
                {schedules.map((item) => {
                  const rowBusy = isDeleting && deletingItem?._id === item._id;
                  return (
                    <motion.div
                      key={item._id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      layout
                      className={`bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${
                        rowBusy ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-brand-dark-grey dark:text-brand-gold-light font-extrabold block">
                              Schedule
                            </span>
                            <h3 className="text-base font-black text-brand-black dark:text-brand-white mt-0.5">
                              {item.scheduleName}
                            </h3>
                            <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold block mt-0.5">
                              {item.shiftType}
                            </span>
                          </div>
                          <span className="shrink-0 w-8 h-8 rounded-2xl bg-brand-gold/10 text-brand-gold font-black text-xs flex items-center justify-center">
                            #{item.order || 1}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-4 text-[11px] font-bold">
                          <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                            <span className="text-[9px] text-brand-dark-grey block uppercase">Daily Work</span>
                            <span className="text-emerald-500">{item.workHoursFormatted || `${item.workHoursPerDay} hrs`}</span>
                          </div>
                          <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                            <span className="text-[9px] text-brand-dark-grey block uppercase">Days / Wk</span>
                            <span>{item.workDaysPerWeek} Days</span>
                          </div>
                          <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight col-span-2">
                            <span className="text-[9px] text-brand-dark-grey block uppercase">Timing / Split</span>
                            <span className="truncate block">
                              {item.isMultiSlot
                                ? `${item.timeSlots?.length || 0} Split Time Slots`
                                : `${format12HourTime(item.startTime)} - ${format12HourTime(item.endTime)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                            item.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {item.status}
                        </span>
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              disabled={rowBusy}
                              className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit Schedule"
                            >
                              <FiEdit3 className="text-sm" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleOpenDelete(item)}
                              disabled={rowBusy}
                              className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Schedule"
                            >
                              {rowBusy ? (
                                <span className="block w-3.5 h-3.5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FiTrash2 className="text-sm" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(newPage) => setPage(newPage)} />
        </>
      )}

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                    <FiClock className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {editingItem ? "Edit Work Schedule" : "Add Work Schedule"}
                    </h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                      Configure shifts, daily work hours, split slots, and policies
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Schedule Name <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.scheduleName}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, scheduleName: e.target.value })}
                      placeholder="e.g. Standard 8.30 Hours Day Shift"
                      className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${
                        formErrors.scheduleName
                          ? "border-brand-red focus:ring-brand-red/50"
                          : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"
                      } text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                    {formErrors.scheduleName && (
                      <p className="text-brand-red text-[11px] mt-1 font-bold">{formErrors.scheduleName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.order}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Shift Category
                    </label>
                    <select
                      value={formData.shiftType}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                    >
                      {availableShifts && availableShifts.length > 0 ? (
                        availableShifts.map((s) => (
                          <option key={s._id} value={s.name}>
                            {s.name} ({s.shiftCategory || "General"})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="General Day Shift">General Day Shift</option>
                          <option value="Morning Shift">Morning Shift</option>
                          <option value="Evening Shift">Evening Shift</option>
                          <option value="Night Shift">Night Shift</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Multi-Slot Split Shift?
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isMultiSlot"
                          checked={!formData.isMultiSlot}
                          disabled={isSubmitting}
                          onChange={() => setFormData({ ...formData, isMultiSlot: false })}
                          className="w-4 h-4 accent-brand-gold cursor-pointer"
                        />
                        <span className="text-xs font-bold">Standard Single Shift</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isMultiSlot"
                          checked={formData.isMultiSlot}
                          disabled={isSubmitting}
                          onChange={() => {
                            const calc = recalculateMultiSlotHours(formData.timeSlots);
                            setFormData({
                              ...formData,
                              isMultiSlot: true,
                              workHoursPerDay: calc.workHoursPerDay,
                              workHoursFormatted: calc.workHoursFormatted,
                              workHoursInput: calc.workHoursInput,
                            });
                          }}
                          className="w-4 h-4 accent-sky-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-sky-500">Split-Shift Multi Slot</span>
                      </label>
                    </div>
                  </div>
                </div>

                {!formData.isMultiSlot ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50">
                    <div>
                      <label className="block text-[11px] font-extrabold text-brand-dark-grey dark:text-brand-gold-light uppercase tracking-wider mb-1">
                        Shift Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        disabled={isSubmitting}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-brand-dark-grey dark:text-brand-gold-light uppercase tracking-wider mb-1">
                        Shift End Time
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        disabled={isSubmitting}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-brand-dark-grey dark:text-brand-gold-light uppercase tracking-wider mb-1">
                        Daily Duration
                      </label>
                      <input
                        type="text"
                        value={formData.workHoursInput}
                        disabled={isSubmitting}
                        onChange={(e) => handleWorkHoursInputChange(e.target.value)}
                        placeholder="e.g. 8.30"
                        className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                      />
                      <span className="text-[10px] text-emerald-500 font-bold block mt-1">
                        {formData.workHoursFormatted}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-sky-500 tracking-wider">
                        Split Slots Configuration ({formData.workHoursFormatted})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddSlot}
                        className="px-3 py-1 bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-sky-600 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <FiPlus /> Add Slot
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formData.timeSlots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50">
                          <input
                            type="text"
                            value={slot.slotName}
                            onChange={(e) => handleSlotChange(idx, "slotName", e.target.value)}
                            placeholder="Slot Name"
                            className="w-32 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                          />
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleSlotChange(idx, "startTime", e.target.value)}
                            className="w-28 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                          />
                          <span className="text-xs font-bold text-brand-dark-grey">to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleSlotChange(idx, "endTime", e.target.value)}
                            className="w-28 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(idx)}
                            disabled={formData.timeSlots.length <= 1}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ml-auto"
                          >
                            <FiMinus className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Work Days / Week
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={formData.workDaysPerWeek}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, workDaysPerWeek: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Late Tolerance (Mins)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.lateToleranceMinutes}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, lateToleranceMinutes: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Half-Day Min Hours
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.halfDayHours}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, halfDayHours: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="scheduleStatus"
                        value="active"
                        checked={formData.status === "active"}
                        disabled={isSubmitting}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-emerald-500">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="scheduleStatus"
                        value="inactive"
                        checked={formData.status === "inactive"}
                        disabled={isSubmitting}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-4 h-4 accent-rose-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-rose-500">Inactive</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-2xl text-xs font-bold bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light hover:bg-brand-beige/60 dark:hover:bg-brand-dark-grey transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-2xl text-xs font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader className="text-sm animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingItem ? "Update Schedule" : "Create Schedule"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingItem?.scheduleName || "Work Schedule"}
        isDeleting={isDeleting}
      />
    </div>
  );
}
