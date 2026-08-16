"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useWorkScheduleApi(initialLimit = 10) {
  const axiosSecure = useAxiosSecure();

  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState({ totalSchedules: 0, activeCount: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const abortRef = useRef(null);

  const fetchSchedules = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await axiosSecure.get("/work-schedule", {
        params: {
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          limit,
        },
        signal: controller.signal,
      });

      if (res?.data) {
        setSchedules(res.data.data || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      console.error("Error fetching work schedules:", err);
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [axiosSecure, search, statusFilter, page, limit]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const createSchedule = async (dto) => {
    const res = await axiosSecure.post("/work-schedule", dto);
    await fetchSchedules();
    return res.data;
  };

  const updateSchedule = async (id, dto) => {
    const res = await axiosSecure.patch(`/work-schedule/${id}`, dto);
    await fetchSchedules();
    return res.data;
  };

  const deleteSchedule = async (id) => {
    const res = await axiosSecure.delete(`/work-schedule/${id}`);
    await fetchSchedules();
    return res.data;
  };

  return {
    schedules,
    stats,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages,
    refetch: fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
}
