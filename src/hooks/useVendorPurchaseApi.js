"use client";

import { useState, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function useVendorPurchaseApi() {
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);

  const getPurchases = useCallback(
    async (vendorId, params = {}) => {
      const res = await axiosSecure.get("/vendor-purchase", { params: { vendor: vendorId, limit: 100, ...params } });
      return res?.data?.data || [];
    },
    [axiosSecure]
  );

  const createPurchase = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.post("/vendor-purchase/post", payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const updatePurchase = useCallback(
    async (id, payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.put(`/vendor-purchase/update/${id}`, payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const deletePurchase = useCallback(
    async (id) => {
      const res = await axiosSecure.delete(`/vendor-purchase/delete/${id}`);
      return res.data;
    },
    [axiosSecure]
  );

  const addPayment = useCallback(
    async (purchaseId, payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.post(`/vendor-purchase/payment/${purchaseId}`, payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const removePayment = useCallback(
    async (purchaseId, paymentId) => {
      const res = await axiosSecure.delete(`/vendor-purchase/payment/${purchaseId}/${paymentId}`);
      return res.data;
    },
    [axiosSecure]
  );

  return { loading, getPurchases, createPurchase, updatePurchase, deletePurchase, addPayment, removePayment };
}
