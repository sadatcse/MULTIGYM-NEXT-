"use client";

import React, { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Mtitle from "@/components/Comon/Mtitle";
import useTaskApi from "@/hooks/useTaskApi";
import useBranchApi from "@/hooks/useBranchApi";
import useDepartmentApi from "@/hooks/useDepartmentApi";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useManagementPersonApi from "@/hooks/useManagementPersonApi";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import { AuthContext } from "@/providers/AuthProvider";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiSend,
  FiUploadCloud,
  FiPaperclip,
  FiTrash2,
  FiCalendar,
  FiClock,
  FiUsers,
  FiAlertCircle,
  FiCheckCircle,
  FiLayers,
  FiFileText,
  FiPlus,
  FiSearch,
} from "react-icons/fi";
import { MdAssignment, MdFlag } from "react-icons/md";

export default function CreateTaskPage() {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const { user } = useContext(AuthContext);
  const { createTask, getCategories } = useTaskApi();

  const { branches } = useBranchApi();
  const { departments } = useDepartmentApi();
  const { employees } = useEmployeeApi(150);
  const { getActiveManagementPersons } = useManagementPersonApi();

  const [managementAuthorities, setManagementAuthorities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingS3, setUploadingS3] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructionSource: "MD Sir",
    instructionSourceCustom: "",
    branch: "All Branches",
    department: "All Departments",
    category: "",
    priority: "HIGH",
    assigneeIds: [],
    instructionDate: new Date().toISOString().split("T")[0],
    startDate: new Date().toISOString().split("T")[0],
    deadline: "",
    approvalRequired: true,
    completionProofRequired: true,
    completionCondition: "ALL_ASSIGNEES",
    remarks: "",
    relatedProject: "",
    estimatedEffort: "",
    isRecurring: false,
    recurrence: {
      frequency: "monthly",
      intervalDays: 30,
      endDate: "",
    },
    attachments: [],
    items: [],
  });

  // Subtask Builder State
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    title: "",
    description: "",
    assigneeIds: [],
    priority: "MEDIUM",
    deadline: "",
    approvalRequired: true,
    completionProofRequired: true,
  });

  useEffect(() => {
    let isMounted = true;
    const loadCats = async () => {
      try {
        setLoadingCategories(true);
        const cats = await getCategories();
        if (isMounted && cats && Array.isArray(cats)) {
          const activeCats = cats
            .filter((c) => !c.status || c.status === "active")
            .map((c) => (typeof c === "string" ? c : c.name))
            .filter(Boolean);

          setCategories(activeCats);
          if (activeCats.length > 0) {
            setFormData((prev) => ({
              ...prev,
              category: prev.category && activeCats.includes(prev.category) ? prev.category : activeCats[0],
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic categories:", err);
      } finally {
        if (isMounted) setLoadingCategories(false);
      }
    };
    loadCats();
    return () => {
      isMounted = false;
    };
  }, [getCategories]);

  // Load active management authorities and auto-fill designated employee name
  useEffect(() => {
    let isMounted = true;
    const loadAuths = async () => {
      try {
        const list = await getActiveManagementPersons();
        if (isMounted && list && list.length > 0) {
          setManagementAuthorities(list);
          // Set initial default if available
          const defaultAuth = list.find((a) => a.title === "MD Sir") || list[0];
          if (defaultAuth) {
            setFormData((prev) => ({
              ...prev,
              instructionSource: defaultAuth.title,
              instructionSourceCustom:
                prev.instructionSourceCustom ||
                defaultAuth.employeeName ||
                defaultAuth.employee?.name ||
                "",
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load management authorities:", err);
      }
    };
    loadAuths();
    return () => {
      isMounted = false;
    };
  }, [getActiveManagementPersons]);

  // Handle instruction source change and auto-fill linked employee name
  const handleInstructionSourceChange = (newSource) => {
    const matched = managementAuthorities.find((a) => a.title === newSource);
    const assignedName = matched?.employeeName || matched?.employee?.name || "";
    setFormData((prev) => ({
      ...prev,
      instructionSource: newSource,
      instructionSourceCustom: assignedName || prev.instructionSourceCustom,
    }));
  };

  // Handle file upload to S3
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingS3(true);
    try {
      const data = new FormData();
      const isImage = file.type.startsWith("image/");
      const endpoint = isImage ? "/upload/image?folder=tasks" : "/upload/document?folder=tasks";
      const field = isImage ? "image" : "document";
      data.append(field, file);

      const res = await axiosSecure.post(endpoint, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res?.data?.data?.url;
      if (url) {
        setFormData((prev) => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            {
              name: file.name,
              url,
              fileType: file.type,
              size: file.size,
            },
          ],
        }));
        toast.success("Attachment uploaded successfully");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "File upload failed");
    } finally {
      setUploadingS3(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const toggleAssignee = (empId) => {
    setFormData((prev) => {
      const exists = prev.assigneeIds.includes(empId);
      return {
        ...prev,
        assigneeIds: exists
          ? prev.assigneeIds.filter((id) => id !== empId)
          : [...prev.assigneeIds, empId],
      };
    });
  };

  const selectAllFilteredEmployees = () => {
    const filteredIds = filteredEmployees.map((e) => e._id);
    setFormData((prev) => ({
      ...prev,
      assigneeIds: Array.from(new Set([...prev.assigneeIds, ...filteredIds])),
    }));
  };

  const clearAllAssignees = () => {
    setFormData((prev) => ({ ...prev, assigneeIds: [] }));
  };

  const handleAddSubtask = () => {
    if (!newSubtask.title.trim()) {
      toast.warning("Please enter a title for the subtask item");
      return;
    }
    const subtaskToAdd = {
      title: newSubtask.title.trim(),
      description: newSubtask.description?.trim() || "",
      assigneeIds: newSubtask.assigneeIds.length > 0 ? newSubtask.assigneeIds : formData.assigneeIds,
      priority: newSubtask.priority || formData.priority || "MEDIUM",
      deadline: newSubtask.deadline || formData.deadline || undefined,
      approvalRequired: newSubtask.approvalRequired ?? formData.approvalRequired,
      completionProofRequired: newSubtask.completionProofRequired ?? formData.completionProofRequired,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), subtaskToAdd],
    }));

    setNewSubtask({
      title: "",
      description: "",
      assigneeIds: [],
      priority: "MEDIUM",
      deadline: "",
      approvalRequired: true,
      completionProofRequired: true,
    });
    setShowSubtaskForm(false);
    toast.success("Subtask item added to directive!");
  };

  const handleRemoveSubtask = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const filteredEmployees = (employees || []).filter((emp) => {
    const matchesSearch =
      !employeeSearch ||
      emp.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.department?.toLowerCase().includes(employeeSearch.toLowerCase());

    const matchesBranch =
      formData.branch === "All Branches" || emp.branch === formData.branch;
    const matchesDept =
      formData.department === "All Departments" || emp.department === formData.department;

    return matchesSearch && matchesBranch && matchesDept;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please provide the instruction details");
      return;
    }
    if (!formData.deadline) {
      toast.error("Please specify a deadline date and time");
      return;
    }
    if (formData.assigneeIds.length === 0) {
      toast.error("Please assign at least one employee to this instruction");
      return;
    }

    const payload = {
      ...formData,
      isRecurring: Boolean(formData.isRecurring),
      recurrence:
        formData.isRecurring && formData.recurrence?.endDate
          ? {
              frequency: formData.recurrence.frequency || "monthly",
              intervalDays: Number(formData.recurrence.intervalDays) || 30,
              endDate: formData.recurrence.endDate,
            }
          : undefined,
    };

    setLoading(true);
    try {
      await createTask(payload);
      toast.success("Management instruction created and dispatched to assignees!");
      router.push("/dashboard/tasks");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/tasks"
          className="flex items-center gap-1.5 text-xs font-black text-brand-dark-grey hover:text-brand-gold transition-colors"
        >
          <FiArrowLeft /> Back to Directory
        </Link>
      </div>

      <Mtitle
        title="Issue Management Instruction"
        subtitle="Create a new official directive from MD Sir, Director Sir, Management, or HR. Track completion proof, deadlines, and approvals."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Directive Information */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
            <MdAssignment className="text-brand-gold text-lg" /> Core Instruction Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Instruction By (Source) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                Instruction By <span className="text-brand-red">*</span>
              </label>
              <select
                value={formData.instructionSource}
                onChange={(e) => handleInstructionSourceChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-extrabold outline-none focus:ring-2 focus:ring-brand-gold/50"
              >
                {managementAuthorities.length > 0 ? (
                  managementAuthorities.map((auth) => (
                    <option key={auth._id} value={auth.title}>
                      {auth.title} {auth.employeeName ? `(${auth.employeeName})` : ""}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="MD Sir">MD Sir</option>
                    <option value="Director Sir">Director Sir</option>
                    <option value="Management">Management</option>
                    <option value="Admin & HR">Admin & HR</option>
                  </>
                )}
              </select>
            </div>

            {/* Instruction Source Detail / Specific Speaker */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                Specific Person / Custom Note
              </label>
              <input
                type="text"
                value={formData.instructionSourceCustom}
                onChange={(e) => setFormData({ ...formData, instructionSourceCustom: e.target.value })}
                placeholder="e.g. Mohammad Sadat Khan"
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                  Category <span className="text-brand-red">*</span>
                </label>
                <Link
                  href="/dashboard/tasks/categories"
                  target="_blank"
                  className="text-[10px] font-black text-brand-gold hover:underline"
                >
                  + Manage Categories
                </Link>
              </div>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={loadingCategories}
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
              >
                {loadingCategories ? (
                  <option value="">Loading dynamic categories...</option>
                ) : categories.length === 0 ? (
                  <option value="">No categories found</option>
                ) : (
                  categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                Priority <span className="text-brand-red">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-extrabold outline-none focus:ring-2 focus:ring-brand-gold/50"
              >
                <option value="CRITICAL">🔴 Critical (Immediate Attention)</option>
                <option value="URGENT">🟠 Urgent</option>
                <option value="HIGH">🟡 High</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="LOW">⚪ Low</option>
              </select>
            </div>
          </div>

          {/* Task Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
              Instruction Title <span className="text-brand-red">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Prepare New Staff Uniforms for Kushtia Branch"
              className="w-full px-4 py-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-sm font-extrabold outline-none focus:ring-2 focus:ring-brand-gold/50"
            />
          </div>

          {/* Task Description / Instruction */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
              Detailed Instruction / Requirement <span className="text-brand-red">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="State the exact directive, instructions, and required deliverables from management..."
              className="w-full p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-medium outline-none focus:ring-2 focus:ring-brand-gold/50 leading-relaxed"
            />
          </div>
        </div>

        {/* Card 2: Dates, Deadline & Location Scope */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
            <FiClock className="text-brand-gold text-lg" /> Schedule, Deadlines & Scope
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Instruction Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                Instruction Date
              </label>
              <input
                type="date"
                value={formData.instructionDate}
                onChange={(e) => setFormData({ ...formData, instructionDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-black uppercase tracking-wider text-brand-red">
                Deadline <span className="text-brand-red">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border-2 border-brand-red/40 text-xs font-extrabold outline-none focus:border-brand-red"
              />
            </div>

            {/* Branch Scope */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                Target Branch
              </label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none"
              >
                <option value="All Branches">All Branches</option>
                {branches?.map((b) => (
                  <option key={b._id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Scope */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                Target Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none"
              >
                <option value="All Departments">All Departments</option>
                {departments?.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Card 3: Assignee Selection (Multi-Employee Independent Tracking) */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
                <FiUsers className="text-brand-gold text-lg" /> Assigned Employees ({formData.assigneeIds.length} Selected)
              </h3>
              <p className="text-[11px] text-brand-dark-grey mt-0.5">
                Every assigned employee receives an independent task status, progress tracker, and proof workflow.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFilteredEmployees}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-extrabold hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
              >
                Select All Filtered
              </button>
              <button
                type="button"
                onClick={clearAllAssignees}
                className="px-3 py-1.5 rounded-xl bg-brand-red/10 text-brand-red text-xs font-extrabold hover:bg-brand-red hover:text-white transition-all cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Quick Staff Filter Search */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-xs" />
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Search staff by name, ID, or department..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none"
            />
          </div>

          {/* Employee Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-1 custom-scrollbar">
            {filteredEmployees.map((emp) => {
              const selected = formData.assigneeIds.includes(emp._id);
              return (
                <div
                  key={emp._id}
                  onClick={() => toggleAssignee(emp._id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    selected
                      ? "bg-brand-gold/15 border-brand-gold shadow-sm"
                      : "bg-brand-offwhite dark:bg-brand-midnight border-brand-beige/40 dark:border-brand-dark-grey/40 hover:border-brand-gold/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                      {emp.photo ? (
                        <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{emp.name?.charAt(0) || "U"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-brand-black dark:text-brand-white truncate">
                        {emp.name}
                      </div>
                      <div className="text-[10px] text-brand-dark-grey truncate font-mono">
                        {emp.employeeId || emp.role} • {emp.department || "General"}
                      </div>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {}} // Handled by div click
                    className="accent-brand-red rounded cursor-pointer w-4 h-4 shrink-0"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3b: Subtasks / Task Items Breakdown (Requirement 1) */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
                <FiLayers className="text-brand-gold text-lg" /> Subtasks / Directive Items ({formData.items?.length || 0})
              </h3>
              <p className="text-[11px] text-brand-dark-grey mt-0.5">
                Break this directive into independent subtasks with dedicated assignees, deadlines, and approval tracking.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSubtaskForm((prev) => !prev)}
              className="px-4 py-2 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/40 text-xs font-black hover:bg-brand-gold hover:text-brand-black transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <FiPlus />
              <span>{showSubtaskForm ? "Close Form" : "Add Subtask Item"}</span>
            </button>
          </div>

          {/* Inline Subtask Form */}
          {showSubtaskForm && (
            <div className="p-5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-gold/40 space-y-4">
              <div className="text-xs font-black text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                <FiPlus /> New Subtask Item Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-brand-dark-grey mb-1">
                    Subtask Title *
                  </label>
                  <input
                    type="text"
                    value={newSubtask.title}
                    onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                    placeholder="e.g. Prepare financial reconciliation sheet"
                    className="w-full px-4 py-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:border-brand-gold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-brand-dark-grey mb-1">
                    Subtask Description
                  </label>
                  <textarea
                    rows={2}
                    value={newSubtask.description}
                    onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                    placeholder="Provide specific instructions for this subtask..."
                    className="w-full px-4 py-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs outline-none focus:border-brand-gold resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-brand-dark-grey mb-1">
                    Priority
                  </label>
                  <select
                    value={newSubtask.priority}
                    onChange={(e) => setNewSubtask({ ...newSubtask, priority: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-brand-dark-grey mb-1">
                    Subtask Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newSubtask.deadline}
                    onChange={(e) => setNewSubtask({ ...newSubtask, deadline: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Subtask Assignee Picker */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-brand-dark-grey mb-1.5">
                  Assigned Staff for this Subtask ({newSubtask.assigneeIds.length} Selected — default: all directive assignees)
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {employees?.map((emp) => {
                    const sel = newSubtask.assigneeIds.includes(emp._id);
                    return (
                      <button
                        key={emp._id}
                        type="button"
                        onClick={() => {
                          setNewSubtask((prev) => ({
                            ...prev,
                            assigneeIds: sel
                              ? prev.assigneeIds.filter((id) => id !== emp._id)
                              : [...prev.assigneeIds, emp._id],
                          }));
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          sel
                            ? "bg-brand-gold text-brand-black border-brand-gold"
                            : "bg-brand-white dark:bg-brand-charcoal text-brand-dark-grey border-brand-beige/50 dark:border-brand-dark-grey/50 hover:border-brand-gold"
                        }`}
                      >
                        <span>{emp.name}</span>
                        {sel && <FiCheckCircle className="text-xs" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubtaskForm(false)}
                  className="px-4 py-2 rounded-xl border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-dark-grey hover:bg-brand-beige/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-5 py-2 rounded-xl bg-brand-gold text-brand-black text-xs font-black hover:bg-brand-gold-light shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FiPlus /> Add to Directive
                </button>
              </div>
            </div>
          )}

          {/* Subtask Items List */}
          {formData.items && formData.items.length > 0 ? (
            <div className="space-y-2.5">
              {formData.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-full bg-brand-gold/20 text-brand-gold text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-extrabold text-xs text-brand-black dark:text-brand-white">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                        {item.priority}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-brand-dark-grey line-clamp-1 pl-8">
                        {item.description}
                      </p>
                    )}
                    <div className="text-[10px] text-brand-dark-grey font-mono pl-8 flex items-center gap-3">
                      <span>Assignees: {item.assigneeIds?.length || "All"}</span>
                      {item.deadline && (
                        <span>Deadline: {new Date(item.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(idx)}
                    className="p-2 text-brand-dark-grey hover:text-brand-red rounded-xl hover:bg-brand-beige/20 transition-colors self-end sm:self-auto cursor-pointer"
                    title="Remove Subtask"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-brand-dark-grey italic">
              No subtask items added yet. You can issue this as a single task or add multiple subtask items above.
            </div>
          )}
        </div>

        {/* Card 4: Governance, Workflow & Completion Rules */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
            <FiCheckCircle className="text-brand-gold text-lg" /> Workflow & Governance Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Approval Requirement */}
            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-brand-black dark:text-brand-white">
                  Management Approval
                </span>
                <input
                  type="checkbox"
                  checked={formData.approvalRequired}
                  onChange={(e) => setFormData({ ...formData, approvalRequired: e.target.checked })}
                  className="toggle toggle-warning toggle-sm"
                />
              </div>
              <p className="text-[11px] text-brand-dark-grey">
                {formData.approvalRequired
                  ? "Requires formal Director/MD review before task can be marked Completed."
                  : "Employees can mark complete directly once finished."}
              </p>
            </div>

            {/* Completion Proof Requirement */}
            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-brand-black dark:text-brand-white">
                  Completion Proof Required
                </span>
                <input
                  type="checkbox"
                  checked={formData.completionProofRequired}
                  onChange={(e) => setFormData({ ...formData, completionProofRequired: e.target.checked })}
                  className="toggle toggle-warning toggle-sm"
                />
              </div>
              <p className="text-[11px] text-brand-dark-grey">
                {formData.completionProofRequired
                  ? "Employee MUST upload evidence (photo, PDF, invoice) before submitting."
                  : "Proof is optional for this instruction."}
              </p>
            </div>

            {/* Completion Condition for Multi-Assignees */}
            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-brand-black dark:text-brand-white block">
                Completion Condition
              </span>
              <select
                value={formData.completionCondition}
                onChange={(e) => setFormData({ ...formData, completionCondition: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none"
              >
                <option value="ALL_ASSIGNEES">All Assignees Must Complete</option>
                <option value="ANY_ASSIGNEE">Any One Assignee Completes Task</option>
              </select>
              <p className="text-[11px] text-brand-dark-grey">
                Overall directive marks completed when this condition is satisfied.
              </p>
            </div>
          </div>
        </div>

        {/* Card 5: Attachments & Additional Reference */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-brand-black dark:text-brand-white flex items-center gap-2">
            <FiPaperclip className="text-brand-gold text-lg" /> Attachments & Reference Files
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="px-5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-dashed border-brand-gold/60 text-xs font-bold text-brand-gold hover:bg-brand-gold/10 transition-all cursor-pointer flex items-center gap-2">
              <FiUploadCloud className="text-base" />
              <span>{uploadingS3 ? "Uploading to Cloud..." : "Upload Document or Photo"}</span>
              <input
                type="file"
                disabled={uploadingS3}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-brand-dark-grey">
              Supports PDF, Word, Excel, PNG, JPG (up to 15MB)
            </span>
          </div>

          {/* Attached Files List */}
          {formData.attachments.length > 0 && (
            <div className="space-y-2 mt-3">
              {formData.attachments.map((att, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FiPaperclip className="text-brand-gold shrink-0" />
                    <span className="font-extrabold truncate">{att.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/dashboard/tasks"
            className="px-6 py-3 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-extrabold hover:border-brand-gold transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-2xl bg-brand-red text-white text-xs font-black shadow-xl shadow-brand-red/25 hover:bg-brand-red-dark transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FiSend />
            <span>{loading ? "Issuing Directive..." : "Issue & Dispatch Directive"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
