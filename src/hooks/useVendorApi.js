"use client";

import { useState, useEffect, useCallback } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useVendorApi() {
  const axiosSecure = useAxiosSecure();

  const [vendors, setVendors] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalVendors: 0,
    activeVendors: 0,
    inactiveVendors: 0,
    categoriesInUse: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchVendors = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setIsFetching(true);

      try {
        const params = { page: currentPage, limit: itemsPerPage };
        if (debouncedSearch) params.search = debouncedSearch;
        if (categoryFilter && categoryFilter !== "all") params.category = categoryFilter;
        if (statusFilter && statusFilter !== "all") params.status = statusFilter;

        const res = await axiosSecure.get("/vendor", { params });

        const rawData = res.data.data || [];
        setVendors(rawData);
        setTotalItems(res.data.total || rawData.length);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error("Error fetching vendors:", err);
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [axiosSecure, currentPage, itemsPerPage, debouncedSearch, categoryFilter, statusFilter]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVendors(true);
  }, [fetchVendors]);

  const createVendor = async (formData) => {
    const res = await axiosSecure.post("/vendor/post", formData);
    await fetchVendors(false);
    return res.data;
  };

  const updateVendor = async (id, formData) => {
    const res = await axiosSecure.put(`/vendor/update/${id}`, formData);
    await fetchVendors(false);
    return res.data;
  };

  const deleteVendor = async (id) => {
    const res = await axiosSecure.delete(`/vendor/delete/${id}`);
    await fetchVendors(false);
    return res.data;
  };

  return {
    vendors,
    totalItems,
    totalPages,
    stats,
    loading,
    isFetching,
    searchInput,
    setSearchInput,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
  };
}
