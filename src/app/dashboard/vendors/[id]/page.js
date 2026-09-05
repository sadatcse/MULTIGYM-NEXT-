"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import useUserPermissions from "@/hooks/useUserPermissions";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import Avatar from "@/components/Comon/Avatar";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import PurchaseDetailsModal from "@/components/Vendors/PurchaseDetailsModal";
import ServiceDetailsModal from "@/components/Vendors/ServiceDetailsModal";
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
  FiEdit3,
  FiCreditCard,
  FiList,
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

  const { can } = useUserPermissions();
  const canView = can("vendor-details", "view");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [loadHistory]);

  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl my-12">
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">Access Restricted</h2>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            You do not have permission to view specific Vendor Details. Please contact your system administrator.
          </p>
          <button onClick={() => router.push("/dashboard/vendors")} className="px-5 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-bold cursor-pointer">
            Back to Directory
          </button>
        </div>
      </div>
    );
  }

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

      {(() => {
        const totalPurchasesDue = (purchases || []).reduce((sum, p) => sum + (p.amountDue || 0), 0);
        const totalServicesDue = (services || []).reduce((sum, s) => sum + (s.amountDue || 0), 0);
        const totalDue = totalPurchasesDue + totalServicesDue;
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Spend" value={`${currencySymbol}${stats.totalSpend.toLocaleString()}`} icon={FiDollarSign} />
            <StatCard label="Total Outstanding Due" value={`${currencySymbol}${totalDue.toLocaleString()}`} icon={FiCreditCard} color={totalDue > 0 ? "rose-500" : "emerald-500"} />
            <StatCard label="Purchases" value={stats.totalPurchases} icon={FiShoppingBag} color="blue-500" />
            <StatCard label="Active Warranties" value={stats.activeWarrantyCount} icon={FiCheckCircle} color="emerald-500" />
            <StatCard label="Upcoming Services" value={stats.upcomingServiceCount} icon={FiTool} color="amber-500" />
            <StatCard label="Contracts" value={stats.totalContracts} icon={FiFileText} color="brand-primary" />
          </div>
        );
      })()}

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
const PURCHASE_ITEM_EMPTY = {
  productName: "",
  productCategory: "",
  description: "",
  quantity: 1,
  unitPrice: "",
  warranty: { available: false, startDate: "", endDate: "", durationMonths: "", serialNumber: "", assetId: "" },
};

const PURCHASE_EMPTY = {
  purchaseDate: new Date().toISOString().split("T")[0],
  invoiceNumber: "",
  purchaseOrderNumber: "",
  description: "",
  department: "",
  location: "",
  dueDate: "",
  paymentOption: "pending", // "paid" (Full Paid) | "partial" (Partial Paid) | "pending" (Due / Unpaid)
  initialPaymentAmount: "",
  initialPaymentMethod: "cash",
  initialPaymentReference: "",
  initialPaymentNote: "",
  items: [PURCHASE_ITEM_EMPTY],
};

const PAYMENT_EMPTY = {
  amount: "",
  paymentDate: new Date().toISOString().split("T")[0],
  method: "cash",
  reference: "",
  note: "",
};

function purchaseToFormData(purchase) {
  return {
    purchaseDate: purchase.purchaseDate ? purchase.purchaseDate.split("T")[0] : PURCHASE_EMPTY.purchaseDate,
    invoiceNumber: purchase.invoiceNumber || "",
    purchaseOrderNumber: purchase.purchaseOrderNumber || "",
    description: purchase.description || "",
    department: purchase.department || "",
    location: purchase.location || "",
    dueDate: purchase.dueDate ? purchase.dueDate.split("T")[0] : "",
    paymentOption: purchase.paymentStatus === "paid" ? "paid" : purchase.paymentStatus === "partial" ? "partial" : "pending",
    initialPaymentAmount: purchase.amountPaid || "",
    initialPaymentMethod: "cash",
    initialPaymentReference: "",
    initialPaymentNote: "",
    items: (purchase.items || []).map((item) => ({
      productName: item.productName || "",
      productCategory: item.productCategory || "",
      description: item.description || "",
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice ?? "",
      warranty: {
        available: !!item.warranty?.available,
        startDate: item.warranty?.startDate ? item.warranty.startDate.split("T")[0] : "",
        endDate: item.warranty?.endDate ? item.warranty.endDate.split("T")[0] : "",
        durationMonths: item.warranty?.durationMonths ?? "",
        serialNumber: item.warranty?.serialNumber || "",
        assetId: item.warranty?.assetId || "",
      },
    })),
  };
}

function PurchasesTab({ vendorId, purchases, api, onChange, formatDate, currencySymbol }) {
  const { departments } = useDepartmentApi(100);
  const { branches } = useBranchApi(100);
  const { productCategories } = useProductCategoryApi(100);
  const { can } = useUserPermissions();
  const canAdd = can("vendor-details", "add");
  const canEdit = can("vendor-details", "edit");
  const canDelete = can("vendor-details", "delete");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState(PURCHASE_EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Synchronous double-click guards: checked/set at the very top of each
  // handler (before any await), because `disabled={isSubmitting}` only takes
  // effect after React re-renders — a same-tick double-click (or two clicks
  // that land before that re-render commits) would otherwise both pass the
  // stale `isSubmitting === false` check and fire two requests.
  const submitLockRef = useRef(false);
  const paymentLockRef = useRef(false);

  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentForm, setPaymentForm] = useState(PAYMENT_EMPTY);
  const [isPaying, setIsPaying] = useState(false);

  const [ledgerTarget, setLedgerTarget] = useState(null);
  const [removingPaymentId, setRemovingPaymentId] = useState(null);

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

  const grandTotal = formData.items.reduce((sum, item) => sum + Number(item.quantity || 1) * Number(item.unitPrice || 0), 0);

  const openAddModal = () => {
    setEditTarget(null);
    setFormData(PURCHASE_EMPTY);
    setIsModalOpen(true);
  };

  const openEditModal = (purchase) => {
    setEditTarget(purchase);
    setFormData(purchaseToFormData(purchase));
    setIsModalOpen(true);
  };

  const updateItem = (index, field, value) => {
    setFormData((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const updateItemWarranty = (index, field, value) => {
    setFormData((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === index ? { ...item, warranty: { ...item.warranty, [field]: value } } : item)),
    }));
  };

  const addItemRow = () => setFormData((f) => ({ ...f, items: [...f.items, { ...PURCHASE_ITEM_EMPTY, warranty: { ...PURCHASE_ITEM_EMPTY.warranty } }] }));
  const removeItemRow = (index) => setFormData((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    const invalidItem = formData.items.find((item) => !item.productName.trim() || !item.unitPrice);
    if (formData.items.length === 0 || invalidItem) {
      Swal.fire({ title: "Missing fields", text: "Every item needs a product name and unit price, and at least one item is required.", icon: "warning", confirmButtonColor: "#FF1818" });
      return;
    }
    submitLockRef.current = true;

    const calculatedInitialPay =
      formData.paymentOption === "paid"
        ? grandTotal
        : formData.paymentOption === "partial"
        ? Number(formData.initialPaymentAmount || 0)
        : 0;

    setIsSubmitting(true);
    try {
      const payload = {
        vendor: vendorId,
        purchaseDate: formData.purchaseDate,
        invoiceNumber: formData.invoiceNumber || undefined,
        purchaseOrderNumber: formData.purchaseOrderNumber || undefined,
        description: formData.description || undefined,
        department: formData.department || undefined,
        location: formData.location || undefined,
        dueDate: formData.dueDate || undefined,
        initialPaymentAmount: calculatedInitialPay > 0 ? calculatedInitialPay : undefined,
        initialPaymentMethod: calculatedInitialPay > 0 ? formData.initialPaymentMethod || "cash" : undefined,
        initialPaymentReference: formData.initialPaymentReference || undefined,
        initialPaymentNote: formData.initialPaymentNote || undefined,
        items: formData.items.map((item) => ({
          productName: item.productName.trim(),
          productCategory: item.productCategory || undefined,
          description: item.description || undefined,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice),
          warranty: item.warranty.available
            ? {
                available: true,
                startDate: item.warranty.startDate || undefined,
                endDate: item.warranty.endDate || undefined,
                durationMonths: item.warranty.durationMonths ? Number(item.warranty.durationMonths) : undefined,
                serialNumber: item.warranty.serialNumber || undefined,
                assetId: item.warranty.assetId || undefined,
              }
            : { available: false },
        })),
      };
      if (editTarget) {
        await api.updatePurchase(editTarget._id, payload);
      } else {
        await api.createPurchase(payload);
      }
      await onChange();
      setIsModalOpen(false);
      setEditTarget(null);
      setFormData(PURCHASE_EMPTY);
      Swal.fire({ title: editTarget ? "Updated!" : "Recorded!", text: "Purchase saved successfully.", icon: "success", confirmButtonColor: "#FF1818", timer: 1800 });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save purchase.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      submitLockRef.current = false;
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

  const openPaymentModal = (purchase) => {
    setPaymentTarget(purchase);
    setPaymentForm({ ...PAYMENT_EMPTY });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (isPaying || paymentLockRef.current || !paymentTarget) return;
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      Swal.fire({ title: "Missing amount", text: "Enter a payment amount greater than zero.", icon: "warning", confirmButtonColor: "#FF1818" });
      return;
    }
    paymentLockRef.current = true;
    setIsPaying(true);
    try {
      await api.addPayment(paymentTarget._id, {
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
        note: paymentForm.note || undefined,
      });
      await onChange();
      setPaymentTarget(null);
      Swal.fire({ title: "Payment Recorded!", icon: "success", confirmButtonColor: "#FF1818", timer: 1500 });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to record payment.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      paymentLockRef.current = false;
      setIsPaying(false);
    }
  };

  const handleRemovePayment = async (payment) => {
    if (!ledgerTarget) return;
    const result = await Swal.fire({ title: "Remove this payment entry?", text: `${currencySymbol}${payment.amount.toLocaleString()} recorded on ${formatDate(payment.paymentDate)} will be reversed.`, icon: "warning", showCancelButton: true, confirmButtonColor: "#FF1818" });
    if (!result.isConfirmed) return;
    setRemovingPaymentId(payment._id);
    try {
      const res = await api.removePayment(ledgerTarget._id, payment._id);
      setLedgerTarget(res.data);
      await onChange();
    } catch (err) {
      Swal.fire({ title: "Error", text: "Failed to remove payment entry.", icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setRemovingPaymentId(null);
    }
  };

  return (
    <div className="space-y-4">
      {canAdd && (
        <div className="flex justify-end">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer">
            <FiPlus /> Add Purchase
          </motion.button>
        </div>
      )}

      <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
              {purchases.length === 0 ? (
                <EmptyRow colSpan={7} message="No purchases recorded yet." />
              ) : (
                purchases.map((p) => {
                  const items = p.items || [];
                  const firstItemName = items[0]?.productName || "—";
                  const extraCount = items.length - 1;
                  return (
                    <tr key={p._id} className="hover:bg-brand-gold/5">
                      <td className="py-3 px-4">
                        <p className="font-bold text-brand-black dark:text-brand-white">
                          {firstItemName}
                          {extraCount > 0 && <span className="text-brand-dark-grey font-medium"> +{extraCount} more</span>}
                        </p>
                        {p.invoiceNumber && <p className="text-[10px] text-brand-dark-grey">Inv# {p.invoiceNumber}</p>}
                      </td>
                      <td className="py-3 px-4 text-brand-dark-grey">{formatDate(p.purchaseDate)}</td>
                      <td className="py-3 px-4 text-right font-bold text-brand-black dark:text-brand-white">{currencySymbol}{p.totalAmount?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-500">{currencySymbol}{p.amountPaid?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-brand-red">{currencySymbol}{p.amountDue?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center"><Badge value={p.paymentStatus} /></td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setLedgerTarget(p)} title="View Ledger" className="p-1.5 rounded-lg text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight cursor-pointer">
                            <FiList className="text-sm" />
                          </button>
                          {canEdit && p.amountDue > 0 && (
                            <button onClick={() => openPaymentModal(p)} title="Record Payment" className="p-1.5 rounded-lg text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white cursor-pointer">
                              <FiCreditCard className="text-sm" />
                            </button>
                          )}
                          {canEdit && (
                            <button onClick={() => openEditModal(p)} title="Edit" className="p-1.5 rounded-lg text-blue-500 bg-blue-500/10 hover:bg-blue-500 hover:text-white cursor-pointer">
                              <FiEdit3 className="text-sm" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteTarget(p)} title="Delete" className="p-1.5 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                              <FiTrash2 className="text-sm" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Purchase Order Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden my-6 border border-brand-beige/60 dark:border-brand-dark-grey/60">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">{editTarget ? "Edit Purchase Order" : "Add Purchase Order"}</h3>
                  <p className="text-[11px] text-brand-dark-grey font-medium">Buy one or multiple products in a single order — payment is recorded separately as a ledger.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <Field type="date" label="Purchase Date" value={formData.purchaseDate} onChange={(v) => setFormData((f) => ({ ...f, purchaseDate: v }))} />
                  <Field label="Invoice Number" value={formData.invoiceNumber} onChange={(v) => setFormData((f) => ({ ...f, invoiceNumber: v }))} placeholder="e.g. INV-2026-001" />
                  <Field label="Purchase Order #" value={formData.purchaseOrderNumber} onChange={(v) => setFormData((f) => ({ ...f, purchaseOrderNumber: v }))} placeholder="e.g. PO-8821" />
                  <DynamicSelectField label="Department" value={formData.department} onChange={(v) => setFormData((f) => ({ ...f, department: v }))} options={departmentOptions} placeholder="Select Department" />
                  <DynamicSelectField label="Location / Branch" value={formData.location} onChange={(v) => setFormData((f) => ({ ...f, location: v }))} options={branchOptions} placeholder="Select Location / Branch" />
                  <Field type="date" label="Payment Due Date" value={formData.dueDate} onChange={(v) => setFormData((f) => ({ ...f, dueDate: v }))} />
                </div>

                <TextAreaField label="Order Notes" value={formData.description} onChange={(v) => setFormData((f) => ({ ...f, description: v }))} />

                <div className="pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Product Items</h4>
                    <button type="button" onClick={addItemRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white cursor-pointer">
                      <FiPlus className="text-xs" /> Add Product
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-4 rounded-2xl bg-brand-offwhite/60 dark:bg-brand-midnight/60 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey">Item {index + 1}</span>
                          {formData.items.length > 1 && (
                            <button type="button" onClick={() => removeItemRow(index)} className="p-1 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                              <FiTrash2 className="text-xs" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <Field label="Product Name *" value={item.productName} onChange={(v) => updateItem(index, "productName", v)} placeholder="e.g. Commercial Treadmill T80" />
                          <DynamicSelectField label="Product Category" value={item.productCategory} onChange={(v) => updateItem(index, "productCategory", v)} options={categoryOptions} placeholder="Select Product Category" />
                          <Field type="number" label="Quantity" value={item.quantity} onChange={(v) => updateItem(index, "quantity", v)} />
                          <Field type="number" label="Unit Price *" value={item.unitPrice} onChange={(v) => updateItem(index, "unitPrice", v)} placeholder="0.00" />
                        </div>
                        {Boolean(item.unitPrice) && (
                          <p className="text-[11px] font-bold text-brand-gold">Line total: {currencySymbol}{(Number(item.quantity || 1) * Number(item.unitPrice || 0)).toLocaleString()}</p>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={item.warranty.available} onChange={(e) => updateItemWarranty(index, "available", e.target.checked)} className="w-4 h-4 accent-brand-red cursor-pointer" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold">Warranty Available</span>
                        </label>
                        {item.warranty.available && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <Field type="date" label="Warranty Start" value={item.warranty.startDate} onChange={(v) => updateItemWarranty(index, "startDate", v)} />
                            <Field type="date" label="Warranty End" value={item.warranty.endDate} onChange={(v) => updateItemWarranty(index, "endDate", v)} />
                            <Field label="Serial Number" value={item.warranty.serialNumber} onChange={(v) => updateItemWarranty(index, "serialNumber", v)} placeholder="e.g. SN-998822" />
                            <Field label="Asset ID" value={item.warranty.assetId} onChange={(v) => updateItemWarranty(index, "assetId", v)} placeholder="e.g. AST-0012" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Status & Initial Repayment Options */}
                {!editTarget && (
                  <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">
                        Payment Status & Upfront Payment
                      </h4>
                      <span className="text-[10px] text-brand-dark-grey">
                        Set upfront payment status for this purchase order
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                          Payment Status *
                        </label>
                        <select
                          value={formData.paymentOption}
                          onChange={(e) => {
                            const opt = e.target.value;
                            setFormData((f) => ({
                              ...f,
                              paymentOption: opt,
                              initialPaymentAmount: opt === "paid" ? grandTotal : opt === "pending" ? "" : f.initialPaymentAmount,
                            }));
                          }}
                          className="w-full bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey rounded-xl px-3 py-2 text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                        >
                          <option value="pending">Due / Unpaid (0% Upfront)</option>
                          <option value="partial">Partial Paid (Installment)</option>
                          <option value="paid">Full Paid (100% Upfront)</option>
                        </select>
                      </div>

                      {formData.paymentOption === "partial" && (
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                            Upfront Paid Amount ({currencySymbol}) *
                          </label>
                          <input
                            type="number"
                            value={formData.initialPaymentAmount}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                initialPaymentAmount: e.target.value,
                              }))
                            }
                            placeholder={`Max ${grandTotal}`}
                            className="w-full bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey rounded-xl px-3 py-2 text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>
                      )}

                      {formData.paymentOption !== "pending" && (
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                            Payment Method
                          </label>
                          <select
                            value={formData.initialPaymentMethod}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                initialPaymentMethod: e.target.value,
                              }))
                            }
                            className="w-full bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey rounded-xl px-3 py-2 text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                          >
                            <option value="cash">Cash</option>
                            <option value="bank-transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="mobile-banking">Mobile Banking (bKash/Nagad)</option>
                            <option value="card">Credit / Debit Card</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Calculated Balance Preview */}
                    <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
                      <div>
                        Upfront Paid: <span className="text-emerald-500 font-black">{currencySymbol}{(formData.paymentOption === "paid" ? grandTotal : formData.paymentOption === "partial" ? Number(formData.initialPaymentAmount || 0) : 0).toLocaleString()}</span>
                      </div>
                      <div>
                        Remaining Balance Due: <span className="text-brand-red font-black">{currencySymbol}{Math.max(grandTotal - (formData.paymentOption === "paid" ? grandTotal : formData.paymentOption === "partial" ? Number(formData.initialPaymentAmount || 0) : 0), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-black dark:text-brand-white">Grand Total ({formData.items.length} item{formData.items.length !== 1 ? "s" : ""})</span>
                  <span className="text-base font-black text-brand-gold">{currencySymbol}{grandTotal.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : editTarget ? "Save Changes" : "Save Purchase Order"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Repayment Modal */}
      <AnimatePresence>
        {paymentTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-8 border border-brand-beige/60 dark:border-brand-dark-grey/60">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">Record Repayment / Installment</h3>
                  <p className="text-[11px] text-brand-dark-grey font-medium">Record installment payment against remaining balance due.</p>
                </div>
                <button onClick={() => setPaymentTarget(null)} disabled={isPaying} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={handleSubmitPayment} className="p-6 space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-dark-grey font-medium">Total Order Amount:</span>
                    <span className="font-bold text-brand-black dark:text-brand-white">{currencySymbol}{paymentTarget.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-dark-grey font-medium">Paid So Far:</span>
                    <span className="font-bold text-emerald-500">{currencySymbol}{paymentTarget.amountPaid?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
                    <span className="font-bold text-brand-black dark:text-brand-white">Current Balance Due:</span>
                    <span className="font-black text-brand-red">{currencySymbol}{paymentTarget.amountDue?.toLocaleString()}</span>
                  </div>
                </div>

                <Field type="number" label="Repayment Amount *" value={paymentForm.amount} onChange={(v) => setPaymentForm((f) => ({ ...f, amount: v }))} placeholder={`Max ${paymentTarget.amountDue}`} />
                <Field type="date" label="Payment Date" value={paymentForm.paymentDate} onChange={(v) => setPaymentForm((f) => ({ ...f, paymentDate: v }))} />
                <SelectField label="Payment Method" value={paymentForm.method} onChange={(v) => setPaymentForm((f) => ({ ...f, method: v }))} options={["cash", "bank-transfer", "cheque", "mobile-banking", "card", "other"]} />
                <Field label="Payment Reference / Txn ID" value={paymentForm.reference} onChange={(v) => setPaymentForm((f) => ({ ...f, reference: v }))} placeholder="e.g. Txn ID / cheque no." />
                <TextAreaField label="Payment Note" value={paymentForm.note} onChange={(v) => setPaymentForm((f) => ({ ...f, note: v }))} />

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setPaymentTarget(null)} disabled={isPaying} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="submit" disabled={isPaying} className="px-6 py-2 rounded-2xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md shadow-emerald-500/20">
                    {isPaying ? <FiLoader className="animate-spin" /> : "Save Repayment"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full View Purchase Order & Payment Ledger Modal */}
      <PurchaseDetailsModal
        isOpen={!!ledgerTarget}
        purchase={ledgerTarget}
        onClose={() => setLedgerTarget(null)}
        formatDate={formatDate}
        currencySymbol={currencySymbol}
        onRecordPayment={openPaymentModal}
        onRemovePayment={handleRemovePayment}
        removingPaymentId={removingPaymentId}
        canDelete={canDelete}
        canEdit={canEdit}
      />

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.items?.[0]?.productName || "Purchase"} isDeleting={isDeleting} />
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
  dueDate: "",
  nextServiceDate: "",
  remarks: "",
  paymentOption: "pending", // "paid" (Full Paid) | "partial" (Partial Paid) | "pending" (Due / Unpaid)
  initialPaymentAmount: "",
  initialPaymentMethod: "cash",
  initialPaymentReference: "",
  initialPaymentNote: "",
};

function ServicesTab({ vendorId, services, api, onChange, formatDate, currencySymbol }) {
  const { can } = useUserPermissions();
  const canAdd = can("vendor-details", "add");
  const canEdit = can("vendor-details", "edit");
  const canDelete = can("vendor-details", "delete");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState(SERVICE_EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const submitLockRef = useRef(false);
  const paymentLockRef = useRef(false);

  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentForm, setPaymentForm] = useState(PAYMENT_EMPTY);
  const [isPaying, setIsPaying] = useState(false);

  const [ledgerTarget, setLedgerTarget] = useState(null);
  const [removingPaymentId, setRemovingPaymentId] = useState(null);

  const openAddModal = () => {
    setEditTarget(null);
    setFormData(SERVICE_EMPTY);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditTarget(record);
    setFormData({
      serviceType: record.serviceType || "",
      serviceDate: record.serviceDate ? record.serviceDate.split("T")[0] : SERVICE_EMPTY.serviceDate,
      description: record.description || "",
      assignedTechnician: record.assignedTechnician || "",
      serviceRequestRef: record.serviceRequestRef || "",
      completionStatus: record.completionStatus || "scheduled",
      serviceCost: record.serviceCost ?? "",
      dueDate: record.dueDate ? record.dueDate.split("T")[0] : "",
      nextServiceDate: record.nextServiceDate ? record.nextServiceDate.split("T")[0] : "",
      remarks: record.remarks || "",
      paymentOption: record.paymentStatus === "paid" ? "paid" : record.paymentStatus === "partial" ? "partial" : "pending",
      initialPaymentAmount: record.amountPaid || "",
      initialPaymentMethod: "cash",
      initialPaymentReference: "",
      initialPaymentNote: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    const serviceCostNum = Number(formData.serviceCost || 0);
    const calculatedInitialPay =
      formData.paymentOption === "paid"
        ? serviceCostNum
        : formData.paymentOption === "partial"
        ? Number(formData.initialPaymentAmount || 0)
        : 0;

    try {
      const payload = {
        vendor: vendorId,
        serviceType: formData.serviceType || undefined,
        serviceDate: formData.serviceDate,
        description: formData.description || undefined,
        assignedTechnician: formData.assignedTechnician || undefined,
        serviceRequestRef: formData.serviceRequestRef || undefined,
        completionStatus: formData.completionStatus,
        serviceCost: serviceCostNum > 0 ? serviceCostNum : undefined,
        dueDate: formData.dueDate || undefined,
        nextServiceDate: formData.nextServiceDate || undefined,
        remarks: formData.remarks || undefined,
        initialPaymentAmount: calculatedInitialPay > 0 ? calculatedInitialPay : undefined,
        initialPaymentMethod: calculatedInitialPay > 0 ? formData.initialPaymentMethod || "cash" : undefined,
        initialPaymentReference: formData.initialPaymentReference || undefined,
        initialPaymentNote: formData.initialPaymentNote || undefined,
      };
      if (editTarget) {
        await api.updateServiceRecord(editTarget._id, payload);
      } else {
        await api.createServiceRecord(payload);
      }
      await onChange();
      setIsModalOpen(false);
      setEditTarget(null);
      setFormData(SERVICE_EMPTY);
      Swal.fire({ title: editTarget ? "Updated!" : "Saved!", text: editTarget ? "Service record updated." : "Service record added.", icon: "success", confirmButtonColor: "#FF1818", timer: 1800 });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save service record.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      submitLockRef.current = false;
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

  const openPaymentModal = (record) => {
    setPaymentTarget(record);
    setPaymentForm({ ...PAYMENT_EMPTY });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (isPaying || paymentLockRef.current || !paymentTarget) return;
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      Swal.fire({ title: "Missing amount", text: "Enter a payment amount greater than zero.", icon: "warning", confirmButtonColor: "#FF1818" });
      return;
    }
    paymentLockRef.current = true;
    setIsPaying(true);
    try {
      await api.addPayment(paymentTarget._id, {
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
        note: paymentForm.note || undefined,
      });
      await onChange();
      setPaymentTarget(null);
      Swal.fire({ title: "Service Payment Recorded!", icon: "success", confirmButtonColor: "#FF1818", timer: 1500 });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to record payment.";
      Swal.fire({ title: "Error!", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      paymentLockRef.current = false;
      setIsPaying(false);
    }
  };

  const handleRemovePayment = async (payment) => {
    if (!ledgerTarget) return;
    const result = await Swal.fire({ title: "Remove this payment entry?", text: `${currencySymbol}${payment.amount.toLocaleString()} recorded on ${formatDate(payment.paymentDate)} will be reversed.`, icon: "warning", showCancelButton: true, confirmButtonColor: "#FF1818" });
    if (!result.isConfirmed) return;
    setRemovingPaymentId(payment._id);
    try {
      const res = await api.removePayment(ledgerTarget._id, payment._id);
      setLedgerTarget(res.data);
      await onChange();
    } catch (err) {
      Swal.fire({ title: "Error", text: "Failed to remove payment entry.", icon: "error", confirmButtonColor: "#FF1818" });
    } finally {
      setRemovingPaymentId(null);
    }
  };

  return (
    <div className="space-y-4">
      {canAdd && (
        <div className="flex justify-end">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer">
            <FiPlus /> Add Service Record
          </motion.button>
        </div>
      )}

      <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
              <tr>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Pay Status</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Next Service</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
              {services.length === 0 ? (
                <EmptyRow colSpan={10} message="No service history recorded yet." />
              ) : (
                services.map((s) => (
                  <tr key={s._id} className="hover:bg-brand-gold/5">
                    <td className="py-3 px-4 font-bold text-brand-black dark:text-brand-white">{s.serviceType || "—"}</td>
                    <td className="py-3 px-4 text-brand-dark-grey">{formatDate(s.serviceDate)}</td>
                    <td className="py-3 px-4 text-brand-dark-grey">{s.assignedTechnician || "—"}</td>
                    <td className="py-3 px-4 text-right font-bold text-brand-black dark:text-brand-white">{s.serviceCost ? `${currencySymbol}${s.serviceCost.toLocaleString()}` : "—"}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-500">{currencySymbol}${(s.amountPaid || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-brand-red">{currencySymbol}${(s.amountDue || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-center"><Badge value={s.paymentStatus || "pending"} /></td>
                    <td className="py-3 px-4 text-center"><Badge value={s.completionStatus} /></td>
                    <td className="py-3 px-4 text-brand-dark-grey">{s.nextServiceDate ? formatDate(s.nextServiceDate) : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setLedgerTarget(s)} title="View Payment Ledger" className="p-1.5 rounded-lg text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight cursor-pointer">
                          <FiList className="text-sm" />
                        </button>
                        {canEdit && (s.amountDue || 0) > 0 && (
                          <button onClick={() => openPaymentModal(s)} title="Record Repayment" className="p-1.5 rounded-lg text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white cursor-pointer">
                            <FiCreditCard className="text-sm" />
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => openEditModal(s)} title="Edit" className="p-1.5 rounded-lg text-blue-500 bg-blue-500/10 hover:bg-blue-500 hover:text-white cursor-pointer">
                            <FiEdit3 className="text-sm" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteTarget(s)} title="Delete" className="p-1.5 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                            <FiTrash2 className="text-sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Service Record Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-6 border border-brand-beige/60 dark:border-brand-dark-grey/60">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">{editTarget ? "Edit Service Record" : "Add Service Record"}</h3>
                  <p className="text-[11px] text-brand-dark-grey font-medium">Record maintenance, repairs, or servicing bills for this vendor.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Service Type" value={formData.serviceType} onChange={(v) => setFormData((f) => ({ ...f, serviceType: v }))} placeholder="e.g. AC Servicing / Treadmill Repair" />
                  <Field type="date" label="Service Date" value={formData.serviceDate} onChange={(v) => setFormData((f) => ({ ...f, serviceDate: v }))} />
                  <Field label="Assigned Technician" value={formData.assignedTechnician} onChange={(v) => setFormData((f) => ({ ...f, assignedTechnician: v }))} placeholder="e.g. Eng. Rahat" />
                  <Field label="Service Request Ref" value={formData.serviceRequestRef} onChange={(v) => setFormData((f) => ({ ...f, serviceRequestRef: v }))} placeholder="e.g. SR-2026-99" />
                  <SelectField label="Completion Status" value={formData.completionStatus} onChange={(v) => setFormData((f) => ({ ...f, completionStatus: v }))} options={["scheduled", "in-progress", "completed", "cancelled"]} />
                  <Field type="number" label="Service Bill Cost" value={formData.serviceCost} onChange={(v) => setFormData((f) => ({ ...f, serviceCost: v }))} placeholder="0.00" />
                  <Field type="date" label="Payment Due Date" value={formData.dueDate} onChange={(v) => setFormData((f) => ({ ...f, dueDate: v }))} />
                  <Field type="date" label="Next Service Date" value={formData.nextServiceDate} onChange={(v) => setFormData((f) => ({ ...f, nextServiceDate: v }))} />
                </div>

                <TextAreaField label="Description" value={formData.description} onChange={(v) => setFormData((f) => ({ ...f, description: v }))} />

                {/* Upfront Payment & Status Section for Service */}
                {!editTarget && (
                  <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">
                        Service Payment Status & Upfront Payment
                      </h4>
                      <span className="text-[10px] text-brand-dark-grey">
                        Set payment status for this service bill
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                          Payment Status *
                        </label>
                        <select
                          value={formData.paymentOption}
                          onChange={(e) => {
                            const opt = e.target.value;
                            const costNum = Number(formData.serviceCost || 0);
                            setFormData((f) => ({
                              ...f,
                              paymentOption: opt,
                              initialPaymentAmount: opt === "paid" ? costNum : opt === "pending" ? "" : f.initialPaymentAmount,
                            }));
                          }}
                          className="w-full bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey rounded-xl px-3 py-2 text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                        >
                          <option value="pending">Due / Unpaid (0% Upfront)</option>
                          <option value="partial">Partial Paid (Installment)</option>
                          <option value="paid">Full Paid (100% Upfront)</option>
                        </select>
                      </div>

                      {formData.paymentOption === "partial" && (
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                            Upfront Paid Amount ({currencySymbol}) *
                          </label>
                          <input
                            type="number"
                            value={formData.initialPaymentAmount}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                initialPaymentAmount: e.target.value,
                              }))
                            }
                            placeholder={`Max ${Number(formData.serviceCost || 0)}`}
                            className="w-full bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey rounded-xl px-3 py-2 text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>
                      )}

                      {formData.paymentOption !== "pending" && (
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                            Payment Method
                          </label>
                          <select
                            value={formData.initialPaymentMethod}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                initialPaymentMethod: e.target.value,
                              }))
                            }
                            className="w-full bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey rounded-xl px-3 py-2 text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                          >
                            <option value="cash">Cash</option>
                            <option value="bank-transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="mobile-banking">Mobile Banking (bKash/Nagad)</option>
                            <option value="card">Credit / Debit Card</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Calculated Balance Preview */}
                    {Boolean(formData.serviceCost) && (
                      <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
                        <div>
                          Upfront Paid: <span className="text-emerald-500 font-black">{currencySymbol}{(formData.paymentOption === "paid" ? Number(formData.serviceCost || 0) : formData.paymentOption === "partial" ? Number(formData.initialPaymentAmount || 0) : 0).toLocaleString()}</span>
                        </div>
                        <div>
                          Remaining Due: <span className="text-brand-red font-black">{currencySymbol}{Math.max(Number(formData.serviceCost || 0) - (formData.paymentOption === "paid" ? Number(formData.serviceCost || 0) : formData.paymentOption === "partial" ? Number(formData.initialPaymentAmount || 0) : 0), 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <TextAreaField label="Remarks" value={formData.remarks} onChange={(v) => setFormData((f) => ({ ...f, remarks: v }))} />

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : editTarget ? "Save Changes" : "Save Service Record"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Service Repayment Modal */}
      <AnimatePresence>
        {paymentTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-8 border border-brand-beige/60 dark:border-brand-dark-grey/60">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">Record Service Repayment</h3>
                  <p className="text-[11px] text-brand-dark-grey font-medium">Record payment against remaining service bill due.</p>
                </div>
                <button onClick={() => setPaymentTarget(null)} disabled={isPaying} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={handleSubmitPayment} className="p-6 space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-dark-grey font-medium">Total Service Bill Cost:</span>
                    <span className="font-bold text-brand-black dark:text-brand-white">{currencySymbol}{(paymentTarget.serviceCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-dark-grey font-medium">Paid So Far:</span>
                    <span className="font-bold text-emerald-500">{currencySymbol}{(paymentTarget.amountPaid || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
                    <span className="font-bold text-brand-black dark:text-brand-white">Current Balance Due:</span>
                    <span className="font-black text-brand-red">{currencySymbol}{(paymentTarget.amountDue || 0).toLocaleString()}</span>
                  </div>
                </div>

                <Field type="number" label="Repayment Amount *" value={paymentForm.amount} onChange={(v) => setPaymentForm((f) => ({ ...f, amount: v }))} placeholder={`Max ${paymentTarget.amountDue || 0}`} />
                <Field type="date" label="Payment Date" value={paymentForm.paymentDate} onChange={(v) => setPaymentForm((f) => ({ ...f, paymentDate: v }))} />
                <SelectField label="Payment Method" value={paymentForm.method} onChange={(v) => setPaymentForm((f) => ({ ...f, method: v }))} options={["cash", "bank-transfer", "cheque", "mobile-banking", "card", "other"]} />
                <Field label="Payment Reference / Txn ID" value={paymentForm.reference} onChange={(v) => setPaymentForm((f) => ({ ...f, reference: v }))} placeholder="e.g. Txn ID / cheque no." />
                <TextAreaField label="Payment Note" value={paymentForm.note} onChange={(v) => setPaymentForm((f) => ({ ...f, note: v }))} />

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setPaymentTarget(null)} disabled={isPaying} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="submit" disabled={isPaying} className="px-6 py-2 rounded-2xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md shadow-emerald-500/20">
                    {isPaying ? <FiLoader className="animate-spin" /> : "Save Service Repayment"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full View Service Record & Payment Ledger Modal */}
      <ServiceDetailsModal
        isOpen={!!ledgerTarget}
        service={ledgerTarget}
        onClose={() => setLedgerTarget(null)}
        formatDate={formatDate}
        currencySymbol={currencySymbol}
        onRecordPayment={openPaymentModal}
        onRemovePayment={handleRemovePayment}
        removingPaymentId={removingPaymentId}
        canDelete={canDelete}
        canEdit={canEdit}
      />

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
  const { can } = useUserPermissions();
  const canAdd = can("vendor-details", "add");
  const canEdit = can("vendor-details", "edit");
  const canDelete = can("vendor-details", "delete");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(CONTRACT_EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const submitLockRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    if (!formData.endDate) {
      Swal.fire({ title: "Missing field", text: "End date is required.", icon: "warning", confirmButtonColor: "#FF1818" });
      return;
    }
    submitLockRef.current = true;
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
      submitLockRef.current = false;
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
      {canAdd && (
        <div className="flex justify-end">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer">
            <FiPlus /> Add Contract
          </motion.button>
        </div>
      )}

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
                        {canEdit && c.status !== "terminated" && (
                          <button onClick={() => handleTerminate(c)} className="px-2 py-1 rounded-lg text-[10px] font-bold text-brand-dark-grey bg-brand-beige/40 dark:bg-brand-midnight hover:bg-brand-black hover:text-white cursor-pointer">
                            Terminate
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                            <FiTrash2 className="text-sm" />
                          </button>
                        )}
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
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : "Save Contract"}
                  </motion.button>
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
  const { can } = useUserPermissions();
  const canAdd = can("vendor-details", "add");
  const canDelete = can("vendor-details", "delete");

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
      {canAdd && (
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
      )}

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
              {canDelete && (
                <button onClick={() => setDeleteTarget(doc)} className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                  <FiTrash2 className="text-sm" />
                </button>
              )}
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
  const { can } = useUserPermissions();
  const canAdd = can("vendor-details", "add");
  const canDelete = can("vendor-details", "delete");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(PERFORMANCE_EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const submitLockRef = useRef(false);

  const avgOverall = reviews.length ? (reviews.reduce((s, r) => s + (r.overallRating || 0), 0) / reviews.length).toFixed(1) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    submitLockRef.current = true;
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
      submitLockRef.current = false;
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
        {canAdd && (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer ml-auto">
            <FiPlus /> Add Review
          </motion.button>
        )}
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
                {canDelete && (
                  <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                    <FiTrash2 className="text-sm" />
                  </button>
                )}
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
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : "Save Review"}
                  </motion.button>
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
