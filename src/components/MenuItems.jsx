"use client";

import React from "react";
import {
  MdHome,
  MdWork,
  MdSettings,
  MdSecurity,
} from "react-icons/md";

const menuItems = () => {
  return [
    {
      title: "Dashboard Home",
      path: "/dashboard/home",
      icon: <MdHome className="text-lg" />,
    },
    {
      title: "Configuration",
      path: "/dashboard/settings/departments",
      icon: <MdSettings className="text-lg" />,
      children: [
        {
          title: "Department",
          path: "/dashboard/settings/departments",
          icon: <MdWork className="text-base" />,
        },
        {
          title: "User Role",
          path: "/dashboard/settings/roles",
          icon: <MdSecurity className="text-base" />,
        },
      ],
    },
  ];
};

export default menuItems;
