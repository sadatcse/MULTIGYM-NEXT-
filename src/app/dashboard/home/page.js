"use client";

import React, { useContext } from "react";
import Link from "next/link";
import WeatherCard from "@/components/Comon/WeatherCard";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import { AuthContext } from "@/providers/AuthProvider";
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
} from "react-icons/fi";

export default function DashboardHomePage() {
  const { user } = useContext(AuthContext);
  const { formatDateTime, currentTimeZoneObj } = useSystemTimeZone();

  const userName = user?.name || "System Admin";

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
