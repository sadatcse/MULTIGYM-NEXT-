"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useAdvancePolicyApi from "@/hooks/useAdvancePolicyApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import Swal from "sweetalert2";
import {
  FiDollarSign,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiGrid,
  FiList,
  FiLoader,
  FiShield,
  FiPercent,
} from "react-icons/fi";

const INITIAL_FORM = {
  policyName: "",
  maxAdvancePercent: 50,
  maxAdvanceCount: 2,
  defaultDeductionType: "salary_deduction",
  minServiceMonths: 3,
  status: "active",
};

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

export default function AdvancePolicyPage() {
  const { hasPermission } = useUserPermissions();
  const canView = hasPermission("/dashboard/settings/advance-policy", "view");
  const canAdd = hasPermission("/dashboard/settings/advance-policy", "add");
  const canEdit = hasPermission("/dashboard/settings/advance-policy", "edit");
  const canDelete = hasPermission("/dashboard/settings/advance-policy", "delete");

  const {
    advancePolicies,
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
    totalPages,
    createAdvancePolicy,
    updateAdvancePolicy,
    deleteAdvancePolicy,
  } = useAdvancePolicyApi(50);

  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode("grid");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const submitLockRef = useRef(false);
  const deleteLockRef = useRef(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isSubmitting]);

  const totalCount = stats?.totalPolicies || advancePolicies.length;
  const activeCount = stats?.activeCount ?? advancePolicies.filter((p) => p.status === "active").length;
  const inactiveCount = Math.max(0, totalCount - activeCount);
  const maxPercent = advancePolicies.length
    ? Math.max(...advancePolicies.map((p) => Number(p.maxAdvancePercent) || 0))
    : 50;

  const handleOpenAdd = () => {
    if (!canAdd) return;
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) return;
    setEditingItem(item);
    setFormData({
      policyName: item.policyName || "",
      maxAdvancePercent: item.maxAdvancePercent !== undefined ? item.maxAdvancePercent : 50,
      maxAdvanceCount: item.maxAdvanceCount !== undefined ? item.maxAdvanceCount : 2,
      defaultDeductionType: item.defaultDeductionType || "salary_deduction",
      minServiceMonths: item.minServiceMonths !== undefined ? item.minServiceMonths : 3,
      status: item.status || "active",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.policyName.trim()) {
      errors.policyName = "Policy name is required.";
    }

    const duplicateName = advancePolicies.find(
      (p) =>
        p.policyName.trim().toLowerCase() === formData.policyName.trim().toLowerCase() &&
        p._id !== editingItem?._id
    );
    if (duplicateName) {
      errors.policyName = `Policy "${formData.policyName}" already exists.`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    if (!validateForm()) return;

    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateAdvancePolicy(editingItem._id, formData);
        Swal.fire({
          title: "Updated!",
          text: `Advance policy "${formData.policyName}" updated successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      } else {
        await createAdvancePolicy(formData);
        Swal.fire({
          title: "Created!",
          text: `Advance policy "${formData.policyName}" created successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save advance policy.";
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

  const handleOpenDelete = (item) => {
    if (!canDelete) return;
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem || isDeleting || deleteLockRef.current) return;

    deleteLockRef.current = true;
    setIsDeleting(true);
    try {
      await deleteAdvancePolicy(deletingItem._id);
      Swal.fire({
        title: "Deleted!",
        text: `Advance policy "${deletingItem.policyName}" has been deleted.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
        timer: 2000,
      });
      setIsDeleteModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete advance policy.";
      Swal.fire({
        title: "Error!",
        text: Array.isArray(msg) ? msg.join(", ") : msg,
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
      deleteLockRef.current = false;
    }
  };

  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
        <Mtitle
          title="Salary Advance Policy"
          subtitle="Configure maximum advance limit, allowed requests per year, default deduction rules, and minimum service requirements."
        />
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl" />
          </div>
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">Access Restricted</h2>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            You do not have view permission for Salary Advance Policy. Please contact your system administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <Mtitle
        title="Salary Advance Policy"
        subtitle="Configure maximum advance limit, allowed requests per year, default deduction rules, and minimum service requirements."
        rightcontent={
          canAdd ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <FiPlus className="text-base" />
              <span>Add Policy</span>
            </button>
          ) : null
        }
      />

      {/* 4 STAT METRIC CARDS */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Total Policies
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {totalCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiDollarSign />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Active
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {activeCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-rose-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Inactive
              </span>
              <span className="text-2xl font-black text-rose-500 mt-1 block">
                {inactiveCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiXCircle />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-sky-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Max Advance Limit
              </span>
              <span className="text-2xl font-black text-sky-500 mt-1 block">
                {maxPercent}%
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiPercent />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* CONTROL BAR */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search advance policy..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white font-bold"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
            >
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
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

      {loading ? (
        <SkeletonLoading variant={viewMode === "table" ? "table" : "card"} rows={5} />
      ) : advancePolicies.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiDollarSign />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">
            No Advance Policies Found
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            {search || statusFilter !== "all"
              ? "No policies match your active filters."
              : "No salary advance policies have been configured yet."}
          </p>
          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-2xl shadow-md hover:bg-brand-red-dark transition-all cursor-pointer"
            >
              + Add First Policy
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "table" && (
            <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                    <tr>
                      <th className="py-4 px-6 text-center w-20">#</th>
                      <th className="py-4 px-6">Policy Name</th>
                      <th className="py-4 px-6">Max Advance Limit</th>
                      <th className="py-4 px-6">Requests Allowed</th>
                      <th className="py-4 px-6">Deduction Method</th>
                      <th className="py-4 px-6">Min Service</th>
                      <th className="py-4 px-6 text-center w-28">Status</th>
                      <th className="py-4 px-6 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    <AnimatePresence initial={false}>
                      {advancePolicies.map((policy, idx) => {
                        const rowBusy = isDeleting && deletingItem?._id === policy._id;
                        return (
                          <motion.tr
                            key={policy._id}
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
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gold/10 text-brand-gold font-black text-xs">
                                #{idx + 1 + (page - 1) * limit}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-extrabold text-brand-black dark:text-brand-white text-sm">
                              {policy.policyName}
                            </td>
                            <td className="py-4 px-6 font-bold text-sky-500">
                              {policy.maxAdvancePercent}% of Basic
                            </td>
                            <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light/90 font-medium">
                              {policy.maxAdvanceCount} times / year
                            </td>
                            <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light/90 font-medium capitalize">
                              <span className="px-2.5 py-1 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white font-bold text-[11px]">
                                {policy.defaultDeductionType?.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light/90 font-medium">
                              {policy.minServiceMonths} Months
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                                  policy.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    policy.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                />
                                {policy.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {canEdit && (
                                  <button
                                    onClick={() => handleOpenEdit(policy)}
                                    disabled={rowBusy}
                                    className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Edit Policy"
                                  >
                                    <FiEdit3 className="text-sm" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleOpenDelete(policy)}
                                    disabled={rowBusy}
                                    className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete Policy"
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

          {viewMode === "grid" && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence initial={false}>
                {advancePolicies.map((policy) => {
                  const rowBusy = isDeleting && deletingItem?._id === policy._id;
                  return (
                    <motion.div
                      key={policy._id}
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
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-brand-dark-grey dark:text-brand-gold-light font-extrabold block">
                              Advance Policy
                            </span>
                            <h3 className="text-base font-black text-brand-black dark:text-brand-white mt-0.5">
                              {policy.policyName}
                            </h3>
                          </div>
                          <div className="w-9 h-9 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center font-black shrink-0">
                            <FiDollarSign />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-4 text-[11px] font-bold">
                          <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                            <span className="text-[9px] text-brand-dark-grey block uppercase">Max Advance</span>
                            <span className="text-sky-500">{policy.maxAdvancePercent}% of Basic</span>
                          </div>
                          <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                            <span className="text-[9px] text-brand-dark-grey block uppercase">Requests / Yr</span>
                            <span>{policy.maxAdvanceCount} times</span>
                          </div>
                          <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                            <span className="text-[9px] text-brand-dark-grey block uppercase">Deduction</span>
                            <span className="capitalize">{policy.defaultDeductionType?.replace("_", " ")}</span>
                          </div>
                          <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                            <span className="text-[9px] text-brand-dark-grey block uppercase">Min Service</span>
                            <span>{policy.minServiceMonths} Months</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                            policy.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              policy.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {policy.status}
                        </span>
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(policy)}
                              disabled={rowBusy}
                              className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit Policy"
                            >
                              <FiEdit3 className="text-sm" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleOpenDelete(policy)}
                              disabled={rowBusy}
                              className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Policy"
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

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(newPage) => setPage(newPage)} />
        </>
      )}

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                    <FiDollarSign className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {editingItem ? "Edit Advance Policy" : "Add Advance Policy"}
                    </h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                      Configure percentage limit, deductions, and eligibility
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Policy Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.policyName}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData((prev) => ({ ...prev, policyName: e.target.value }))}
                    placeholder="e.g. Standard Salary Advance"
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${
                      formErrors.policyName
                        ? "border-brand-red focus:ring-brand-red/50"
                        : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"
                    } text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                  {formErrors.policyName && (
                    <p className="text-brand-red text-[11px] mt-1 font-bold">{formErrors.policyName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Max Advance (% of Basic)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.maxAdvancePercent}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maxAdvancePercent: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Max Requests / Year
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.maxAdvanceCount}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maxAdvanceCount: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Deduction Type
                    </label>
                    <select
                      value={formData.defaultDeductionType}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData((prev) => ({ ...prev, defaultDeductionType: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                    >
                      <option value="salary_deduction">Salary Deduction (Next Payroll)</option>
                      <option value="installment">Monthly Installment</option>
                      <option value="lump_sum">Lump Sum Payment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Min Service (Months)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.minServiceMonths}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData((prev) => ({ ...prev, minServiceMonths: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

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
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-4 h-4 accent-rose-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-rose-500">Inactive</span>
                    </label>
                  </div>
                </div>

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
                      <span>{editingItem ? "Update Policy" : "Create Policy"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingItem?.policyName || "Advance Policy"}
        isDeleting={isDeleting}
      />
    </div>
  );
}
