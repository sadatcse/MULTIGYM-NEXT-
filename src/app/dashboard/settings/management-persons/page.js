"use client";

import React, { useState, useEffect, useMemo, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import useManagementPersonApi from "@/hooks/useManagementPersonApi";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import { AuthContext } from "@/providers/AuthProvider";
import Swal from "sweetalert2";
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiShield,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiPhone,
  FiMail,
  FiBriefcase,
  FiGrid,
  FiList,
  FiStar,
  FiAward,
  FiInfo,
  FiCheck,
  FiLayers,
} from "react-icons/fi";
import { MdSupervisorAccount, MdAdminPanelSettings } from "react-icons/md";

// Preset quick authorities
const PRESET_ROLES = [
  { title: "MD Sir", code: "MD_SIR", designation: "Managing Director", order: 1 },
  { title: "Director Sir", code: "DIRECTOR_SIR", designation: "Director", order: 2 },
  { title: "Chairman", code: "CHAIRMAN", designation: "Chairman of the Board", order: 1 },
  { title: "CEO", code: "CEO", designation: "Chief Executive Officer", order: 2 },
  { title: "Executive Director", code: "EXEC_DIRECTOR", designation: "Executive Director", order: 3 },
  { title: "Management", code: "MANAGEMENT", designation: "Executive Management", order: 4 },
  { title: "Admin & HR", code: "ADMIN_HR", designation: "Head of Admin & HR", order: 5 },
];

export default function ManagementPersonsPage() {
  const { can } = useUserPermissions();
  const canView = can("management-persons", "view");
  const canAdd = can("management-persons", "add");
  const canEdit = can("management-persons", "edit");
  const canDelete = can("management-persons", "delete");

  const {
    managementPersons,
    totalItems,
    totalPages,
    stats,
    loading,
    isFetching,
    page,
    setPage,
    limit,
    setLimit,
    searchInput,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    createManagementPerson,
    updateManagementPerson,
    deleteManagementPerson,
  } = useManagementPersonApi(10);

  // Fetch employees for linking
  const { employees, loading: loadingEmployees } = useEmployeeApi(200);

  const [viewMode, setViewMode] = useState("table");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    designation: "",
    employee: "",
    employeeName: "",
    employeeId: "",
    phone: "",
    email: "",
    department: "",
    branch: "",
    avatar: "",
    priorityOrder: 1,
    canIssueInstructions: true,
    canApproveTasks: true,
    status: "active",
    notes: "",
  });

  // Search filter for employee selector inside modal
  const [employeeSelectorSearch, setEmployeeSelectorSearch] = useState("");

  // Filtered employees for modal selection
  const filteredEmployees = useMemo(() => {
    if (!employeeSelectorSearch.trim()) return employees;
    const q = employeeSelectorSearch.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(q) ||
        emp.employeeId?.toLowerCase().includes(q) ||
        emp.jobPosition?.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q)
    );
  }, [employees, employeeSelectorSearch]);

  // Selected employee object
  const selectedEmployeeObj = useMemo(() => {
    if (!formData.employee) return null;
    return employees.find((emp) => emp._id === formData.employee);
  }, [employees, formData.employee]);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingItem(null);
    setEmployeeSelectorSearch("");
    setFormData({
      title: "",
      code: "",
      designation: "",
      employee: "",
      employeeName: "",
      employeeId: "",
      phone: "",
      email: "",
      department: "",
      branch: "",
      avatar: "",
      priorityOrder: managementPersons.length + 1,
      canIssueInstructions: true,
      canApproveTasks: true,
      status: "active",
      notes: "",
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEmployeeSelectorSearch("");
    setFormData({
      title: item.title || "",
      code: item.code || "",
      designation: item.designation || "",
      employee: item.employee?._id || item.employee || "",
      employeeName: item.employeeName || item.employee?.name || "",
      employeeId: item.employeeId || item.employee?.employeeId || "",
      phone: item.phone || item.employee?.phone || item.employee?.mobileNumber || "",
      email: item.email || item.employee?.email || "",
      department: item.department || item.employee?.department || "",
      branch: item.branch || item.employee?.branch || "",
      avatar: item.avatar || item.employee?.photo || "",
      priorityOrder: item.priorityOrder ?? 1,
      canIssueInstructions: item.canIssueInstructions ?? true,
      canApproveTasks: item.canApproveTasks ?? true,
      status: item.status || "active",
      notes: item.notes || "",
    });
    setIsModalOpen(true);
  };

  // Handle preset role selection
  const handleSelectPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      title: preset.title,
      code: preset.code,
      designation: preset.designation,
      priorityOrder: preset.order,
    }));
  };

  // Handle employee selection change
  const handleSelectEmployee = (empId) => {
    if (!empId) {
      setFormData((prev) => ({
        ...prev,
        employee: "",
        employeeName: "",
        employeeId: "",
        phone: "",
        email: "",
        department: "",
        branch: "",
        avatar: "",
      }));
      return;
    }

    const emp = employees.find((e) => e._id === empId);
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        employee: emp._id,
        employeeName: emp.name || "",
        employeeId: emp.employeeId || "",
        phone: emp.mobileNumber || emp.phone || "",
        email: emp.email || "",
        department: emp.department || "",
        branch: emp.branch || "",
        avatar: emp.photo || "",
        designation: prev.designation || emp.jobPosition || "",
      }));
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Title Required",
        text: "Please enter an official authority title (e.g. MD Sir)",
        confirmButtonColor: "#C5A059",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        code: (formData.code || formData.title.toUpperCase().replace(/[^A-Z0-9]/g, "_")).trim(),
        priorityOrder: Number(formData.priorityOrder) || 1,
      };

      if (editingItem) {
        const res = await updateManagementPerson(editingItem._id, payload);
        if (res?.success) setIsModalOpen(false);
      } else {
        const res = await createManagementPerson(payload);
        if (res?.success) setIsModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = (item) => {
    Swal.fire({
      title: `Delete "${item.title}"?`,
      text: "This management authority profile will be permanently deleted. Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete It",
    }).then(async (res) => {
      if (res.isConfirmed) {
        await deleteManagementPerson(item._id);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Mtitle
          title="Management Persons & Authorities"
          subtitle="Configure executive management authorities (MD Sir, Director Sir, etc.), designate official roles, and link employee profiles."
        />
        {canAdd && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-lg shadow-brand-red/25 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <FiPlus className="text-base" />
            <span>Add Management Person</span>
          </button>
        )}
      </div>

      {/* 4 STAT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Authorities */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold shrink-0">
            <MdSupervisorAccount />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Total Authorities
            </span>
            <p className="text-2xl font-black text-brand-black dark:text-brand-white mt-0.5">
              {stats.totalCount || 0}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              All management positions
            </p>
          </div>
        </motion.div>

        {/* Card 2: Active Authorities */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold shrink-0">
            <FiCheckCircle />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Active Authorities
            </span>
            <p className="text-2xl font-black text-emerald-500 mt-0.5">
              {stats.activeCount || 0}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Can issue official directives
            </p>
          </div>
        </motion.div>

        {/* Card 3: Assigned Employees */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl font-bold shrink-0">
            <FiUserCheck />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Assigned Employees
            </span>
            <p className="text-2xl font-black text-blue-500 mt-0.5">
              {stats.assignedEmployeesCount || 0}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Linked to employee profiles
            </p>
          </div>
        </motion.div>

        {/* Card 4: Inactive Authorities */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center text-xl font-bold shrink-0">
            <FiUserX />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Inactive Authorities
            </span>
            <p className="text-2xl font-black text-red-500 mt-0.5">
              {stats.inactiveCount || 0}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Archived / disabled
            </p>
          </div>
        </motion.div>
      </div>

      {/* SEARCH, FILTER & TOOLBAR */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Search input & Status pills */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search authority, name, email..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark-grey hover:text-brand-black cursor-pointer text-xs"
              >
                <FiX />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige dark:border-brand-dark-grey overflow-x-auto w-full sm:w-auto">
            {[
              { label: "All", value: "all", count: stats.totalCount },
              { label: "Active", value: "active", count: stats.activeCount },
              { label: "Inactive", value: "inactive", count: stats.inactiveCount },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.value
                    ? "bg-brand-gold text-brand-midnight shadow-xs font-black"
                    : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-brand-white font-bold"
                }`}
              >
                {tab.label} {tab.count !== undefined ? `(${tab.count})` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Items Per Page & View Mode Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Limit Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light hidden sm:inline">
              Show:
            </span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige dark:border-brand-dark-grey">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-brand-red text-white shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-brand-white"
              }`}
              title="Table View"
            >
              <FiList />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-brand-red text-white shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-brand-white"
              }`}
              title="Grid View"
            >
              <FiGrid />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT: LOADING, TABLE, OR GRID */}
      {loading ? (
        <SkeletonLoading type={viewMode === "table" ? "table" : "card"} />
      ) : managementPersons.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal p-12 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-2xl font-bold">
            <MdSupervisorAccount />
          </div>
          <h3 className="text-base font-black text-brand-black dark:text-brand-white">
            No Management Authorities Found
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light max-w-sm mx-auto">
            {searchInput || statusFilter !== "all"
              ? "No management persons matched your filters. Try clearing your search."
              : "No executive authorities have been set up yet. Click below to add one."}
          </p>
          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-gold text-brand-midnight font-black text-xs shadow-md transition-all cursor-pointer"
            >
              <FiPlus />
              <span>Add Management Person</span>
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-offwhite dark:bg-brand-midnight/60 border-b border-brand-beige/50 dark:border-brand-dark-grey/50 text-[11px] font-black uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider">
                  <th className="py-4 px-4 w-12 text-center">#</th>
                  <th className="py-4 px-4 min-w-[200px]">Authority & Code</th>
                  <th className="py-4 px-4 min-w-[240px]">Assigned Employee</th>
                  <th className="py-4 px-4">Designation & Department</th>
                  <th className="py-4 px-4 text-center w-24">Order</th>
                  <th className="py-4 px-4 text-center">Capabilities</th>
                  <th className="py-4 px-4 text-center w-28">Status</th>
                  <th className="py-4 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs font-bold">
                {managementPersons.map((item, idx) => {
                  const emp = item.employee;
                  const employeeName = item.employeeName || emp?.name;
                  const employeePhoto = item.avatar || emp?.photo;
                  const employeeId = item.employeeId || emp?.employeeId;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/30 transition-colors"
                    >
                      {/* # */}
                      <td className="py-4 px-4 text-center text-brand-dark-grey align-middle font-bold">
                        {(page - 1) * limit + idx + 1}
                      </td>

                      {/* Authority Title & Code */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20">
                              {item.code || "AUTH"}
                            </span>
                            <span className="font-black text-sm text-brand-black dark:text-brand-white">
                              {item.title}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light/80 font-normal line-clamp-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Assigned Employee */}
                      <td className="py-4 px-4 align-middle">
                        {employeeName ? (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-brand-gold/10 text-brand-gold font-black flex items-center justify-center overflow-hidden shrink-0 border border-brand-gold/30">
                              {employeePhoto ? (
                                <img
                                  src={employeePhoto}
                                  alt={employeeName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs">{employeeName.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-black text-brand-black dark:text-brand-white block truncate">
                                {employeeName}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-brand-dark-grey font-mono">
                                {employeeId && <span>ID: {employeeId}</span>}
                                {item.phone && <span>• {item.phone}</span>}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <FiInfo className="text-xs" />
                            <span>Unassigned — Click Edit to Link</span>
                          </div>
                        )}
                      </td>

                      {/* Designation & Dept */}
                      <td className="py-4 px-4 align-middle">
                        <span className="font-bold text-brand-black dark:text-brand-white block">
                          {item.designation || "Executive"}
                        </span>
                        <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/80 block">
                          {item.department || "Executive Board / Management"}
                        </span>
                      </td>

                      {/* Order */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white font-mono font-black text-xs border border-brand-beige dark:border-brand-dark-grey">
                          #{item.priorityOrder || 1}
                        </span>
                      </td>

                      {/* Capabilities */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {item.canIssueInstructions && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold">
                              <FiCheck className="text-xs" />
                              <span>Directives</span>
                            </span>
                          )}
                          {item.canApproveTasks && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold">
                              <FiCheck className="text-xs" />
                              <span>Approvals</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
                            item.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Edit Management Person"
                            >
                              <FiEdit3 className="text-sm" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Delete Management Person"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      ) : (
        /* GRID VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {managementPersons.map((item) => {
              const emp = item.employee;
              const employeeName = item.employeeName || emp?.name;
              const employeePhoto = item.avatar || emp?.photo;
              const employeeId = item.employeeId || emp?.employeeId;

              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Top: Header with code and status */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        {item.code || "AUTH"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-brand-dark-grey">
                          Order #{item.priorityOrder || 1}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                            item.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{item.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Authority Title */}
                    <h4 className="text-lg font-black text-brand-black dark:text-brand-white">
                      {item.title}
                    </h4>
                    <p className="text-xs font-bold text-brand-gold mt-0.5">
                      {item.designation || "Executive Authority"}
                    </p>

                    {/* Linked Employee profile */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight/60 border border-brand-beige/40 dark:border-brand-dark-grey/40">
                      {employeeName ? (
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-brand-gold/10 text-brand-gold font-black flex items-center justify-center overflow-hidden shrink-0 border border-brand-gold/30">
                            {employeePhoto ? (
                              <img
                                src={employeePhoto}
                                alt={employeeName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm">{employeeName.charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-brand-dark-grey block">
                              Assigned Executive
                            </span>
                            <span className="font-black text-xs text-brand-black dark:text-brand-white block truncate">
                              {employeeName}
                            </span>
                            {employeeId && (
                              <span className="text-[10px] font-mono text-brand-dark-grey">
                                ID: {employeeId}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-xs font-bold text-amber-600">
                            No employee assigned
                          </p>
                          <p className="text-[10px] text-brand-dark-grey mt-0.5">
                            Click Edit to link an active employee
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Contact & Meta */}
                    <div className="mt-3 space-y-1 text-xs">
                      {item.email && (
                        <div className="flex items-center gap-2 text-brand-dark-grey dark:text-brand-gold-light/80">
                          <FiMail className="text-xs shrink-0" />
                          <span className="truncate">{item.email}</span>
                        </div>
                      )}
                      {item.phone && (
                        <div className="flex items-center gap-2 text-brand-dark-grey dark:text-brand-gold-light/80">
                          <FiPhone className="text-xs shrink-0" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                      {item.department && (
                        <div className="flex items-center gap-2 text-brand-dark-grey dark:text-brand-gold-light/80">
                          <FiBriefcase className="text-xs shrink-0" />
                          <span>{item.department}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Capabilities & Actions */}
                  <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.canIssueInstructions && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                          Directives
                        </span>
                      )}
                      {item.canApproveTasks && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600">
                          Approvals
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-all cursor-pointer"
                          title="Edit"
                        >
                          <FiEdit3 className="text-sm" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                          title="Delete"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-lg font-bold">
                    <MdSupervisorAccount />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {editingItem
                        ? `Edit Authority: ${editingItem.title}`
                        : "Add Management Authority"}
                    </h3>
                    <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                      Configure authority title and select the corresponding employee
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white cursor-pointer"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Quick Presets */}
                {!editingItem && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-brand-dark-grey block">
                      Quick Preset Roles
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_ROLES.map((preset) => (
                        <button
                          key={preset.code}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                            formData.code === preset.code
                              ? "bg-brand-gold text-brand-midnight shadow-xs font-black"
                              : "bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white border border-brand-beige/60 dark:border-brand-dark-grey"
                          }`}
                        >
                          {preset.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Row 1: Title & Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      Authority Title <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. MD Sir, Director Sir"
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      System Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
                        })
                      }
                      placeholder="e.g. MD_SIR"
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                {/* Row 2: Designation & Priority Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      Executive Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) =>
                        setFormData({ ...formData, designation: e.target.value })
                      }
                      placeholder="e.g. Managing Director"
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      Hierarchy Order (Priority)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={formData.priorityOrder}
                      onChange={(e) =>
                        setFormData({ ...formData, priorityOrder: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                {/* EMPLOYEE SELECTION SECTION (Core user requirement) */}
                <div className="p-4 rounded-2xl bg-brand-gold/5 dark:bg-brand-midnight/50 border border-brand-gold/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
                      <FiUsers className="text-sm" />
                      <span>Select Employee for {formData.title || "Authority"}</span>
                    </label>
                    {formData.employee && (
                      <button
                        type="button"
                        onClick={() => handleSelectEmployee("")}
                        className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer"
                      >
                        Clear Assignment
                      </button>
                    )}
                  </div>

                  {/* Search inside employee dropdown */}
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark-grey text-xs" />
                    <input
                      type="text"
                      value={employeeSelectorSearch}
                      onChange={(e) => setEmployeeSelectorSearch(e.target.value)}
                      placeholder="Type to filter employees by name, ID, designation..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  {/* Employee Dropdown Select */}
                  <select
                    value={formData.employee}
                    onChange={(e) => handleSelectEmployee(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                  >
                    <option value="">-- No Employee Selected (Unassigned) --</option>
                    {filteredEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} {emp.employeeId ? `(${emp.employeeId})` : ""} -{" "}
                        {emp.jobPosition || emp.department || "Staff"}
                      </option>
                    ))}
                  </select>

                  {/* Preview of Selected Employee */}
                  {selectedEmployeeObj && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3.5 p-3 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold font-black flex items-center justify-center overflow-hidden shrink-0 border border-brand-gold/40">
                        {selectedEmployeeObj.photo ? (
                          <img
                            src={selectedEmployeeObj.photo}
                            alt={selectedEmployeeObj.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base">
                            {selectedEmployeeObj.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-brand-black dark:text-brand-white truncate">
                            {selectedEmployeeObj.name}
                          </span>
                          {selectedEmployeeObj.employeeId && (
                            <span className="text-[10px] font-mono font-bold bg-brand-offwhite dark:bg-brand-midnight px-1.5 py-0.5 rounded border border-brand-beige/40">
                              {selectedEmployeeObj.employeeId}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-brand-gold font-bold">
                          {selectedEmployeeObj.jobPosition || "Executive"}
                        </p>
                        <p className="text-[10px] text-brand-dark-grey truncate">
                          {selectedEmployeeObj.email || "No email"} •{" "}
                          {selectedEmployeeObj.mobileNumber || selectedEmployeeObj.phone || "No phone"}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Row 3: Direct Overrides (Optional contact info) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. md@company.com"
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                      Official Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +880 1700-000000"
                      className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                {/* Row 4: Capabilities & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canIssueInstructions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          canIssueInstructions: e.target.checked,
                        })
                      }
                      className="rounded accent-brand-gold w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-brand-black dark:text-brand-white">
                      Can Issue Directives
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canApproveTasks}
                      onChange={(e) =>
                        setFormData({ ...formData, canApproveTasks: e.target.checked })
                      }
                      className="rounded accent-brand-gold w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-brand-black dark:text-brand-white">
                      Can Approve Tasks
                    </span>
                  </label>

                  <div className="space-y-1">
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="active">Status: Active</option>
                      <option value="inactive">Status: Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey">
                    Notes / Memo
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Primary instruction authority for fitness and gym directives."
                    className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-2xl bg-brand-gold text-brand-midnight font-black text-xs shadow-md shadow-brand-gold/20 hover:brightness-105 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting
                      ? "Saving..."
                      : editingItem
                      ? "Update Management Person"
                      : "Create Management Person"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
