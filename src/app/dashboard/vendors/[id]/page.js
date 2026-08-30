"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import useVendorPurchaseApi from "@/hooks/useVendorPurchaseApi";
import useVendorServiceApi from "@/hooks/useVendorServiceApi";
import useVendorContractApi from "@/hooks/useVendorContractApi";
import useVendorDocumentApi from "@/hooks/useVendorDocumentApi";
import useVendorPerformanceApi from "@/hooks/useVendorPerformanceApi";
import useDepartmentApi from "@/hooks/useDepartmentApi";
import useBranchApi from "@/hooks/useBranchApi";
import useProductCategoryApi from "@/hooks/useProductCategoryApi";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import Avatar from "@/components/Comon/Avatar";
import ConfirmDeleteModal from "@/components/Comon/ConfirmDeleteModal";
import {
  FiArrowLeft,
  FiTruck,
  FiTag,
  FiPlus,
  FiTrash2,
  FiX,
  FiLoader,
  FiDollarSign,
  FiShoppingBag,
  FiTool,
  FiFileText,
  FiFolder,
  FiStar,
  FiDownload,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";

const TABS = [
  { key: "overview", label: "Overview", icon: FiTruck },
  { key: "purchases", label: "Purchases & Products", icon: FiShoppingBag },
  { key: "services", label: "Services", icon: FiTool },
  { key: "contracts", label: "Contracts", icon: FiFileText },
  { key: "documents", label: "Documents", icon: FiFolder },
  { key: "performance", label: "Performance", icon: FiStar },
];

const STATUS_BADGE = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "expiring-soon": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  expiring: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  expired: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  terminated: "bg-brand-dark-grey/10 text-brand-dark-grey border-brand-dark-grey/20",
  none: "bg-brand-beige/30 text-brand-dark-grey border-brand-beige/40",
  paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  partial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  pending: "bg-brand-beige/30 text-brand-dark-grey border-brand-beige/40",
  overdue: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "in-progress": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const Badge = ({ value, fallback = "—" }) => {
  if (!value) return <span className="text-brand-dark-grey">{fallback}</span>;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize border ${STATUS_BADGE[value] || "bg-brand-beige/30 text-brand-dark-grey border-brand-beige/40"}`}>
      {value.replace(/-/g, " ")}
    </span>
  );
};

// Full literal class strings per color, never built via template-string
// interpolation — Tailwind's static scanner needs each complete utility
// class to appear verbatim in source, not reconstructed at runtime.
const STAT_CARD_COLORS = {
  gold: { value: "text-brand-gold", iconBg: "bg-brand-gold/10", icon: "text-brand-gold" },
  "emerald-500": { value: "text-emerald-500", iconBg: "bg-emerald-500/10", icon: "text-emerald-500" },
  "blue-500": { value: "text-blue-500", iconBg: "bg-blue-500/10", icon: "text-blue-500" },
  "amber-500": { value: "text-amber-500", iconBg: "bg-amber-500/10", icon: "text-amber-500" },
  "brand-primary": { value: "text-brand-primary", iconBg: "bg-brand-primary/10", icon: "text-brand-primary" },
};

const StatCard = ({ label, value, icon: Icon, color = "gold" }) => {
  const c = STAT_CARD_COLORS[color] || STAT_CARD_COLORS.gold;
  return (
    <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">{label}</span>
          <span className={`text-xl font-black mt-1 block ${c.value}`}>{value}</span>
        </div>
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.icon} flex items-center justify-center text-lg`}>
          <Icon />
        </div>
      </div>
    </div>
  );
};

const EmptyRow = ({ colSpan, message }) => (
  <tr>
    <td colSpan={colSpan} className="py-10 text-center text-brand-dark-grey text-xs">
      {message}
    </td>
  </tr>
);

export default function VendorProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const { formatDate, settings } = useSystemTimeZone();
  const currencySymbol = settings.currencySymbol || "৳";

  const purchaseApi = useVendorPurchaseApi();
  const serviceApi = useVendorServiceApi();
  const contractApi = useVendorContractApi();
  const documentApi = useVendorDocumentApi();
  const performanceApi = useVendorPerformanceApi();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadHistory = useCallback(async () => {
    try {
      const res = await axiosSecure.get(`/vendor/${id}/full-history`);
      setHistory(res.data.data);
    } catch (err) {
      console.error("Failed to load vendor history:", err);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg text-brand-primary"></span>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="text-center py-20">
        <p className="text-brand-dark-grey text-sm">Vendor not found.</p>
        <button onClick={() => router.push("/dashboard/vendors")} className="mt-4 px-5 py-2 rounded-2xl bg-brand-red text-white text-xs font-bold cursor-pointer">
          Back to Directory
        </button>
      </div>
    );
  }

  const { vendor, purchases, services, contracts, documents, performanceReviews, stats } = history;

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/dashboard/vendors")} className="p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 text-brand-dark-grey hover:text-brand-black dark:hover:text-white cursor-pointer">
          <FiArrowLeft />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar name={vendor.name} size={14} />
          <div className="min-w-0">
            <h1 className="text-xl font-black text-brand-black dark:text-brand-white truncate">{vendor.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light font-bold text-[10px] border border-brand-beige/40 dark:border-brand-dark-grey/50">
                <FiTag className="text-brand-gold text-[10px]" />
                {vendor.category || "Uncategorized"}
              </span>
              <Badge value={vendor.status === "active" ? "active" : "expired"} />
              {vendor.rating != null && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-brand-gold">
                  <FiStar className="fill-current" /> {vendor.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Spend" value={`${currencySymbol}${stats.totalSpend.toLocaleString()}`} icon={FiDollarSign} />
        <StatCard label="Purchases" value={stats.totalPurchases} icon={FiShoppingBag} color="blue-500" />
        <StatCard label="Active Warranties" value={stats.activeWarrantyCount} icon={FiCheckCircle} color="emerald-500" />
        <StatCard label="Upcoming Services" value={stats.upcomingServiceCount} icon={FiTool} color="amber-500" />
        <StatCard label="Contracts" value={stats.totalContracts} icon={FiFileText} color="brand-primary" />
      </div>

      <div className="bg-brand-white dark:bg-brand-charcoal rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 p-1.5 flex flex-wrap gap-1 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.key ? "bg-brand-red text-white shadow-md" : "text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-offwhite dark:hover:bg-brand-midnight"}`}
            >
              <Icon className="text-sm" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "overview" && <OverviewTab vendor={vendor} formatDate={formatDate} />}
          {activeTab === "purchases" && (
            <PurchasesTab vendorId={id} purchases={purchases} api={purchaseApi} onChange={loadHistory} formatDate={formatDate} currencySymbol={currencySymbol} />
          )}
          {activeTab === "services" && <ServicesTab vendorId={id} services={services} api={serviceApi} onChange={loadHistory} formatDate={formatDate} currencySymbol={currencySymbol} />}
          {activeTab === "contracts" && <ContractsTab vendorId={id} contracts={contracts} api={contractApi} onChange={loadHistory} formatDate={formatDate} currencySymbol={currencySymbol} />}
          {activeTab === "documents" && <DocumentsTab vendorId={id} documents={documents} api={documentApi} onChange={loadHistory} formatDate={formatDate} />}
          {activeTab === "performance" && <PerformanceTab vendorId={id} reviews={performanceReviews} api={performanceApi} onChange={loadHistory} formatDate={formatDate} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ==================== OVERVIEW ==================== */
function OverviewTab({ vendor, formatDate }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-brand-gold">Contact Person 1</h3>
        {vendor.contactPerson1?.name ? (
          <div className="text-sm">
            <p className="font-bold text-brand-black dark:text-brand-white">{vendor.contactPerson1.name} {vendor.contactPerson1.designation && `(${vendor.contactPerson1.designation})`}</p>
            <p className="text-xs text-brand-dark-grey flex items-center gap-1.5 mt-1"><FiPhone /> {vendor.contactPerson1.phone || "—"}</p>
            <p className="text-xs text-brand-dark-grey flex items-center gap-1.5 mt-1"><FiMail /> {vendor.contactPerson1.email || "—"}</p>
          </div>
        ) : (
          <p className="text-xs text-brand-dark-grey">No contact person on file.</p>
        )}

        {vendor.contactPerson2?.name && (
          <>
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-gold pt-2">Contact Person 2</h3>
            <div className="text-sm">
              <p className="font-bold text-brand-black dark:text-brand-white">{vendor.contactPerson2.name} {vendor.contactPerson2.designation && `(${vendor.contactPerson2.designation})`}</p>
              <p className="text-xs text-brand-dark-grey flex items-center gap-1.5 mt-1"><FiPhone /> {vendor.contactPerson2.phone || "—"}</p>
              <p className="text-xs text-brand-dark-grey flex items-center gap-1.5 mt-1"><FiMail /> {vendor.contactPerson2.email || "—"}</p>
            </div>
          </>
        )}

        {(vendor.phones?.length > 0 || vendor.emails?.length > 0) && (
          <div className="pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs text-brand-dark-grey space-y-1">
            {vendor.phones?.length > 0 && <p><FiPhone className="inline mr-1.5 text-brand-gold" />{vendor.phones.join(", ")}</p>}
            {vendor.emails?.length > 0 && <p><FiMail className="inline mr-1.5 text-brand-gold" />{vendor.emails.join(", ")}</p>}
          </div>
        )}
      </div>

      <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-brand-gold">Company Information</h3>
        <div className="text-xs text-brand-dark-grey space-y-2">
          {vendor.website && <p className="flex items-center gap-1.5"><FiFileText className="text-brand-gold" /> {vendor.website}</p>}
          {vendor.taxVatNumber && <p className="flex items-center gap-1.5"><FiFileText className="text-brand-gold" /> Tax/VAT: {vendor.taxVatNumber}</p>}
          {(vendor.address?.addressLine1 || vendor.address?.city) && (
            <p className="flex items-start gap-1.5">
              <FiMapPin className="text-brand-gold mt-0.5 shrink-0" />
              {[vendor.address?.addressLine1, vendor.address?.addressLine2, vendor.address?.area, vendor.address?.city, vendor.address?.division].filter(Boolean).join(", ")}
            </p>
          )}
          {vendor.notes && (
            <div className="pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
              <p className="font-bold text-brand-black dark:text-brand-white mb-1">Notes</p>
              <p>{vendor.notes}</p>
            </div>
          )}
          <p className="pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
            <FiCalendar className="inline mr-1.5 text-brand-gold" /> Vendor since {formatDate(vendor.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ==================== PURCHASES ==================== */
const PURCHASE_EMPTY = {
  purchaseDate: new Date().toISOString().split("T")[0],
  invoiceNumber: "",
  productName: "",
  productCategory: "",
  description: "",
  quantity: 1,
  unitPrice: "",
  purchaseOrderNumber: "",
  paymentStatus: "pending",
  paymentDate: "",
  department: "",
  location: "",
  warranty: { available: false, startDate: "", endDate: "", durationMonths: "", serialNumber: "", assetId: "" },
};

function PurchasesTab({ vendorId, purchases, api, onChange, formatDate, currencySymbol }) {
  const { departments } = useDepartmentApi(100);
  const { branches } = useBranchApi(100);
  const { productCategories } = useProductCategoryApi(100);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(PURCHASE_EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pure dynamic options directly from live MongoDB database
  const activeBranches = (branches || []).filter((b) => !b.status || b.status === "active");
  const branchOptions = activeBranches.length > 0
    ? Array.from(new Set(activeBranches.map((b) => b.name || b.title || b.branchName).filter(Boolean)))
    : ["Power Fit — Adabor", "Shiya Masjid Branch", "Lalmatia Branch", "MULTIGYM"];

  const activeDepartments = (departments || []).filter((d) => !d.status || d.status === "active");
  const departmentOptions = activeDepartments.length > 0
    ? Array.from(new Set(activeDepartments.map((d) => d.title || d.name).filter(Boolean)))
    : ["Management", "Operations", "IT & Security", "Fitness & Training", "Maintenance & Cleaning", "Accounts & Finance", "Sales & Marketing", "Front Desk & Reception"];

  const activeProductCategories = (productCategories || []).filter((c) => !c.status || c.status === "active");
  const categoryOptions = activeProductCategories.length > 0
    ? Array.from(new Set(activeProductCategories.map((c) => c.title).filter(Boolean)))
    : ["Tissue & Hygiene Paper Products", "Electrical & Wiring Supplies", "Cardio Machines & Fitness Equipment", "Strength Training & Power Racks"];

  const calculatedTotal = Number(formData.quantity || 1) * Number(formData.unitPrice || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.productName.trim() || !formData.unitPrice) {
      Swal.fire({ title: "Missing fields", text: "Product name and unit price are required.", icon: "warning", confirmButtonColor: "#FF1818" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        vendor: vendorId,
        purchaseDate: formData.purchaseDate,
        invoiceNumber: formData.invoiceNumber || undefined,
        productName: formData.productName.trim(),
        productCategory: formData.productCategory || undefined,
        description: formData.description || undefined,
        quantity: Number(formData.quantity) || 1,
        unitPrice: Number(formData.unitPrice),
        purchaseOrderNumber: formData.purchaseOrderNumber || undefined,
        paymentStatus: formData.paymentStatus,
        paymentDate: formData.paymentDate || undefined,
        department: formData.department || undefined,
        location: formData.location || undefined,
        warranty: formData.warranty.available
          ? {
              available: true,
              startDate: formData.warranty.startDate || undefined,
              endDate: formData.warranty.endDate || undefined,
              durationMonths: formData.warranty.durationMonths ? Number(formData.warranty.durationMonths) : undefined,
              serialNumber: formData.warranty.serialNumber || undefined,
              assetId: formData.warranty.assetId || undefined,
            }
          : { available: false },
      };
      await api.createPurchase(payload);
      await onChange();
      setIsModalOpen(false);
      setFormData(PURCHASE_EMPTY);
      Swal.fire({ title: "Recorded!", text: "Purchase saved successfully.", icon: "success", confirmButtonColor: "#FF1818", timer: 1800 });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save purchase.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.deletePurchase(deleteTarget._id);
      await onChange();
      setDeleteTarget(null);
    } catch (err) {
      Swal.fire({ title: "Error", text: "Failed to delete purchase.", icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer">
          <FiPlus /> Add Purchase
        </button>
      </div>

      <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Purchase Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Warranty</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
              {purchases.length === 0 ? (
                <EmptyRow colSpan={6} message="No purchases recorded yet." />
              ) : (
                purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-brand-gold/5">
                    <td className="py-3 px-4">
                      <p className="font-bold text-brand-black dark:text-brand-white">{p.productName}</p>
                      {p.invoiceNumber && <p className="text-[10px] text-brand-dark-grey">Inv# {p.invoiceNumber}</p>}
                    </td>
                    <td className="py-3 px-4 text-brand-dark-grey">{formatDate(p.purchaseDate)}</td>
                    <td className="py-3 px-4 text-right font-bold text-brand-black dark:text-brand-white">{currencySymbol}{p.totalPrice?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center"><Badge value={p.paymentStatus} /></td>
                    <td className="py-3 px-4 text-center"><Badge value={p.warrantyStatus} /></td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                        <FiTrash2 className="text-sm" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-6 border border-brand-beige/60 dark:border-brand-dark-grey/60">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">Add Purchase / Product</h3>
                  <p className="text-[11px] text-brand-dark-grey font-medium">Record item purchases, invoices, department allocations, and warranties</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <Field label="Product Name *" value={formData.productName} onChange={(v) => setFormData((f) => ({ ...f, productName: v }))} placeholder="e.g. Commercial Treadmill T80" />
                  <DynamicSelectField label="Product Category" value={formData.productCategory} onChange={(v) => setFormData((f) => ({ ...f, productCategory: v }))} options={categoryOptions} placeholder="Select Product Category" />
                  <Field type="date" label="Purchase Date" value={formData.purchaseDate} onChange={(v) => setFormData((f) => ({ ...f, purchaseDate: v }))} />
                  <Field label="Invoice Number" value={formData.invoiceNumber} onChange={(v) => setFormData((f) => ({ ...f, invoiceNumber: v }))} placeholder="e.g. INV-2026-001" />
                  <Field type="number" label="Quantity" value={formData.quantity} onChange={(v) => setFormData((f) => ({ ...f, quantity: v }))} />
                  <Field type="number" label="Unit Price *" value={formData.unitPrice} onChange={(v) => setFormData((f) => ({ ...f, unitPrice: v }))} placeholder="0.00" />
                  <Field label="Purchase Order #" value={formData.purchaseOrderNumber} onChange={(v) => setFormData((f) => ({ ...f, purchaseOrderNumber: v }))} placeholder="e.g. PO-8821" />
                  <SelectField label="Payment Status" value={formData.paymentStatus} onChange={(v) => setFormData((f) => ({ ...f, paymentStatus: v }))} options={["pending", "partial", "paid", "overdue"]} />
                  <Field type="date" label="Payment Date" value={formData.paymentDate} onChange={(v) => setFormData((f) => ({ ...f, paymentDate: v }))} />
                  <DynamicSelectField label="Department" value={formData.department} onChange={(v) => setFormData((f) => ({ ...f, department: v }))} options={departmentOptions} placeholder="Select Department" />
                  <DynamicSelectField label="Location / Branch" value={formData.location} onChange={(v) => setFormData((f) => ({ ...f, location: v }))} options={branchOptions} placeholder="Select Location / Branch" />
                </div>

                {Boolean(formData.unitPrice) && (
                  <div className="p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-black dark:text-brand-white">Calculated Total Amount</span>
                    <span className="text-base font-black text-brand-gold">{currencySymbol}{calculatedTotal.toLocaleString()}</span>
                  </div>
                )}

                <TextAreaField label="Description" value={formData.description} onChange={(v) => setFormData((f) => ({ ...f, description: v }))} />

                <div className="p-4 rounded-2xl bg-brand-offwhite/60 dark:bg-brand-midnight/60 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.warranty.available} onChange={(e) => setFormData((f) => ({ ...f, warranty: { ...f.warranty, available: e.target.checked } }))} className="w-4 h-4 accent-brand-red cursor-pointer" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Warranty Available</span>
                  </label>
                  {formData.warranty.available && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Field type="date" label="Warranty Start" value={formData.warranty.startDate} onChange={(v) => setFormData((f) => ({ ...f, warranty: { ...f.warranty, startDate: v } }))} />
                      <Field type="date" label="Warranty End" value={formData.warranty.endDate} onChange={(v) => setFormData((f) => ({ ...f, warranty: { ...f.warranty, endDate: v } }))} />
                      <Field label="Serial Number" value={formData.warranty.serialNumber} onChange={(v) => setFormData((f) => ({ ...f, warranty: { ...f.warranty, serialNumber: v } }))} placeholder="e.g. SN-998822" />
                      <Field label="Asset ID" value={formData.warranty.assetId} onChange={(v) => setFormData((f) => ({ ...f, warranty: { ...f.warranty, assetId: v } }))} placeholder="e.g. AST-0012" />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : "Save Purchase"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.productName || "Purchase"} isDeleting={isDeleting} />
    </div>
  );
}

/* ==================== SERVICES ==================== */
const SERVICE_EMPTY = {
  serviceType: "",
  serviceDate: new Date().toISOString().split("T")[0],
  description: "",
  assignedTechnician: "",
  serviceRequestRef: "",
  completionStatus: "scheduled",
  serviceCost: "",
  nextServiceDate: "",
  remarks: "",
};

function ServicesTab({ vendorId, services, api, onChange, formatDate, currencySymbol }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(SERVICE_EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.createServiceRecord({
        vendor: vendorId,
        serviceType: formData.serviceType || undefined,
        serviceDate: formData.serviceDate,
        description: formData.description || undefined,
        assignedTechnician: formData.assignedTechnician || undefined,
        serviceRequestRef: formData.serviceRequestRef || undefined,
        completionStatus: formData.completionStatus,
        serviceCost: formData.serviceCost ? Number(formData.serviceCost) : undefined,
        nextServiceDate: formData.nextServiceDate || undefined,
        remarks: formData.remarks || undefined,
      });
      await onChange();
      setIsModalOpen(false);
      setFormData(SERVICE_EMPTY);
      Swal.fire({ title: "Saved!", text: "Service record added.", icon: "success", confirmButtonColor: "#FF1818", timer: 1800 });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save service record.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.deleteServiceRecord(deleteTarget._id);
      await onChange();
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer">
          <FiPlus /> Add Service Record
        </button>
      </div>

      <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
              <tr>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Next Service</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
              {services.length === 0 ? (
                <EmptyRow colSpan={7} message="No service history recorded yet." />
              ) : (
                services.map((s) => (
                  <tr key={s._id} className="hover:bg-brand-gold/5">
                    <td className="py-3 px-4 font-bold text-brand-black dark:text-brand-white">{s.serviceType || "—"}</td>
                    <td className="py-3 px-4 text-brand-dark-grey">{formatDate(s.serviceDate)}</td>
                    <td className="py-3 px-4 text-brand-dark-grey">{s.assignedTechnician || "—"}</td>
                    <td className="py-3 px-4 text-right font-bold">{s.serviceCost ? `${currencySymbol}${s.serviceCost.toLocaleString()}` : "—"}</td>
                    <td className="py-3 px-4 text-center"><Badge value={s.completionStatus} /></td>
                    <td className="py-3 px-4 text-brand-dark-grey">{s.nextServiceDate ? formatDate(s.nextServiceDate) : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                        <FiTrash2 className="text-sm" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-8">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">Add Service Record</h3>
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Service Type" value={formData.serviceType} onChange={(v) => setFormData((f) => ({ ...f, serviceType: v }))} placeholder="e.g. AC Servicing" />
                  <Field type="date" label="Service Date" value={formData.serviceDate} onChange={(v) => setFormData((f) => ({ ...f, serviceDate: v }))} />
                  <Field label="Assigned Technician" value={formData.assignedTechnician} onChange={(v) => setFormData((f) => ({ ...f, assignedTechnician: v }))} />
                  <Field label="Service Request Ref" value={formData.serviceRequestRef} onChange={(v) => setFormData((f) => ({ ...f, serviceRequestRef: v }))} />
                  <SelectField label="Completion Status" value={formData.completionStatus} onChange={(v) => setFormData((f) => ({ ...f, completionStatus: v }))} options={["scheduled", "in-progress", "completed", "cancelled"]} />
                  <Field type="number" label="Service Cost" value={formData.serviceCost} onChange={(v) => setFormData((f) => ({ ...f, serviceCost: v }))} />
                  <Field type="date" label="Next Service Date" value={formData.nextServiceDate} onChange={(v) => setFormData((f) => ({ ...f, nextServiceDate: v }))} />
                </div>
                <TextAreaField label="Description" value={formData.description} onChange={(v) => setFormData((f) => ({ ...f, description: v }))} />
                <TextAreaField label="Remarks" value={formData.remarks} onChange={(v) => setFormData((f) => ({ ...f, remarks: v }))} />

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : "Save Record"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.serviceType || "Service Record"} isDeleting={isDeleting} />
    </div>
  );
}

/* ==================== CONTRACTS ==================== */
const CONTRACT_EMPTY = {
  contractType: "",
  contractNumber: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  value: "",
  terms: "",
  autoRenew: false,
  remarks: "",
};

function ContractsTab({ vendorId, contracts, api, onChange, formatDate, currencySymbol }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(CONTRACT_EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.endDate) {
      Swal.fire({ title: "Missing field", text: "End date is required.", icon: "warning", confirmButtonColor: "#FF1818" });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createContract({
        vendor: vendorId,
        contractType: formData.contractType || undefined,
        contractNumber: formData.contractNumber || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        value: formData.value ? Number(formData.value) : undefined,
        terms: formData.terms || undefined,
        autoRenew: formData.autoRenew,
        remarks: formData.remarks || undefined,
      });
      await onChange();
      setIsModalOpen(false);
      setFormData(CONTRACT_EMPTY);
      Swal.fire({ title: "Saved!", text: "Contract added.", icon: "success", confirmButtonColor: "#FF1818", timer: 1800 });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save contract.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTerminate = async (contract) => {
    const result = await Swal.fire({ title: "Terminate contract?", text: `Mark "${contract.contractType || contract.contractNumber || "this contract"}" as terminated.`, icon: "warning", showCancelButton: true, confirmButtonColor: "#FF1818" });
    if (!result.isConfirmed) return;
    await api.updateContract(contract._id, { status: "terminated" });
    await onChange();
  };

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.deleteContract(deleteTarget._id);
      await onChange();
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer">
          <FiPlus /> Add Contract
        </button>
      </div>

      <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
              <tr>
                <th className="py-3 px-4">Contract</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
              {contracts.length === 0 ? (
                <EmptyRow colSpan={5} message="No contracts recorded yet." />
              ) : (
                contracts.map((c) => (
                  <tr key={c._id} className="hover:bg-brand-gold/5">
                    <td className="py-3 px-4">
                      <p className="font-bold text-brand-black dark:text-brand-white">{c.contractType || "Contract"}</p>
                      {c.contractNumber && <p className="text-[10px] text-brand-dark-grey">#{c.contractNumber}</p>}
                    </td>
                    <td className="py-3 px-4 text-brand-dark-grey">{formatDate(c.startDate)} → {formatDate(c.endDate)}</td>
                    <td className="py-3 px-4 text-right font-bold">{c.value ? `${currencySymbol}${c.value.toLocaleString()}` : "—"}</td>
                    <td className="py-3 px-4 text-center"><Badge value={c.status} /></td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {c.status !== "terminated" && (
                          <button onClick={() => handleTerminate(c)} className="px-2 py-1 rounded-lg text-[10px] font-bold text-brand-dark-grey bg-brand-beige/40 dark:bg-brand-midnight hover:bg-brand-black hover:text-white cursor-pointer">
                            Terminate
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-8">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">Add Contract</h3>
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contract Type" value={formData.contractType} onChange={(v) => setFormData((f) => ({ ...f, contractType: v }))} placeholder="e.g. Maintenance Agreement" />
                  <Field label="Contract Number" value={formData.contractNumber} onChange={(v) => setFormData((f) => ({ ...f, contractNumber: v }))} />
                  <Field type="date" label="Start Date" value={formData.startDate} onChange={(v) => setFormData((f) => ({ ...f, startDate: v }))} />
                  <Field type="date" label="End Date *" value={formData.endDate} onChange={(v) => setFormData((f) => ({ ...f, endDate: v }))} />
                  <Field type="number" label="Value" value={formData.value} onChange={(v) => setFormData((f) => ({ ...f, value: v }))} />
                  <label className="flex items-center gap-2 cursor-pointer mt-5">
                    <input type="checkbox" checked={formData.autoRenew} onChange={(e) => setFormData((f) => ({ ...f, autoRenew: e.target.checked }))} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                    <span className="font-bold text-brand-black dark:text-brand-white">Auto-renew</span>
                  </label>
                </div>
                <TextAreaField label="Terms" value={formData.terms} onChange={(v) => setFormData((f) => ({ ...f, terms: v }))} />
                <TextAreaField label="Remarks" value={formData.remarks} onChange={(v) => setFormData((f) => ({ ...f, remarks: v }))} />

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : "Save Contract"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.contractType || "Contract"} isDeleting={isDeleting} />
    </div>
  );
}

/* ==================== DOCUMENTS ==================== */
const DOCUMENT_TYPES = ["contract", "invoice", "purchase-order", "warranty-certificate", "service-report", "vendor-agreement", "quotation", "other"];

function DocumentsTab({ vendorId, documents, api, onChange }) {
  const inputRef = React.useRef(null);
  const [pendingType, setPendingType] = useState("other");
  const [pendingTitle, setPendingTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await api.uploadAndAttach(file, { vendor: vendorId, documentType: pendingType, title: pendingTitle || undefined, relatedType: "vendor" });
      await onChange();
      setPendingTitle("");
      Swal.fire({ title: "Uploaded!", text: "Document saved.", icon: "success", confirmButtonColor: "#FF1818", timer: 1800 });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to upload document.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.deleteDocument(deleteTarget._id);
      await onChange();
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Document Type</label>
          <select value={pendingType} onChange={(e) => setPendingType(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey cursor-pointer">
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/-/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Title (optional)</label>
          <input type="text" value={pendingTitle} onChange={(e) => setPendingTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey" />
        </div>
        <button onClick={() => inputRef.current?.click()} disabled={api.uploading} className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer disabled:opacity-50">
          {api.uploading ? <FiLoader className="animate-spin" /> : <FiPlus />} Upload Document
        </button>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} className="hidden" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {documents.length === 0 ? (
          <p className="col-span-full text-center py-10 text-brand-dark-grey text-xs">No documents uploaded yet.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc._id} className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                <FiFileText />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-brand-black dark:text-brand-white text-xs truncate">{doc.title || doc.fileName || "Document"}</p>
                <Badge value={doc.documentType} />
              </div>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight cursor-pointer">
                <FiDownload className="text-sm" />
              </a>
              <button onClick={() => setDeleteTarget(doc)} className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                <FiTrash2 className="text-sm" />
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "Document"} isDeleting={isDeleting} />
    </div>
  );
}

/* ==================== PERFORMANCE ==================== */
const PERFORMANCE_EMPTY = { serviceQuality: 3, responseTime: 3, productQuality: 3, pricing: 3, reliability: 3, remarks: "" };

function RatingInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">{label}</label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => onChange(n)} className="cursor-pointer">
            <FiStar className={n <= value ? "fill-brand-gold text-brand-gold" : "text-brand-beige dark:text-brand-dark-grey"} />
          </button>
        ))}
      </div>
    </div>
  );
}

function PerformanceTab({ vendorId, reviews, api, onChange, formatDate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(PERFORMANCE_EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const avgOverall = reviews.length ? (reviews.reduce((s, r) => s + (r.overallRating || 0), 0) / reviews.length).toFixed(1) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.createReview({ vendor: vendorId, ...formData });
      await onChange();
      setIsModalOpen(false);
      setFormData(PERFORMANCE_EMPTY);
      Swal.fire({ title: "Saved!", text: "Performance review recorded.", icon: "success", confirmButtonColor: "#FF1818", timer: 1800 });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save review.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.deleteReview(deleteTarget._id);
      await onChange();
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {avgOverall && (
          <div className="flex items-center gap-2 text-sm font-black text-brand-gold">
            <FiStar className="fill-current" /> {avgOverall} average · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </div>
        )}
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer ml-auto">
          <FiPlus /> Add Review
        </button>
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-center py-10 text-brand-dark-grey text-xs">No performance reviews yet.</p>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-black text-brand-gold text-sm"><FiStar className="fill-current" /> {r.overallRating?.toFixed(1)}</span>
                  <span className="text-[10px] text-brand-dark-grey">{formatDate(r.reviewDate)} {r.reviewedBy ? `· ${r.reviewedBy}` : ""}</span>
                </div>
                <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] text-brand-dark-grey">
                <span>Service: {r.serviceQuality}/5</span>
                <span>Response: {r.responseTime}/5</span>
                <span>Product: {r.productQuality}/5</span>
                <span>Pricing: {r.pricing}/5</span>
                <span>Reliability: {r.reliability}/5</span>
              </div>
              {r.remarks && <p className="mt-2 text-xs text-brand-dark-grey">{r.remarks}</p>}
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-8">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">Add Performance Review</h3>
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <RatingInput label="Service Quality" value={formData.serviceQuality} onChange={(v) => setFormData((f) => ({ ...f, serviceQuality: v }))} />
                  <RatingInput label="Response Time" value={formData.responseTime} onChange={(v) => setFormData((f) => ({ ...f, responseTime: v }))} />
                  <RatingInput label="Product Quality" value={formData.productQuality} onChange={(v) => setFormData((f) => ({ ...f, productQuality: v }))} />
                  <RatingInput label="Pricing" value={formData.pricing} onChange={(v) => setFormData((f) => ({ ...f, pricing: v }))} />
                  <RatingInput label="Reliability" value={formData.reliability} onChange={(v) => setFormData((f) => ({ ...f, reliability: v }))} />
                </div>
                <TextAreaField label="Remarks" value={formData.remarks} onChange={(v) => setFormData((f) => ({ ...f, remarks: v }))} />

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : "Save Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)} onConfirm={handleDelete} itemName="Performance review" isDeleting={isDeleting} />
    </div>
  );
}

/* ==================== SHARED FIELD HELPERS ==================== */
function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey cursor-pointer capitalize">
        {options.map((o) => (
          <option key={o} value={o}>{o.replace(/-/g, " ")}</option>
        ))}
      </select>
    </div>
  );
}

function DynamicSelectField({ label, value, onChange, options = [], placeholder = "Select Option" }) {
  return (
    <div>
      <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value || opt.title || opt.name;
          const lbl = typeof opt === "string" ? opt : opt.label || opt.title || opt.name || opt.branchName;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">{label}</label>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
      />
    </div>
  );
}
