"use client";

import { useState, useEffect, useCallback } from "react";
import useAxiosSecure from "./useAxiosSecure";
import { toast } from "react-toastify";

export default function useManagementPersonApi(initialLimit = 10) {
  const axiosSecure = useAxiosSecure();

  const [managementPersons, setManagementPersons] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    assignedEmployeesCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Filter & Pagination state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch paginated management persons
  const fetchManagementPersons = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setIsFetching(true);

      try {
        const params = {
          page,
          limit,
        };

        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter && statusFilter !== "all") params.status = statusFilter;

        const res = await axiosSecure.get("/management-person", { params });

        if (res?.data?.success) {
          setManagementPersons(res.data.data || []);
          setTotalItems(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
          if (res.data.stats) setStats(res.data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch management persons:", err);
        toast.error(err?.response?.data?.message || "Failed to load management persons");
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [axiosSecure, page, limit, debouncedSearch, statusFilter]
  );

  // Trigger fetch on parameter change
  useEffect(() => {
    fetchManagementPersons(false);
  }, [fetchManagementPersons]);

  // Fetch all active management persons (for dropdown selectors)
  const getActiveManagementPersons = useCallback(async () => {
    try {
      const res = await axiosSecure.get("/management-person/active");
      if (res?.data?.success) {
        return res.data.data || [];
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch active management persons:", err);
      return [];
    }
  }, [axiosSecure]);

  // Create management person
  const createManagementPerson = async (data) => {
    try {
      const res = await axiosSecure.post("/management-person", data);
      if (res?.data?.success) {
        toast.success(res.data.message || "Management authority created successfully");
        await fetchManagementPersons();
        return { success: true, data: res.data.data };
      }
      return { success: false };
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to create management authority";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Update management person
  const updateManagementPerson = async (id, data) => {
    try {
      const res = await axiosSecure.patch(`/management-person/${id}`, data);
      if (res?.data?.success) {
        toast.success(res.data.message || "Management authority updated successfully");
        await fetchManagementPersons();
        return { success: true, data: res.data.data };
      }
      return { success: false };
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update management authority";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Delete management person
  const deleteManagementPerson = async (id) => {
    try {
      const res = await axiosSecure.delete(`/management-person/${id}`);
      if (res?.data?.success) {
        toast.success(res.data.message || "Management authority deleted successfully");
        await fetchManagementPersons();
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete management authority";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  return {
    managementPersons,
    totalItems,
    totalPages,
    stats,
    loading,
    isFetching,
    page,
    setPage,
    limit,
    setLimit,
    searchInput,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    fetchManagementPersons,
    getActiveManagementPersons,
    createManagementPerson,
    updateManagementPerson,
    deleteManagementPerson,
  };
}
