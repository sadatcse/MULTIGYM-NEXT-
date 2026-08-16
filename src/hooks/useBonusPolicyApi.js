"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useBonusPolicyApi(initialLimit = 10) {
  const axiosSecure = useAxiosSecure();

  const [bonusPolicies, setBonusPolicies] = useState([]);
  const [stats, setStats] = useState({ totalPolicies: 0, activeCount: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const abortRef = useRef(null);

  const fetchBonusPolicies = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await axiosSecure.get("/bonus-policy", {
        params: {
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          limit,
        },
        signal: controller.signal,
      });

      if (res?.data) {
        setBonusPolicies(res.data.data || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      console.error("Error fetching bonus policies:", err);
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [axiosSecure, search, statusFilter, page, limit]);

  useEffect(() => {
    fetchBonusPolicies();
  }, [fetchBonusPolicies]);

  const createBonusPolicy = async (dto) => {
    const res = await axiosSecure.post("/bonus-policy", dto);
    await fetchBonusPolicies();
    return res.data;
  };

  const updateBonusPolicy = async (id, dto) => {
    const res = await axiosSecure.patch(`/bonus-policy/${id}`, dto);
    await fetchBonusPolicies();
    return res.data;
  };

  const deleteBonusPolicy = async (id) => {
    const res = await axiosSecure.delete(`/bonus-policy/${id}`);
    await fetchBonusPolicies();
    return res.data;
  };

  return {
    bonusPolicies,
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
    refetch: fetchBonusPolicies,
    createBonusPolicy,
    updateBonusPolicy,
    deleteBonusPolicy,
  };
}
