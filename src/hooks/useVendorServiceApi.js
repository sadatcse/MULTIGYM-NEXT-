"use client";

import { useState, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function useVendorServiceApi() {
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);

  const getServiceRecords = useCallback(
    async (vendorId, params = {}) => {
      const res = await axiosSecure.get("/vendor-service", { params: { vendor: vendorId, limit: 100, ...params } });
      return res?.data?.data || [];
    },
    [axiosSecure]
  );

  const createServiceRecord = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.post("/vendor-service/post", payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const updateServiceRecord = useCallback(
    async (id, payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.put(`/vendor-service/update/${id}`, payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const deleteServiceRecord = useCallback(
    async (id) => {
      const res = await axiosSecure.delete(`/vendor-service/delete/${id}`);
      return res.data;
    },
    [axiosSecure]
  );

  const addPayment = useCallback(
    async (serviceId, payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.post(`/vendor-service/payment/${serviceId}`, payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const removePayment = useCallback(
    async (serviceId, paymentId) => {
      const res = await axiosSecure.delete(`/vendor-service/payment/${serviceId}/${paymentId}`);
      return res.data;
    },
    [axiosSecure]
  );

  return { loading, getServiceRecords, createServiceRecord, updateServiceRecord, deleteServiceRecord, addPayment, removePayment };
}
