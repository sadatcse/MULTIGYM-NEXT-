"use client";

import React, { useState, useEffect } from "react";
import useWorkScheduleApi from "@/hooks/useWorkScheduleApi";
import useShiftApi from "@/hooks/useShiftApi";
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
  FiLayers,
  FiCalendar,
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

// Format decimal hours (e.g. 8.5 -> "8 hrs 30 mins", 8 -> "8 hrs 0 mins")
function formatHoursAndMinsText(decimalHours, existingText) {
  if (existingText && existingText.trim()) return existingText;
  if (!decimalHours || isNaN(decimalHours)) return "0 hrs 0 mins";
  const totalMins = Math.round(decimalHours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h} hrs ${m} mins`;
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

  const { shifts: availableShifts } = useShiftApi(100);

  const [viewMode, setViewMode] = useState("table");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recalculate work hours when single shift timing or multi-slots change
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
    setFormError("");
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
      workHoursInput: item.workHoursFormatted
        ? item.workHoursFormatted
        : String(item.workHoursPerDay || 8),
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
    setFormError("");
    setIsModalOpen(true);
  };  // Handle changes in Start Time (Auto calculate Work Hours)
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

  // Handle changes in End Time (Auto calculate Work Hours)
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

  // Handle manual changes in workHoursInput (e.g. user typing "8.30", "8.45", "8.59")
  const handleWorkHoursInputChange = (val) => {
    const parsed = parseWorkHoursInput(val);
    setFormData({
      ...formData,
      workHoursInput: val,
      workHoursPerDay: parsed.decimalHours,
      workHoursFormatted: parsed.formattedText,
    });
  };

  // Handle Multi-Slot Time Updates
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.scheduleName.trim()) {
      setFormError("Schedule name is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

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
      order: Number(formData.order),
    };

    try {
      if (editingItem) {
        await updateSchedule(editingItem._id, payload);
        Swal.fire({
          title: "Work Schedule Updated!",
          text: `"${payload.scheduleName}" has been updated successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      } else {
        await createSchedule(payload);
        Swal.fire({
          title: "Work Schedule Created!",
          text: `"${payload.scheduleName}" has been created successfully.`,
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
        subtitle="Configure weekly working schedules, hours & minutes duration, split-shifts with multiple time slots, and employee assignments."
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
                <th className="py-3.5 px-4">Shift Timing (Punch Slots)</th>
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
                  <td colSpan={10} className="py-8 text-center text-brand-dark-grey">
                    No work schedules found. Click "Add Work Schedule" to create one.
                  </td>
                </tr>
              ) : (
                schedules.map((item, idx) => (
                  <tr key={item._id} className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/30 transition-colors">
                    <td className="py-3.5 px-4 text-brand-dark-grey">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-black text-brand-black dark:text-brand-white">
                      <div>{item.scheduleName}</div>
                      {item.isMultiSlot && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold text-[10px] font-extrabold uppercase border border-brand-gold/30">
                          Split Shift ({item.timeSlots?.length || 0} Slots)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-brand-gold">{item.shiftType}</td>
                    <td className="py-3.5 px-4">
                      {item.isMultiSlot && item.timeSlots && item.timeSlots.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {item.timeSlots.map((slot, sIdx) => (
                            <span key={sIdx} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-brand-gold/15 text-brand-gold dark:text-brand-gold-light font-extrabold text-[11px] border border-brand-gold/30 w-fit">
                              <FiClock className="text-xs shrink-0" />
                              <span>
                                {slot.slotName ? `${slot.slotName}: ` : ""}
                                {format12HourTime(slot.startTime)} – {format12HourTime(slot.endTime)}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-gold/15 text-brand-gold dark:text-brand-gold-light font-extrabold text-xs border border-brand-gold/30">
                          <FiClock className="text-xs shrink-0" />
                          <span>
                            {format12HourTime(item.startTime || "09:00")} – {format12HourTime(item.endTime || "17:00")}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-brand-black dark:text-brand-white font-extrabold">
                      {formatHoursAndMinsText(item.workHoursPerDay, item.workHoursFormatted)}
                      <span className="text-[10px] text-brand-dark-grey block font-normal">
                        ({item.workHoursPerDay} hrs)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{item.workDaysPerWeek} Days / Wk</td>
                    <td className="py-3.5 px-4 text-brand-gold">{item.lateToleranceMinutes} Mins</td>
                    <td className="py-3.5 px-4">{item.halfDayHours} Hrs</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${item.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-brand-red/10 text-brand-red"}`}>
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
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-xl rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
              <div>
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                  {editingItem ? "Edit Work Schedule" : "Add Work Schedule"}
                </h3>
                <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light">
                  Supports custom hours & minutes (e.g. 8.30, 8.45, 8.59) and multi-slot split shifts.
                </p>
              </div>
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
                  placeholder="e.g. SPOTTER DUTY or Split Shift Schedule"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  required
                />
              </div>

              {/* SCHEDULE MODE TOGGLE: Single Shift vs Multi-Slot Split Shift */}
              <div className="p-3 bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-2">
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light">
                  Shift Entry Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isMultiSlot: false })}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${!formData.isMultiSlot
                        ? "bg-brand-gold text-brand-midnight shadow-md"
                        : "bg-brand-white dark:bg-brand-charcoal text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
                      }`}
                  >
                    <FiClock className="text-xs" />
                    <span>Single Shift Slot</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const calc = recalculateMultiSlotHours(formData.timeSlots);
                      setFormData({
                        ...formData,
                        isMultiSlot: true,
                        timeSlots: calc.updatedSlots,
                        workHoursPerDay: calc.workHoursPerDay,
                        workHoursFormatted: calc.workHoursFormatted,
                        workHoursInput: calc.workHoursInput,
                      });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${formData.isMultiSlot
                        ? "bg-brand-red text-white shadow-md shadow-brand-red/20"
                        : "bg-brand-white dark:bg-brand-charcoal text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
                      }`}
                  >
                    <FiLayers className="text-xs" />
                    <span>Multiple Time Slots (Split Shift)</span>
                  </button>
                </div>
              </div>

              {/* SINGLE SHIFT FIELDS */}
              {!formData.isMultiSlot ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Shift Type
                    </label>
                    <select
                      value={formData.shiftType}
                      onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                    >
                      {availableShifts && availableShifts.length > 0 ? (
                        availableShifts.map((shift) => (
                          <option key={shift._id} value={shift.name}>
                            {shift.name} {shift.status === "inactive" ? "(Inactive)" : ""}
                          </option>
                        ))
                      ) : (
                        <option value={formData.shiftType || "General Day Shift"}>
                          {formData.shiftType || "General Day Shift"}
                        </option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-brand-gold mt-1 block">
                      {format12HourTime(formData.startTime)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-brand-gold mt-1 block">
                      {format12HourTime(formData.endTime)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Work Hours / Day
                    </label>
                    <input
                      type="text"
                      value={formData.workHoursInput}
                      onChange={(e) => handleWorkHoursInputChange(e.target.value)}
                      placeholder="e.g. 8.30 or 8.45 or 8.59"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                    <span className="text-[10px] font-bold text-emerald-500 mt-1 block">
                      Duration: {formData.workHoursFormatted} ({formData.workHoursPerDay} hrs)
                    </span>
                  </div>
                </div>
              ) : (
                /* MULTI-SLOT SPLIT SHIFT BUILDER */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-brand-black dark:text-brand-white uppercase">
                      Split Shift Time Slots ({formData.timeSlots.length} Slots = {formData.timeSlots.length * 2} Punch Entries)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      className="px-3 py-1.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-brand-red/20"
                    >
                      <FiPlus className="text-xs" />
                      <span>Add Slot</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formData.timeSlots.map((slot, index) => {
                      const duration = calculateSlotDurationMinutes(slot.startTime, slot.endTime);
                      const dHours = Math.floor(duration / 60);
                      const dMins = duration % 60;
                      return (
                        <div
                          key={index}
                          className="p-3 bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={slot.slotName || `Slot ${index + 1}`}
                              onChange={(e) => handleSlotChange(index, "slotName", e.target.value)}
                              placeholder={`Slot ${index + 1} Name (e.g. Morning)`}
                              className="px-2.5 py-1 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none w-1/2"
                            />
                            <span className="text-[10px] font-extrabold text-brand-gold bg-brand-gold/10 px-2 py-1 rounded-lg border border-brand-gold/20">
                              Duration: {dHours}h {dMins}m
                            </span>
                            {formData.timeSlots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(index)}
                                className="p-1.5 rounded-xl text-brand-red hover:bg-brand-red/10 transition-colors cursor-pointer"
                                title="Remove Slot"
                              >
                                <FiTrash2 className="text-sm" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-brand-dark-grey mb-0.5">
                                Start Time (Check-In)
                              </label>
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => handleSlotChange(index, "startTime", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                              />
                              <span className="text-[10px] font-semibold text-brand-gold mt-0.5 block">
                                {format12HourTime(slot.startTime)}
                              </span>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-brand-dark-grey mb-0.5">
                                End Time (Check-Out)
                              </label>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => handleSlotChange(index, "endTime", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                              />
                              <span className="text-[10px] font-semibold text-brand-gold mt-0.5 block">
                                {format12HourTime(slot.endTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* SUMMARY BOX FOR SPLIT SHIFT */}
                  <div className="p-3 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 text-brand-black dark:text-brand-gold-light text-xs font-extrabold flex items-center justify-between">
                    <span>Total Calculated Work Duration:</span>
                    <span className="text-sm font-black underline text-brand-gold">
                      {formData.workHoursFormatted} ({formData.workHoursPerDay} Hrs)
                    </span>
                  </div>
                </div>
              )}

              {/* COMMON FORM FIELDS */}
              <div className="grid grid-cols-2 gap-3 pt-2">
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
                    min="0.5"
                    step="any"
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

