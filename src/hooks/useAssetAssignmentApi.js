"use client";

import { useState, useCallback, useMemo } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function useAssetAssignmentApi() {
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);

  const issueAsset = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.post("/asset-assignment/issue", payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const bulkIssueAsset = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.post("/asset-assignment/bulk-issue", payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const returnAsset = useCallback(
    async (id, payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.put(`/asset-assignment/return/${id}`, payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const getByEmployee = useCallback(
    async (employeeId) => {
      if (!employeeId) return [];
      try {
        const res = await axiosSecure.get(`/asset-assignment/employee/${encodeURIComponent(employeeId)}`);
        return res?.data?.data || [];
      } catch (err) {
        console.warn("Primary getByEmployee request failed, attempting fallback query:", err?.message);
        try {
          const fallbackRes = await axiosSecure.get(`/asset-assignment?search=${encodeURIComponent(employeeId)}&limit=100`);
          return fallbackRes?.data?.data || [];
        } catch (fallbackErr) {
          console.error("Fallback getByEmployee failed:", fallbackErr);
          return [];
        }
      }
    },
    [axiosSecure]
  );

  const getByAsset = useCallback(
    async (assetId) => {
      const res = await axiosSecure.get(`/asset-assignment/asset/${assetId}`);
      return res?.data?.data || [];
    },
    [axiosSecure]
  );

  const getPendingReturns = useCallback(
    async (employeeId) => {
      const res = await axiosSecure.get("/asset-assignment/pending-returns", { params: employeeId ? { employee: employeeId } : {} });
      return res?.data?.data || [];
    },
    [axiosSecure]
  );

  const getDashboardStats = useCallback(async () => {
    const res = await axiosSecure.get("/asset-assignment/dashboard-stats");
    return res?.data?.data;
  }, [axiosSecure]);

  const getAlerts = useCallback(async () => {
    const res = await axiosSecure.get("/asset-assignment/alerts");
    return res?.data?.data;
  }, [axiosSecure]);

  // Memoized so consumers can safely depend on the whole hook object in a
  // useCallback/useEffect dependency array — without this, a plain object
  // literal here would be a new reference on every render, making any
  // `useCallback(..., [assignmentApi])` re-create itself every render and
  // re-trigger its own effect forever (confirmed: this caused an infinite
  // fetch loop on the Exit Clearance page).
  return useMemo(
    () => ({ loading, issueAsset, bulkIssueAsset, returnAsset, getByEmployee, getByAsset, getPendingReturns, getDashboardStats, getAlerts }),
    [loading, issueAsset, bulkIssueAsset, returnAsset, getByEmployee, getByAsset, getPendingReturns, getDashboardStats, getAlerts]
  );
}
