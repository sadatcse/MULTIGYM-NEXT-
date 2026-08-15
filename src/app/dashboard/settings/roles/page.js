"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/Comon/ConfirmDeleteModal";
import useRoleApi from "@/hooks/useRoleApi";
import Swal from "sweetalert2";
import {
  FiShield,
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
  FiUserCheck,
} from "react-icons/fi";

const INITIAL_FORM = {
  name: "",
  order: 1,
  description: "",
  status: "active",
};

// Framer Motion variants
const statGridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const statItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
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

export default function UserRolesPage() {
  const {
    roles,
    totalItems,
    totalPages,
    stats,
    loading,
    isFetching,
    searchInput,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    createRole,
    updateRole,
    deleteRole,
  } = useRoleApi();

  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-detect mobile screen and switch to card view
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setViewMode("cards");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Allow Escape to close modal
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
    setEditingRole(null);
    const nextOrder = (stats.maxDisplayOrder || 0) + 1;
    setFormData({ ...INITIAL_FORM, order: nextOrder });
    setFormError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      order: role.order || 1,
      description: role.description || "",
      status: role.status || "active",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  // Frontend duplicate name & order validation
  const validateForm = () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setFormError("User Role Name is required.");
      return false;
    }
    if (!formData.order || formData.order < 1) {
      setFormError("Display Order must be a positive integer.");
      return false;
    }

    const dupName = roles.find(
      (r) =>
        r.name.toLowerCase() === trimmedName.toLowerCase() &&
        r._id !== editingRole?._id
    );
    if (dupName) {
      setFormError(`User Role "${trimmedName}" already exists on current page.`);
      return false;
    }

    const dupOrder = roles.find(
      (r) => r.order === Number(formData.order) && r._id !== editingRole?._id
    );
    if (dupOrder) {
      setFormError(`Order #${formData.order} is already assigned to "${dupOrder.name}".`);
      return false;
    }

    setFormError("");
    return true;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingRole) {
        await updateRole(editingRole._id, formData);
        Swal.fire({
          title: "Updated Successfully!",
          text: `User Role "${formData.name}" has been updated.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      } else {
        await createRole(formData);
        Swal.fire({
          title: "Created Successfully!",
          text: `User Role "${formData.name}" added to system.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save user role.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handlers
  const handleOpenDelete = (role) => {
    setDeletingRole(role);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRole || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteRole(deletingRole._id);
      setIsDeleteModalOpen(false);
      Swal.fire({
        title: "Deleted!",
        text: `User Role "${deletingRole.name}" has been removed.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
      });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete user role.";
      Swal.fire({
        title: "Error!",
        text: msg,
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsDeleting(false);
      setDeletingRole(null);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      {/* Header with Title and Add Button */}
      <Mtitle
        title="User Role Configuration"
        subtitle="Manage system access roles, display hierarchy order, and active user privileges."
        rightcontent={
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-xs bg-brand-red hover:bg-brand-red-dark text-white shadow-lg shadow-brand-red/25 transition-all scale-100 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <FiPlus className="text-lg" />
            <span>Add User Role</span>
          </button>
        }
      />

      {/* 4 KPI Stat Cards */}
      <motion.div
        variants={statGridVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total User Roles */}
        <motion.div
          variants={statItemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Total User Roles
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {stats.totalRoles}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiShield />
            </div>
          </div>
        </motion.div>

        {/* Active User Roles */}
        <motion.div
          variants={statItemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Active User Roles
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {stats.activeRoles}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
        </motion.div>

        {/* Inactive User Roles */}
        <motion.div
          variants={statItemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-red/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Inactive User Roles
              </span>
              <span className="text-2xl font-black text-brand-red mt-1 block">
                {stats.inactiveRoles}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiXCircle />
            </div>
          </div>
        </motion.div>

        {/* Max Display Order */}
        <motion.div
          variants={statItemVariants}
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

      {/* Control Bar */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input (Left side) */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search role name..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white"
          />
          <AnimatePresence>
            {isFetching && (
              <motion.span
                key="search-spinner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-3.5 top-2.5"
              >
                <FiLoader className="text-brand-gold text-sm animate-spin" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Right side: Items Per Page, Status Filter Tabs & Layout Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Items Per Page Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light shrink-0">
              Show:
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 rounded-2xl px-3 py-2 text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer shadow-xs"
            >
              {[5, 10, 20, 50].map((opt) => (
                <option key={opt} value={opt}>
                  {opt} per page
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50">
            {["all", "active", "inactive"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-brand-red text-white shadow-sm"
                    : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Table / Card View Toggle Buttons */}
          <div className="flex items-center gap-1 p-1 bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-brand-red text-white shadow-sm"
                  : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
              }`}
              title="Table View"
            >
              <FiList className="text-base" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-brand-red text-white shadow-sm"
                  : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
              }`}
              title="Card Grid View"
            >
              <FiGrid className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* Background refetch indicator */}
      <AnimatePresence>
        {isFetching && !loading && (
          <motion.div
            key="refetch-bar"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-0.5 w-full rounded-full bg-brand-beige/40 dark:bg-brand-dark-grey/40 overflow-hidden origin-left -mt-3"
          >
            <motion.div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand-red via-brand-gold to-brand-gold-light"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content: Skeleton Loading or Data Views */}
      {loading ? (
        <SkeletonLoading variant="table" rows={5} />
      ) : (
        <>
          <div
            className={`space-y-6 transition-opacity duration-300 ${
              isFetching ? "opacity-60 pointer-events-none" : "opacity-100"
            }`}
          >
            {/* LIVE DATA TABLE VIEW */}
            <div className={`bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden ${viewMode === "table" ? "hidden md:block" : "hidden"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  {/* Table Header */}
                  <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-extrabold tracking-widest text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                    <tr>
                      <th className="py-4 px-6 text-center w-24">
                        <span className="inline-flex items-center gap-1">
                          <FiHash className="text-brand-gold" /> Order
                        </span>
                      </th>
                      <th className="py-4 px-6">
                        <span className="inline-flex items-center gap-1">
                          <FiUserCheck className="text-brand-gold" /> User Role Name
                        </span>
                      </th>
                      <th className="py-4 px-6 font-extrabold text-center">Status</th>
                      <th className="py-4 px-6 font-extrabold text-right">Actions</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs">
                    {roles.length > 0 ? (
                      <AnimatePresence initial={false}>
                        {roles.map((role, idx) => {
                          const rowBusy = isDeleting && deletingRole?._id === role._id;
                          return (
                            <motion.tr
                              key={role._id}
                              custom={idx}
                              variants={rowVariants}
                              initial="hidden"
                              animate="show"
                              exit="exit"
                              layout
                              className={`hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-200 group ${
                                rowBusy ? "opacity-50 pointer-events-none" : ""
                              }`}
                            >
                              {/* Order Badge */}
                              <td className="py-4 px-6 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-2xl bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-midnight font-mono font-black text-xs shadow-md shadow-brand-gold/20 group-hover:scale-105 transition-transform">
                                  #{role.order}
                                </span>
                              </td>

                              {/* Role Name & Description */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center font-bold text-base shrink-0 group-hover:bg-brand-red group-hover:text-white transition-colors duration-200">
                                    <FiShield />
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-sm text-brand-black dark:text-brand-white block group-hover:text-brand-red transition-colors">
                                      {role.name}
                                    </span>
                                    <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                                      {role.description || `Role Hierarchy #${role.order}`}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Status Pill */}
                              <td className="py-4 px-6 text-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                    role.status === "active"
                                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm"
                                      : "bg-brand-red/10 text-brand-red border border-brand-red/20 shadow-sm"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      role.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-brand-red"
                                    }`}
                                  />
                                  {role.status}
                                </span>
                              </td>

                              {/* Action Buttons */}
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenEdit(role)}
                                    disabled={rowBusy}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:hover:scale-100"
                                    title="Edit Role"
                                  >
                                    <FiEdit3 className="text-xs" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenDelete(role)}
                                    disabled={rowBusy}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:hover:scale-100"
                                    title="Delete Role"
                                  >
                                    {rowBusy ? (
                                      <span className="w-3 h-3 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <FiTrash2 className="text-xs" />
                                    )}
                                    <span>{rowBusy ? "Deleting..." : "Delete"}</span>
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-12 text-center text-brand-dark-grey dark:text-brand-gold-light font-medium">
                          No user roles found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CARD GRID VIEW */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${viewMode === "cards" ? "grid" : "hidden"}`}>
              {roles.length > 0 ? (
                <AnimatePresence initial={false}>
                  {roles.map((role, idx) => {
                    const rowBusy = isDeleting && deletingRole?._id === role._id;
                    return (
                      <motion.div
                        key={role._id}
                        custom={idx}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        layout
                        className={`bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:shadow-md hover:border-brand-gold/50 transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                          rowBusy ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-red via-brand-gold to-brand-gold-light opacity-90" />

                        <div className="flex items-center justify-between pt-1">
                          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-midnight font-mono font-black text-xs shadow-sm">
                            Order #{role.order}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              role.status === "active"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                role.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-brand-red"
                              }`}
                            />
                            {role.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
                            <FiShield />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-brand-black dark:text-brand-white">
                              {role.name}
                            </h4>
                            <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light line-clamp-2 mt-0.5">
                              {role.description || "System authority role"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                          <button
                            onClick={() => handleOpenEdit(role)}
                            disabled={rowBusy}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            <FiEdit3 /> Edit
                          </button>
                          <button
                            onClick={() => handleOpenDelete(role)}
                            disabled={rowBusy}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            {rowBusy ? (
                              <span className="w-3 h-3 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FiTrash2 />
                            )}
                            {rowBusy ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="col-span-full bg-brand-white dark:bg-brand-charcoal p-12 rounded-3xl border text-center text-xs text-brand-dark-grey">
                  No user roles found matching criteria.
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Backend Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </>
      )}

      {/* ADD / EDIT USER ROLE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="role-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleCloseModal}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <div className="h-1.5 bg-gradient-to-r from-brand-red via-brand-gold to-brand-gold-light" />

              {/* Modal Header */}
              <div className="p-5 bg-brand-offwhite dark:bg-brand-midnight border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center justify-between">
                <h3 className="text-base font-bold text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiShield className="text-brand-gold" />
                  {editingRole ? "Edit User Role" : "Add New User Role"}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  title={isSubmitting ? "Please wait for the save to finish" : "Close"}
                  className="text-brand-dark-grey hover:text-brand-black dark:hover:text-white p-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-brand-dark-grey"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <AnimatePresence>
                  {formError && (
                    <motion.div
                      key="form-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-3 bg-brand-red/10 border border-brand-red/30 rounded-2xl text-xs font-bold text-brand-red flex items-center gap-2 overflow-hidden"
                    >
                      <FiInfo className="text-base shrink-0" />
                      <span>{formError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* User Role Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5">
                    User Role Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Payroll Specialist"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5 flex items-center gap-1">
                    <FiHash className="text-brand-gold" /> Display Order <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={isSubmitting}
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    disabled={isSubmitting}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of role responsibilities..."
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                  />
                </div>

                {/* Status Radio */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5">
                    Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-black dark:text-brand-white">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        disabled={isSubmitting}
                        checked={formData.status === "active"}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="accent-brand-red"
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-black dark:text-brand-white">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        disabled={isSubmitting}
                        checked={formData.status === "inactive"}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="accent-brand-red"
                      />
                      Inactive
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-beige/50 dark:border-brand-dark-grey/50">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-beige/40 dark:hover:bg-brand-dark-grey transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/25 scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingRole ? "Update Role" : "Create Role"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ConfirmDeleteModal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingRole?.name || "User Role"}
        isDeleting={isDeleting}
      />
    </div>
  );
}
