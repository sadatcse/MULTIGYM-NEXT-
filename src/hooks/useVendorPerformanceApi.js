"use client";

import { useState, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function useVendorPerformanceApi() {
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);

  const getReviews = useCallback(
    async (vendorId, params = {}) => {
      const res = await axiosSecure.get("/vendor-performance", { params: { vendor: vendorId, limit: 100, ...params } });
      return res?.data?.data || [];
    },
    [axiosSecure]
  );

  const createReview = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.post("/vendor-performance/post", payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const updateReview = useCallback(
    async (id, payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.put(`/vendor-performance/update/${id}`, payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const deleteReview = useCallback(
    async (id) => {
      const res = await axiosSecure.delete(`/vendor-performance/delete/${id}`);
      return res.data;
    },
    [axiosSecure]
  );

  return { loading, getReviews, createReview, updateReview, deleteReview };
}
