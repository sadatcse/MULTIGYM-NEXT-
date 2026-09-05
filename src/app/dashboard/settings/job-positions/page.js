"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import useJobPositionApi from "@/hooks/useJobPositionApi";
import useDepartmentApi from "@/hooks/useDepartmentApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import Swal from "sweetalert2";
import {
  FiBriefcase,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiHash,
  FiInfo,
  FiGrid,
  FiList,
  FiLoader,
  FiShield,
  FiLayers,
  FiTag,
} from "react-icons/fi";

// Framer Motion Animation Variants
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut", delay: Math.min(i, 8) * 0.035 },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export default function JobPositionsPage() {
  const { can } = useUserPermissions();
  const canView = can("job-positions", "view");
  const canAdd = can("job-positions", "add");
  const canEdit = can("job-positions", "edit");
  const canDelete = can("job-positions", "delete");

  const {
    jobPositions,
    loading,
    isFetching,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages,
    statusFilter,
    setStatusFilter,
    searchInput,
    setSearchInput,
    stats,
    createJobPosition,
    updateJobPosition,
    deleteJobPosition,
  } = useJobPositionApi(100);

  const { departments } = useDepartmentApi(100);

  // Department Filter State
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Filtered Job Positions by Department
  const displayPositions = useMemo(() => {
    if (!departmentFilter || departmentFilter === "all") return jobPositions;
    return jobPositions.filter(
      (item) => item.department && item.department.toLowerCase() === departmentFilter.toLowerCase()
    );
  }, [jobPositions, departmentFilter]);

  // Layout View Mode (Table / Card Grid)
  const [viewMode, setViewMode] = useState("table");

  // Auto-switch to card view on smaller mobile screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("grid");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    order: "",
    department: "Fitness & Training",
    description: "",
    status: "active",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPosition, setDeletingPosition] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Synchronous locks (belt-and-suspenders against a rapid double-click firing
  // two requests before React re-renders the `disabled` attribute)
  const submitLockRef = useRef(false);
  const deleteLockRef = useRef(false);

  // Allow Escape to close the modal (blocked while a save is in flight)
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isSubmitting]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingPosition(null);
    const nextOrder = (stats?.maxDisplayOrder || 0) + 1;
    setFormData({
      title: "",
      order: nextOrder,
      department: "Fitness & Training",
      description: "",
      status: "active",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (position) => {
    setEditingPosition(position);
    setFormData({
      title: position.title || "",
      order: position.order ?? 1,
      department: position.department || "General",
      description: position.description || "",
      status: position.status || "active",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Guarded modal close: no-ops while a save is in flight
  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  // Validate Form Client-Side
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Job position title is required";
    }

    if (formData.order === "" || formData.order === null || formData.order === undefined) {
      errors.order = "Display order is required";
    } else if (Number(formData.order) < 1) {
      errors.order = "Order must be at least 1";
    }

    // Check duplicate title locally
    const duplicateTitle = jobPositions.find(
      (p) =>
        p.title.trim().toLowerCase() === formData.title.trim().toLowerCase() &&
        p._id !== editingPosition?._id
    );
    if (duplicateTitle) {
      errors.title = `Job position "${formData.title}" already exists`;
    }

    // Check duplicate order locally
    const duplicateOrder = jobPositions.find(
      (p) => Number(p.order) === Number(formData.order) && p._id !== editingPosition?._id
    );
    if (duplicateOrder) {
      errors.order = `Order #${formData.order} is already assigned to "${duplicateOrder.title}"`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    if (!validateForm()) return;

    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        order: Number(formData.order),
        department: formData.department.trim(),
        description: formData.description.trim(),
        status: formData.status,
      };

      if (editingPosition) {
        await updateJobPosition(editingPosition._id, payload);
        Swal.fire({
          title: "Updated!",
          text: `Job position "${payload.title}" updated successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      } else {
        await createJobPosition(payload);
        Swal.fire({
          title: "Created!",
          text: `Job position "${payload.title}" created successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Operation failed. Please try again.";
      Swal.fire({
        title: "Error!",
        text: Array.isArray(msg) ? msg.join(", ") : msg,
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (position) => {
    setDeletingPosition(position);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingPosition || isDeleting || deleteLockRef.current) return;

    deleteLockRef.current = true;
    setIsDeleting(true);
    try {
      await deleteJobPosition(deletingPosition._id);
      Swal.fire({
        title: "Deleted!",
        text: `Job position "${deletingPosition.title}" has been deleted.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
        timer: 2000,
      });
      setIsDeleteModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete job position.";
      Swal.fire({
        title: "Error!",
        text: Array.isArray(msg) ? msg.join(", ") : msg,
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsDeleting(false);
      setDeletingPosition(null);
      deleteLockRef.current = false;
    }
  };

  // Permission Guard for View
  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        <Mtitle
          title="Job Position Configuration"
          subtitle="Manage organizational job titles, department assignments, display hierarchy order, and active access."
        />
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl" />
          </div>
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">
            Access Restricted
          </h2>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            You do not have view permission for the Job Position Configuration module. Please contact your system administrator to update your role privileges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      {/* Header Component */}
      <Mtitle
        title="Job Position Configuration"
        subtitle="Manage organizational job titles, department assignments, display hierarchy order, and active access."
        rightcontent={
          canAdd ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <FiPlus className="text-base" />
              <span>Add Job Position</span>
            </button>
          ) : null
        }
      />

      {/* 4 KPI Stat Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Job Positions */}
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Total Job Positions
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {stats.totalJobPositions}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiBriefcase />
            </div>
          </div>
        </motion.div>

        {/* Active Positions */}
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Active Positions
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {stats.activeJobPositions}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
        </motion.div>

        {/* Inactive Positions */}
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-rose-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Inactive Positions
              </span>
              <span className="text-2xl font-black text-rose-500 mt-1 block">
                {stats.inactiveJobPositions}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiXCircle />
            </div>
          </div>
        </motion.div>

        {/* Max Display Order */}
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Max Display Order
              </span>
              <span className="text-2xl font-black text-brand-gold mt-1 block">
                #{stats.maxDisplayOrder}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiHash />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Control Bar: Search + Filter Tabs + Limit + View Toggle */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search job title or department..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white font-bold"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-2.5 text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
            >
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        {/* Right Options: Department Filter + Status Tabs + Page Limit + View Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Department Filter Dropdown */}
          <div className="flex items-center gap-2 bg-brand-offwhite dark:bg-brand-midnight px-3.5 py-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50">
            <FiTag className="text-brand-gold text-xs shrink-0" />
            <span className="text-xs font-extrabold text-brand-dark-grey dark:text-brand-gold-light whitespace-nowrap">
              Dept:
            </span>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-brand-black dark:text-brand-white text-xs font-black outline-none cursor-pointer max-w-[180px]"
            >
              <option value="all">🏢 All Departments ({jobPositions.length})</option>
              {departments.map((dept) => {
                const count = jobPositions.filter((p) => p.department === dept.name).length;
                return (
                  <option key={dept._id || dept.name} value={dept.name}>
                    {dept.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
          {/* Status Filter Tabs */}
          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            {["all", "active", "inactive"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === tab
                    ? "bg-brand-gold text-brand-midnight shadow-xs"
                    : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Page Limit Selector */}
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          {/* Table / Grid View Switcher */}
          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-brand-gold text-brand-midnight shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light"
              }`}
              title="Table View"
            >
              <FiList className="text-sm" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-brand-gold text-brand-midnight shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light"
              }`}
              title="Grid Card View"
            >
              <FiGrid className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <SkeletonLoading variant={viewMode === "table" ? "table" : "card"} rows={5} />
      ) : displayPositions.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiBriefcase />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">
            No Job Positions Found
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            {searchInput || statusFilter !== "all" || departmentFilter !== "all"
              ? "No job positions match your active department or search filters."
              : "No job positions have been configured in the system yet."}
          </p>
          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-2xl shadow-md hover:bg-brand-red-dark transition-all cursor-pointer"
            >
              + Add First Job Position
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === "table" && (
            <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                    <tr>
                      <th className="py-4 px-6 text-center w-20">Order</th>
                      <th className="py-4 px-6">Job Position Title</th>
                      <th className="py-4 px-6">Department</th>
                      <th className="py-4 px-6">Description</th>
                      <th className="py-4 px-6 text-center w-28">Status</th>
                      <th className="py-4 px-6 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    <AnimatePresence initial={false}>
                      {displayPositions.map((position, idx) => {
                        const rowBusy = isDeleting && deletingPosition?._id === position._id;
                        return (
                      <motion.tr
                        key={position._id}
                        custom={idx}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        layout
                        className={`hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-150 ${
                          rowBusy ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        {/* Order Badge */}
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gold/10 text-brand-gold font-black text-xs">
                            #{position.order}
                          </span>
                        </td>

                        {/* Position Title */}
                        <td className="py-4 px-6 font-extrabold text-brand-black dark:text-brand-white text-sm">
                          {position.title}
                        </td>

                        {/* Department */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light font-bold text-xs border border-brand-beige/40 dark:border-brand-dark-grey/50">
                            <FiTag className="text-brand-gold text-xs" />
                            {position.department || "General"}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light/90 font-medium max-w-xs truncate">
                          {position.description || "—"}
                        </td>

                        {/* Status Pill */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                              position.status === "active"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                position.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {position.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEdit(position)}
                                disabled={rowBusy}
                                className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-gold/10 disabled:hover:text-brand-gold"
                                title="Edit Job Position"
                              >
                                <FiEdit3 className="text-sm" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleOpenDelete(position)}
                                disabled={rowBusy}
                                className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-red/10 disabled:hover:text-brand-red"
                                title="Delete Job Position"
                              >
                                {rowBusy ? (
                                  <span className="block w-3.5 h-3.5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <FiTrash2 className="text-sm" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grid View */}
          {viewMode === "grid" && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence initial={false}>
                {displayPositions.map((position) => {
                  const rowBusy = isDeleting && deletingPosition?._id === position._id;
                  return (
                <motion.div
                  key={position._id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  layout
                  className={`bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${
                    rowBusy ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <div>
                    {/* Header: Title + Order Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-brand-dark-grey dark:text-brand-gold-light font-extrabold block">
                          Job Title
                        </span>
                        <h3 className="text-base font-black text-brand-black dark:text-brand-white mt-0.5">
                          {position.title}
                        </h3>
                      </div>
                      <span className="shrink-0 w-8 h-8 rounded-2xl bg-brand-gold/10 text-brand-gold font-black text-xs flex items-center justify-center">
                        #{position.order}
                      </span>
                    </div>

                    {/* Department Tag */}
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light font-bold text-xs border border-brand-beige/40 dark:border-brand-dark-grey/50">
                        <FiTag className="text-brand-gold text-xs" />
                        {position.department || "General"}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light/90 font-medium leading-relaxed mb-4 line-clamp-2">
                      {position.description || "No description provided."}
                    </p>
                  </div>

                  {/* Footer: Status + Actions */}
                  <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                        position.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          position.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      {position.status}
                    </span>

                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(position)}
                          disabled={rowBusy}
                          className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-gold/10 disabled:hover:text-brand-gold"
                          title="Edit Job Position"
                        >
                          <FiEdit3 className="text-sm" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleOpenDelete(position)}
                          disabled={rowBusy}
                          className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-red/10 disabled:hover:text-brand-red"
                          title="Delete Job Position"
                        >
                          {rowBusy ? (
                            <span className="block w-3.5 h-3.5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiTrash2 className="text-sm" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                    <FiBriefcase className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {editingPosition ? "Edit Job Position" : "Add New Job Position"}
                    </h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                      Configure title, department, display order, and status
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  title={isSubmitting ? "Please wait for the save to finish" : "Close"}
                  className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-brand-dark-grey"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Job Position Title <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    disabled={isSubmitting}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g. Senior Personal Trainer"
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${
                      formErrors.title
                        ? "border-brand-red focus:ring-brand-red/50"
                        : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"
                    } text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                  {formErrors.title && (
                    <p className="text-brand-red text-[11px] mt-1 font-bold">
                      {formErrors.title}
                    </p>
                  )}
                </div>

                {/* Grid: Order & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Display Order */}
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Display Order <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.order}
                      disabled={isSubmitting}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, order: e.target.value }))
                      }
                      placeholder="e.g. 1"
                      className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${
                        formErrors.order
                          ? "border-brand-red focus:ring-brand-red/50"
                          : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"
                      } text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                    {formErrors.order && (
                      <p className="text-brand-red text-[11px] mt-1 font-bold">
                        {formErrors.order}
                      </p>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      disabled={isSubmitting}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, department: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    disabled={isSubmitting}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief summary of duties and responsibilities..."
                    className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === "active"}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="w-4 h-4 accent-emerald-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-emerald-500">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={formData.status === "inactive"}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="w-4 h-4 accent-rose-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-rose-500">Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-2xl text-xs font-bold bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light hover:bg-brand-beige/60 dark:hover:bg-brand-dark-grey transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-2xl text-xs font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader className="text-sm animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingPosition ? "Update Position" : "Create Position"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingPosition?.title || "Job Position"}
        isDeleting={isDeleting}
      />
    </div>
  );
}
