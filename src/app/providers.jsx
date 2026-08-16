"use client";

import React, { useState, useEffect } from "react";
import AuthProvider from "@/providers/AuthProvider";
import { TimeZoneProvider } from "@/providers/TimeZoneProvider";
import { PermissionsProvider } from "@/providers/PermissionsProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Global timezone monkey-patch
if (typeof window !== "undefined") {
  if (!window.__DATE_PATCHED__) {
    window.__DATE_PATCHED__ = true;
    window.__SYSTEM_TIMEZONE__ = "Asia/Dhaka"; // Default initial timezone

    const originalToLocaleString = Date.prototype.toLocaleString;
    Date.prototype.toLocaleString = function (locales, options) {
      const tz = window.__SYSTEM_TIMEZONE__ || "Asia/Dhaka";
      const opts = { timeZone: tz, ...options };
      return originalToLocaleString.call(this, locales, opts);
    };

    const originalToLocaleDateString = Date.prototype.toLocaleDateString;
    Date.prototype.toLocaleDateString = function (locales, options) {
      const tz = window.__SYSTEM_TIMEZONE__ || "Asia/Dhaka";
      const opts = { timeZone: tz, ...options };
      return originalToLocaleDateString.call(this, locales, opts);
    };

    const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
    Date.prototype.toLocaleTimeString = function (locales, options) {
      const tz = window.__SYSTEM_TIMEZONE__ || "Asia/Dhaka";
      const opts = { timeZone: tz, ...options };
      return originalToLocaleTimeString.call(this, locales, opts);
    };

    // Patch Intl.DateTimeFormat
    const OriginalDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function (locales, options) {
      const tz = window.__SYSTEM_TIMEZONE__ || "Asia/Dhaka";
      const opts = { timeZone: tz, ...options };
      return new OriginalDateTimeFormat(locales, opts);
    };
    Object.setPrototypeOf(Intl.DateTimeFormat, OriginalDateTimeFormat);
    Intl.DateTimeFormat.prototype = OriginalDateTimeFormat.prototype;
  }
}

export default function Providers({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });
  }, []);

  return (
    <AuthProvider>
      <TimeZoneProvider>
        <PermissionsProvider>
          {mounted ? children : <div className="min-h-screen bg-brand-offwhite dark:bg-brand-charcoal" />}
          <ToastContainer position="top-right" autoClose={3000} />
        </PermissionsProvider>
      </TimeZoneProvider>
    </AuthProvider>
  );
}
