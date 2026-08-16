"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function useJobPositionApi(initialLimit = 100) {
  const axiosSecure = useAxiosSecure();

  const [jobPositions, setJobPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({
    totalJobPositions: 0,
    activeJobPositions: 0,
    inactiveJobPositions: 0,
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

  const fetchJobPositions = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsFetching(true);
    try {
      const res = await axiosSecure.get("/job-position", {
        params: {
          search,
          status: statusFilter,
          page,
          limit,
        },
        signal: controller.signal,
      });

      if (res?.data?.data) {
        setJobPositions(res.data.data);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        console.error("Failed to fetch job positions:", err);
      }
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  }, [axiosSecure, search, statusFilter, page, limit]);

  useEffect(() => {
    // Data fetching is an intentional effect (https://react.dev/learn/you-might-not-need-an-effect#fetching-data).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobPositions();
  }, [fetchJobPositions]);

  const createJobPosition = async (formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.post("/job-position", formData);
      await fetchJobPositions();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const updateJobPosition = async (id, formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.patch(`/job-position/${id}`, formData);
      await fetchJobPositions();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const deleteJobPosition = async (id) => {
    if (deleteLockRef.current) return;
    deleteLockRef.current = true;
    try {
      const res = await axiosSecure.delete(`/job-position/${id}`);
      await fetchJobPositions();
      return res.data;
    } finally {
      deleteLockRef.current = false;
    }
  };

  return {
    jobPositions,
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
    fetchJobPositions,
    createJobPosition,
    updateJobPosition,
    deleteJobPosition,
  };
}
