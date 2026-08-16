"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useOvertimeApi(initialLimit = 10) {
  const axiosSecure = useAxiosSecure();

  const [policies, setPolicies] = useState([]);
  const [records, setRecords] = useState([]);
  const [policyStats, setPolicyStats] = useState({ totalPolicies: 0, activeCount: 0 });
  const [recordStats, setRecordStats] = useState({ totalRecords: 0, approvedCount: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await axiosSecure.get("/overtime/policy", {
        params: { search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined },
      });
      if (res?.data) {
        setPolicies(res.data.data || []);
        if (res.data.stats) setPolicyStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error fetching overtime policies:", err);
    }
  }, [axiosSecure, search, statusFilter]);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await axiosSecure.get("/overtime/record", {
        params: { search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined, page, limit },
      });
      if (res?.data) {
        setRecords(res.data.data || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) setRecordStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error fetching overtime records:", err);
    }
  }, [axiosSecure, search, statusFilter, page, limit]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPolicies(), fetchRecords()]);
    setLoading(false);
  }, [fetchPolicies, fetchRecords]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Policy CRUD
  const createPolicy = async (dto) => {
    const res = await axiosSecure.post("/overtime/policy", dto);
    await fetchPolicies();
    return res.data;
  };
  const updatePolicy = async (id, dto) => {
    const res = await axiosSecure.patch(`/overtime/policy/${id}`, dto);
    await fetchPolicies();
    return res.data;
  };
  const deletePolicy = async (id) => {
    const res = await axiosSecure.delete(`/overtime/policy/${id}`);
    await fetchPolicies();
    return res.data;
  };

  // Record CRUD
  const createRecord = async (dto) => {
    const res = await axiosSecure.post("/overtime/record", dto);
    await fetchRecords();
    return res.data;
  };
  const updateRecord = async (id, dto) => {
    const res = await axiosSecure.patch(`/overtime/record/${id}`, dto);
    await fetchRecords();
    return res.data;
  };
  const deleteRecord = async (id) => {
    const res = await axiosSecure.delete(`/overtime/record/${id}`);
    await fetchRecords();
    return res.data;
  };

  return {
    policies,
    records,
    policyStats,
    recordStats,
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
    refetch: refreshAll,
    createPolicy,
    updatePolicy,
    deletePolicy,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
