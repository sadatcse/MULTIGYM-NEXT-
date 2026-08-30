"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/Comon/ConfirmDeleteModal";
import Avatar from "@/components/Comon/Avatar";
import useVendorApi from "@/hooks/useVendorApi";
import useVendorCategoryApi from "@/hooks/useVendorCategoryApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import Swal from "sweetalert2";
import {
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiTag,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiSearch,
  FiX,
  FiGrid,
  FiList,
  FiLoader,
  FiShield,
  FiPhone,
  FiMail,
  FiMapPin,
  FiDollarSign,
  FiAlertTriangle,
  FiClock,
  FiFileText,
} from "react-icons/fi";

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
  category: "",
  website: "",
  taxVatNumber: "",
  notes: "",
  status: "active",
  address: { addressLine1: "", addressLine2: "", area: "", division: "", city: "" },
  contactPerson1: { name: "", designation: "", phone: "", email: "" },
  contactPerson2: { name: "", designation: "", phone: "", email: "" },
  extraPhones: "",
  extraEmails: "",
};

export default function VendorDirectoryPage() {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const { settings } = useSystemTimeZone();
  const currencySymbol = settings.currencySymbol || "৳";

  const { can } = useUserPermissions();
  const canView = can("vendors", "view");
  const canAdd = can("vendors", "add");
  const canEdit = can("vendors", "edit");
  const canDelete = can("vendors", "delete");

  const [dashboardStats, setDashboardStats] = useState(null);
  const loadDashboardStats = useCallback(async () => {
    try {
      const res = await axiosSecure.get("/vendor/dashboard-stats");
      setDashboardStats(res.data.data);
    } catch (err) {
      console.error("Failed to load vendor dashboard stats:", err);
    }
  }, [axiosSecure]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardStats();
  }, [loadDashboardStats]);

  const {
    vendors,
    loading,
    stats,
    searchInput,
    setSearchInput,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    createVendor,
    updateVendor,
    deleteVendor,
  } = useVendorApi();

  const { vendorCategories } = useVendorCategoryApi(100);
  const activeCategories = vendorCategories.filter((c) => c.status === "active");

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
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingVendor, setDeletingVendor] = useState(null);
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
    setEditingVendor(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name || "",
      category: vendor.category || "",
      website: vendor.website || "",
      taxVatNumber: vendor.taxVatNumber || "",
      notes: vendor.notes || "",
      status: vendor.status || "active",
      address: {
        addressLine1: vendor.address?.addressLine1 || "",
        addressLine2: vendor.address?.addressLine2 || "",
        area: vendor.address?.area || "",
        division: vendor.address?.division || "",
        city: vendor.address?.city || "",
      },
      contactPerson1: {
        name: vendor.contactPerson1?.name || "",
        designation: vendor.contactPerson1?.designation || "",
        phone: vendor.contactPerson1?.phone || "",
        email: vendor.contactPerson1?.email || "",
      },
      contactPerson2: {
        name: vendor.contactPerson2?.name || "",
        designation: vendor.contactPerson2?.designation || "",
        phone: vendor.contactPerson2?.phone || "",
        email: vendor.contactPerson2?.email || "",
      },
      extraPhones: (vendor.phones || []).join(", "),
      extraEmails: (vendor.emails || []).join(", "),
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
    if (!formData.name.trim()) errors.name = "Vendor/company name is required";
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
        category: formData.category || undefined,
        website: formData.website.trim() || undefined,
        taxVatNumber: formData.taxVatNumber.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: formData.status,
        address: formData.address,
        contactPerson1: formData.contactPerson1.name || formData.contactPerson1.phone || formData.contactPerson1.email ? formData.contactPerson1 : undefined,
        contactPerson2: formData.contactPerson2.name || formData.contactPerson2.phone || formData.contactPerson2.email ? formData.contactPerson2 : undefined,
        phones: formData.extraPhones.split(",").map((p) => p.trim()).filter(Boolean),
        emails: formData.extraEmails.split(",").map((e) => e.trim()).filter(Boolean),
      };

      if (editingVendor) {
        await updateVendor(editingVendor._id, payload);
        Swal.fire({ title: "Updated!", text: `Vendor "${payload.name}" updated successfully.`, icon: "success", confirmButtonColor: "#FF1818", timer: 2000 });
      } else {
        await createVendor(payload);
        Swal.fire({ title: "Created!", text: `Vendor "${payload.name}" added successfully.`, icon: "success", confirmButtonColor: "#FF1818", timer: 2000 });
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

  const handleOpenDelete = (vendor) => {
    setDeletingVendor(vendor);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingVendor || isDeleting || deleteLockRef.current) return;
    deleteLockRef.current = true;
    setIsDeleting(true);
    try {
      await deleteVendor(deletingVendor._id);
      Swal.fire({ title: "Deleted!", text: `Vendor "${deletingVendor.name}" has been deleted.`, icon: "success", confirmButtonColor: "#FF1818", timer: 2000 });
      setIsDeleteModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete vendor.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsDeleting(false);
      setDeletingVendor(null);
      deleteLockRef.current = false;
    }
  };

  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        <Mtitle title="Vendor Management" subtitle="A-to-Z record of every vendor your organization works with." />
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl" />
          </div>
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">Access Restricted</h2>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            You do not have view permission for Vendor Management. Please contact your system administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      <Mtitle
        title="Vendor Management"
        subtitle="A-to-Z record of every vendor your organization works with."
        rightcontent={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push("/dashboard/vendors/report")}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-offwhite dark:bg-brand-midnight hover:bg-brand-beige/50 dark:hover:bg-brand-dark-grey text-brand-black dark:text-brand-white font-bold text-xs rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 transition-all cursor-pointer"
            >
              <FiFileText className="text-base text-brand-gold" />
              <span>View Report</span>
            </button>
            {canAdd && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <FiPlus className="text-base" />
                <span>Add Vendor</span>
              </button>
            )}
          </div>
        }
      />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">Total Vendors</span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">{stats.totalVendors}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiTruck />
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">Active Vendors</span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">{stats.activeVendors}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-rose-500/50 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">Inactive Vendors</span>
              <span className="text-2xl font-black text-rose-500 mt-1 block">{stats.inactiveVendors}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiXCircle />
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">Categories In Use</span>
              <span className="text-2xl font-black text-brand-gold mt-1 block">{stats.categoriesInUse}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiTag />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {dashboardStats && (
        <>
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">Total Spending</span>
                  <span className="text-2xl font-black text-brand-gold mt-1 block">{currencySymbol}{dashboardStats.totalSpending.toLocaleString()}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                  <FiDollarSign />
                </div>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-amber-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">Pending Payments</span>
                  <span className="text-2xl font-black text-amber-500 mt-1 block">{currencySymbol}{dashboardStats.pendingPaymentAmount.toLocaleString()}</span>
                  <span className="text-[10px] text-brand-dark-grey">{dashboardStats.pendingPaymentCount} purchase{dashboardStats.pendingPaymentCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                  <FiClock />
                </div>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-rose-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">Expiring Warranties</span>
                  <span className="text-2xl font-black text-rose-500 mt-1 block">{dashboardStats.expiringWarrantiesCount}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                  <FiAlertTriangle />
                </div>
              </div>
            </motion.div>
          </motion.div>


        </>
      )}

      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search vendor, category, contact, tax no..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white font-bold"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute right-3 top-2.5 text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer max-w-[180px]"
          >
            <option value="all">All Categories</option>
            {vendorCategories.map((c) => (
              <option key={c._id} value={c.title}>
                {c.title}
              </option>
            ))}
          </select>

          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            {["all", "active", "inactive"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${statusFilter === tab ? "bg-brand-gold text-brand-midnight shadow-xs" : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
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
      ) : vendors.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiTruck />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">No Vendors Found</h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            {searchInput || statusFilter !== "all" || categoryFilter !== "all" ? "No vendors match your active filters." : "No vendors have been added to the system yet."}
          </p>
          {canAdd && (
            <button onClick={handleOpenAdd} className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-2xl shadow-md hover:bg-brand-red-dark transition-all cursor-pointer">
              + Add First Vendor
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
                      <th className="py-4 px-6">Vendor</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Primary Contact</th>
                      <th className="py-4 px-6 text-center w-28">Status</th>
                      <th className="py-4 px-6 text-center w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    <AnimatePresence initial={false}>
                      {vendors.map((vendor, idx) => {
                        const rowBusy = isDeleting && deletingVendor?._id === vendor._id;
                        return (
                          <motion.tr key={vendor._id} custom={idx} variants={rowVariants} initial="hidden" animate="show" exit="exit" layout className={`hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-150 ${rowBusy ? "opacity-50 pointer-events-none" : ""}`}>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <Avatar name={vendor.name} size={9} />
                                <div>
                                  <p className="font-extrabold text-brand-black dark:text-brand-white text-sm">{vendor.name}</p>
                                  {vendor.website && <p className="text-[10px] text-brand-dark-grey">{vendor.website}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light font-bold text-xs border border-brand-beige/40 dark:border-brand-dark-grey/50">
                                <FiTag className="text-brand-gold text-xs" />
                                {vendor.category || "Uncategorized"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light/90 font-medium">
                              {vendor.contactPerson1?.name ? (
                                <>
                                  <p className="text-brand-black dark:text-brand-white font-bold">{vendor.contactPerson1.name}</p>
                                  <p className="text-[10px]">{vendor.contactPerson1.phone || vendor.contactPerson1.email || "—"}</p>
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${vendor.status === "active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${vendor.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                {vendor.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => router.push(`/dashboard/vendors/${vendor._id}`)} className="p-2 rounded-xl text-brand-dark-grey bg-brand-beige/30 dark:bg-brand-midnight hover:bg-brand-black hover:text-white dark:hover:bg-white dark:hover:text-brand-black transition-all cursor-pointer" title="View Vendor">
                                  <FiEye className="text-sm" />
                                </button>
                                {canEdit && (
                                  <button onClick={() => handleOpenEdit(vendor)} disabled={rowBusy} className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Edit Vendor">
                                    <FiEdit3 className="text-sm" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button onClick={() => handleOpenDelete(vendor)} disabled={rowBusy} className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Delete Vendor">
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
                {vendors.map((vendor) => {
                  const rowBusy = isDeleting && deletingVendor?._id === vendor._id;
                  return (
                    <motion.div key={vendor._id} variants={itemVariants} initial="hidden" animate="show" exit="exit" layout className={`bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${rowBusy ? "opacity-50 pointer-events-none" : ""}`}>
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar name={vendor.name} size={11} />
                          <div className="min-w-0">
                            <h3 className="text-base font-black text-brand-black dark:text-brand-white truncate">{vendor.name}</h3>
                            <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-lg bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light font-bold text-[10px] border border-brand-beige/40 dark:border-brand-dark-grey/50">
                              <FiTag className="text-brand-gold text-[10px]" />
                              {vendor.category || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-brand-dark-grey dark:text-brand-gold-light/90 font-medium">
                          {vendor.contactPerson1?.name && (
                            <p className="flex items-center gap-1.5">
                              <FiPhone className="text-brand-gold shrink-0" /> {vendor.contactPerson1.name} — {vendor.contactPerson1.phone || "—"}
                            </p>
                          )}
                          {vendor.contactPerson1?.email && (
                            <p className="flex items-center gap-1.5 truncate">
                              <FiMail className="text-brand-gold shrink-0" /> {vendor.contactPerson1.email}
                            </p>
                          )}
                          {vendor.address?.city && (
                            <p className="flex items-center gap-1.5">
                              <FiMapPin className="text-brand-gold shrink-0" /> {vendor.address.city}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${vendor.status === "active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${vendor.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {vendor.status}
                        </span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => router.push(`/dashboard/vendors/${vendor._id}`)} className="p-2 rounded-xl text-brand-dark-grey bg-brand-beige/30 dark:bg-brand-midnight hover:bg-brand-black hover:text-white dark:hover:bg-white dark:hover:text-brand-black transition-all cursor-pointer" title="View Vendor">
                            <FiEye className="text-sm" />
                          </button>
                          {canEdit && (
                            <button onClick={() => handleOpenEdit(vendor)} disabled={rowBusy} className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Edit Vendor">
                              <FiEdit3 className="text-sm" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleOpenDelete(vendor)} disabled={rowBusy} className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Delete Vendor">
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

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} />
        </>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-5xl rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden my-6"
            >
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                    <FiTruck className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">{editingVendor ? "Edit Vendor" : "Add New Vendor"}</h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">Company details, contacts, and business information</p>
                  </div>
                </div>
                <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Basic Company Info - 4 Columns in Wide View */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Vendor / Company Name <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Link3 Technologies"
                      className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${formErrors.name ? "border-brand-red focus:ring-brand-red/50" : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"} text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                    {formErrors.name && <p className="text-brand-red text-[11px] mt-1 font-bold">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={formData.category}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Category</option>
                      {activeCategories.map((c) => (
                        <option key={c._id} value={c.title}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Website</label>
                    <input type="text" value={formData.website} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))} placeholder="https://..." className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Tax / VAT Number</label>
                    <input type="text" value={formData.taxVatNumber} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, taxVatNumber: e.target.value }))} placeholder="BIN-123456789" className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60" />
                  </div>
                </div>

                {/* Address Section */}
                <div className="p-4 rounded-2xl bg-brand-offwhite/60 dark:bg-brand-midnight/60 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Address</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input type="text" value={formData.address.addressLine1} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, address: { ...prev.address, addressLine1: e.target.value } }))} placeholder="Address line 1" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.address.addressLine2} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, address: { ...prev.address, addressLine2: e.target.value } }))} placeholder="Address line 2" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.address.area} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, address: { ...prev.address, area: e.target.value } }))} placeholder="Area" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.address.city} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, address: { ...prev.address, city: e.target.value } }))} placeholder="City" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.address.division} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, address: { ...prev.address, division: e.target.value } }))} placeholder="Division" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                </div>

                {/* Contact Person 1 - 4 Columns */}
                <div className="p-4 rounded-2xl bg-brand-offwhite/60 dark:bg-brand-midnight/60 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Contact Person 1</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input type="text" value={formData.contactPerson1.name} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson1: { ...prev.contactPerson1, name: e.target.value } }))} placeholder="Full name" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.contactPerson1.designation} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson1: { ...prev.contactPerson1, designation: e.target.value } }))} placeholder="Designation" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.contactPerson1.phone} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson1: { ...prev.contactPerson1, phone: e.target.value } }))} placeholder="Phone" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="email" value={formData.contactPerson1.email} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson1: { ...prev.contactPerson1, email: e.target.value } }))} placeholder="Email" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                </div>

                {/* Contact Person 2 - 4 Columns */}
                <div className="p-4 rounded-2xl bg-brand-offwhite/60 dark:bg-brand-midnight/60 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Contact Person 2 (Optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input type="text" value={formData.contactPerson2.name} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson2: { ...prev.contactPerson2, name: e.target.value } }))} placeholder="Full name" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.contactPerson2.designation} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson2: { ...prev.contactPerson2, designation: e.target.value } }))} placeholder="Designation" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.contactPerson2.phone} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson2: { ...prev.contactPerson2, phone: e.target.value } }))} placeholder="Phone" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="email" value={formData.contactPerson2.email} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson2: { ...prev.contactPerson2, email: e.target.value } }))} placeholder="Email" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                </div>

                {/* Additional Contacts & Status in 3 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Additional Phone Numbers</label>
                    <input type="text" value={formData.extraPhones} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, extraPhones: e.target.value }))} placeholder="Comma-separated" className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Additional Email Addresses</label>
                    <input type="text" value={formData.extraEmails} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, extraEmails: e.target.value }))} placeholder="Comma-separated" className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">Status</label>
                    <div className="flex items-center gap-4 py-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="status" value="active" checked={formData.status === "active"} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                        <span className="text-xs font-bold text-emerald-500">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="status" value="inactive" checked={formData.status === "inactive"} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))} className="w-4 h-4 accent-rose-500 cursor-pointer" />
                        <span className="text-xs font-bold text-rose-500">Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Notes</label>
                  <textarea rows={2} value={formData.notes} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Any additional notes about this vendor..." className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none disabled:opacity-60" />
                </div>

                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2 rounded-2xl text-xs font-bold bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light hover:bg-brand-beige/60 dark:hover:bg-brand-dark-grey transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-2xl text-xs font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <FiLoader className="text-sm animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingVendor ? "Update Vendor" : "Create Vendor"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => !isDeleting && setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} itemName={deletingVendor?.name || "Vendor"} isDeleting={isDeleting} />
    </div>
  );
}
