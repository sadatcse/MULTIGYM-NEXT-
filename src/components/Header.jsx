"use client";

import React, { useState, useContext, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FaUserCircle } from "react-icons/fa";
import { RiMenuFold4Fill as RiFoldIcon } from "react-icons/ri";
import { MdMenu, MdSearch, MdDarkMode, MdLightMode, MdTableRestaurant, MdReceiptLong, MdDashboard } from "react-icons/md";
import { FiBell, FiCheck } from "react-icons/fi";
import { AuthContext } from "@/providers/AuthProvider";
import useThemeMode from "@/hooks/useThemeMode";
import ProfileDropdown from "@/components/Comon/ProfileDropdown";

const getMockNotifications = () => [
  {
    _id: "mock-1",
    title: "System Update Complete",
    message: "Resort PMS system successfully optimized to v16.2.7.",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false
  },
  {
    _id: "mock-2",
    title: "Daily Checkout Warning",
    message: "Room 101 expected checkout is overdue by 1 hour.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false
  },
  {
    _id: "mock-3",
    title: "Kitchen Alert: Low Ingredients",
    message: "Sugar and milk stock counts are approaching safety minimums.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: true
  }
];

const Header = ({ isSidebarOpen, toggleSidebar }) => {
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(getMockNotifications());

  const { user, logoutUser } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const { mode, toggleMode, loading } = useThemeMode();

  const handleMarkAsRead = (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSignOut = async () => {
    await logoutUser();
    router.push("/");
  };

  return (
    <header className="bg-brand-white dark:bg-brand-charcoal border-b border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm w-full p-2 flex items-center justify-between z-10 transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-brand-charcoal dark:text-brand-offwhite hover:bg-brand-primary/10 dark:hover:bg-brand-dark-grey p-2 rounded-full focus:outline-none transition-colors duration-200 cursor-pointer"
        >
          {isSidebarOpen ? (
            <RiFoldIcon className="text-2xl" />
          ) : (
            <MdMenu className="text-2xl" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Profile Dropdown */}
        <ProfileDropdown
          user={{
            name: user?.name || "System Admin",
            email: user?.email || "admin@gmail.com",
            role: user?.role || "superadmin",
            avatar: user?.photo,
          }}
          onSignOut={handleSignOut}
        />
      </div>
    </header>
  );
};

export default Header;
