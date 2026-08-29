"use client";

import { useState, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function useVendorContractApi() {
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);

  const getContracts = useCallback(
    async (vendorId, params = {}) => {
      const res = await axiosSecure.get("/vendor-contract", { params: { vendor: vendorId, limit: 100, ...params } });
      return res?.data?.data || [];
    },
    [axiosSecure]
  );

  const createContract = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.post("/vendor-contract/post", payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const updateContract = useCallback(
    async (id, payload) => {
      setLoading(true);
      try {
        const res = await axiosSecure.put(`/vendor-contract/update/${id}`, payload);
        return res.data;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const deleteContract = useCallback(
    async (id) => {
      const res = await axiosSecure.delete(`/vendor-contract/delete/${id}`);
      return res.data;
    },
    [axiosSecure]
  );

  return { loading, getContracts, createContract, updateContract, deleteContract };
}
