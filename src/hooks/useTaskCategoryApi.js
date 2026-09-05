"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

const SEARCH_DEBOUNCE_MS = 300;

export default function useTaskCategoryApi(initialLimit = 100) {
  const axiosSecure = useAxiosSecure();

  const [rawCategories, setRawCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const submitLockRef = useRef(false);
  const deleteLockRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput.trim().toLowerCase());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchTaskCategories = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsFetching(true);
    try {
      const res = await axiosSecure.get("/task/categories", {
        signal: controller.signal,
      });

      const list = res?.data?.data || [];
      const normalized = (Array.isArray(list) ? list : []).map((cat) => ({
        ...cat,
        title: cat.title || cat.name || "",
        name: cat.name || cat.title || "",
        order: Number(cat.order) || 1,
        status: cat.status || "active",
      }));

      // Sort by order ascending, then name
      normalized.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
      setRawCategories(normalized);
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        console.error("Failed to fetch task categories:", err);
      }
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchTaskCategories();
  }, [fetchTaskCategories]);

  // Overall Statistics calculated from the full list
  const stats = useMemo(() => {
    const totalCategories = rawCategories.length;
    const activeCategories = rawCategories.filter((c) => c.status === "active").length;
    const inactiveCategories = rawCategories.filter((c) => c.status === "inactive").length;
    const maxDisplayOrder = rawCategories.reduce(
      (max, c) => Math.max(max, Number(c.order) || 0),
      0
    );

    return {
      totalCategories,
      activeCategories,
      inactiveCategories,
      maxDisplayOrder,
    };
  }, [rawCategories]);

  // Filtered list based on search and status
  const filteredCategories = useMemo(() => {
    return rawCategories.filter((c) => {
      const matchesSearch =
        !search ||
        (c.name && c.name.toLowerCase().includes(search)) ||
        (c.title && c.title.toLowerCase().includes(search)) ||
        (c.description && c.description.toLowerCase().includes(search));

      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rawCategories, search, statusFilter]);

  // Paginated slice
  const totalItems = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / (limit || 10)));
  const paginatedCategories = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredCategories.slice(startIndex, startIndex + limit);
  }, [filteredCategories, page, limit]);

  const createTaskCategory = async (formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const payload = {
        name: (formData.title || formData.name || "").trim(),
        description: (formData.description || "").trim(),
        order: Number(formData.order) || 1,
        status: formData.status || "active",
      };
      const res = await axiosSecure.post("/task/categories", payload);
      await fetchTaskCategories();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const updateTaskCategory = async (id, formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const payload = {
        name: (formData.title || formData.name || "").trim(),
        description: (formData.description || "").trim(),
        order: Number(formData.order) || 1,
        status: formData.status || "active",
      };
      const res = await axiosSecure.put(`/task/categories/${id}`, payload);
      await fetchTaskCategories();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  const deleteTaskCategory = async (id) => {
    if (deleteLockRef.current) return;
    deleteLockRef.current = true;
    try {
      const res = await axiosSecure.delete(`/task/categories/${id}`);
      await fetchTaskCategories();
      return res.data;
    } finally {
      deleteLockRef.current = false;
    }
  };

  return {
    taskCategories: paginatedCategories,
    allCategories: rawCategories,
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
    fetchTaskCategories,
    createTaskCategory,
    updateTaskCategory,
    deleteTaskCategory,
  };
}
