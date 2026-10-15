"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import useAssetTypeApi from "@/hooks/useAssetTypeApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import Swal from "sweetalert2";
import {
  FiBox,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiHash,
  FiGrid,
  FiList,
  FiLoader,
  FiShield,
  FiTag,
  FiRepeat,
} from "react-icons/fi";
import AssetTypeFormModal from "@/components/modals/assets/AssetTypeFormModal";

const CATEGORIES = [
  "Uniform & Identification",
  "Keys & Access",
  "Company Assets",
  "IT & Electronics",
  "Office Equipment & Furniture",
  "Vehicles & Transport",
  "Fitness & Gym Equipment",
  "Safety & Security Equipment",
];

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut", delay: Math.min(i, 8) * 0.035 } }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const EMPTY_FORM = {
  name: "",
  category: CATEGORIES[0],
  trackingType: "inventory",
  returnable: true,
  order: "",
  description: "",
  status: "active",
  replacementIntervalMonths: "",
  requiresSerialNumber: false,
  requiresSize: false,
  requiresCondition: true,
  requiresEmployeeAssignment: true,
  requiresBranch: false,
  requiresDepartment: false,
  quantityBased: true,
  individualBased: false,
};

export default function AssetTypesPage() {
  const { can } = useUserPermissions();
  const canView = can("asset-types", "view");
  const canAdd = can("asset-types", "add");
  const canEdit = can("asset-types", "edit");
  const canDelete = can("asset-types", "delete");

  const {
    assetTypes,
    loading,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    searchInput,
    setSearchInput,
    stats,
    createAssetType,
    updateAssetType,
    deleteAssetType,
  } = useAssetTypeApi(100);

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
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingType, setDeletingType] = useState(null);
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

  const handleOpenAdd = () => {
    setEditingType(null);
    const nextOrder = (stats?.maxDisplayOrder || 0) + 1;
    setFormData({ ...EMPTY_FORM, order: nextOrder });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name || "",
      category: type.category || CATEGORIES[0],
      trackingType: type.trackingType || "inventory",
      returnable: type.returnable !== false,
      order: type.order ?? 1,
      description: type.description || "",
      status: type.status || "active",
      replacementIntervalMonths: type.replacementIntervalMonths || "",
      requiresSerialNumber: !!type.requiresSerialNumber,
      requiresSize: !!type.requiresSize,
      requiresCondition: type.requiresCondition !== false,
      requiresEmployeeAssignment: type.requiresEmployeeAssignment !== false,
      requiresBranch: !!type.requiresBranch,
      requiresDepartment: !!type.requiresDepartment,
      quantityBased: !!type.quantityBased,
      individualBased: !!type.individualBased,
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
    if (!formData.name.trim()) errors.name = "Asset type name is required";
    if (formData.order === "" || formData.order === null) errors.order = "Display order is required";
    else if (Number(formData.order) < 1) errors.order = "Order must be at least 1";
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
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        trackingType: formData.trackingType,
        returnable: formData.returnable,
        order: Number(formData.order),
        description: formData.description.trim(),
        status: formData.status,
        replacementIntervalMonths: formData.replacementIntervalMonths ? Number(formData.replacementIntervalMonths) : undefined,
        requiresSerialNumber: formData.requiresSerialNumber,
        requiresSize: formData.requiresSize,
        requiresCondition: formData.requiresCondition,
        requiresEmployeeAssignment: formData.requiresEmployeeAssignment,
        requiresBranch: formData.requiresBranch,
        requiresDepartment: formData.requiresDepartment,
        quantityBased: formData.trackingType === "inventory",
        individualBased: formData.trackingType === "individual",
      };

      if (editingType) {
        await updateAssetType(editingType._id, payload);
        Swal.fire({ title: "Updated!", text: `Asset type "${payload.name}" updated successfully.`, icon: "success", confirmButtonColor: "#FF1818", timer: 2000 });
      } else {
        await createAssetType(payload);
        Swal.fire({ title: "Created!", text: `Asset type "${payload.name}" created successfully.`, icon: "success", confirmButtonColor: "#FF1818", timer: 2000 });
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Operation failed. Please try again.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const handleOpenDelete = (type) => {
    setDeletingType(type);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingType || isDeleting || deleteLockRef.current) return;
    deleteLockRef.current = true;
    setIsDeleting(true);
    try {
      await deleteAssetType(deletingType._id);
      Swal.fire({ title: "Deleted!", text: `Asset type "${deletingType.name}" has been deleted.`, icon: "success", confirmButtonColor: "#FF1818", timer: 2000 });
      setIsDeleteModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete asset type.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsDeleting(false);
      setDeletingType(null);
      deleteLockRef.current = false;
    }
  };

  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        <Mtitle title="Asset Types" subtitle="Manage the master list of asset & uniform types your organization tracks." />
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl" />
          </div>
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">Access Restricted</h2>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">You do not have view permission for Asset Types.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      <Mtitle
        title="Asset Types"
        subtitle="Manage the master list of asset & uniform types your organization tracks."
        rightcontent={
          canAdd ? (
            <button onClick={handleOpenAdd} className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer">
              <FiPlus className="text-base" />
              <span>Add Asset Type</span>
            </button>
          ) : null
        }
      />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">Total Asset Types</span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">{stats.totalAssetTypes}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiBox />
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">Active</span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">{stats.activeAssetTypes}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-rose-500/50 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">Inactive</span>
              <span className="text-2xl font-black text-rose-500 mt-1 block">{stats.inactiveAssetTypes}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiXCircle />
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">Max Display Order</span>
              <span className="text-2xl font-black text-brand-gold mt-1 block">#{stats.maxDisplayOrder}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiHash />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search asset type..." className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white font-bold" />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute right-3 top-2.5 text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer max-w-[200px]">
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            {["all", "active", "inactive"].map((tab) => (
              <button key={tab} onClick={() => { setStatusFilter(tab); setPage(1); }} className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${statusFilter === tab ? "bg-brand-gold text-brand-midnight shadow-xs" : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"}`}>
                {tab}
              </button>
            ))}
          </div>

          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer">
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === "table" ? "bg-brand-gold text-brand-midnight shadow-xs" : "text-brand-dark-grey dark:text-brand-gold-light"}`} title="Table View">
              <FiList className="text-sm" />
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === "grid" ? "bg-brand-gold text-brand-midnight shadow-xs" : "text-brand-dark-grey dark:text-brand-gold-light"}`} title="Grid Card View">
              <FiGrid className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonLoading variant={viewMode === "table" ? "table" : "card"} rows={5} />
      ) : assetTypes.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiBox />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">No Asset Types Found</h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            {searchInput || statusFilter !== "all" || categoryFilter !== "all" ? "No asset types match your active filters." : "No asset types have been configured yet."}
          </p>
          {canAdd && (
            <button onClick={handleOpenAdd} className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-2xl shadow-md hover:bg-brand-red-dark transition-all cursor-pointer">
              + Add First Asset Type
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
                      <th className="py-4 px-6 text-center w-16">Order</th>
                      <th className="py-4 px-6">Asset Type</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6 text-center">Tracking</th>
                      <th className="py-4 px-6 text-center">Returnable</th>
                      <th className="py-4 px-6 text-center w-24">Status</th>
                      <th className="py-4 px-6 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    <AnimatePresence initial={false}>
                      {assetTypes.map((type, idx) => {
                        const rowBusy = isDeleting && deletingType?._id === type._id;
                        return (
                          <motion.tr key={type._id} custom={idx} variants={rowVariants} initial="hidden" animate="show" exit="exit" layout className={`hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-150 ${rowBusy ? "opacity-50 pointer-events-none" : ""}`}>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gold/10 text-brand-gold font-black text-xs">#{type.order}</span>
                            </td>
                            <td className="py-4 px-6 font-extrabold text-brand-black dark:text-brand-white text-sm">{type.name}</td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light font-bold text-xs border border-brand-beige/40 dark:border-brand-dark-grey/50">
                                <FiTag className="text-brand-gold text-xs" />
                                {type.category}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                {type.trackingType}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              {type.returnable !== false ? <FiRepeat className="inline text-emerald-500" title="Returnable" /> : <FiX className="inline text-brand-dark-grey" title="One-time issue" />}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${type.status === "active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${type.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                {type.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {canEdit && (
                                  <button onClick={() => handleOpenEdit(type)} disabled={rowBusy} className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50" title="Edit">
                                    <FiEdit3 className="text-sm" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button onClick={() => handleOpenDelete(type)} disabled={rowBusy} className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50" title="Delete">
                                    {rowBusy ? <span className="block w-3.5 h-3.5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /> : <FiTrash2 className="text-sm" />}
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
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence initial={false}>
                {assetTypes.map((type) => {
                  const rowBusy = isDeleting && deletingType?._id === type._id;
                  return (
                    <motion.div key={type._id} variants={itemVariants} initial="hidden" animate="show" exit="exit" layout className={`bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${rowBusy ? "opacity-50 pointer-events-none" : ""}`}>
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-brand-dark-grey dark:text-brand-gold-light font-extrabold block">{type.category}</span>
                            <h3 className="text-base font-black text-brand-black dark:text-brand-white mt-0.5">{type.name}</h3>
                          </div>
                          <span className="shrink-0 w-8 h-8 rounded-2xl bg-brand-gold/10 text-brand-gold font-black text-xs flex items-center justify-center">#{type.order}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize bg-blue-500/10 text-blue-500 border border-blue-500/20">{type.trackingType}</span>
                          {type.returnable === false && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-brand-beige/30 text-brand-dark-grey border border-brand-beige/40">One-time</span>}
                        </div>
                        <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light/90 font-medium leading-relaxed mb-4 line-clamp-2">{type.description || "No description provided."}</p>
                      </div>
                      <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${type.status === "active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${type.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {type.status}
                        </span>
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button onClick={() => handleOpenEdit(type)} disabled={rowBusy} className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50" title="Edit">
                              <FiEdit3 className="text-sm" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleOpenDelete(type)} disabled={rowBusy} className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50" title="Delete">
                              {rowBusy ? <span className="block w-3.5 h-3.5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /> : <FiTrash2 className="text-sm" />}
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

      <AssetTypeFormModal CATEGORIES={CATEGORIES} editingType={editingType} formData={formData} formErrors={formErrors} handleCloseModal={handleCloseModal} handleSubmit={handleSubmit} isModalOpen={isModalOpen} isSubmitting={isSubmitting} setFormData={setFormData} permissions={{ canAdd, canEdit, canDelete }} />

      <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => !isDeleting && setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} itemName={deletingType?.name || "Asset Type"} isDeleting={isDeleting} />
    </div>
  );
}
