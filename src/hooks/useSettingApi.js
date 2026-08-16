"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function useSettingApi() {
  const axiosSecure = useAxiosSecure();

  const [settings, setSettings] = useState({
    companyName: "Multigym HR",
    companyTagline: "Complete Enterprise HR & Payroll Management",
    email: "info@multigymhr.com",
    phone: "+880 1700-000000",
    address: "House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh",
    website: "https://multigymhr.com",
    logo: "",
    taxNumber: "BIN-123456789",
    timeZone: "Asia/Dhaka",
    dateFormat: "YYYY-MM-DD",
    currencySymbol: "৳",
    language: "English",
    enablePrintHeader: "yes",
    enablePrintFooter: "yes",
    printHeaderInch: 1.0,
    printFooterInch: 0.75,
    printHeaderText: "MULTIGYM HR MANAGEMENT SYSTEM",
    printFooterText: "This is a computer-generated document. No signature required.",
    probationMonths: 3,
    workingDaysPerWeek: 5,
    dailyWorkHours: 8,
    overtimeRate: 1.5,
  });

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Synchronous lock (defense-in-depth against rapid double-submit firing two
  // overlapping PUT requests before the isUpdating state re-render commits).
  const updateLockRef = useRef(false);

  // Fetch site settings from backend
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosSecure.get("/setting");
      if (res?.data?.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data.data,
        }));
      }
    } catch (err) {
      console.error("Error fetching site settings:", err);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount, not a cascading render
    fetchSettings();
  }, [fetchSettings]);

  // Update site settings
  const updateSettings = async (payload) => {
    // Internal guard: if a save is already in flight, treat this call as a safe
    // no-op instead of firing a second overlapping PUT (protects every caller of
    // this hook, not just ones that remember to disable their own Save button).
    if (updateLockRef.current) return null;

    updateLockRef.current = true;
    setIsUpdating(true);
    try {
      const res = await axiosSecure.put("/setting", payload);
      if (res?.data?.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data.data,
        }));
      }
      return res.data;
    } finally {
      updateLockRef.current = false;
      setIsUpdating(false);
    }
  };

  return {
    settings,
    loading,
    isUpdating,
    fetchSettings,
    updateSettings,
  };
}
