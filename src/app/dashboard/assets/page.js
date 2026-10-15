"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import IssueAssetModal from "@/components/Assets/IssueAssetModal";
import useAssetApi from "@/hooks/useAssetApi";
import useAssetTypeApi from "@/hooks/useAssetTypeApi";
import useAssetAssignmentApi from "@/hooks/useAssetAssignmentApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import Swal from "sweetalert2";
import {
  FiBox,
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
  FiAlertTriangle,
  FiTool,
  FiUserCheck,
  FiPackage,
  FiLayers,
  FiSliders,
  FiZap,
} from "react-icons/fi";
import AssetFormModal from "@/components/modals/assets/AssetFormModal";

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

const STATUS_BADGE = {
  available: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  assigned: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  damaged: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  lost: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  repair: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  disposed: "bg-brand-dark-grey/10 text-brand-dark-grey border-brand-dark-grey/20",
  low_stock: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const EMPTY_ASSET_FORM = {
  productType: "simple",
  assetType: "",
  assetCode: "",
  returnable: true,
  description: "",
  size: "",
  serialNumber: "",
  quantityTotal: 1,
  minStockThreshold: 5,
  purchaseDate: "",
  condition: "New",
  status: "available",
  notes: "",
  useAttributes: false,
  useVariants: false,
  attributes: [
    { name: "Size", value: "S, M, L, XL" },
    { name: "Color", value: "Red, Black" },
  ],
  sizeVariants: [
    { size: "M - Red", variantName: "M - Red", quantityTotal: 1, minStockThreshold: 1 },
    { size: "XL - Black", variantName: "XL - Black", quantityTotal: 1, minStockThreshold: 1 },
  ],
};

const EMPTY_ISSUE_FORM = { employee: "", asset: "", size: "", quantity: 1, issueDate: new Date().toISOString().split("T")[0], issueCondition: "New", issuedBy: "", issueNotes: "" };

export default function AssetDirectoryPage() {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();

  const { can } = useUserPermissions();
  const canView = can("assets", "view");
  const canAdd = can("assets", "add");
  const canEdit = can("assets", "edit");
  const canDelete = can("assets", "delete");

  const {
    assets,
    loading,
    searchInput,
    setSearchInput,
    assetTypeFilter,
    setAssetTypeFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    createAsset,
    updateAsset,
    deleteAsset,
  } = useAssetApi();

  const { assetTypes } = useAssetTypeApi(100);
  const activeAssetTypes = assetTypes.filter((t) => t.status === "active");
  const assignmentApi = useAssetAssignmentApi();

  const [dashboardStats, setDashboardStats] = useState(null);
  const loadDashboardStats = useCallback(async () => {
    try {
      const data = await assignmentApi.getDashboardStats();
      setDashboardStats(data);
    } catch (err) {
      console.error("Failed to load asset dashboard stats:", err);
    }
  }, [assignmentApi]);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const [employees, setEmployees] = useState([]);
  useEffect(() => {
    axiosSecure
      .get("/employee", { params: { limit: 1000, status: "active" } })
      .then((res) => setEmployees(res?.data?.data || []))
      .catch((err) => console.error("Failed to load employees:", err));
  }, [axiosSecure]);

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
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState(EMPTY_ASSET_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState(EMPTY_ISSUE_FORM);
  const [isIssuing, setIsIssuing] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const submitLockRef = useRef(false);
  const deleteLockRef = useRef(false);

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setFormData(EMPTY_ASSET_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asset) => {
    setEditingAsset(asset);
    const hasAttr = asset.attributes && asset.attributes.length > 0;
    const hasVar = asset.sizeVariants && asset.sizeVariants.length > 0;
    setFormData({
      productType: asset.productType || (hasVar ? "variable" : "simple"),
      assetType: asset.assetType?._id || asset.assetType || "",
      assetCode: asset.assetCode || "",
      returnable: asset.returnable !== undefined ? asset.returnable : (asset.assetType?.returnable !== false),
      description: asset.description || "",
      size: asset.size || "",
      serialNumber: asset.serialNumber || "",
      quantityTotal: asset.quantityTotal || 1,
      minStockThreshold: asset.minStockThreshold || 5,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split("T")[0] : "",
      condition: asset.condition || "New",
      status: asset.status || "available",
      notes: asset.notes || "",
      useAttributes: hasAttr,
      useVariants: hasVar,
      attributes: hasAttr
        ? asset.attributes
        : [{ name: "Size", value: asset.size || "" }, { name: "Color", value: "" }],
      sizeVariants: hasVar
        ? asset.sizeVariants.map((v) => ({
            size: v.size || v.variantName,
            variantName: v.variantName || v.size,
            quantityTotal: v.quantityTotal || 0,
            minStockThreshold: v.minStockThreshold || 1,
          }))
        : [
            { size: "M - Red", variantName: "M - Red", quantityTotal: 1, minStockThreshold: 1 },
            { size: "XL - Black", variantName: "XL - Black", quantityTotal: 1, minStockThreshold: 1 },
          ],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Preset Shortcut Attributes
  const handleAddPresetAttribute = (name, defaultValue) => {
    setFormData((prev) => {
      // Filter out empty placeholder rows
      const existing = prev.attributes.filter((a) => a.name.trim() || a.value.trim());
      return {
        ...prev,
        attributes: [...existing, { name, value: defaultValue }],
      };
    });
  };

  // Dynamic Attribute Handlers
  const handleAddAttributeRow = () => {
    setFormData((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { name: "", value: "" }],
    }));
  };

  const handleRemoveAttributeRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const handleAttributeChange = (index, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.attributes];
      updated[index][field] = val;
      return { ...prev, attributes: updated };
    });
  };

  // Auto-Combination Matrix Generator Engine
  const handleAutoGenerateVariants = () => {
    const validAttrs = formData.attributes.filter((a) => a.name.trim() && a.value.trim());
    if (validAttrs.length === 0) {
      Swal.fire({
        title: "No Attributes Found",
        text: "Please add at least one attribute with comma-separated values (e.g. Size: S, M, L, XL or Color: Red, Black).",
        icon: "warning",
        confirmButtonColor: "#FF1818",
      });
      return;
    }

    const attrLists = validAttrs.map((a) => {
      const vals = a.value.split(",").map((v) => v.trim()).filter(Boolean);
      return vals.length > 0 ? vals : [a.value.trim()];
    });

    const cartesian = (arrays) => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap((d) => curr.map((e) => [...d, e]));
      }, [[]]);
    };

    const combinations = cartesian(attrLists);
    const newVariants = combinations.map((combo) => {
      const variantName = combo.join(" - ");
      return {
        size: variantName,
        variantName: variantName,
        quantityTotal: 1,
        minStockThreshold: 1,
      };
    });

    const sumTotal = newVariants.reduce((sum, v) => sum + v.quantityTotal, 0);

    setFormData((prev) => ({
      ...prev,
      productType: "variable",
      useVariants: true,
      sizeVariants: newVariants,
      quantityTotal: sumTotal,
    }));

    Swal.fire({
      title: "Variants Generated!",
      text: `Generated ${newVariants.length} dynamic variant combinations based on your attributes.`,
      icon: "success",
      confirmButtonColor: "#FF1818",
      timer: 2000,
    });
  };

  // Dynamic Variant Matrix Handlers
  const handleAddVariantRow = () => {
    setFormData((prev) => {
      const updatedVariants = [
        ...prev.sizeVariants,
        { size: "", variantName: "", quantityTotal: 1, minStockThreshold: 1 },
      ];
      const sumTotal = updatedVariants.reduce((sum, v) => sum + (Number(v.quantityTotal) || 0), 0);
      return {
        ...prev,
        sizeVariants: updatedVariants,
        quantityTotal: sumTotal || prev.quantityTotal,
      };
    });
  };

  const handleRemoveVariantRow = (index) => {
    setFormData((prev) => {
      const updatedVariants = prev.sizeVariants.filter((_, i) => i !== index);
      const sumTotal = updatedVariants.reduce((sum, v) => sum + (Number(v.quantityTotal) || 0), 0);
      return {
        ...prev,
        sizeVariants: updatedVariants,
        quantityTotal: sumTotal || prev.quantityTotal,
      };
    });
  };

  const handleVariantChange = (index, field, val) => {
    setFormData((prev) => {
      const updatedVariants = [...prev.sizeVariants];
      updatedVariants[index][field] = val;
      if (field === "size" && !updatedVariants[index].variantName) {
        updatedVariants[index].variantName = val;
      }
      const sumTotal = updatedVariants.reduce((sum, v) => sum + (Number(v.quantityTotal) || 0), 0);
      return {
        ...prev,
        sizeVariants: updatedVariants,
        quantityTotal: sumTotal || prev.quantityTotal,
      };
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.assetType) errors.assetType = "Asset type is required";
    if (!formData.assetCode.trim()) errors.assetCode = "Asset code is required";
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
      const validAttributes = formData.useAttributes
        ? formData.attributes.filter((a) => a.name.trim() && a.value.trim())
        : [];
      const validVariants = formData.useVariants
        ? formData.sizeVariants.filter((v) => (v.size || v.variantName) && Number(v.quantityTotal) > 0)
        : [];

      const totalQty = formData.useVariants && validVariants.length > 0
        ? validVariants.reduce((sum, v) => sum + (Number(v.quantityTotal) || 0), 0)
        : Number(formData.quantityTotal) || 1;

      const isVariable = formData.productType === "variable" || formData.useVariants;
      const payload = {
        productType: isVariable ? "variable" : "simple",
        assetType: formData.assetType,
        assetCode: formData.assetCode.trim(),
        returnable: formData.returnable,
        description: formData.description || undefined,
        size: formData.size || (validVariants[0]?.size ?? undefined),
        serialNumber: formData.serialNumber || undefined,
        quantityTotal: totalQty,
        minStockThreshold: Number(formData.minStockThreshold) || 0,
        purchaseDate: formData.purchaseDate || undefined,
        condition: formData.condition || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
        attributes: validAttributes,
        sizeVariants: isVariable ? validVariants : [],
      };

      if (editingAsset) {
        await updateAsset(editingAsset._id, payload);
        Swal.fire({ title: "Updated!", text: `Asset "${payload.assetCode}" updated successfully.`, icon: "success", confirmButtonColor: "#FF1818", timer: 2000 });
      } else {
        await createAsset(payload);
        Swal.fire({ title: "Created!", text: `Asset "${payload.assetCode}" added successfully.`, icon: "success", confirmButtonColor: "#FF1818", timer: 2000 });
      }
      setIsModalOpen(false);
      loadDashboardStats();
    } catch (err) {
      const msg = err?.response?.data?.message || "Operation failed. Please try again.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const handleOpenIssue = (asset) => {
    const defaultSize = asset?.sizeVariants?.[0]?.size || asset?.size || "";
    setIssueForm({ ...EMPTY_ISSUE_FORM, asset: asset?._id || "", size: defaultSize });
    setIsIssueModalOpen(true);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (isIssuing) return;
    if (!issueForm.employee || !issueForm.asset) {
      Swal.fire({ title: "Missing fields", text: "Employee and asset are required.", icon: "warning", confirmButtonColor: "#FF1818" });
      return;
    }
    setIsIssuing(true);
    try {
      let formattedDate = issueForm.issueDate;
      if (formattedDate) {
        const parsedDate = new Date(formattedDate);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toISOString().split("T")[0];
        }
      } else {
        formattedDate = new Date().toISOString().split("T")[0];
      }

      await assignmentApi.issueAsset({
        employee: issueForm.employee,
        asset: issueForm.asset,
        size: issueForm.size || undefined,
        quantity: Number(issueForm.quantity) || 1,
        issueDate: formattedDate,
        issueCondition: issueForm.issueCondition || undefined,
        issuedBy: issueForm.issuedBy || undefined,
        issueNotes: issueForm.issueNotes || undefined,
      });
      Swal.fire({ title: "Issued!", text: "Asset issued successfully.", icon: "success", confirmButtonColor: "#FF1818", timer: 2000 });
      setIsIssueModalOpen(false);
      loadDashboardStats();
    } catch (err) {
      console.error("Issue asset error details:", err);
      const rawMsg = err?.response?.data?.message || err?.message || "Failed to issue asset.";
      const displayMsg = Array.isArray(rawMsg) ? rawMsg.join(", ") : typeof rawMsg === "object" ? JSON.stringify(rawMsg) : String(rawMsg);
      Swal.fire({ title: "Error!", text: displayMsg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleOpenDelete = (asset) => {
    setDeletingAsset(asset);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAsset || isDeleting || deleteLockRef.current) return;
    deleteLockRef.current = true;
    setIsDeleting(true);
    try {
      await deleteAsset(deletingAsset._id);
      Swal.fire({ title: "Deleted!", text: `Asset "${deletingAsset.assetCode}" has been deleted.`, icon: "success", confirmButtonColor: "#FF1818", timer: 2000 });
      setIsDeleteModalOpen(false);
      loadDashboardStats();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete asset.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsDeleting(false);
      setDeletingAsset(null);
      deleteLockRef.current = false;
    }
  };

  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        <Mtitle title="Asset Management" subtitle="Track every uniform, key, and company asset issued to staff." />
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl" />
          </div>
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">Access Restricted</h2>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">You do not have view permission for Asset Management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      <Mtitle
        title="Asset Management"
        subtitle="Track every uniform, key, and company asset issued to staff with dynamic attributes & multi-variant combinations."
        rightcontent={
          <div className="flex items-center gap-2">
            {canAdd && (
              <button onClick={() => handleOpenIssue(null)} className="flex items-center gap-2 px-5 py-2.5 bg-brand-black dark:bg-white text-white dark:text-brand-black font-bold text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer">
                <FiUserCheck className="text-base" />
                <span>Issue Asset</span>
              </button>
            )}
            {canAdd && (
              <button onClick={handleOpenAdd} className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer">
                <FiPlus className="text-base" />
                <span>Add Asset</span>
              </button>
            )}
          </div>
        }
      />

      {dashboardStats && (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Assets", value: dashboardStats.totalAssets, icon: FiBox, text: "text-brand-gold", bg: "bg-brand-gold/10" },
            { label: "Assigned", value: dashboardStats.assigned, icon: FiUserCheck, text: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Available", value: dashboardStats.available, icon: FiCheckCircle, text: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Damaged", value: dashboardStats.damaged, icon: FiAlertTriangle, text: "text-rose-500", bg: "bg-rose-500/10" },
            { label: "Lost", value: dashboardStats.lost, icon: FiXCircle, text: "text-rose-500", bg: "bg-rose-500/10" },
            { label: "Under Repair", value: dashboardStats.repair, icon: FiTool, text: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((card) => (
            <motion.div key={card.label} variants={itemVariants} className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">{card.label}</span>
                  <span className={`text-xl font-black mt-1 block ${card.text}`}>{card.value}</span>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${card.bg} ${card.text}`}>
                  <card.icon />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Filter Controls Bar */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search asset code, serial, attributes..." className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white font-bold" />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute right-3 top-2.5 text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select value={assetTypeFilter} onChange={(e) => setAssetTypeFilter(e.target.value)} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer max-w-[180px]">
            <option value="all">All Types</option>
            {assetTypes.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer capitalize">
            <option value="all">All Statuses</option>
            {["available", "assigned", "damaged", "lost", "repair", "disposed", "low_stock"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer">
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
      ) : assets.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiBox />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">No Assets Found</h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            {searchInput || statusFilter !== "all" || assetTypeFilter !== "all" ? "No assets match your active filters." : "No assets have been added yet."}
          </p>
          {canAdd && (
            <button onClick={handleOpenAdd} className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-2xl shadow-md hover:bg-brand-red-dark transition-all cursor-pointer">
              + Add First Asset
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
                      <th className="py-4 px-6">Asset & Dynamic Attributes</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6 text-center">Available / Total</th>
                      <th className="py-4 px-6 text-center w-28">Status</th>
                      <th className="py-4 px-6 text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    <AnimatePresence initial={false}>
                      {assets.map((asset, idx) => {
                        const rowBusy = isDeleting && deletingAsset?._id === asset._id;
                        const isInventory = asset.assetType?.trackingType === "inventory";
                        const hasVar = asset.sizeVariants && asset.sizeVariants.length > 0;
                        const isReturnable = asset.returnable !== false && asset.assetType?.returnable !== false;
                        return (
                          <motion.tr key={asset._id} custom={idx} variants={rowVariants} initial="hidden" animate="show" exit="exit" layout className={`hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-150 ${rowBusy ? "opacity-50 pointer-events-none" : ""}`}>
                            <td className="py-4 px-6">
                              <button onClick={() => router.push(`/dashboard/assets/${asset._id}`)} className="text-left cursor-pointer group">
                                <p className="font-extrabold text-brand-black dark:text-brand-white text-sm group-hover:text-brand-red transition-colors flex items-center gap-2 flex-wrap">
                                  {asset.assetCode}
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                    asset.productType === "variable" || hasVar
                                      ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                                      : "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"
                                  }`}>
                                    {asset.productType === "variable" || hasVar ? "Variable" : "Simple"}
                                  </span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                    isReturnable
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  }`}>
                                    Returnable: {isReturnable ? "Yes" : "No"}
                                  </span>
                                  {asset.isLowStock && <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">Low Stock</span>}
                                </p>
                                <p className="text-[10px] text-brand-dark-grey">{asset.description || asset.serialNumber || "—"}</p>
                                
                                {/* Dynamic Attributes & Variant Matrix Badges */}
                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                  {asset.attributes?.map((attr, aIdx) => (
                                    attr.name && attr.value ? (
                                      <span key={aIdx} className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                                        {attr.name}: {attr.value}
                                      </span>
                                    ) : null
                                  ))}
                                  {hasVar && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                      <FiLayers className="text-[10px]" /> {asset.sizeVariants.length} Variants Matrix
                                    </span>
                                  )}
                                </div>
                              </button>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light font-bold text-xs border border-brand-beige/40 dark:border-brand-dark-grey/50">
                                <FiTag className="text-brand-gold text-xs" />
                                {asset.assetType?.name || "—"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center font-bold text-brand-black dark:text-brand-white">
                              {isInventory ? `${asset.quantityAvailable} / ${asset.quantityTotal}` : asset.quantityAvailable > 0 ? "Available" : "Assigned"}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize border ${STATUS_BADGE[asset.status] || "bg-brand-beige/30 text-brand-dark-grey border-brand-beige/40"}`}>{asset.status}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => router.push(`/dashboard/assets/${asset._id}`)} className="p-2 rounded-xl text-brand-dark-grey bg-brand-beige/30 dark:bg-brand-midnight hover:bg-brand-black hover:text-white dark:hover:bg-white dark:hover:text-brand-black transition-all cursor-pointer" title="View Details & Ledger">
                                  <FiEye className="text-sm" />
                                </button>
                                {canAdd && asset.quantityAvailable > 0 && (
                                  <button onClick={() => handleOpenIssue(asset)} className="p-2 rounded-xl text-blue-500 bg-blue-500/10 hover:bg-blue-500 hover:text-white transition-all cursor-pointer" title="Issue Asset">
                                    <FiUserCheck className="text-sm" />
                                  </button>
                                )}
                                {canEdit && (
                                  <button onClick={() => handleOpenEdit(asset)} disabled={rowBusy} className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50" title="Edit">
                                    <FiEdit3 className="text-sm" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button onClick={() => handleOpenDelete(asset)} disabled={rowBusy} className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50" title="Delete">
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
                {assets.map((asset) => {
                  const rowBusy = isDeleting && deletingAsset?._id === asset._id;
                  const isInventory = asset.assetType?.trackingType === "inventory";
                  const hasVar = asset.sizeVariants && asset.sizeVariants.length > 0;
                  const isReturnable = asset.returnable !== false && asset.assetType?.returnable !== false;
                  return (
                    <motion.div key={asset._id} variants={itemVariants} initial="hidden" animate="show" exit="exit" layout className={`bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${rowBusy ? "opacity-50 pointer-events-none" : ""}`}>
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <button onClick={() => router.push(`/dashboard/assets/${asset._id}`)} className="text-left cursor-pointer">
                            <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-2">
                              <FiPackage />
                            </div>
                            <h3 className="text-base font-black text-brand-black dark:text-brand-white group-hover:text-brand-red transition-colors">{asset.assetCode}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-brand-dark-grey font-bold">{asset.assetType?.name}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                isReturnable
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}>
                                Returnable: {isReturnable ? "Yes" : "No"}
                              </span>
                            </div>
                          </button>
                        </div>
                        <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light/90 font-medium leading-relaxed mb-2 line-clamp-2">{asset.description || asset.serialNumber || "No description."}</p>
                        
                        <div className="flex items-center gap-1.5 flex-wrap mb-3">
                          {asset.attributes?.map((attr, aIdx) => (
                            attr.name && attr.value ? (
                              <span key={aIdx} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                                {attr.name}: {attr.value}
                              </span>
                            ) : null
                          ))}
                          {hasVar && (
                            <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                              {asset.sizeVariants.length} Variants
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-brand-black dark:text-brand-white">
                          {isInventory ? `${asset.quantityAvailable} / ${asset.quantityTotal} available` : asset.quantityAvailable > 0 ? "Available" : "Currently assigned"}
                        </p>
                      </div>
                      <div className="pt-4 mt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize border ${STATUS_BADGE[asset.status] || "bg-brand-beige/30 text-brand-dark-grey border-brand-beige/40"}`}>{asset.status}</span>
                        <div className="flex items-center gap-1.5">
                          {canAdd && asset.quantityAvailable > 0 && (
                            <button onClick={() => handleOpenIssue(asset)} className="p-2 rounded-xl text-blue-500 bg-blue-500/10 hover:bg-blue-500 hover:text-white transition-all cursor-pointer" title="Issue Asset">
                              <FiUserCheck className="text-sm" />
                            </button>
                          )}
                          {canEdit && (
                            <button onClick={() => handleOpenEdit(asset)} disabled={rowBusy} className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50" title="Edit">
                              <FiEdit3 className="text-sm" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleOpenDelete(asset)} disabled={rowBusy} className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50" title="Delete">
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

      {/* Add / Edit Asset Modal */}
      <AssetFormModal activeAssetTypes={activeAssetTypes} editingAsset={editingAsset} formData={formData} formErrors={formErrors} handleAddAttributeRow={handleAddAttributeRow} handleAddPresetAttribute={handleAddPresetAttribute} handleAddVariantRow={handleAddVariantRow} handleAttributeChange={handleAttributeChange} handleAutoGenerateVariants={handleAutoGenerateVariants} handleRemoveAttributeRow={handleRemoveAttributeRow} handleRemoveVariantRow={handleRemoveVariantRow} handleSubmit={handleSubmit} handleVariantChange={handleVariantChange} isModalOpen={isModalOpen} isSubmitting={isSubmitting} setFormData={setFormData} setIsModalOpen={setIsModalOpen} permissions={{ canAdd, canEdit, canDelete }} />

      {/* Issue Asset Modal Component */}
      <IssueAssetModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        preselectedAsset={null}
        availableAssets={assets}
        onSuccess={async () => {
          await loadDashboardStats();
          setCurrentPage(1);
        }}
      />

      <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => !isDeleting && setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} itemName={deletingAsset?.assetCode || "Asset"} isDeleting={isDeleting} />
    </div>
  );
}
