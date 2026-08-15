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
      path: "/dashboard/settings/departments",
      key: "configuration",
      icon: <MdSettings className="text-lg" />,
      children: [
        {
          title: "Department Configuration",
          path: "/dashboard/settings/departments",
          key: "departments",
          description: "Manage organizational departments, display order, and status",
          icon: <MdWork className="text-base" />,
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
      title: "Staff & Employee Management",
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
    {
      title: "Procurement & Operations",
      path: "/dashboard/vendor",
      key: "procurement",
      icon: <MdStorefront className="text-lg" />,
      children: [
        {
          title: "Vendor Management",
          path: "/dashboard/vendor",
          key: "vendor",
          description: "Track suppliers, gym equipment vendors, and contact records",
          icon: <MdStorefront className="text-base" />,
        },
      ],
    },
    {
      title: "Financial & System Audit",
      path: "/dashboard/transaction-logs",
      key: "audit",
      icon: <MdReceiptLong className="text-lg" />,
      children: [
        {
          title: "Transaction Logs",
          path: "/dashboard/transaction-logs",
          key: "transaction-logs",
          description: "Audit trail, action logs, system event history, and security logs",
          icon: <MdReceiptLong className="text-base" />,
        },
      ],
    },
  ];
};

export default menuItems;
