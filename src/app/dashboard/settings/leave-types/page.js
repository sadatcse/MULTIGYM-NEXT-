"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useLeaveTypeApi from "@/hooks/useLeaveTypeApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import Swal from "sweetalert2";
import {
  FiCalendar,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiUsers,
  FiGrid,
  FiList,
  FiX,
  FiLoader,
  FiRotateCw,
  FiTag,
  FiBriefcase,
} from "react-icons/fi";

const INITIAL_FORM = {
  name: "",
  description: "",
  isPaid: "yes",
  status: "active",
  daysAllowed: 12,
  carryForward: "no",
  applicableFor: "All",
  policyYear: new Date().getFullYear(),
  order: 1,
};

export default function LeaveTypesPage() {
  const { hasPermission } = useUserPermissions();
  const canView = hasPermission("/dashboard/settings/leave-types", "view");
  const canAdd = hasPermission("/dashboard/settings/leave-types", "add");
  const canEdit = hasPermission("/dashboard/settings/leave-types", "edit");
  const canDelete = hasPermission("/dashboard/settings/leave-types", "delete");

  const {
    leaveTypes,
    stats,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
  } = useLeaveTypeApi(10);

  const [viewMode, setViewMode] = useState("table");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Metric computations
  const totalCount = stats?.totalLeaveTypes || totalItems || leaveTypes.length;
  const activeCount = stats?.activeCount || leaveTypes.filter((l) => l.status === "active").length;
  const inactiveCount = Math.max(0, totalCount - activeCount);
  const paidCount = stats?.paidCount || leaveTypes.filter((l) => l.isPaid === "yes").length;

  const handleOpenAdd = () => {
    if (!canAdd) return;
    setEditingItem(null);
    setFormData({
      ...INITIAL_FORM,
      policyYear: new Date().getFullYear(),
      order: leaveTypes.length + 1,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) return;
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      description: item.description || "",
      isPaid: item.isPaid || "yes",
      status: item.status || "active",
      daysAllowed: item.daysAllowed !== undefined ? item.daysAllowed : 12,
      carryForward: item.carryForward || "no",
      applicableFor: item.applicableFor || "All",
      policyYear: item.policyYear || new Date().getFullYear(),
      order: item.order || 1,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Leave policy name is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      if (editingItem) {
        await updateLeaveType(editingItem._id, formData);
        Swal.fire({
          title: "Leave Type Updated!",
          text: `"${formData.name}" has been updated successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      } else {
        await createLeaveType(formData);
        Swal.fire({
          title: "Leave Type Created!",
          text: `"${formData.name}" has been added to the leave policy roster.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save leave type.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (item) => {
    if (!canDelete) return;
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLeaveType(itemToDelete._id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      Swal.fire({
        title: "Deleted!",
        text: `"${itemToDelete.name}" has been removed.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
      });
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: err?.response?.data?.message || "Failed to delete leave type.",
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Mtitle
          title="Employee Leave Type Configuration"
          subtitle="Manage leave categories, paid/unpaid status, annual entitlements, carry-forward rules, and eligibility criteria."
        />
        {canAdd && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-lg shadow-brand-red/25 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <FiPlus className="text-base" />
            <span>Add Leave Type</span>
          </button>
        )}
      </div>

      {/* 4 STAT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold shrink-0">
            <FiCalendar />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Total Leave Types
            </span>
            <p className="text-2xl font-black text-brand-black dark:text-brand-white mt-0.5">
              {totalCount}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              All configured leave policies
            </p>
          </div>
        </motion.div>

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
              Active Policies
            </span>
            <p className="text-2xl font-black text-emerald-500 mt-0.5">
              {activeCount}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Currently available for request
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center text-xl font-bold shrink-0">
            <FiXCircle />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Inactive Policies
            </span>
            <p className="text-2xl font-black text-red-500 mt-0.5">
              {inactiveCount}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Archived or disabled rules
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl font-bold shrink-0">
            <FiDollarSign />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Paid Leave Types
            </span>
            <p className="text-2xl font-black text-blue-500 mt-0.5">
              {paidCount}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Full wage compensation
            </p>
          </div>
        </motion.div>
      </div>

      {/* CONTROL BAR: SEARCH, STATUS TABS, LIMIT, VIEW TOGGLE */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Search Bar & Status Tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
            <input
              type="text"
              placeholder="Search leave types..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark-grey hover:text-brand-red text-xs transition-colors cursor-pointer"
                title="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige dark:border-brand-dark-grey w-full sm:w-auto overflow-x-auto">
            {[
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
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
                {tab.label}
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
      ) : leaveTypes.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal p-12 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-2xl font-bold">
            <FiCalendar />
          </div>
          <h3 className="text-base font-black text-brand-black dark:text-brand-white">
            No Leave Types Found
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light max-w-sm mx-auto font-medium">
            {search || statusFilter !== "all"
              ? "No leave types matched your search criteria. Try adjusting your search query or status filter."
              : "No leave types have been created yet. Click \"Add Leave Type\" to configure your first policy."}
          </p>
          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer"
            >
              <FiPlus />
              <span>Add Leave Type</span>
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
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Leave Name</th>
                  <th className="py-3.5 px-4">Days Allowed</th>
                  <th className="py-3.5 px-4">Compensation</th>
                  <th className="py-3.5 px-4">Carry Forward</th>
                  <th className="py-3.5 px-4">Applicable For</th>
                  <th className="py-3.5 px-4">Policy Year</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs font-bold">
                {leaveTypes.map((item, idx) => (
                  <tr
                    key={item._id}
                    className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center text-brand-dark-grey">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-brand-black dark:text-brand-white block">
                        {item.name}
                      </span>
                      {item.description && (
                        <span className="block text-[10px] text-brand-dark-grey dark:text-brand-gold-light font-normal line-clamp-1 max-w-xs">
                          {item.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-black text-brand-black dark:text-brand-white">
                      {item.daysAllowed ?? 0} Days
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
                          item.isPaid === "yes"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}
                      >
                        <FiDollarSign className="text-xs" />
                        <span>{item.isPaid === "yes" ? "Paid Leave" : "Unpaid Leave"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 uppercase font-bold text-brand-black dark:text-brand-white">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] ${
                          item.carryForward === "yes"
                            ? "bg-brand-gold/10 text-brand-gold font-black"
                            : "text-brand-dark-grey"
                        }`}
                      >
                        {item.carryForward === "yes" ? "Allowed" : "No"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-black dark:text-brand-white">
                        <FiUsers className="text-brand-dark-grey text-xs" />
                        <span>{item.applicableFor || "All"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-brand-black dark:text-brand-white">
                      {item.policyYear || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
                          item.status === "active"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        {item.status === "active" ? (
                          <FiCheckCircle className="text-xs" />
                        ) : (
                          <FiXCircle className="text-xs" />
                        )}
                        <span>{item.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Edit Leave Type"
                        >
                          <FiEdit3 className="text-xs" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="p-2 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red/20 transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Delete Leave Type"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {leaveTypes.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Card Top: Title and Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-lg font-bold shrink-0">
                      <FiCalendar />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-brand-black dark:text-brand-white truncate">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light font-bold">
                        Year: {item.policyYear || "—"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border shrink-0 ${
                      item.status === "active"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}
                  >
                    {item.status === "active" ? (
                      <FiCheckCircle className="text-xs" />
                    ) : (
                      <FiXCircle className="text-xs" />
                    )}
                    <span>{item.status}</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light line-clamp-2 mt-3 font-normal">
                  {item.description || "No description provided."}
                </p>

                {/* Key Spec Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-xs font-bold pt-3 mt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <div className="bg-brand-offwhite/50 dark:bg-brand-midnight/40 p-2 rounded-2xl">
                    <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 block uppercase font-extrabold">
                      Entitlement
                    </span>
                    <span className="font-black text-brand-black dark:text-brand-white">
                      {item.daysAllowed ?? 0} Days/Yr
                    </span>
                  </div>

                  <div className="bg-brand-offwhite/50 dark:bg-brand-midnight/40 p-2 rounded-2xl">
                    <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 block uppercase font-extrabold">
                      Compensation
                    </span>
                    <span
                      className={`font-black ${
                        item.isPaid === "yes" ? "text-emerald-500" : "text-amber-500"
                      }`}
                    >
                      {item.isPaid === "yes" ? "Paid" : "Unpaid"}
                    </span>
                  </div>

                  <div className="bg-brand-offwhite/50 dark:bg-brand-midnight/40 p-2 rounded-2xl">
                    <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 block uppercase font-extrabold">
                      Carry Forward
                    </span>
                    <span className="uppercase font-black text-brand-black dark:text-brand-white">
                      {item.carryForward === "yes" ? "Yes" : "No"}
                    </span>
                  </div>

                  <div className="bg-brand-offwhite/50 dark:bg-brand-midnight/40 p-2 rounded-2xl">
                    <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 block uppercase font-extrabold">
                      Applicable For
                    </span>
                    <span className="font-black text-brand-black dark:text-brand-white truncate block">
                      {item.applicableFor || "All"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                {canEdit && (
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-all cursor-pointer inline-flex items-center justify-center"
                    title="Edit Leave Type"
                  >
                    <FiEdit3 className="text-xs" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteClick(item)}
                    className="p-2 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red/20 transition-all cursor-pointer inline-flex items-center justify-center"
                    title="Delete Leave Type"
                  >
                    <FiTrash2 className="text-xs" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* PAGINATION COMPONENT */}
      {!loading && leaveTypes.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* INLINE FRAMER MOTION ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-brand-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-xl rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-base font-bold">
                    <FiCalendar />
                  </div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    {editingItem ? "Edit Leave Type Policy" : "Create Leave Type Policy"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-brand-dark-grey hover:text-brand-red transition-colors cursor-pointer"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold">
                  {formError}
                </div>
              )}

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Leave Type Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Annual Vacation, Sick Leave, Casual Leave"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Description & Policy Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Eligibility, notice requirements, documentation needed..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Days Allowed / Year <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.daysAllowed}
                      onChange={(e) =>
                        setFormData({ ...formData, daysAllowed: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Compensation Type
                    </label>
                    <select
                      value={formData.isPaid}
                      onChange={(e) => setFormData({ ...formData, isPaid: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    >
                      <option value="yes">Paid Leave (Full Compensation)</option>
                      <option value="no">Unpaid Leave (Loss of Pay)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Carry Forward to Next Year?
                    </label>
                    <select
                      value={formData.carryForward}
                      onChange={(e) =>
                        setFormData({ ...formData, carryForward: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    >
                      <option value="yes">Yes (Carry forward permitted)</option>
                      <option value="no">No (Lapses at year end)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Applicable For
                    </label>
                    <select
                      value={formData.applicableFor}
                      onChange={(e) =>
                        setFormData({ ...formData, applicableFor: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    >
                      <option value="All">All Employees</option>
                      <option value="Male">Male Employees Only</option>
                      <option value="Female">Female Employees Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Policy Year
                    </label>
                    <input
                      type="number"
                      value={formData.policyYear}
                      onChange={(e) =>
                        setFormData({ ...formData, policyYear: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    >
                      <option value="active">Active (Requestable)</option>
                      <option value="inactive">Inactive (Disabled)</option>
                    </select>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && <FiLoader className="animate-spin text-sm" />}
                    <span>
                      {isSubmitting
                        ? "Saving..."
                        : editingItem
                        ? "Update Leave Type"
                        : "Create Leave Type"}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Leave Type"
        message="Are you sure you want to delete this leave type policy? This action cannot be undone."
        itemName={itemToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
}
