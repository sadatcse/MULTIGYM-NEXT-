"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

const SEARCH_DEBOUNCE_MS = 400;

export default function useBranchApi(initialLimit = 100) {
  const axiosSecure = useAxiosSecure();

  const [branches, setBranches] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalBranches: 0,
    activeBranches: 0,
    inactiveBranches: 0,
    maxDisplayOrder: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);

  const submitLockRef = useRef(false);
  const deleteLockRef = useRef(false);
  const abortControllerRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);

  // Debounce free-text search input
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Fetch live paginated branches & stats from backend MongoDB API
  const fetchBranches = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!hasLoadedOnceRef.current) setLoading(true);
    setIsFetching(true);

    try {
      const res = await axiosSecure.get("/branch", {
        signal: controller.signal,
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });

      if (res?.data) {
        setBranches(res.data.data || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
      hasLoadedOnceRef.current = true;
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      console.error("Error fetching live branches:", err);
      setBranches([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [axiosSecure, currentPage, itemsPerPage, search, statusFilter]);

  useEffect(() => {
    // Data fetching is an intentional effect; the abort-on-cleanup below is what
    // actually protects against races, not deferring this call.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBranches();
    return () => abortControllerRef.current?.abort();
  }, [fetchBranches]);

  // Create Branch
  const createBranch = async (formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.post("/branch", formData);
      await fetchBranches();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  // Update Branch
  const updateBranch = async (id, formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.patch(`/branch/${id}`, formData);
      await fetchBranches();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  // Delete Branch
  const deleteBranch = async (id) => {
    if (deleteLockRef.current) return;
    deleteLockRef.current = true;
    try {
      const res = await axiosSecure.delete(`/branch/${id}`);
      await fetchBranches();
      return res.data;
    } finally {
      deleteLockRef.current = false;
    }
  };

  return {
    branches,
    totalItems,
    totalPages,
    stats,
    loading,
    isFetching,
    searchInput,
    setSearchInput,
    search,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
  };
}
