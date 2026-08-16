"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import Mtitle from "@/components/Comon/Mtitle";
import Swal from "sweetalert2";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiPlus,
  FiSettings,
  FiX,
  FiSave,
  FiRotateCcw,
  FiCheckCircle,
  FiAlertCircle,
  FiCheck,
  FiInfo,
  FiDollarSign,
  FiAward,
  FiSliders,
  FiMapPin,
} from "react-icons/fi";

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_TYPE_OPTIONS = [
  { value: "working_day", label: "Working Day", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { value: "weekly_off", label: "Weekly Off", badge: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  { value: "public_holiday", label: "Public Holiday", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { value: "special_holiday", label: "Special Holiday", badge: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  { value: "company_holiday", label: "Company Holiday", badge: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { value: "emergency_closure", label: "Emergency Closure", badge: "bg-red-500/10 text-red-500 border-red-500/20" },
];

function GymCalendarContent() {
  const axiosSecure = useAxiosSecure();
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryBranchId = searchParams.get("branchId") || "global";

  const now = new Date();
  const currentYearVal = now.getFullYear();
  const currentMonthVal = now.getMonth() + 1; // 1-12
  const initialYear = currentYearVal >= 2026 && currentYearVal <= 2032 ? currentYearVal : 2026;

  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthVal);
  const [selectedBranchId, setSelectedBranchId] = useState(queryBranchId);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState({
    days: [],
    stats: {
      totalDays: 31,
      openDays: 0,
      closedDays: 0,
      publicHolidays: 0,
      specialHolidays: 0,
      companyHolidays: 0,
      emergencyClosures: 0,
      weeklyOffs: 0,
      workingDays: 0,
      paidHolidays: 0,
      salaryApplicableDays: 0,
    },
    weeklyDefault: {},
  });

  // Date Config Modal State
  const [selectedDay, setSelectedDay] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSavingDay, setIsSavingDay] = useState(false);
  const [dayFormData, setDayFormData] = useState({
    branchId: "global",
    dateStr: "",
    year: 2026,
    month: 1,
    day: 1,
    dayName: "",
    gymStatus: "open",
    openingTime: "07:00",
    closingTime: "23:00",
    dayType: "working_day",
    title: "",
    description: "",
    isPaidHoliday: true,
    isSalaryApplicable: true,
  });

  // Weekly Schedule Modal State
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [weeklyScheduleData, setWeeklyScheduleData] = useState({});
  const [isSavingWeekly, setIsSavingWeekly] = useState(false);

  // Holiday Date Range Modal State
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [isSavingRange, setIsSavingRange] = useState(false);
  const [rangeFormData, setRangeFormData] = useState({
    branchId: "global",
    startDate: "",
    endDate: "",
    title: "",
    dayType: "public_holiday",
    gymStatus: "closed",
    openingTime: "",
    closingTime: "",
    description: "",
    isPaidHoliday: true,
    isSalaryApplicable: true,
  });

  // Fetch Branches List
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axiosSecure.get("/branch?limit=100");
        if (res?.data?.data) {
          setBranches(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, [axiosSecure]);

  // Fetch Month Calendar Data from Backend API
  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosSecure.get(
        `/gym-calendar/month?year=${selectedYear}&month=${selectedMonth}&branchId=${selectedBranchId}`
      );
      if (res?.data?.data) {
        setCalendarData(res.data.data);
        if (res.data.data.weeklyDefault) {
          setWeeklyScheduleData(res.data.data.weeklyDefault);
        }
      }
    } catch (err) {
      console.error("Error fetching gym calendar:", err);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, selectedYear, selectedMonth, selectedBranchId]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // Handle Prev Month
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      if (selectedYear > 2026) {
        setSelectedYear(selectedYear - 1);
        setSelectedMonth(12);
      }
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  // Handle Next Month
  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      if (selectedYear < 2032) {
        setSelectedYear(selectedYear + 1);
        setSelectedMonth(1);
      }
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Handle Today Jump
  const handleJumpToday = () => {
    setSelectedYear(initialYear);
    setSelectedMonth(currentMonthVal);
  };

  // Open Date Configuration Modal
  const handleOpenDayConfig = (dayItem) => {
    setSelectedDay(dayItem);
    setDayFormData({
      branchId: selectedBranchId,
      dateStr: dayItem.dateStr,
      year: dayItem.year,
      month: dayItem.month,
      day: dayItem.day,
      dayName: dayItem.dayName,
      gymStatus: dayItem.gymStatus || "open",
      openingTime: dayItem.openingTime || "07:00",
      closingTime: dayItem.closingTime || "23:00",
      dayType: dayItem.dayType || "working_day",
      title: dayItem.title || "",
      description: dayItem.description || "",
      isPaidHoliday: dayItem.isPaidHoliday ?? true,
      isSalaryApplicable: dayItem.isSalaryApplicable ?? true,
    });
    setIsConfigModalOpen(true);
  };

  // Submit Single Day Override Configuration
  const handleSaveDayConfig = async (e) => {
    e.preventDefault();
    setIsSavingDay(true);
    try {
      const payload = {
        ...dayFormData,
        branchId: selectedBranchId,
        year: Number(dayFormData.year),
        month: Number(dayFormData.month),
        day: Number(dayFormData.day),
        isPaidHoliday: Boolean(dayFormData.isPaidHoliday),
        isSalaryApplicable: Boolean(dayFormData.isSalaryApplicable),
      };

      await axiosSecure.post("/gym-calendar/date", payload);

      Swal.fire({
        title: "Date Configured!",
        text: `Schedule for ${dayFormData.dateStr} updated successfully.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setIsConfigModalOpen(false);
      fetchCalendar();
    } catch (err) {
      console.error("Save day config error:", err);
      Swal.fire("Error", "Failed to save date configuration.", "error");
    } finally {
      setIsSavingDay(false);
    }
  };

  // Reset Custom Day Override back to Weekly Default
  const handleResetDayOverride = async () => {
    if (!selectedDay?.isCustomOverride) return;

    try {
      await axiosSecure.delete(
        `/gym-calendar/date/${selectedDay.dateStr}?branchId=${selectedBranchId}`
      );

      Swal.fire({
        title: "Reset Complete",
        text: `Date ${selectedDay.dateStr} reset to default weekly schedule.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setIsConfigModalOpen(false);
      fetchCalendar();
    } catch (err) {
      console.error("Reset date error:", err);
      Swal.fire("Error", "Failed to reset date override.", "error");
    }
  };

  // Submit Weekly Default Schedule
  const handleSaveWeeklySchedule = async (e) => {
    e.preventDefault();
    setIsSavingWeekly(true);
    try {
      await axiosSecure.put("/gym-calendar/weekly-default", {
        branchId: selectedBranchId,
        schedule: weeklyScheduleData,
      });

      Swal.fire({
        title: "Weekly Schedule Saved!",
        text: "Standard weekly defaults updated successfully.",
        icon: "success",
        confirmButtonColor: "#FF1818",
      });

      setIsWeeklyModalOpen(false);
      fetchCalendar();
    } catch (err) {
      console.error("Save weekly schedule error:", err);
      Swal.fire("Error", "Failed to save weekly schedule.", "error");
    } finally {
      setIsSavingWeekly(false);
    }
  };

  // Open Range Holiday Modal
  const handleOpenRangeModal = () => {
    const defaultStart = `${selectedYear}-${selectedMonth < 10 ? "0" + selectedMonth : selectedMonth}-01`;
    setRangeFormData({
      branchId: selectedBranchId,
      startDate: defaultStart,
      endDate: defaultStart,
      title: "",
      dayType: "public_holiday",
      gymStatus: "closed",
      openingTime: "",
      closingTime: "",
      description: "",
      isPaidHoliday: true,
      isSalaryApplicable: true,
    });
    setIsRangeModalOpen(true);
  };

  // Submit Range Holiday
  const handleSaveRangeHoliday = async (e) => {
    e.preventDefault();
    setIsSavingRange(true);
    try {
      await axiosSecure.post("/gym-calendar/holiday-range", {
        ...rangeFormData,
        branchId: selectedBranchId,
      });

      Swal.fire({
        title: "Holiday Configured!",
        text: `Event "${rangeFormData.title}" saved successfully across the specified range.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
      });

      setIsRangeModalOpen(false);
      fetchCalendar();
    } catch (err) {
      console.error("Save range holiday error:", err);
      Swal.fire("Error", "Failed to save holiday range.", "error");
    } finally {
      setIsSavingRange(false);
    }
  };

  const firstDayOfWeekIdx = useMemo(() => {
    if (!calendarData.days || calendarData.days.length === 0) return 0;
    return calendarData.days[0].dayOfWeekIdx || 0;
  }, [calendarData.days]);

  const activeBranchName = useMemo(() => {
    if (selectedBranchId === "global" || selectedBranchId === "all") return "All Branches (Global)";
    const b = branches.find((item) => item._id === selectedBranchId);
    return b ? b.name : "Selected Branch";
  }, [selectedBranchId, branches]);

  return (
    <div className="space-y-6 w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 font-sans">
      {/* Title & Navigation Header */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 sm:p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Mtitle
              title="Gym Operating & Holiday Calendar"
              subtitle={`Integrated with ${activeBranchName}. Master gym schedule, holidays, and payroll calculation rules.`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Quick Action: Configure Weekly Default */}
            <button
              type="button"
              onClick={() => setIsWeeklyModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey hover:border-brand-gold text-brand-black dark:text-brand-white font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <FiSliders className="text-brand-gold text-sm" />
              <span>Configure Weekly Schedule</span>
            </button>

            {/* Quick Action: Add Holiday / Special Day */}
            <button
              type="button"
              onClick={handleOpenRangeModal}
              className="px-4 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FiPlus className="text-sm" />
              <span>Add Holiday / Date Range</span>
            </button>
          </div>
        </div>

        {/* YEAR, MONTH & BRANCH SELECTOR NAV BAR */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={selectedYear === 2026 && selectedMonth === 1}
              className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-brand-black dark:text-brand-white hover:border-brand-gold transition-all cursor-pointer disabled:opacity-30"
              title="Previous Month"
            >
              <FiChevronLeft className="text-lg" />
            </button>

            {/* MONTH DROPDOWN */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-black text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            {/* YEAR DROPDOWN (2026-2032) */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-black text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={selectedYear === 2032 && selectedMonth === 12}
              className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-brand-black dark:text-brand-white hover:border-brand-gold transition-all cursor-pointer disabled:opacity-30"
              title="Next Month"
            >
              <FiChevronRight className="text-lg" />
            </button>

            <button
              type="button"
              onClick={handleJumpToday}
              className="px-3.5 py-2.5 rounded-2xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/20 font-black text-xs transition-all cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* BRANCH SELECTOR INTEGRATION */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <div className="flex items-center gap-2 bg-brand-offwhite dark:bg-brand-midnight px-3.5 py-2 rounded-2xl border border-brand-beige dark:border-brand-dark-grey">
              <FiMapPin className="text-brand-gold text-sm shrink-0" />
              <span className="text-xs font-extrabold text-brand-dark-grey dark:text-brand-gold-light whitespace-nowrap">
                Branch:
              </span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-black text-brand-black dark:text-brand-white outline-none cursor-pointer max-w-[200px]"
              >
                <option value="global">🏢 All Branches (Global)</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    📍 {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* MONTHLY SUMMARY METRICS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-xs text-center space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block">
            Total Days
          </span>
          <span className="text-2xl font-black text-brand-black dark:text-brand-white font-mono">
            {calendarData.stats?.totalDays ?? 31}
          </span>
        </div>

        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-emerald-500/30 shadow-xs text-center space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider block flex items-center justify-center gap-1">
            🟢 Gym Open
          </span>
          <span className="text-2xl font-black text-emerald-500 font-mono">
            {calendarData.stats?.openDays ?? 0}
          </span>
        </div>

        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-red-500/30 shadow-xs text-center space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-red-500 tracking-wider block flex items-center justify-center gap-1">
            🔴 Gym Closed
          </span>
          <span className="text-2xl font-black text-red-500 font-mono">
            {calendarData.stats?.closedDays ?? 0}
          </span>
        </div>

        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-amber-500/30 shadow-xs text-center space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-amber-500 tracking-wider block flex items-center justify-center gap-1">
            🟡 Public Holidays
          </span>
          <span className="text-2xl font-black text-amber-500 font-mono">
            {calendarData.stats?.publicHolidays ?? 0}
          </span>
        </div>

        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-sky-500/30 shadow-xs text-center space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-sky-400 tracking-wider block flex items-center justify-center gap-1">
            🔵 Special Holidays
          </span>
          <span className="text-2xl font-black text-sky-400 font-mono">
            {calendarData.stats?.specialHolidays ?? 0}
          </span>
        </div>

        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-xs text-center space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block flex items-center justify-center gap-1">
            ⚪ Weekly Offs
          </span>
          <span className="text-2xl font-black text-brand-black dark:text-brand-white font-mono">
            {calendarData.stats?.weeklyOffs ?? 0}
          </span>
        </div>
      </div>

      {/* MONTHLY CALENDAR GRID */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 sm:p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
        {/* Status Indicators Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-brand-dark-grey dark:text-brand-gold-light font-black uppercase text-[11px]">
              Status Indicators:
            </span>
            <span className="text-[11px] text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full border border-brand-gold/20 font-mono">
              Branch: {activeBranchName}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              🟢 Gym Open
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              🔴 Gym Closed
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              🟡 Public Holiday
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              🔵 Special Holiday
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-500/10 text-gray-400 border border-gray-500/20">
              ⚪ Weekly Off
            </span>
          </div>
        </div>

        {/* WEEKDAY COLUMNS HEADER */}
        <div className="grid grid-cols-7 gap-2 text-center font-black text-xs text-brand-dark-grey dark:text-brand-gold-light uppercase tracking-wider py-2">
          {WEEKDAY_NAMES.map((day) => (
            <div key={day} className={`p-2 rounded-xl ${day === "Friday" ? "text-red-500" : ""}`}>
              {day}
            </div>
          ))}
        </div>

        {/* CALENDAR DATE TILES GRID */}
        {loading ? (
          <div className="grid grid-cols-7 gap-2 min-h-[400px]">
            {Array.from({ length: 31 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Empty Lead Offset Cells */}
            {Array.from({ length: firstDayOfWeekIdx }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-28 rounded-2xl bg-brand-offwhite/40 dark:bg-brand-midnight/40 border border-transparent opacity-30"
              />
            ))}

            {/* Actual Month Days */}
            {calendarData.days.map((dayItem) => {
              const isOpen = dayItem.gymStatus === "open";
              const isCustom = dayItem.isCustomOverride;
              const isFriday = dayItem.dayName === "Friday";

              let statusBorder = isOpen
                ? "border-emerald-500/30 hover:border-emerald-500"
                : "border-red-500/30 hover:border-red-500";

              if (dayItem.dayType === "public_holiday") {
                statusBorder = "border-amber-500/40 hover:border-amber-500";
              } else if (dayItem.dayType === "special_holiday") {
                statusBorder = "border-sky-500/40 hover:border-sky-500";
              } else if (dayItem.dayType === "weekly_off") {
                statusBorder = "border-gray-500/30 hover:border-gray-400";
              }

              return (
                <div
                  key={dayItem.dateStr}
                  onClick={() => handleOpenDayConfig(dayItem)}
                  className={`relative group h-28 sm:h-32 p-2.5 rounded-2xl border bg-brand-offwhite dark:bg-brand-midnight transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${statusBorder}`}
                >
                  {/* Top Bar: Date Number & Status Indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-base font-black font-mono ${isFriday ? "text-red-500" : "text-brand-black dark:text-brand-white"
                        }`}
                    >
                      {dayItem.day}
                    </span>

                    <div className="flex items-center gap-1">
                      {isCustom && (
                        <span
                          title="Manually configured override"
                          className="w-2 h-2 rounded-full bg-brand-gold animate-ping"
                        />
                      )}
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase font-mono ${isOpen
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-red-500/20 text-red-500"
                          }`}
                      >
                        {isOpen ? "OPEN" : "CLOSED"}
                      </span>
                    </div>
                  </div>

                  {/* Middle Section: Event Title & Day Type Pill */}
                  <div className="space-y-1">
                    {dayItem.title ? (
                      <p className="text-[11px] font-black text-brand-gold line-clamp-1 truncate">
                        {dayItem.title}
                      </p>
                    ) : (
                      <p className="text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light capitalize">
                        {dayItem.dayType.replace("_", " ")}
                      </p>
                    )}

                    {/* Opening & Closing Time Pill */}
                    {isOpen && dayItem.openingTime && (
                      <div className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <FiClock className="text-[9px] shrink-0" />
                        <span>{dayItem.openingTime}–{dayItem.closingTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Bar: Payroll Data Indicators */}
                  <div className="flex items-center justify-between pt-1 border-t border-brand-beige/30 dark:border-brand-dark-grey/30 text-[9px] text-brand-dark-grey dark:text-brand-gold-light">
                    <span className="truncate">{dayItem.dayName.slice(0, 3)}</span>

                    <div className="flex items-center gap-1 font-mono">
                      {dayItem.isPaidHoliday && (
                        <span title="Paid Holiday Applicable" className="text-amber-400 font-black">
                          $
                        </span>
                      )}
                      {dayItem.isSalaryApplicable && (
                        <span title="Salary Applicable Day" className="text-emerald-400 font-black">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: SINGLE DATE CONFIGURATION DRAWER / MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-xl rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between bg-brand-offwhite/50 dark:bg-brand-midnight/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-lg">
                  <FiCalendar />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    Date Configuration & Override
                  </h3>
                  <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light font-mono">
                    {dayFormData.dateStr} ({dayFormData.dayName}) &bull; {activeBranchName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="p-2 rounded-xl text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-red hover:text-white transition-all cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveDayConfig} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-2">
                  Gym Status <span className="text-brand-red">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDayFormData({ ...dayFormData, gymStatus: "open" })}
                    className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${dayFormData.gymStatus === "open"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                        : "bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white border-brand-beige dark:border-brand-dark-grey"
                      }`}
                  >
                    <span>🟢 Gym Open</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDayFormData({ ...dayFormData, gymStatus: "closed" })}
                    className={`py-2.5 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${dayFormData.gymStatus === "closed"
                        ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20"
                        : "bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white border-brand-beige dark:border-brand-dark-grey"
                      }`}
                  >
                    <span>🔴 Gym Closed</span>
                  </button>
                </div>
              </div>

              {dayFormData.gymStatus === "open" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={dayFormData.openingTime}
                      onChange={(e) => setDayFormData({ ...dayFormData, openingTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={dayFormData.closingTime}
                      onChange={(e) => setDayFormData({ ...dayFormData, closingTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Day Type <span className="text-brand-red">*</span>
                </label>
                <select
                  value={dayFormData.dayType}
                  onChange={(e) => setDayFormData({ ...dayFormData, dayType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                >
                  {DAY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Holiday / Event Short Name
                </label>
                <input
                  type="text"
                  value={dayFormData.title}
                  onChange={(e) => setDayFormData({ ...dayFormData, title: e.target.value })}
                  placeholder="e.g. Independence Day / Gym Maintenance"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Description / Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={dayFormData.description}
                  onChange={(e) => setDayFormData({ ...dayFormData, description: e.target.value })}
                  placeholder="Additional context for HR and attendance auditing..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-gold/20 space-y-3">
                <span className="text-[11px] font-black uppercase text-brand-gold flex items-center gap-1.5">
                  <FiDollarSign /> Payroll Calculation Metadata
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Paid Holiday?
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDayFormData({ ...dayFormData, isPaidHoliday: true })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${dayFormData.isPaidHoliday
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-transparent text-brand-dark-grey border-brand-dark-grey/40"
                          }`}
                      >
                        Yes (Paid)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDayFormData({ ...dayFormData, isPaidHoliday: false })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${!dayFormData.isPaidHoliday
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-transparent text-brand-dark-grey border-brand-dark-grey/40"
                          }`}
                      >
                        No (Unpaid)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Salary Applicable?
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDayFormData({ ...dayFormData, isSalaryApplicable: true })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${dayFormData.isSalaryApplicable
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-transparent text-brand-dark-grey border-brand-dark-grey/40"
                          }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setDayFormData({ ...dayFormData, isSalaryApplicable: false })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${!dayFormData.isSalaryApplicable
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-transparent text-brand-dark-grey border-brand-dark-grey/40"
                          }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                {selectedDay?.isCustomOverride ? (
                  <button
                    type="button"
                    onClick={handleResetDayOverride}
                    className="px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-500/30 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FiRotateCcw /> Reset to Default
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(false)}
                    className="px-4 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey dark:text-brand-gold-light font-extrabold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingDay}
                    className="px-5 py-2 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FiSave />
                    <span>{isSavingDay ? "Saving..." : "Save Configuration"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NORMAL WEEKLY SCHEDULE CONFIGURATION MODAL */}
      {isWeeklyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between bg-brand-offwhite/50 dark:bg-brand-midnight/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-lg">
                  <FiSliders />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    Normal Weekly Gym Schedule ({activeBranchName})
                  </h3>
                  <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                    Default recurring status for each day of the week.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWeeklyModalOpen(false)}
                className="p-2 rounded-xl text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-red hover:text-white transition-all cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveWeeklySchedule} className="p-6 space-y-4 overflow-y-auto">
              <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light font-semibold">
                Set standard open/closed status for Sunday to Saturday. Note: Manually configured specific dates will always override these defaults.
              </p>

              <div className="space-y-3">
                {WEEKDAY_NAMES.map((dayName) => {
                  const key = dayName.toLowerCase();
                  const dayData = weeklyScheduleData[key] || {
                    gymStatus: key === "friday" ? "closed" : "open",
                    dayType: key === "friday" ? "weekly_off" : "working_day",
                    openingTime: key === "friday" ? "" : "07:00",
                    closingTime: key === "friday" ? "" : "23:00",
                  };
                  const isOpen = dayData.gymStatus === "open";

                  return (
                    <div
                      key={dayName}
                      className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 flex flex-col sm:flex-row items-center justify-between gap-3"
                    >
                      <div className="w-28 font-black text-xs text-brand-black dark:text-brand-white">
                        {dayName}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setWeeklyScheduleData({
                              ...weeklyScheduleData,
                              [key]: {
                                ...dayData,
                                gymStatus: "open",
                                dayType: "working_day",
                                openingTime: dayData.openingTime || "07:00",
                                closingTime: dayData.closingTime || "23:00",
                              },
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs cursor-pointer border ${isOpen
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : "bg-transparent text-brand-dark-grey border-brand-dark-grey/30"
                            }`}
                        >
                          🟢 Open
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setWeeklyScheduleData({
                              ...weeklyScheduleData,
                              [key]: {
                                ...dayData,
                                gymStatus: "closed",
                                dayType: "weekly_off",
                              },
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs cursor-pointer border ${!isOpen
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-transparent text-brand-dark-grey border-brand-dark-grey/30"
                            }`}
                        >
                          🔴 Closed
                        </button>
                      </div>

                      {isOpen && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={dayData.openingTime || "07:00"}
                            onChange={(e) => {
                              setWeeklyScheduleData({
                                ...weeklyScheduleData,
                                [key]: { ...dayData, openingTime: e.target.value },
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-mono font-bold text-brand-black dark:text-brand-white"
                          />
                          <span className="text-xs text-brand-dark-grey">–</span>
                          <input
                            type="time"
                            value={dayData.closingTime || "23:00"}
                            onChange={(e) => {
                              setWeeklyScheduleData({
                                ...weeklyScheduleData,
                                [key]: { ...dayData, closingTime: e.target.value },
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-mono font-bold text-brand-black dark:text-brand-white"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                <button
                  type="button"
                  onClick={() => setIsWeeklyModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey dark:text-brand-gold-light font-extrabold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingWeekly}
                  className="px-5 py-2 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FiSave />
                  <span>{isSavingWeekly ? "Saving..." : "Save Default Weekly Schedule"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SINGLE & MULTI-DAY HOLIDAY DATE RANGE MODAL */}
      {isRangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-xl rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between bg-brand-offwhite/50 dark:bg-brand-midnight/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-red/20 text-brand-red flex items-center justify-center font-bold text-lg">
                  <FiPlus />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    Add Holiday / Special Date Range ({activeBranchName})
                  </h3>
                  <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                    Configure single or multi-day holidays & event closures.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRangeModalOpen(false)}
                className="p-2 rounded-xl text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-red hover:text-white transition-all cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveRangeHoliday} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Start Date <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="date"
                    value={rangeFormData.startDate}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    End Date <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="date"
                    value={rangeFormData.endDate}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Holiday / Event Title <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={rangeFormData.title}
                  onChange={(e) => setRangeFormData({ ...rangeFormData, title: e.target.value })}
                  placeholder="e.g. Eid-ul-Fitr / Independence Day / Annual Maintenance"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Holiday Type
                  </label>
                  <select
                    value={rangeFormData.dayType}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, dayType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                  >
                    {DAY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Gym Status
                  </label>
                  <select
                    value={rangeFormData.gymStatus}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, gymStatus: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                  >
                    <option value="closed">🔴 Closed</option>
                    <option value="open">🟢 Open</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Description / Details
                </label>
                <textarea
                  rows={2}
                  value={rangeFormData.description}
                  onChange={(e) => setRangeFormData({ ...rangeFormData, description: e.target.value })}
                  placeholder="Government declaration details or company announcement..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                <button
                  type="button"
                  onClick={() => setIsRangeModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey dark:text-brand-gold-light font-extrabold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRange}
                  className="px-5 py-2 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FiSave />
                  <span>{isSavingRange ? "Applying..." : "Apply Holiday Range"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GymCalendarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-extrabold text-xs">Loading Calendar...</div>}>
      <GymCalendarContent />
    </Suspense>
  );
}
