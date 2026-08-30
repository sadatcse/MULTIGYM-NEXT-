"use client";

import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MdMenu } from "react-icons/md";
import { RiMenuFold4Fill as RiFoldIcon } from "react-icons/ri";
import { FiBell, FiClock, FiAlertTriangle, FiFileText, FiTool, FiDollarSign, FiUserX, FiRefreshCw } from "react-icons/fi";
import { AuthContext } from "@/providers/AuthProvider";
import useThemeMode from "@/hooks/useThemeMode";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import ProfileDropdown from "@/components/Comon/ProfileDropdown";

// Vendor alerts (expiring warranties/contracts, upcoming services, pending
// payments) are computed live server-side — no persisted read/unread state,
// "read" here is just an ephemeral client-side dismissal for this session.
function buildNotificationsFromAlerts(alerts) {
  if (!alerts) return [];
  const items = [];

  alerts.expiringWarranties?.forEach((p) => {
    items.push({
      _id: `warranty-${p._id}`,
      icon: FiAlertTriangle,
      color: "text-rose-500",
      title: p.warrantyStatus === "expired" ? "Warranty expired" : "Warranty expiring soon",
      message: `${p.productName} — ${p.vendor?.name || "Unknown vendor"}`,
      createdAt: p.warranty?.endDate,
    });
  });

  alerts.expiringContracts?.forEach((c) => {
    items.push({
      _id: `contract-${c._id}`,
      icon: FiFileText,
      color: "text-amber-500",
      title: c.status === "expired" ? "Contract expired" : "Contract expiring soon",
      message: `${c.contractType || "Contract"} — ${c.vendor?.name || "Unknown vendor"}`,
      createdAt: c.endDate,
    });
  });

  alerts.upcomingServices?.forEach((s) => {
    items.push({
      _id: `service-${s._id}`,
      icon: FiTool,
      color: "text-blue-500",
      title: "Upcoming service",
      message: `${s.serviceType || "Service"} — ${s.vendor?.name || "Unknown vendor"}`,
      createdAt: s.nextServiceDate,
    });
  });

  alerts.pendingPayments?.forEach((p) => {
    items.push({
      _id: `payment-${p._id}`,
      icon: FiDollarSign,
      color: "text-brand-gold",
      title: "Pending vendor payment",
      message: `${p.productName} — ${p.vendor?.name || "Unknown vendor"}`,
      createdAt: p.purchaseDate,
    });
  });

  return items.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

// Same computed-live, no-persisted-state approach for asset alerts (pending
// returns, damaged/lost items, uniform replacement due).
function buildAssetNotifications(alerts) {
  if (!alerts) return [];
  const items = [];

  alerts.pendingReturns?.forEach((a) => {
    items.push({
      _id: `asset-pending-${a._id}`,
      icon: FiUserX,
      color: "text-rose-500",
      title: "Pending asset return",
      message: `${a.asset?.assetCode || "Asset"} — ${a.employee?.name || "Unknown employee"}`,
      createdAt: a.issueDate,
    });
  });

  alerts.damagedAssets?.forEach((a) => {
    items.push({
      _id: `asset-damaged-${a._id}`,
      icon: FiAlertTriangle,
      color: "text-rose-500",
      title: a.status === "lost" ? "Asset reported lost" : "Asset reported damaged",
      message: `${a.assetCode} — ${a.assetType?.name || ""}`,
      createdAt: a.updatedAt,
    });
  });

  alerts.replacementDue?.forEach((a) => {
    items.push({
      _id: `asset-replacement-${a._id}`,
      icon: FiRefreshCw,
      color: "text-brand-gold",
      title: "Uniform replacement due",
      message: `${a.asset?.assetType?.name || "Item"} — ${a.employee?.name || "Unknown employee"}`,
      createdAt: a.issueDate,
    });
  });

  return items;
}

const Header = ({ isSidebarOpen, toggleSidebar }) => {
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const notifRef = useRef(null);

  const { user, logoutUser } = useContext(AuthContext);
  const axiosSecure = useAxiosSecure();
  const router = useRouter();
  const { mode } = useThemeMode();
  const { formatDateTime, currentTimeZoneObj } = useSystemTimeZone();
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const [vendorRes, assetRes] = await Promise.allSettled([
        axiosSecure.get("/vendor/alerts"),
        axiosSecure.get("/asset-assignment/alerts"),
      ]);

      const vendorItems = vendorRes.status === "fulfilled" ? buildNotificationsFromAlerts(vendorRes.value.data.data) : [];
      const assetItems = assetRes.status === "fulfilled" ? buildAssetNotifications(assetRes.value.data.data) : [];

      setNotifications([...vendorItems, ...assetItems].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)));
    } catch (err) {
      console.error("Failed to load alerts:", err);
    }
  }, [axiosSecure]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleNotifications = notifications.filter((n) => !dismissedIds.has(n._id));

  const handleMarkAllRead = () => {
    setDismissedIds(new Set(notifications.map((n) => n._id)));
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
        {/* LIVE SYSTEM TIME ZONE CLOCK */}
        {now && (
          <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20 text-xs font-extrabold shadow-xs">
            <FiClock className="text-sm shrink-0 text-brand-gold animate-pulse" />
            <span>
              {currentTimeZoneObj?.city || "Zoned"}: {formatDateTime(now)}
            </span>
          </div>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label="Notifications"
            className="relative text-brand-charcoal dark:text-brand-offwhite hover:bg-brand-primary/10 dark:hover:bg-brand-dark-grey p-2 rounded-full focus:outline-none transition-colors duration-200 cursor-pointer"
          >
            <FiBell className="text-xl" />
            {visibleNotifications.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-brand-red text-white text-[9px] font-black flex items-center justify-center">
                {visibleNotifications.length > 9 ? "9+" : visibleNotifications.length}
              </span>
            )}
          </button>

          <div
            className={`absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey/60 rounded-2xl shadow-2xl z-50 transition-all duration-200 origin-top-right ${
              isNotifOpen ? "opacity-100 scale-100 visible pointer-events-auto" : "opacity-0 scale-95 invisible pointer-events-none"
            }`}
          >
            <div className="p-3.5 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between sticky top-0 bg-brand-white dark:bg-brand-charcoal">
              <h4 className="text-xs font-black text-brand-black dark:text-brand-white">Alerts</h4>
              {visibleNotifications.length > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-brand-gold hover:underline cursor-pointer">
                  Mark all read
                </button>
              )}
            </div>
            {visibleNotifications.length === 0 ? (
              <p className="p-6 text-center text-xs text-brand-dark-grey">No pending alerts. You&apos;re all caught up.</p>
            ) : (
              <ul>
                {visibleNotifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <li key={n._id} className="p-3 border-b border-brand-beige/30 dark:border-brand-dark-grey/30 last:border-0 flex items-start gap-2.5">
                      <Icon className={`text-sm mt-0.5 shrink-0 ${n.color}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-brand-black dark:text-brand-white">{n.title}</p>
                        <p className="text-[11px] text-brand-dark-grey truncate">{n.message}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

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
