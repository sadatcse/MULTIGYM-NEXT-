"use client";

import { useCallback } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useAccountabilityApi() {
  const axiosSecure = useAxiosSecure();

  // 1. Management Command Center Overview Metrics
  const getDashboard = useCallback(async () => {
    const res = await axiosSecure.get("/accountability/dashboard");
    return res.data?.data;
  }, [axiosSecure]);

  // 2. Unified "Requires Attention" Queue
  const getAttentionQueue = useCallback(
    async (category = "all", type, source) => {
      const params = {};
      if (category && category !== "all") params.category = category;
      if (type) params.type = type;
      if (source) params.source = source;
      const res = await axiosSecure.get("/accountability/attention-queue", { params });
      return res.data?.data;
    },
    [axiosSecure]
  );

  // 3. Employee Combined Obligations ("My Responsibilities")
  const getMyObligations = useCallback(async () => {
    const res = await axiosSecure.get("/accountability/my-obligations");
    return res.data?.data;
  }, [axiosSecure]);

  // 4. Live Unified Activity Stream
  const getActivityStream = useCallback(
    async (page = 1, limit = 25, type, source) => {
      const params = { page, limit };
      if (type) params.type = type;
      if (source) params.source = source;
      const res = await axiosSecure.get("/accountability/activity-stream", { params });
      return res.data?.data;
    },
    [axiosSecure]
  );

  // 5. Global Polymorphic Search
  const searchAll = useCallback(
    async (q, type, limit = 20) => {
      if (!q || !q.trim()) return { results: [], total: 0 };
      const params = { q: q.trim(), limit };
      if (type) params.type = type;
      const res = await axiosSecure.get("/accountability/search", { params });
      return res.data?.data;
    },
    [axiosSecure]
  );

  // 6. Chronological Audit Timeline for specific communication
  const getTimeline = useCallback(
    async (type, id) => {
      const res = await axiosSecure.get(`/accountability/timeline/${type}/${id}`);
      return res.data?.data;
    },
    [axiosSecure]
  );

  // 7. Multi-Entity Compliance & Accountability Reports
  const getReports = useCallback(
    async (reportType, query = {}) => {
      const res = await axiosSecure.get(`/accountability/reports/${reportType}`, { params: query });
      return res.data?.data;
    },
    [axiosSecure]
  );

  // 8. Trigger manual evaluation of reminders & overdue
  const processReminders = useCallback(async () => {
    const res = await axiosSecure.post("/accountability/reminders/process");
    return res.data;
  }, [axiosSecure]);

  return {
    getDashboard,
    getAttentionQueue,
    getMyObligations,
    getActivityStream,
    searchAll,
    getTimeline,
    getReports,
    processReminders,
  };
}
