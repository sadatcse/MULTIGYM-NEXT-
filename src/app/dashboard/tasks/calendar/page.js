"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useTaskApi from "@/hooks/useTaskApi";
import { toast } from "react-toastify";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function TaskCalendarPage() {
  const { getCalendarTasks } = useTaskApi();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const fetchMonthTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCalendarTasks(currentMonth, currentYear);
      setTasks(data || []);
    } catch (err) {
      console.error("Failed to load calendar tasks:", err);
      toast.error("Failed to load calendar schedule");
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, getCalendarTasks]);

  useEffect(() => {
    fetchMonthTasks();
  }, [fetchMonthTasks]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Generate days in month
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d);
  }

  return (
    <div className="space-y-6 w-full max-w-[1500px] mx-auto pb-16">
      <Mtitle
        title="Management Instruction Calendar"
        subtitle="Visual month-view of instruction deadlines, milestone dates, and active schedules."
        rightcontent={
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey hover:border-brand-gold text-xs font-bold"
            >
              <FiChevronLeft />
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-brand-gold text-brand-black text-xs font-black">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey hover:border-brand-gold text-xs font-bold"
            >
              <FiChevronRight />
            </button>
          </div>
        }
      />

      {/* Calendar Matrix */}
      {loading ? (
        <SkeletonLoading count={5} />
      ) : (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg p-5">
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-2 text-center pb-3 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 text-[11px] font-black uppercase tracking-wider text-brand-dark-grey">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-2 pt-3">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-28 rounded-2xl bg-brand-offwhite/40 dark:bg-brand-midnight/40 border border-transparent"
                  />
                );
              }

              // Find tasks with deadline on this day
              const dayTasks = tasks.filter((t) => {
                const d = new Date(t.deadline);
                return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
              });

              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth &&
                new Date().getFullYear() === currentYear;

              return (
                <div
                  key={`day-${day}`}
                  className={`h-28 p-2 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                    isToday
                      ? "bg-brand-gold/10 border-brand-gold shadow-xs"
                      : "bg-brand-offwhite dark:bg-brand-midnight border-brand-beige/30 dark:border-brand-dark-grey/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black ${
                        isToday ? "text-brand-gold text-sm" : "text-brand-black dark:text-brand-white"
                      }`}
                    >
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-brand-red text-white">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-20 custom-scrollbar pr-0.5">
                    {dayTasks.map((task) => (
                      <Link
                        key={task._id}
                        href={`/dashboard/tasks/${task._id}`}
                        className={`block text-[10px] p-1 rounded-lg truncate font-extrabold ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-600"
                            : task.priority === "CRITICAL"
                            ? "bg-red-500/20 text-red-600"
                            : "bg-brand-gold/20 text-brand-gold"
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
