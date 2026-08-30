"use client";

import { useState, useCallback } from "react";
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
      const res = await axiosSecure.get(`/asset-assignment/employee/${employeeId}`);
      return res?.data?.data || [];
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

  return { loading, issueAsset, returnAsset, getByEmployee, getByAsset, getPendingReturns, getDashboardStats, getAlerts };
}
