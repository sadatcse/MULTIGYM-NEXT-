"use client";

import { useState, useCallback } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useAssetReportApi() {
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getEmployeeAssetReport = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosSecure.get("/asset-assignment/employee-report", { params });
        return res.data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  const getAssetTransactions = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosSecure.get("/asset-transaction", { params });
        return res.data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  return {
    loading,
    error,
    getEmployeeAssetReport,
    getAssetTransactions,
  };
}
