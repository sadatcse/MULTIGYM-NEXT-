"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import timezonesData from "@/data/Timezone.json";

const TimeZoneContext = createContext(null);

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_NAMES_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function applyDateFormatPattern(d, formatPattern, timeZone = "Asia/Dhaka") {
  if (!d || isNaN(new Date(d).getTime())) return String(d || "");

  try {
    const dateObj = new Date(d);

    // Extract zoned date parts using Intl
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(dateObj);
    let YYYY = "", MM = "", DD = "";
    parts.forEach((p) => {
      if (p.type === "year") YYYY = p.value;
      if (p.type === "month") MM = p.value;
      if (p.type === "day") DD = p.value;
    });

    const monthIdx = parseInt(MM, 10) - 1;
    const MMM = MONTH_NAMES_SHORT[monthIdx] || MM;
    const MMMM = MONTH_NAMES_LONG[monthIdx] || MM;

    const pattern = formatPattern || "YYYY-MM-DD";

    switch (pattern) {
      case "DD/MM/YYYY":
        return `${DD}/${MM}/${YYYY}`;
      case "MM/DD/YYYY":
        return `${MM}/${DD}/${YYYY}`;
      case "DD-MM-YYYY":
        return `${DD}-${MM}-${YYYY}`;
      case "DD MMM YYYY":
        return `${DD} ${MMM} ${YYYY}`;
      case "DD MMMM YYYY":
        return `${DD} ${MMMM} ${YYYY}`;
      case "MMM DD, YYYY":
        return `${MMM} ${DD}, ${YYYY}`;
      case "MMMM DD, YYYY":
        return `${MMMM} ${DD}, ${YYYY}`;
      case "YYYY/MM/DD":
        return `${YYYY}/${MM}/${DD}`;
      case "YYYY-MM-DD":
      default:
        return `${YYYY}-${MM}-${DD}`;
    }
  } catch (err) {
    return String(d);
  }
}

export function TimeZoneProvider({ children }) {
  const axiosSecure = useAxiosSecure();

  const [settings, setSettings] = useState({
    timeZone: "Asia/Dhaka",
    dateFormat: "YYYY-MM-DD",
    currencySymbol: "৳",
  });
  const [loading, setLoading] = useState(true);

  // Sync window.__SYSTEM_TIMEZONE__ and window.__SYSTEM_DATE_FORMAT__
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (settings.timeZone) window.__SYSTEM_TIMEZONE__ = settings.timeZone;
      if (settings.dateFormat) window.__SYSTEM_DATE_FORMAT__ = settings.dateFormat;
    }
  }, [settings.timeZone, settings.dateFormat]);

  const fetchTimeZoneSettings = useCallback(async () => {
    try {
      const res = await axiosSecure.get("/setting");
      if (res?.data?.data) {
        const fetchedTz = res.data.data.timeZone || "Asia/Dhaka";
        const fetchedDateFormat = res.data.data.dateFormat || "YYYY-MM-DD";

        setSettings((prev) => ({
          ...prev,
          ...res.data.data,
        }));

        if (typeof window !== "undefined") {
          window.__SYSTEM_TIMEZONE__ = fetchedTz;
          window.__SYSTEM_DATE_FORMAT__ = fetchedDateFormat;
        }
      }
    } catch (err) {
      console.error("TimeZoneProvider fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchTimeZoneSettings();
  }, [fetchTimeZoneSettings]);

  const updateTimeZoneSettings = useCallback(
    async (newPayload) => {
      const res = await axiosSecure.put("/setting", newPayload);
      if (res?.data?.data) {
        const updatedTz = res.data.data.timeZone || settings.timeZone;
        const updatedFormat = res.data.data.dateFormat || settings.dateFormat;

        setSettings((prev) => ({
          ...prev,
          ...res.data.data,
        }));

        if (typeof window !== "undefined") {
          window.__SYSTEM_TIMEZONE__ = updatedTz;
          window.__SYSTEM_DATE_FORMAT__ = updatedFormat;
        }
      }
      return res?.data;
    },
    [axiosSecure, settings.timeZone, settings.dateFormat]
  );

  const timeZone = settings.timeZone || "Asia/Dhaka";
  const dateFormat = settings.dateFormat || "YYYY-MM-DD";

  const currentTimeZoneObj = useMemo(() => {
    return (
      timezonesData.find((tz) => tz.value.toLowerCase() === timeZone.toLowerCase()) ||
      timezonesData.find((tz) => tz.value === "Asia/Dhaka") ||
      timezonesData[0]
    );
  }, [timeZone]);

  const formatDate = useCallback(
    (dateInput, overrideFormat) => {
      if (!dateInput) return "";
      const formatToUse = overrideFormat || settings.dateFormat || "YYYY-MM-DD";
      return applyDateFormatPattern(dateInput, formatToUse, timeZone);
    },
    [timeZone, settings.dateFormat]
  );

  const formatTime = useCallback(
    (dateInput) => {
      if (!dateInput) return "";
      try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return String(dateInput);
        return new Intl.DateTimeFormat("en-US", {
          timeZone: timeZone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(d);
      } catch (err) {
        return String(dateInput);
      }
    },
    [timeZone]
  );

  const formatDateTime = useCallback(
    (dateInput, overrideFormat) => {
      if (!dateInput) return "";
      try {
        const dateStr = formatDate(dateInput, overrideFormat);
        const timeStr = formatTime(dateInput);
        return `${dateStr} ${timeStr}`;
      } catch (err) {
        return String(dateInput);
      }
    },
    [formatDate, formatTime]
  );

  const value = useMemo(
    () => ({
      timeZone,
      dateFormat,
      timezones: timezonesData,
      currentTimeZoneObj,
      settings,
      loading,
      formatDate,
      formatTime,
      formatDateTime,
      updateTimeZoneSettings,
      refreshTimeZoneSettings: fetchTimeZoneSettings,
    }),
    [
      timeZone,
      dateFormat,
      currentTimeZoneObj,
      settings,
      loading,
      formatDate,
      formatTime,
      formatDateTime,
      updateTimeZoneSettings,
      fetchTimeZoneSettings,
    ]
  );

  return <TimeZoneContext.Provider value={value}>{children}</TimeZoneContext.Provider>;
}

export function useSystemTimeZone() {
  const context = useContext(TimeZoneContext);
  if (!context) {
    const tz = typeof window !== "undefined" && window.__SYSTEM_TIMEZONE__ ? window.__SYSTEM_TIMEZONE__ : "Asia/Dhaka";
    const df = typeof window !== "undefined" && window.__SYSTEM_DATE_FORMAT__ ? window.__SYSTEM_DATE_FORMAT__ : "YYYY-MM-DD";
    return {
      timeZone: tz,
      dateFormat: df,
      timezones: timezonesData,
      currentTimeZoneObj: timezonesData.find((t) => t.value === "Asia/Dhaka") || timezonesData[0],
      formatDate: (d) => applyDateFormatPattern(d, df, tz),
      formatTime: (d) => (d ? new Date(d).toLocaleTimeString() : ""),
      formatDateTime: (d) => `${applyDateFormatPattern(d, df, tz)} ${d ? new Date(d).toLocaleTimeString() : ""}`,
      updateTimeZoneSettings: async () => {},
      refreshTimeZoneSettings: async () => {},
    };
  }
  return context;
}
