"use client";

import { useState, useEffect, useCallback } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useHrLetterApi(initialLimit = 10) {
  const axiosSecure = useAxiosSecure();

  const [letters, setLetters] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalLetters: 0,
    activeDrafts: 0,
    issuedLetters: 0,
    thisMonthCount: 0,
    byType: {},
  });

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Filters State
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [letterTypeFilter, setLetterTypeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Letters List
  const fetchLetters = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setIsFetching(true);

      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
        };

        if (debouncedSearch) params.search = debouncedSearch;
        if (letterTypeFilter && letterTypeFilter !== "all") params.letterType = letterTypeFilter;
        if (branchFilter && branchFilter !== "all") params.branch = branchFilter;
        if (departmentFilter && departmentFilter !== "all") params.department = departmentFilter;
        if (statusFilter && statusFilter !== "all") params.status = statusFilter;
        if (startDateFilter) params.startDate = startDateFilter;
        if (endDateFilter) params.endDate = endDateFilter;

        const res = await axiosSecure.get("/hr-letters", { params });
        if (res?.data?.success) {
          setLetters(res.data.items || []);
          setTotalItems(res.data.pagination?.totalItems || 0);
          setTotalPages(res.data.pagination?.totalPages || 1);
        }
      } catch (err) {
        console.error("Failed to fetch HR letters:", err);
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [
      axiosSecure,
      currentPage,
      itemsPerPage,
      debouncedSearch,
      letterTypeFilter,
      branchFilter,
      departmentFilter,
      statusFilter,
      startDateFilter,
      endDateFilter,
    ]
  );

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosSecure.get("/hr-letters/stats");
      if (res?.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch HR letter stats:", err);
    }
  }, [axiosSecure]);

  // Initial trigger
  useEffect(() => {
    fetchLetters(true);
  }, [fetchLetters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Single Letter
  const getLetterById = async (id) => {
    const res = await axiosSecure.get(`/hr-letters/${id}`);
    return res.data?.data;
  };

  // Employee Letters
  const getEmployeeLetters = async (employeeId) => {
    const res = await axiosSecure.get(`/hr-letters/employee/${employeeId}`);
    return res.data?.data || [];
  };

  // Next Letter Number Preview
  const getNextNumberPreview = async (letterType) => {
    const res = await axiosSecure.get(`/hr-letters/next-number?letterType=${letterType}`);
    return res.data?.data?.nextLetterNumber || "";
  };

  // Create
  const createLetter = async (dto) => {
    const res = await axiosSecure.post("/hr-letters", dto);
    await fetchLetters();
    await fetchStats();
    return res.data;
  };

  // Reissue
  const reissueLetter = async (id, dto) => {
    const res = await axiosSecure.post(`/hr-letters/${id}/reissue`, dto);
    await fetchLetters();
    await fetchStats();
    return res.data;
  };

  // Delete
  const deleteLetter = async (id) => {
    const res = await axiosSecure.delete(`/hr-letters/${id}`);
    await fetchLetters();
    await fetchStats();
    return res.data;
  };

  // Client Audit Action (view, print, download)
  const logClientAction = async (id, action) => {
    try {
      await axiosSecure.post(`/hr-letters/${id}/audit`, { action });
    } catch (err) {
      // Non-blocking
    }
  };

  // Templates
  const fetchTemplates = async () => {
    const res = await axiosSecure.get("/hr-letters/templates");
    return res.data?.data || [];
  };

  const getTemplateForType = async (type) => {
    const res = await axiosSecure.get(`/hr-letters/templates/${type}`);
    return res.data?.data;
  };

  const updateTemplate = async (id, data) => {
    const res = await axiosSecure.put(`/hr-letters/templates/${id}`, data);
    return res.data;
  };

  // Audit Logs
  const fetchAuditHistory = async (page = 1, limit = 20, search = "") => {
    const res = await axiosSecure.get("/hr-letters/audit-history", {
      params: { page, limit, search },
    });
    return res.data;
  };

  return {
    letters,
    totalItems,
    totalPages,
    stats,
    loading,
    isFetching,
    // Filters
    searchInput,
    setSearchInput,
    letterTypeFilter,
    setLetterTypeFilter,
    branchFilter,
    setBranchFilter,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    // Methods
    fetchLetters,
    fetchStats,
    getLetterById,
    getEmployeeLetters,
    getNextNumberPreview,
    createLetter,
    reissueLetter,
    deleteLetter,
    logClientAction,
    fetchTemplates,
    getTemplateForType,
    updateTemplate,
    fetchAuditHistory,
  };
}
