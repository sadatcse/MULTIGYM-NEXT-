"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useLeaveTypeApi(initialLimit = 10) {
  const axiosSecure = useAxiosSecure();

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [stats, setStats] = useState({ totalLeaveTypes: 0, activeCount: 0, paidCount: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const abortRef = useRef(null);

  const fetchLeaveTypes = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await axiosSecure.get("/leave-type", {
        params: {
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          limit,
        },
        signal: controller.signal,
      });

      if (res?.data) {
        setLeaveTypes(res.data.data || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      console.error("Error fetching leave types:", err);
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [axiosSecure, search, statusFilter, page, limit]);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  const createLeaveType = async (dto) => {
    const res = await axiosSecure.post("/leave-type", dto);
    await fetchLeaveTypes();
    return res.data;
  };

  const updateLeaveType = async (id, dto) => {
    const res = await axiosSecure.patch(`/leave-type/${id}`, dto);
    await fetchLeaveTypes();
    return res.data;
  };

  const deleteLeaveType = async (id) => {
    const res = await axiosSecure.delete(`/leave-type/${id}`);
    await fetchLeaveTypes();
    return res.data;
  };

  return {
    leaveTypes,
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
    refetch: fetchLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
  };
}
