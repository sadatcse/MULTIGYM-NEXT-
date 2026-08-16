"use client";

import React from "react";
import {
  MdHome,
  MdWork,
  MdSettings,
  MdSecurity,
  MdPeople,
  MdLocationOn,
  MdBadge,
  MdAccessTime,
  MdCalendarMonth,
  MdChat,
  MdBeachAccess,
  MdSchedule,
  MdTimer,
  MdPayments,
  MdSwapHoriz,
  MdAlarmOn,
  MdCardGiftcard,
} from "react-icons/md";

const menuItems = () => {
  return [
    {
      title: "Dashboard Home",
      path: "/dashboard/home",
      key: "home",
      description: "Main HR management overview, metrics, and quick actions",
      icon: <MdHome className="text-lg" />,
    },
    {
      title: "Employee Chat",
      path: "/dashboard/chat",
      key: "chat",
      description: "Message any colleague in real time, see who's online",
      icon: <MdChat className="text-lg" />,
    },
    {
      title: "Configuration & Settings",
      path: "/dashboard/settings/branches",
      key: "configuration",
      icon: <MdSettings className="text-lg" />,
      children: [
        {
          title: "Site & General Settings",
          path: "/dashboard/settings",
          key: "settings",
          description: "Manage company info, time zone, print header/footer margins, and HR policies",
          icon: <MdSettings className="text-base" />,
        },
        {
          title: "Gym Calendar ",
          path: "/dashboard/calendar",
          key: "calendar",
          description: "Manage gym calendar, holidays, operating schedules, and payroll calculation metadata",
          icon: <MdCalendarMonth className="text-base" />,
        },
        {
          title: "Branch Configuration",
          path: "/dashboard/settings/branches",
          key: "branches",
          description: "Manage gym location branches, contact details, display order, and status",
          icon: <MdLocationOn className="text-base" />,
        },
        {
          title: "Department Configuration",
          path: "/dashboard/settings/departments",
          key: "departments",
          description: "Manage organizational departments, display order, and status",
          icon: <MdWork className="text-base" />,
        },
        {
          title: "Job Position Configuration",
          path: "/dashboard/settings/job-positions",
          key: "job-positions",
          description: "Manage job titles, department assignments, hierarchy order, and active access",
          icon: <MdBadge className="text-base" />,
        },
        {
          title: "Shift Configuration",
          path: "/dashboard/settings/shifts",
          key: "shifts",
          description: "Manage work shift schedules, display order, and active status",
          icon: <MdAccessTime className="text-base" />,
        },
        {
          title: "Employee Leave Types",
          path: "/dashboard/settings/leave-types",
          key: "leave-types",
          description: "Manage leave categories, paid/unpaid status, carry-forward, and gender rules",
          icon: <MdBeachAccess className="text-base" />,
        },
        {
          title: "Work Schedule List",
          path: "/dashboard/settings/work-schedules",
          key: "work-schedules",
          description: "Manage weekly work schedules, daily hours, late tolerance, and half-day rules",
          icon: <MdSchedule className="text-base" />,
        },
        {
          title: "Late & Attendance Policy",
          path: "/dashboard/settings/late-policy",
          key: "late-policy",
          description: "Configure matching methods, grace periods, late tolerances, and deduction rates",
          icon: <MdTimer className="text-base" />,
        },
        {
          title: "Salary Advance Policy",
          path: "/dashboard/settings/advance-policy",
          key: "advance-policy",
          description: "Configure max advance %, max count, deduction methods, and service months",
          icon: <MdPayments className="text-base" />,
        },
        {
          title: "Proxy Duty Management",
          path: "/dashboard/settings/proxy-duty",
          key: "proxy-duty",
          description: "Log and track substitute duty swaps, duty dates, and proxy pay allowances",
          icon: <MdSwapHoriz className="text-base" />,
        },
        {
          title: "Overtime Policy & Records",
          path: "/dashboard/settings/overtime",
          key: "overtime",
          description: "Manage overtime calculation rate multipliers, max hours, and log overtime records",
          icon: <MdAlarmOn className="text-base" />,
        },
        {
          title: "Bonus Policy Configuration",
          path: "/dashboard/settings/bonus-policy",
          key: "bonus-policy",
          description: "Configure festival, performance, and attendance bonuses and payout months",
          icon: <MdCardGiftcard className="text-base" />,
        },
        {
          title: "User Role Configuration",
          path: "/dashboard/settings/roles",
          key: "roles",
          description: "Create and manage system user roles and hierarchy order",
          icon: <MdSecurity className="text-base" />,
        },
        {
          title: "Role Access Control",
          path: "/dashboard/settings/role-permissions",
          key: "role-permissions",
          description: "Configure module-level view/add/edit/delete access matrix",
          icon: <MdSecurity className="text-base" />,
        },
      ],
    },
    {
      title: "Employee Management",
      path: "/dashboard/employee",
      key: "employee-management",
      icon: <MdPeople className="text-lg" />,
      children: [
        {
          title: "Employee Directory",
          path: "/dashboard/employee",
          key: "employee",
          description: "View, create, update, and manage employee profiles and credentials",
          icon: <MdPeople className="text-base" />,
        },
      ],
    },
  ];
};

export default menuItems;
