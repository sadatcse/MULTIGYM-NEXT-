"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useProxyDutyApi(initialLimit = 10) {
  const axiosSecure = useAxiosSecure();

  const [proxyDuties, setProxyDuties] = useState([]);
  const [stats, setStats] = useState({ totalRecords: 0, activeCount: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const abortRef = useRef(null);

  const fetchProxyDuties = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await axiosSecure.get("/proxy-duty", {
        params: {
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          month: monthFilter || undefined,
          page,
          limit,
        },
        signal: controller.signal,
      });

      if (res?.data) {
        setProxyDuties(res.data.data || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      console.error("Error fetching proxy duties:", err);
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [axiosSecure, search, statusFilter, monthFilter, page, limit]);

  useEffect(() => {
    fetchProxyDuties();
  }, [fetchProxyDuties]);

  const createProxyDuty = async (dto) => {
    const res = await axiosSecure.post("/proxy-duty", dto);
    await fetchProxyDuties();
    return res.data;
  };

  const updateProxyDuty = async (id, dto) => {
    const res = await axiosSecure.patch(`/proxy-duty/${id}`, dto);
    await fetchProxyDuties();
    return res.data;
  };

  const deleteProxyDuty = async (id) => {
    const res = await axiosSecure.delete(`/proxy-duty/${id}`);
    await fetchProxyDuties();
    return res.data;
  };

  return {
    proxyDuties,
    stats,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    monthFilter,
    setMonthFilter,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages,
    refetch: fetchProxyDuties,
    createProxyDuty,
    updateProxyDuty,
    deleteProxyDuty,
  };
}
