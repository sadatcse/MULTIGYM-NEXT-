"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useAdvancePolicyApi(initialLimit = 10) {
  const axiosSecure = useAxiosSecure();

  const [advancePolicies, setAdvancePolicies] = useState([]);
  const [stats, setStats] = useState({ totalPolicies: 0, activeCount: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const abortRef = useRef(null);

  const fetchAdvancePolicies = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await axiosSecure.get("/advance-policy", {
        params: {
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          limit,
        },
        signal: controller.signal,
      });

      if (res?.data) {
        setAdvancePolicies(res.data.data || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      console.error("Error fetching advance policies:", err);
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [axiosSecure, search, statusFilter, page, limit]);

  useEffect(() => {
    fetchAdvancePolicies();
  }, [fetchAdvancePolicies]);

  const createAdvancePolicy = async (dto) => {
    const res = await axiosSecure.post("/advance-policy", dto);
    await fetchAdvancePolicies();
    return res.data;
  };

  const updateAdvancePolicy = async (id, dto) => {
    const res = await axiosSecure.patch(`/advance-policy/${id}`, dto);
    await fetchAdvancePolicies();
    return res.data;
  };

  const deleteAdvancePolicy = async (id) => {
    const res = await axiosSecure.delete(`/advance-policy/${id}`);
    await fetchAdvancePolicies();
    return res.data;
  };

  return {
    advancePolicies,
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
    refetch: fetchAdvancePolicies,
    createAdvancePolicy,
    updateAdvancePolicy,
    deleteAdvancePolicy,
  };
}
