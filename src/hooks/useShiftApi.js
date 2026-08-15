"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function useShiftApi() {
  const axiosSecure = useAxiosSecure();

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({
    totalShifts: 0,
    activeShifts: 0,
    inactiveShifts: 0,
    maxDisplayOrder: 0,
  });

  const abortControllerRef = useRef(null);
  const submitLockRef = useRef(false);
  const deleteLockRef = useRef(false);

  // 400ms debounce on search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchShifts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsFetching(true);
    try {
      const res = await axiosSecure.get("/shift", {
        params: {
          search,
          status: statusFilter,
          page,
          limit,
        },
        signal: controller.signal,
      });

      if (res?.data?.data) {
        setShifts(res.data.data);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        console.error("Failed to fetch shifts:", err);
      }
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  }, [axiosSecure, search, statusFilter, page, limit]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const createShift = async (formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.post("/shift", formData);
      await fetchShifts();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const updateShift = async (id, formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.patch(`/shift/${id}`, formData);
      await fetchShifts();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const deleteShift = async (id) => {
    if (deleteLockRef.current) return;
    deleteLockRef.current = true;
    try {
      const res = await axiosSecure.delete(`/shift/${id}`);
      await fetchShifts();
      return res.data;
    } finally {
      deleteLockRef.current = false;
    }
  };

  return {
    shifts,
    loading,
    isFetching,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages,
    statusFilter,
    setStatusFilter,
    searchInput,
    setSearchInput,
    stats,
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
  };
}
