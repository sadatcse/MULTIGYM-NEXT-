"use client";

import { useCallback, useMemo } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useTaskApi() {
  const axiosSecure = useAxiosSecure();

  // 1. Get task directory list
  const getTasks = useCallback(
    async (params = {}) => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      );
      const query = new URLSearchParams(cleanParams).toString();
      const res = await axiosSecure.get(`/task?${query}`);
      return res?.data?.data || { tasks: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    },
    [axiosSecure]
  );

  // 2. Get personal tasks for current employee
  const getMyTasks = useCallback(
    async (params = {}) => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      );
      const query = new URLSearchParams(cleanParams).toString();
      const res = await axiosSecure.get(`/task/my-tasks?${query}`);
      return res?.data?.data || { assignments: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    },
    [axiosSecure]
  );

  // 3. Get task detail by ID
  const getTaskById = useCallback(
    async (id) => {
      const res = await axiosSecure.get(`/task/${id}`);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  // 4. Create new task / management instruction
  const createTask = useCallback(
    async (taskData) => {
      const res = await axiosSecure.post("/task", taskData);
      return res?.data;
    },
    [axiosSecure]
  );

  // 5. Update task details
  const updateTask = useCallback(
    async (id, taskData) => {
      const res = await axiosSecure.put(`/task/${id}`, taskData);
      return res?.data;
    },
    [axiosSecure]
  );

  // 6. Start task
  const startTask = useCallback(
    async (id) => {
      const res = await axiosSecure.post(`/task/${id}/start`);
      return res?.data;
    },
    [axiosSecure]
  );

  // 7. Update progress
  const updateProgress = useCallback(
    async (id, progressData) => {
      const res = await axiosSecure.post(`/task/${id}/progress`, progressData);
      return res?.data;
    },
    [axiosSecure]
  );

  // 8. Upload completion proof
  const uploadProof = useCallback(
    async (id, proofData) => {
      const res = await axiosSecure.post(`/task/${id}/proof`, proofData);
      return res?.data;
    },
    [axiosSecure]
  );

  // 9. Submit for approval
  const submitForApproval = useCallback(
    async (id, submitData = {}) => {
      const res = await axiosSecure.post(`/task/${id}/submit`, submitData);
      return res?.data;
    },
    [axiosSecure]
  );

  // 10. Approve task
  const approveTask = useCallback(
    async (id, approveData = {}) => {
      const res = await axiosSecure.post(`/task/${id}/approve`, approveData);
      return res?.data;
    },
    [axiosSecure]
  );

  // 11. Reject task
  const rejectTask = useCallback(
    async (id, rejectData) => {
      const res = await axiosSecure.post(`/task/${id}/reject`, rejectData);
      return res?.data;
    },
    [axiosSecure]
  );

  // 12. Direct complete (when approval is not required)
  const completeTaskDirect = useCallback(
    async (id) => {
      const res = await axiosSecure.post(`/task/${id}/complete`);
      return res?.data;
    },
    [axiosSecure]
  );

  // 13. Extend deadline
  const extendDeadline = useCallback(
    async (id, extendData) => {
      const res = await axiosSecure.post(`/task/${id}/extend-deadline`, extendData);
      return res?.data;
    },
    [axiosSecure]
  );

  // 14. Cancel task
  const cancelTask = useCallback(
    async (id, cancelData) => {
      const res = await axiosSecure.post(`/task/${id}/cancel`, cancelData);
      return res?.data;
    },
    [axiosSecure]
  );

  // 15. Delete task
  const deleteTask = useCallback(
    async (id) => {
      const res = await axiosSecure.delete(`/task/${id}`);
      return res?.data;
    },
    [axiosSecure]
  );

  // 16. Dashboard stats
  const getDashboardStats = useCallback(async () => {
    const res = await axiosSecure.get("/task/dashboard");
    return res?.data?.data;
  }, [axiosSecure]);

  // 17. Management follow-up queue
  const getFollowUpList = useCallback(
    async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await axiosSecure.get(`/task/follow-up?${query}`);
      return res?.data?.data || [];
    },
    [axiosSecure]
  );

  // 18. Reports (source-wise, branch-wise, employee-wise)
  const getReports = useCallback(
    async (type, params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await axiosSecure.get(`/task/reports/${type}?${query}`);
      return res?.data?.data || [];
    },
    [axiosSecure]
  );

  // 19. Calendar tasks
  const getCalendarTasks = useCallback(
    async (month, year) => {
      const query = new URLSearchParams({
        ...(month !== undefined ? { month } : {}),
        ...(year !== undefined ? { year } : {}),
      }).toString();
      const res = await axiosSecure.get(`/task/calendar?${query}`);
      return res?.data?.data || [];
    },
    [axiosSecure]
  );

  // 20. Live alerts for Header bell
  const getAlerts = useCallback(async () => {
    const res = await axiosSecure.get("/task/alerts");
    return res?.data?.data || { overdue: [], waitingApproval: [], dueSoon: [], newAssigned: [] };
  }, [axiosSecure]);

  // 21. Categories
  const getCategories = useCallback(async () => {
    const res = await axiosSecure.get("/task/categories");
    return res?.data?.data || [];
  }, [axiosSecure]);

  const createCategory = useCallback(
    async (catData) => {
      const res = await axiosSecure.post("/task/categories", catData);
      return res?.data;
    },
    [axiosSecure]
  );

  const updateCategory = useCallback(
    async (id, catData) => {
      const res = await axiosSecure.put(`/task/categories/${id}`, catData);
      return res?.data;
    },
    [axiosSecure]
  );

  const deleteCategory = useCallback(
    async (id) => {
      const res = await axiosSecure.delete(`/task/categories/${id}`);
      return res?.data;
    },
    [axiosSecure]
  );

  // 8b. Batch upload completion proofs (Requirement 2)
  const batchUploadProofs = useCallback(
    async (id, proofData) => {
      const res = await axiosSecure.post(`/task/${id}/proofs/batch`, proofData);
      return res?.data;
    },
    [axiosSecure]
  );

  // 8c. Subtask management (Requirement 1)
  const addSubtask = useCallback(
    async (taskId, subtaskData) => {
      const res = await axiosSecure.post(`/task/${taskId}/subtasks`, subtaskData);
      return res?.data;
    },
    [axiosSecure]
  );

  const updateSubtask = useCallback(
    async (taskId, subtaskId, subtaskData) => {
      const res = await axiosSecure.put(`/task/${taskId}/subtasks/${subtaskId}`, subtaskData);
      return res?.data;
    },
    [axiosSecure]
  );

  const deleteSubtask = useCallback(
    async (taskId, subtaskId) => {
      const res = await axiosSecure.delete(`/task/${taskId}/subtasks/${subtaskId}`);
      return res?.data;
    },
    [axiosSecure]
  );

  // 8d. Employee Performance Analytics & History (Requirements 8 & 9)
  const getEmployeePerformance = useCallback(
    async (employeeId, params = {}) => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      );
      const query = new URLSearchParams(cleanParams).toString();
      const res = await axiosSecure.get(`/task/employee-performance/${employeeId}?${query}`);
      return res?.data?.data;
    },
    [axiosSecure]
  );

  // 22. Trigger background reminder evaluation
  const triggerReminderProcess = useCallback(async () => {
    const res = await axiosSecure.post("/task/reminders/process");
    return res?.data;
  }, [axiosSecure]);

  return useMemo(
    () => ({
      getTasks,
      getMyTasks,
      getTaskById,
      createTask,
      updateTask,
      startTask,
      updateProgress,
      uploadProof,
      batchUploadProofs,
      addSubtask,
      updateSubtask,
      deleteSubtask,
      getEmployeePerformance,
      submitForApproval,
      approveTask,
      rejectTask,
      completeTaskDirect,
      extendDeadline,
      cancelTask,
      deleteTask,
      getDashboardStats,
      getFollowUpList,
      getReports,
      getCalendarTasks,
      getAlerts,
      getCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      triggerReminderProcess,
    }),
    [
      getTasks,
      getMyTasks,
      getTaskById,
      createTask,
      updateTask,
      startTask,
      updateProgress,
      uploadProof,
      batchUploadProofs,
      addSubtask,
      updateSubtask,
      deleteSubtask,
      getEmployeePerformance,
      submitForApproval,
      approveTask,
      rejectTask,
      completeTaskDirect,
      extendDeadline,
      cancelTask,
      deleteTask,
      getDashboardStats,
      getFollowUpList,
      getReports,
      getCalendarTasks,
      getAlerts,
      getCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      triggerReminderProcess,
    ]
  );
}
