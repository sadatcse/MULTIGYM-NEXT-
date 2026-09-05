"use client";

import { useCallback } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useNoticeApi() {
  const axiosSecure = useAxiosSecure();

  // Employee: Get My Targeted Notices
  const getMyNotices = useCallback(async () => {
    const res = await axiosSecure.get("/notice/my-notices");
    return res?.data?.data || { notices: [], stats: { total: 0, unread: 0, pendingAck: 0 } };
  }, [axiosSecure]);

  // Employee: Record Automatic Seen Event
  const recordSeen = useCallback(
    async (noticeId) => {
      const res = await axiosSecure.post(`/notice/${noticeId}/seen`);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  // Employee: Record Acknowledgement Event
  const recordAcknowledgement = useCallback(
    async (noticeId) => {
      const res = await axiosSecure.post(`/notice/${noticeId}/acknowledge`);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  // Admin: Get Dashboard Stats & Activity
  const getAdminDashboard = useCallback(async () => {
    const res = await axiosSecure.get("/notice/admin/dashboard");
    return res?.data?.data;
  }, [axiosSecure]);

  // Admin: Get Notice List
  const getAllNoticesAdmin = useCallback(
    async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await axiosSecure.get(`/notice/admin/list?${query}`);
      return res?.data?.data || [];
    },
    [axiosSecure]
  );

  // Admin: Create Notice
  const createNotice = useCallback(
    async (noticeData) => {
      const res = await axiosSecure.post("/notice/admin/create", noticeData);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  // Admin: Update Notice
  const updateNotice = useCallback(
    async (noticeId, noticeData) => {
      const res = await axiosSecure.put(`/notice/admin/${noticeId}`, noticeData);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  // Admin: Publish Notice
  const publishNotice = useCallback(
    async (noticeId) => {
      const res = await axiosSecure.post(`/notice/admin/${noticeId}/publish`);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  // Admin: Notice Monitoring Details & Recipient Matrix
  const getNoticeMonitoring = useCallback(
    async (noticeId, search = "", status = "") => {
      const res = await axiosSecure.get(
        `/notice/admin/${noticeId}/monitor?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`
      );
      return res?.data?.data;
    },
    [axiosSecure]
  );

  // Admin: Send Reminder Notifications
  const sendReminder = useCallback(
    async (noticeId) => {
      const res = await axiosSecure.post(`/notice/admin/${noticeId}/reminder`);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  // Admin: Delete Notice
  const deleteNotice = useCallback(
    async (noticeId) => {
      const res = await axiosSecure.delete(`/notice/admin/${noticeId}`);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  return {
    getMyNotices,
    recordSeen,
    recordAcknowledgement,
    getAdminDashboard,
    getAllNoticesAdmin,
    createNotice,
    updateNotice,
    publishNotice,
    getNoticeMonitoring,
    sendReminder,
    deleteNotice,
  };
}
