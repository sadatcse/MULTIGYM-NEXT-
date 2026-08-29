"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function useVendorCategoryApi(initialLimit = 100) {
  const axiosSecure = useAxiosSecure();

  const [vendorCategories, setVendorCategories] = useState([]);
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
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0,
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

  const fetchVendorCategories = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsFetching(true);
    try {
      const res = await axiosSecure.get("/vendor-category", {
        params: { search, status: statusFilter, page, limit },
        signal: controller.signal,
      });

      if (res?.data?.data) {
        setVendorCategories(res.data.data);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        console.error("Failed to fetch vendor categories:", err);
      }
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  }, [axiosSecure, search, statusFilter, page, limit]);

  useEffect(() => {
    // Data fetching is an intentional effect (https://react.dev/learn/you-might-not-need-an-effect#fetching-data).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVendorCategories();
  }, [fetchVendorCategories]);

  const createVendorCategory = async (formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.post("/vendor-category", formData);
      await fetchVendorCategories();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const updateVendorCategory = async (id, formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.patch(`/vendor-category/${id}`, formData);
      await fetchVendorCategories();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const deleteVendorCategory = async (id) => {
    if (deleteLockRef.current) return;
    deleteLockRef.current = true;
    try {
      const res = await axiosSecure.delete(`/vendor-category/${id}`);
      await fetchVendorCategories();
      return res.data;
    } finally {
      deleteLockRef.current = false;
    }
  };

  return {
    vendorCategories,
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
    fetchVendorCategories,
    createVendorCategory,
    updateVendorCategory,
    deleteVendorCategory,
  };
}
