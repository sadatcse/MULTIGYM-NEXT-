"use client";

import React, { useState, useEffect, useRef, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/providers/AuthProvider";
import {
  FiUser,
  FiSettings,
  FiShield,
  FiMoon,
  FiSun,
  FiLogOut,
  FiHelpCircle
} from "react-icons/fi";

const ProfileDropdown = ({
  user: propUser,
  onSignOut,
  className = "",
}) => {
  const { user: authUser, logOut } = useContext(AuthContext) || {};
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const dropdownRef = useRef(null);

  const currentUser = propUser || authUser || {
    name: "System Admin",
    email: "admin@gmail.com",
    role: "superadmin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    status: "online",
  };

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Sync initial dark mode state
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        if (next) {
          document.documentElement.classList.add("dark");
          localStorage.setItem("theme", "dark");
        } else {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("theme", "light");
        }
      }
      return next;
    });
  };

  const handleLogoutClick = async () => {
    setIsOpen(false);
    if (onSignOut) {
      onSignOut();
    } else if (logOut) {
      try {
        await logOut();
        router.push("/");
      } catch (err) {
        console.error("Logout failed", err);
      }
    }
  };

  const menuItems = [
    {
      label: "My Profile",
      icon: FiUser,
      path: "/dashboard/profile",
      shortcut: "⌘P",
    },
    {
      label: "Account Settings",
      icon: FiSettings,
      path: "/dashboard/settings",
      shortcut: "⌘S",
    },
    {
      label: "Role & Security",
      icon: FiShield,
      path: "/dashboard/settings/roles",
      badge: "NEW",
    },
    {
      label: "Help & Support",
      icon: FiHelpCircle,
      path: "/dashboard/help",
    },
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Profile Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Profile menu"
        className="relative flex items-center justify-center cursor-pointer group focus:outline-none p-0.5 rounded-full hover:ring-2 hover:ring-brand-gold transition-all duration-200"
      >
        <img
          src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
          alt={currentUser.name}
          className="w-9 h-9 rounded-full object-cover border border-brand-gold/50 shadow-sm"
        />
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-brand-white dark:border-brand-midnight rounded-full" />
      </button>

      {/* Dropdown Menu Container */}
      <div
        className={`absolute right-0 top-full mt-2 w-64 bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey/60 rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-200 origin-top-right ${
          isOpen
            ? "opacity-100 scale-100 visible pointer-events-auto"
            : "opacity-0 scale-95 invisible pointer-events-none"
        }`}
      >
        {/* Identity Header */}
        <div className="p-3.5 bg-brand-offwhite dark:bg-brand-midnight border-b border-brand-beige/40 dark:border-brand-dark-grey/40">
          <Link
            href="/dashboard/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border border-brand-gold/40"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-brand-white dark:border-brand-midnight rounded-full" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-brand-black dark:text-brand-white truncate group-hover:text-brand-red transition-colors">
                {currentUser.name}
              </h4>
              <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light truncate">
                {currentUser.email}
              </p>
              {currentUser.role && (
                <span className="inline-block text-[9px] font-black uppercase tracking-wider text-brand-gold mt-0.5">
                  {currentUser.role}
                </span>
              )}
            </div>
          </Link>
        </div>

        <div className="p-2 space-y-1">
          {/* Main Action Menu Items */}
          <ul className="space-y-0.5">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <li key={idx}>
                  <Link
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-brand-black dark:text-brand-white hover:bg-brand-red/10 hover:text-brand-red dark:hover:bg-brand-red/20 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-brand-gold group-hover:text-brand-red transition-colors" />
                      <span>{item.label}</span>
                    </div>

                    {item.shortcut && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 text-brand-dark-grey dark:text-brand-gold-light rounded">
                        {item.shortcut}
                      </span>
                    )}

                    {item.badge && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-brand-red uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping" />
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="my-1.5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40" />

          {/* Dark Mode Toggle Row */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-brand-black dark:text-brand-white hover:bg-brand-gold/10 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {isDarkMode ? (
                <FiSun className="w-4 h-4 text-brand-gold" />
              ) : (
                <FiMoon className="w-4 h-4 text-brand-dark-grey" />
              )}
              <span>Dark Mode</span>
            </div>

            {/* Custom Toggle Switch */}
            <div
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-300 relative ${
                isDarkMode ? "bg-brand-gold" : "bg-brand-beige dark:bg-brand-dark-grey"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-300 transform ${
                  isDarkMode ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </div>
          </button>

          <div className="my-1.5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40" />

          {/* Sign Out Row */}
          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black text-brand-red hover:bg-brand-red/10 transition-all cursor-pointer"
          >
            <FiLogOut className="w-4 h-4 text-brand-red" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDropdown;
