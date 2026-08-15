"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

const SEARCH_DEBOUNCE_MS = 400;

export default function useDepartmentApi() {
  const axiosSecure = useAxiosSecure();

  const [departments, setDepartments] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalDepartments: 0,
    activeDepartments: 0,
    inactiveDepartments: 0,
    maxDisplayOrder: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  // Fetch live paginated departments & stats from backend MongoDB API
  const fetchDepartments = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!hasLoadedOnceRef.current) setLoading(true);
    setIsFetching(true);

    try {
      const res = await axiosSecure.get("/department", {
        signal: controller.signal,
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });

      if (res?.data) {
        setDepartments(res.data.data || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
      hasLoadedOnceRef.current = true;
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      console.error("Error fetching live departments:", err);
      setDepartments([]);
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
    fetchDepartments();
    return () => abortControllerRef.current?.abort();
  }, [fetchDepartments]);

  // Create Department
  const createDepartment = async (formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.post("/department", formData);
      await fetchDepartments();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  // Update Department
  const updateDepartment = async (id, formData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      const res = await axiosSecure.patch(`/department/${id}`, formData);
      await fetchDepartments();
      return res.data;
    } finally {
      submitLockRef.current = false;
    }
  };

  // Delete Department
  const deleteDepartment = async (id) => {
    if (deleteLockRef.current) return;
    deleteLockRef.current = true;
    try {
      const res = await axiosSecure.delete(`/department/${id}`);
      await fetchDepartments();
      return res.data;
    } finally {
      deleteLockRef.current = false;
    }
  };

  return {
    departments,
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
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
