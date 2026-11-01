"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAxiosSecure from "./useAxiosSecure";

// HR letter API. `useHrLetterActions` is the plain, stable set of calls
// (no automatic fetching) for detail / create / template / history screens;
// the default `useHrLetterApi` adds the paginated, filtered list + stats
// used by the "All HR Letters" page.

export function useHrLetterActions() {
  const axiosSecure = useAxiosSecure();
  return useMemo(() => {
    const data = (p) => p.then((r) => r.data);
    return {
      getLetterById: (id) => axiosSecure.get(`/hr-letters/${id}`).then((r) => r.data?.data),
      getEmployeeLetters: (employeeId) => axiosSecure.get(`/hr-letters/employee/${employeeId}`).then((r) => r.data?.data || []),
      getNextNumberPreview: (letterType, letterDate) =>
        axiosSecure.get("/hr-letters/next-number", { params: { letterType, letterDate } }).then((r) => r.data?.data?.nextLetterNumber || ""),
      previewLetter: (dto, config) => axiosSecure.post("/hr-letters/preview", dto, config).then((r) => r.data?.data),
      createLetter: (dto) => data(axiosSecure.post("/hr-letters", dto)),
      updateDraft: (id, dto) => data(axiosSecure.put(`/hr-letters/${id}`, dto)),
      issueDraft: (id) => data(axiosSecure.post(`/hr-letters/${id}/issue`)),
      reissueLetter: (id, dto) => data(axiosSecure.post(`/hr-letters/${id}/reissue`, dto)),
      cancelLetter: (id, reason) => data(axiosSecure.post(`/hr-letters/${id}/cancel`, { reason })),
      deleteLetter: (id) => data(axiosSecure.delete(`/hr-letters/${id}`)),
      // Fire-and-forget audit entry (viewed / printed / downloaded).
      logClientAction: (id, action) => axiosSecure.post(`/hr-letters/${id}/audit`, { action }).catch(() => undefined),
      fetchTemplates: () => axiosSecure.get("/hr-letters/templates").then((r) => r.data?.data || []),
      getTemplateForType: (type) => axiosSecure.get(`/hr-letters/templates/${type}`).then((r) => r.data?.data),
      updateTemplate: (id, dto) => data(axiosSecure.put(`/hr-letters/templates/${id}`, dto)),
      resetTemplate: (id) => data(axiosSecure.post(`/hr-letters/templates/${id}/reset`)),
      previewTemplate: (id, dto = {}) => axiosSecure.post(`/hr-letters/templates/${id}/preview`, dto).then((r) => r.data?.data),
      fetchAuditHistory: (params, config) => data(axiosSecure.get("/hr-letters/audit-history", { params, ...config })),
      fetchStats: () => axiosSecure.get("/hr-letters/stats").then((r) => r.data?.data),
      // Employee self-service ("My Letters") — own issued letters only.
      getMyLetters: () => axiosSecure.get("/hr-letters/my").then((r) => r.data?.data || []),
      getMyLetter: (id) => axiosSecure.get(`/hr-letters/my/${id}`).then((r) => r.data?.data),
      logMyAction: (id, action) => axiosSecure.post(`/hr-letters/my/${id}/audit`, { action }).catch(() => undefined),
    };
  }, [axiosSecure]);
}

const EMPTY_STATS = { totalLetters: 0, issuedLetters: 0, activeDrafts: 0, cancelledLetters: 0, thisMonthCount: 0, byType: {} };

export default function useHrLetterApi(initialLimit = 10) {
  const axiosSecure = useAxiosSecure();
  const actions = useHrLetterActions();

  const [letters, setLetters] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");

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
  const abortRef = useRef(null);
  const loadedOnce = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchLetters = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (loadedOnce.current) setIsFetching(true);
    try {
      const params = { page: currentPage, limit: itemsPerPage };
      if (debouncedSearch) params.search = debouncedSearch;
      if (letterTypeFilter !== "all") params.letterType = letterTypeFilter;
      if (branchFilter !== "all") params.branch = branchFilter;
      if (departmentFilter !== "all") params.department = departmentFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;
      const res = await axiosSecure.get("/hr-letters", { params, signal: controller.signal });
      setLetters(res.data?.items || []);
      setTotalItems(res.data?.pagination?.totalItems || 0);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setError("");
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      setError(err?.response?.data?.message || "Could not load HR letters. Check your connection and try again.");
    } finally {
      if (abortRef.current === controller) {
        loadedOnce.current = true;
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [axiosSecure, currentPage, itemsPerPage, debouncedSearch, letterTypeFilter, branchFilter, departmentFilter, statusFilter, startDateFilter, endDateFilter]);

  const fetchStats = useCallback(async () => {
    try {
      setStats({ ...EMPTY_STATS, ...(await actions.fetchStats()) });
    } catch {
      // stats are decorative; the list shows its own error
    }
  }, [actions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLetters();
    return () => abortRef.current?.abort();
  }, [fetchLetters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  // Mutations refresh the list and stats afterwards.
  const refresh = useCallback(() => Promise.all([fetchLetters(), fetchStats()]), [fetchLetters, fetchStats]);
  const withRefresh = useCallback(
    (fn) =>
      async (...args) => {
        const res = await fn(...args);
        refresh();
        return res;
      },
    [refresh],
  );

  const resetFilters = () => {
    setSearchInput("");
    setLetterTypeFilter("all");
    setBranchFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setStartDateFilter("");
    setEndDateFilter("");
    setCurrentPage(1);
  };

  return {
    ...actions,
    letters,
    totalItems,
    totalPages,
    stats,
    loading,
    isFetching,
    error,
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
    resetFilters,
    fetchLetters,
    fetchStats,
    refresh,
    createLetter: withRefresh(actions.createLetter),
    issueDraft: withRefresh(actions.issueDraft),
    reissueLetter: withRefresh(actions.reissueLetter),
    cancelLetter: withRefresh(actions.cancelLetter),
    deleteLetter: withRefresh(actions.deleteLetter),
  };
}
