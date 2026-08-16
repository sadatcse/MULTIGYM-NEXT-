"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useLatePolicyApi(initialLimit = 10) {
  const axiosSecure = useAxiosSecure();

  const [latePolicies, setLatePolicies] = useState([]);
  const [stats, setStats] = useState({ totalPolicies: 0, activeCount: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const abortRef = useRef(null);

  const fetchLatePolicies = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await axiosSecure.get("/late-policy", {
        params: {
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          limit,
        },
        signal: controller.signal,
      });

      if (res?.data) {
        setLatePolicies(res.data.data || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      console.error("Error fetching late policies:", err);
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [axiosSecure, search, statusFilter, page, limit]);

  useEffect(() => {
    fetchLatePolicies();
  }, [fetchLatePolicies]);

  const createLatePolicy = async (dto) => {
    const res = await axiosSecure.post("/late-policy", dto);
    await fetchLatePolicies();
    return res.data;
  };

  const updateLatePolicy = async (id, dto) => {
    const res = await axiosSecure.patch(`/late-policy/${id}`, dto);
    await fetchLatePolicies();
    return res.data;
  };

  const deleteLatePolicy = async (id) => {
    const res = await axiosSecure.delete(`/late-policy/${id}`);
    await fetchLatePolicies();
    return res.data;
  };

  return {
    latePolicies,
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
    refetch: fetchLatePolicies,
    createLatePolicy,
    updateLatePolicy,
    deleteLatePolicy,
  };
}
