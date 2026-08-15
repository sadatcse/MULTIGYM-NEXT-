"use client";

import React from "react";
import {
  MdHome,
  MdWork,
  MdSettings,
  MdSecurity,
  MdPeople,
  MdStorefront,
  MdReceiptLong,
  MdLocationOn,
  MdBadge,
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
      title: "Configuration & Settings",
      path: "/dashboard/settings/branches",
      key: "configuration",
      icon: <MdSettings className="text-lg" />,
      children: [
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
      path: "/dashboard/user",
      key: "user-management",
      icon: <MdPeople className="text-lg" />,
      children: [
        {
          title: "Employee Directory",
          path: "/dashboard/user",
          key: "user",
          description: "View, create, update, and manage employee profiles and credentials",
          icon: <MdPeople className="text-base" />,
        },
      ],
    },
  ];
};

export default menuItems;
