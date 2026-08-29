"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

const SEARCH_DEBOUNCE_MS = 400;

export default function useProductCategoryApi(initialLimit = 100) {
  const axiosSecure = useAxiosSecure();

  const [productCategories, setProductCategories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0,
    maxDisplayOrder: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const submitLockRef = useRef(false);
  const deleteLockRef = useRef(false);
  const abortControllerRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const fetchProductCategories = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!hasLoadedOnceRef.current) setLoading(true);
    setIsFetching(true);

    try {
      const res = await axiosSecure.get("/product-category", {
        signal: controller.signal,
        params: {
          page,
          limit,
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });

      if (res?.data) {
        setProductCategories(res.data.data || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
      hasLoadedOnceRef.current = true;
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      console.error("Error fetching product categories:", err);
      setProductCategories([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [axiosSecure, page, limit, search, statusFilter]);

  useEffect(() => {
    fetchProductCategories();
    return () => abortControllerRef.current?.abort();
  }, [fetchProductCategories]);

  const createProductCategory = async (formData) => {
    if (submitLockRef.current) return null;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.post("/product-category", formData);
      await fetchProductCategories();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const updateProductCategory = async (id, formData) => {
    if (submitLockRef.current) return null;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.put(`/product-category/${id}`, formData);
      await fetchProductCategories();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const deleteProductCategory = async (id) => {
    if (deleteLockRef.current) return null;
    deleteLockRef.current = true;
    try {
      const res = await axiosSecure.delete(`/product-category/${id}`);
      await fetchProductCategories();
      return res.data;
    } finally {
      deleteLockRef.current = false;
    }
  };

  return {
    productCategories,
    totalItems,
    totalPages,
    stats,
    loading,
    isFetching,
    searchInput,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    limit,
    setLimit,
    createProductCategory,
    updateProductCategory,
    deleteProductCategory,
    fetchProductCategories,
  };
}
