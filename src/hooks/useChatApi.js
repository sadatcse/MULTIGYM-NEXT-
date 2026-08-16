"use client";

import { useCallback, useContext } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import { AuthContext } from "@/providers/AuthProvider";

export default function useChatApi() {
  const axiosSecure = useAxiosSecure();
  const { employee, user } = useContext(AuthContext);
  const currentEmployeeId = (employee || user)?._id;

  // All employees except the current one, used to populate the contact list
  // alongside existing conversations. Reuses the existing employee directory
  // endpoint instead of duplicating employee-listing logic.
  const getContacts = useCallback(async () => {
    const res = await axiosSecure.get("/employee", { params: { limit: 1000 } });
    const all = res?.data?.data || [];
    return all.filter((emp) => emp._id !== currentEmployeeId);
  }, [axiosSecure, currentEmployeeId]);

  const getConversations = useCallback(async () => {
    const res = await axiosSecure.get("/chat/conversations");
    return res?.data?.data || [];
  }, [axiosSecure]);

  const getMessages = useCallback(
    async (partnerId, page = 1, limit = 30) => {
      const res = await axiosSecure.get(`/chat/messages/${partnerId}`, { params: { page, limit } });
      return {
        data: res?.data?.data || [],
        totalItems: res?.data?.totalItems || 0,
        totalPages: res?.data?.totalPages || 1,
        currentPage: res?.data?.currentPage || 1,
      };
    },
    [axiosSecure]
  );

  const markSeenRest = useCallback(
    async (partnerId) => {
      const res = await axiosSecure.put(`/chat/messages/seen/${partnerId}`);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  return { getContacts, getConversations, getMessages, markSeenRest };
}
