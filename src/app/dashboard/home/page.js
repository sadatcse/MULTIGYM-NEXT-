"use client";

import React, { useContext, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import WeatherCard from "@/components/Comon/WeatherCard";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import { AuthContext } from "@/providers/AuthProvider";
import useTaskApi from "@/hooks/useTaskApi";
import useMaintenanceApi from "@/hooks/useMaintenanceApi";
import {
  FiUsers,
  FiMapPin,
  FiShield,
  FiSettings,
  FiClock,
  FiBriefcase,
  FiArrowRight,
  FiCheckCircle,
  FiCalendar,
  FiAlertTriangle,
  FiTool,
} from "react-icons/fi";
import { MdAssignment, MdPendingActions, MdBuild } from "react-icons/md";

export default function DashboardHomePage() {
  const { user } = useContext(AuthContext);
  const { formatDateTime, currentTimeZoneObj } = useSystemTimeZone();
  const { getDashboardStats } = useTaskApi();
  const { getDashboardStats: getMaintenanceStats } = useMaintenanceApi();

  const [taskData, setTaskData] = useState(null);
  const [maintenanceData, setMaintenanceData] = useState(null);

  const fetchTaskStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setTaskData(data);
    } catch {
      // Non-fatal
    }
  }, [getDashboardStats]);

  const fetchMaintenanceStats = useCallback(async () => {
    try {
      const data = await getMaintenanceStats();
      setMaintenanceData(data);
    } catch {
      // Non-fatal
    }
  }, [getMaintenanceStats]);

  useEffect(() => {
    fetchTaskStats();
    fetchMaintenanceStats();
  }, [fetchTaskStats, fetchMaintenanceStats]);

  const userName = user?.name || "System Admin";
  const overview = taskData?.overview || {
    total: 0,
    overdue: 0,
    dueToday: 0,
    dueSoon: 0,
    pending: 0,
    waitingApproval: 0,
  };
  const criticalList = taskData?.criticalTasks || [];

  return (
    <div className="space-y-6 w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 font-sans">
      {/* TOP BANNER & WEATHER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Welcome Banner (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-r from-brand-black via-brand-charcoal to-brand-midnight border border-brand-gold/30 p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl group-hover:bg-brand-gold/20 transition-all pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 text-xs font-black uppercase tracking-wider">
              <FiClock className="text-sm shrink-0" />
              <span>{currentTimeZoneObj?.city || "System Zoned"}: {formatDateTime(new Date())}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Welcome Back, <span className="text-brand-gold">{userName}</span>!
            </h1>

            <p className="text-xs sm:text-sm text-brand-gold-light max-w-xl leading-relaxed">
              Multigym Enterprise HR Portal is operating efficiently. Access employee directory, branch open/close schedules, system access roles, and general site settings below.
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap gap-3 relative z-10">
            <Link
              href="/dashboard/employee"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-gold text-brand-midnight font-extrabold text-xs hover:bg-brand-gold-light transition-all shadow-md shadow-brand-gold/20 scale-100 hover:scale-105"
            >
              <FiUsers /> Employee Directory <FiArrowRight />
            </Link>

            <Link
              href="/dashboard/settings/branches"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-all border border-white/20"
            >
              <FiMapPin className="text-brand-gold" /> Branch Locations
            </Link>

            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-all border border-white/20"
            >
              <FiSettings className="text-brand-gold" /> Site Settings
            </Link>
          </div>
        </div>

        {/* Right Live Weather Card (1 col) */}
        <div className="lg:col-span-1 flex">
          <div className="w-full">
            <WeatherCard />
          </div>
        </div>
      </div>

      {/* MANAGEMENT INSTRUCTIONS & TASKS WIDGET */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-brand-gold/15 text-brand-gold text-lg">
                <MdAssignment />
              </span>
              <h2 className="text-lg font-black text-brand-black dark:text-brand-white">
                Management Instructions &amp; Tasks
              </h2>
            </div>
            <p className="text-xs text-brand-dark-grey mt-0.5">
              Directives from MD Sir, Director Sir, and Management requiring active tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/dashboard/tasks/my-tasks"
              className="px-3.5 py-1.5 rounded-xl bg-brand-gold text-brand-black text-xs font-black hover:bg-brand-gold-light transition-all flex items-center gap-1"
            >
              My Tasks
            </Link>
            <Link
              href="/dashboard/tasks"
              className="px-3.5 py-1.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold hover:border-brand-gold transition-colors flex items-center gap-1"
            >
              Task Directory <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* 4 Overview Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/dashboard/tasks/follow-up"
            className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 hover:border-red-500/50 transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 block">
                Overdue
              </span>
              <span className="text-xl font-black text-red-500 block">{overview.overdue}</span>
            </div>
            <span className="text-[9px] font-bold text-red-500">Requires Action</span>
          </Link>

          <Link
            href="/dashboard/tasks/follow-up"
            className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block">
                Due Today
              </span>
              <span className="text-xl font-black text-amber-500 block">{overview.dueToday}</span>
            </div>
            <span className="text-[9px] font-bold text-amber-500">Today</span>
          </Link>

          <Link
            href="/dashboard/tasks"
            className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/50 transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block">
                Due Soon (3d)
              </span>
              <span className="text-xl font-black text-blue-500 block">{overview.dueSoon}</span>
            </div>
            <span className="text-[9px] font-bold text-blue-500">Upcoming</span>
          </Link>

          <Link
            href="/dashboard/tasks?status=PENDING"
            className="p-3 rounded-2xl bg-gray-500/10 border border-gray-500/20 hover:border-gray-500/50 transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-gray-500 block">
                Pending Directives
              </span>
              <span className="text-xl font-black text-gray-500 block">{overview.pending}</span>
            </div>
            <span className="text-[9px] font-bold text-gray-500">Unstarted</span>
          </Link>
        </div>

        {/* Priority Instructions Quick Snippets */}
        {criticalList.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-brand-beige/20 dark:border-brand-dark-grey/20">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold block">
              High Priority Directives
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {criticalList.slice(0, 3).map((item) => (
                <Link
                  key={item._id}
                  href={`/dashboard/tasks/${item._id}`}
                  className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 hover:border-brand-gold/60 transition-all block text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-red-500 text-white">
                      {item.priority}
                    </span>
                    <span className="text-[10px] text-brand-gold font-bold">
                      {item.instructionSource}
                    </span>
                  </div>
                  <div className="font-extrabold text-brand-black dark:text-brand-white truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-brand-dark-grey">
                    Deadline: {new Date(item.deadline).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MY MAINTENANCE WIDGET */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-brand-gold/15 text-brand-gold text-lg">
                <MdBuild />
              </span>
              <h2 className="text-lg font-black text-brand-black dark:text-brand-white">My Maintenance</h2>
            </div>
            <p className="text-xs text-brand-dark-grey mt-0.5">
              Issues you&apos;ve reported and their current status.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/dashboard/maintenance/create"
              className="px-3.5 py-1.5 rounded-xl bg-brand-gold text-brand-black text-xs font-black hover:bg-brand-gold-light transition-all flex items-center gap-1"
            >
              Request Maintenance
            </Link>
            <Link
              href="/dashboard/maintenance/my-requests"
              className="px-3.5 py-1.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold hover:border-brand-gold transition-colors flex items-center gap-1"
            >
              My Requests <FiArrowRight />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-brand-gold/10 border border-brand-gold/20">
            <span className="text-[10px] font-black uppercase text-brand-gold block">Total Requests</span>
            <span className="text-xl font-black text-brand-gold block">{maintenanceData?.overview?.total ?? 0}</span>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
            <span className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400 block">Open</span>
            <span className="text-xl font-black text-sky-500 block">{maintenanceData?.overview?.open ?? 0}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block">In Progress</span>
            <span className="text-xl font-black text-amber-500 block">{maintenanceData?.overview?.inProgress ?? 0}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">Completed</span>
            <span className="text-xl font-black text-emerald-500 block">{maintenanceData?.overview?.completed ?? 0}</span>
          </div>
        </div>

        {maintenanceData?.recent?.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-brand-beige/20 dark:border-brand-dark-grey/20">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold block">Recent Requests</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {maintenanceData.recent.slice(0, 3).map((item) => (
                <Link
                  key={item._id}
                  href={`/dashboard/maintenance/${item._id}`}
                  className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 hover:border-brand-gold/60 transition-all block text-xs space-y-1"
                >
                  <div className="flex items-center gap-1.5 text-brand-gold">
                    <FiTool className="text-xs shrink-0" />
                    <span className="text-[10px] font-bold uppercase">{item.category}</span>
                  </div>
                  <div className="font-extrabold text-brand-black dark:text-brand-white truncate">{item.issue}</div>
                  <div className="text-[10px] text-brand-dark-grey">{item.status?.replace("_", " ")}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QUICK SYSTEM MODULE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Module 1: Employees */}
        <Link
          href="/dashboard/employee"
          className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:shadow-md hover:border-brand-gold/50 transition-all duration-300 group flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiUsers />
            </div>
            <span className="text-xs font-black text-brand-gold group-hover:translate-x-1 transition-transform flex items-center gap-1">
              View Directory <FiArrowRight />
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-brand-black dark:text-brand-white">
              Employee Management
            </h3>
            <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-1">
              Manage personnel records, departments, and dynamic access roles.
            </p>
          </div>
        </Link>

        {/* Module 2: Branches */}
        <Link
          href="/dashboard/settings/branches"
          className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:shadow-md hover:border-brand-gold/50 transition-all duration-300 group flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiMapPin />
            </div>
            <span className="text-xs font-black text-emerald-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Manage Schedule <FiArrowRight />
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-brand-black dark:text-brand-white">
              Branch Operating Hours
            </h3>
            <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-1">
              Configure everyday open and close schedules for all branches.
            </p>
          </div>
        </Link>

        {/* Module 3: System Roles */}
        <Link
          href="/dashboard/settings/roles"
          className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:shadow-md hover:border-brand-gold/50 transition-all duration-300 group flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiShield />
            </div>
            <span className="text-xs font-black text-sky-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Roles & Access <FiArrowRight />
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-brand-black dark:text-brand-white">
              System Roles & Permissions
            </h3>
            <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-1">
              Define granular access permissions and RBAC role assignments.
            </p>
          </div>
        </Link>

        {/* Module 4: Site Settings */}
        <Link
          href="/dashboard/settings"
          className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:shadow-md hover:border-brand-gold/50 transition-all duration-300 group flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiSettings />
            </div>
            <span className="text-xs font-black text-brand-red group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Site Settings <FiArrowRight />
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-brand-black dark:text-brand-white">
              General Configuration
            </h3>
            <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-1">
              Time zones, company info, print header/footer inches, and HR defaults.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
