"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function useAssetTypeApi(initialLimit = 100) {
  const axiosSecure = useAxiosSecure();

  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({
    totalAssetTypes: 0,
    activeAssetTypes: 0,
    inactiveAssetTypes: 0,
    maxDisplayOrder: 0,
  });

  const abortControllerRef = useRef(null);
  const submitLockRef = useRef(false);
  const deleteLockRef = useRef(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchAssetTypes = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsFetching(true);
    try {
      const res = await axiosSecure.get("/asset-type", {
        params: { search, status: statusFilter, category: categoryFilter, page, limit },
        signal: controller.signal,
      });

      if (res?.data?.data) {
        setAssetTypes(res.data.data);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        console.error("Failed to fetch asset types:", err);
      }
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  }, [axiosSecure, search, statusFilter, categoryFilter, page, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssetTypes();
  }, [fetchAssetTypes]);

  const createAssetType = async (formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.post("/asset-type", formData);
      await fetchAssetTypes();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const updateAssetType = async (id, formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.patch(`/asset-type/${id}`, formData);
      await fetchAssetTypes();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const deleteAssetType = async (id) => {
    if (deleteLockRef.current) return;
    deleteLockRef.current = true;
    try {
      const res = await axiosSecure.delete(`/asset-type/${id}`);
      await fetchAssetTypes();
      return res.data;
    } finally {
      deleteLockRef.current = false;
    }
  };

  return {
    assetTypes,
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
    categoryFilter,
    setCategoryFilter,
    searchInput,
    setSearchInput,
    stats,
    fetchAssetTypes,
    createAssetType,
    updateAssetType,
    deleteAssetType,
  };
}
