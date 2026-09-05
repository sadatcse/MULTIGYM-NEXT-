"use client";

import { useCallback, useMemo } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useMaintenanceApi() {
  const axiosSecure = useAxiosSecure();

  const createRequest = useCallback(
    async (payload) => {
      const res = await axiosSecure.post("/maintenance", payload);
      return res?.data;
    },
    [axiosSecure]
  );

  const getMyRequests = useCallback(
    async (params = {}) => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      );
      const query = new URLSearchParams(cleanParams).toString();
      const res = await axiosSecure.get(`/maintenance/my-requests?${query}`);
      return res?.data?.data || { requests: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    },
    [axiosSecure]
  );

  const getAllRequests = useCallback(
    async (params = {}) => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      );
      const query = new URLSearchParams(cleanParams).toString();
      const res = await axiosSecure.get(`/maintenance?${query}`);
      return res?.data?.data || { requests: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    },
    [axiosSecure]
  );

  const getRequestById = useCallback(
    async (id) => {
      const res = await axiosSecure.get(`/maintenance/${id}`);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  const markUnderReview = useCallback(
    async (id) => {
      const res = await axiosSecure.put(`/maintenance/${id}/review`);
      return res?.data;
    },
    [axiosSecure]
  );

  const assignRequest = useCallback(
    async (id, payload) => {
      const res = await axiosSecure.put(`/maintenance/${id}/assign`, payload);
      return res?.data;
    },
    [axiosSecure]
  );

  const addWorkUpdate = useCallback(
    async (id, payload) => {
      const res = await axiosSecure.post(`/maintenance/${id}/work-update`, payload);
      return res?.data;
    },
    [axiosSecure]
  );

  const completeRequest = useCallback(
    async (id, payload) => {
      const res = await axiosSecure.put(`/maintenance/${id}/complete`, payload);
      return res?.data;
    },
    [axiosSecure]
  );

  const rejectRequest = useCallback(
    async (id, payload) => {
      const res = await axiosSecure.put(`/maintenance/${id}/reject`, payload);
      return res?.data;
    },
    [axiosSecure]
  );

  const cancelRequest = useCallback(
    async (id, payload) => {
      const res = await axiosSecure.put(`/maintenance/${id}/cancel`, payload);
      return res?.data;
    },
    [axiosSecure]
  );

  const getDashboardStats = useCallback(async () => {
    const res = await axiosSecure.get("/maintenance/dashboard");
    return res?.data?.data;
  }, [axiosSecure]);

  const getReports = useCallback(
    async (type, params = {}) => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      );
      const query = new URLSearchParams(cleanParams).toString();
      const res = await axiosSecure.get(`/maintenance/reports/${type}?${query}`);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  return useMemo(
    () => ({
      createRequest,
      getMyRequests,
      getAllRequests,
      getRequestById,
      markUnderReview,
      assignRequest,
      addWorkUpdate,
      completeRequest,
      rejectRequest,
      cancelRequest,
      getDashboardStats,
      getReports,
    }),
    [
      createRequest,
      getMyRequests,
      getAllRequests,
      getRequestById,
      markUnderReview,
      assignRequest,
      addWorkUpdate,
      completeRequest,
      rejectRequest,
      cancelRequest,
      getDashboardStats,
      getReports,
    ]
  );
}
