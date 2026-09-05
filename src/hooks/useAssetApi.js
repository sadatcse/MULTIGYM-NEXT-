"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useAssetApi() {
  const axiosSecure = useAxiosSecure();

  const [assets, setAssets] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("all");
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

  const fetchAssets = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setIsFetching(true);

      try {
        const params = { page: currentPage, limit: itemsPerPage };
        if (debouncedSearch) params.search = debouncedSearch;
        if (assetTypeFilter && assetTypeFilter !== "all") params.assetType = assetTypeFilter;
        if (statusFilter && statusFilter !== "all") params.status = statusFilter;

        const res = await axiosSecure.get("/asset", { params });

        const rawData = res.data.data || [];
        setAssets(rawData);
        setTotalItems(res.data.total || rawData.length);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error("Error fetching assets:", err);
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [axiosSecure, currentPage, itemsPerPage, debouncedSearch, assetTypeFilter, statusFilter]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssets(true);
  }, [fetchAssets]);

  const createAsset = useCallback(
    async (formData) => {
      const res = await axiosSecure.post("/asset/post", formData);
      await fetchAssets(false);
      return res.data;
    },
    [axiosSecure, fetchAssets]
  );

  const updateAsset = useCallback(
    async (id, formData) => {
      const res = await axiosSecure.put(`/asset/update/${id}`, formData);
      await fetchAssets(false);
      return res.data;
    },
    [axiosSecure, fetchAssets]
  );

  const deleteAsset = useCallback(
    async (id) => {
      const res = await axiosSecure.delete(`/asset/delete/${id}`);
      await fetchAssets(false);
      return res.data;
    },
    [axiosSecure, fetchAssets]
  );

  const getAssetById = useCallback(
    async (id) => {
      const res = await axiosSecure.get(`/asset/get-id/${id}`);
      return res.data.data;
    },
    [axiosSecure]
  );

  // Memoized so consumers can safely depend on the whole hook object in a
  // useCallback/useEffect dependency array — a plain object literal here
  // would be a new reference every render, and a page whose own data-load
  // effect depends on (say) `getAssetById` from this hook would re-fire
  // forever. Confirmed: this caused a 49-requests-in-6-seconds runaway loop
  // on the Asset Detail page, which also silently reset the Issue Asset
  // modal's form (the parent's `asset` state kept getting a new reference,
  // re-triggering the modal's isOpen-reset effect on every re-render).
  return useMemo(
    () => ({
      assets,
      totalItems,
      totalPages,
      loading,
      isFetching,
      searchInput,
      setSearchInput,
      assetTypeFilter,
      setAssetTypeFilter,
      statusFilter,
      setStatusFilter,
      currentPage,
      setCurrentPage,
      itemsPerPage,
      setItemsPerPage,
      fetchAssets,
      createAsset,
      updateAsset,
      deleteAsset,
      getAssetById,
    }),
    [
      assets,
      totalItems,
      totalPages,
      loading,
      isFetching,
      searchInput,
      assetTypeFilter,
      statusFilter,
      currentPage,
      itemsPerPage,
      fetchAssets,
      createAsset,
      updateAsset,
      deleteAsset,
      getAssetById,
    ]
  );
}
