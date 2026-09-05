"use client";

import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useVendorCategoryApi from "@/hooks/useVendorCategoryApi";
import useBranchApi from "@/hooks/useBranchApi";
import useDepartmentApi from "@/hooks/useDepartmentApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import { AuthContext } from "@/providers/AuthProvider";
import ExportButtons from "@/components/Comon/ExportButtons";
import Pagination from "@/components/Comon/Pagination";
import { exportToExcel, exportToCsv, copyTableToClipboard, printHtmlReport } from "@/lib/exportHelper";
import {
  FiPrinter,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiTag,
  FiDollarSign,
  FiClock,
  FiAlertTriangle,
  FiShield,
  FiFileText,
  FiMail,
  FiPhone,
  FiMapPin,
  FiChevronLeft,
  FiShoppingBag,
  FiTool,
  FiLayers,
  FiEye,
} from "react-icons/fi";
import PurchaseDetailsModal from "@/components/Vendors/PurchaseDetailsModal";
import ServiceDetailsModal from "@/components/Vendors/ServiceDetailsModal";

export default function VendorReportPage() {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const { user, company } = useContext(AuthContext);
  const { settings } = useSystemTimeZone();
  const currencySymbol = settings.currencySymbol || "৳";

  const { can } = useUserPermissions();
  const canView = can("vendors", "view");

  const [loading, setLoading] = useState(true);

  // Active Report Tab: "purchase" | "service" | "directory"
  const [reportTab, setReportTab] = useState("purchase");

  // Raw API Data
  const [vendors, setVendors] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [services, setServices] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Full View Modal States
  const [viewTargetPurchase, setViewTargetPurchase] = useState(null);
  const [viewTargetService, setViewTargetService] = useState(null);

  // Dynamically generate auto last 12 months list ending at current month
  const last12Months = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const value = `${year}-${month}`;
      months.push({ value, label, isCurrent: i === 0 });
    }
    return months;
  }, []);

  // Filter Dropdowns (Default to current month, e.g. "2026-08")
  const [branchFilter, setBranchFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(last12Months[0]?.value || "all");
  const [searchTerm, setSearchTerm] = useState("");

  // Client-Side Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [branchFilter, departmentFilter, categoryFilter, statusFilter, monthFilter, searchTerm, reportTab]);

  const matchMonth = (dateString, filterVal) => {
    if (filterVal === "all") return true;
    if (!dateString) return false;
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return false;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}` === filterVal;
  };

  // Live Options
  const { vendorCategories } = useVendorCategoryApi(100);
  const { branches } = useBranchApi(100);
  const { departments } = useDepartmentApi(100);

  // Pages through each endpoint (500 records per request) until its own
  // `total` is reached, instead of trusting a single hardcoded `limit` —
  // a fixed limit:1000 silently truncated the report with no indication to
  // the user once a collection grew past it. Capped at MAX_PAGES as a safety
  // ceiling so a runaway collection can never trigger unbounded requests.
  const fetchAllPaged = useCallback(
    async (url) => {
      const MAX_PAGES = 40;
      let page = 1;
      let all = [];
      for (; page <= MAX_PAGES; page++) {
        const res = await axiosSecure.get(url, { params: { limit: 500, page } });
        const batch = res?.data?.data || [];
        all = all.concat(batch);
        const total = res?.data?.total;
        if (!total || all.length >= total || batch.length === 0) break;
      }
      return all;
    },
    [axiosSecure]
  );

  const fetchAllReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorsData, purchasesData, servicesData, statsRes] = await Promise.all([
        fetchAllPaged("/vendor"),
        fetchAllPaged("/vendor-purchase"),
        fetchAllPaged("/vendor-service"),
        axiosSecure.get("/vendor/dashboard-stats"),
      ]);

      setVendors(vendorsData);
      setPurchases(purchasesData);
      setServices(servicesData);
      if (statsRes?.data?.data) setDashboardStats(statsRes.data.data);
    } catch (err) {
      console.error("Failed to load comprehensive vendor report data:", err);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, fetchAllPaged]);

  useEffect(() => {
    // Legitimate initial data fetch; setState inside is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllReportData();
  }, [fetchAllReportData]);

  // Helper map for vendor names
  const vendorMap = new Map(vendors.map((v) => [v._id, v]));

  // Purchases are now multi-item orders — flatten to one report row per
  // product line, carrying the parent order's invoice/date/payment fields
  // alongside that item's own name/category/quantity/price, so every
  // filter/search/print/export below (which was written for one-product-
  // per-record) keeps working unchanged against these flattened rows.
  const purchaseLineItems = useMemo(() => {
    const flattened = [];
    purchases.forEach((order) => {
      const items = order.items && order.items.length > 0 ? order.items : [{}];
      items.forEach((item, itemIdx) => {
        flattened.push({
          ...item,
          _id: `${order._id}-${item._id || itemIdx}`,
          orderId: order._id,
          vendor: order.vendor,
          invoiceNumber: order.invoiceNumber,
          purchaseOrderNumber: order.purchaseOrderNumber,
          purchaseDate: order.purchaseDate,
          department: order.department,
          location: order.location,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          amountPaid: order.amountPaid,
          amountDue: order.amountDue,
        });
      });
    });
    return flattened;
  }, [purchases]);

  // 1. Filtered Purchases Data (one row per product line item)
  const filteredPurchases = purchaseLineItems.filter((p) => {
    const vendorObj = typeof p.vendor === "object" ? p.vendor : vendorMap.get(p.vendor);
    const matchesBranch = branchFilter === "all" || p.location === branchFilter;
    const matchesDept = departmentFilter === "all" || p.department === departmentFilter;
    const matchesCategory = categoryFilter === "all" || p.productCategory === categoryFilter;
    const matchesStatus = statusFilter === "all" || p.paymentStatus === statusFilter;
    const matchesMonth = matchMonth(p.purchaseDate || p.createdAt, monthFilter);
    const matchesSearch =
      !searchTerm ||
      (p.productName && p.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vendorObj?.name && vendorObj.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesBranch && matchesDept && matchesCategory && matchesStatus && matchesMonth && matchesSearch;
  });

  // 2. Filtered Service & Warranty Data
  const filteredServices = services.filter((s) => {
    const vendorObj = typeof s.vendor === "object" ? s.vendor : vendorMap.get(s.vendor);
    const matchesBranch = branchFilter === "all" || s.branch === branchFilter;
    const matchesDept = departmentFilter === "all" || s.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || s.completionStatus === statusFilter;
    const matchesMonth = matchMonth(s.serviceDate || s.createdAt, monthFilter);
    const matchesSearch =
      !searchTerm ||
      (s.serviceType && s.serviceType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vendorObj?.name && vendorObj.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesBranch && matchesDept && matchesStatus && matchesMonth && matchesSearch;
  });

  // 3. Filtered Master Vendor Directory
  const filteredVendors = vendors.filter((v) => {
    const matchesCategory = categoryFilter === "all" || v.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    const matchesMonth = matchMonth(v.createdAt, monthFilter);
    const matchesSearch =
      !searchTerm ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.category && v.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.contactPerson1?.name && v.contactPerson1.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.taxVatNumber && v.taxVatNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesStatus && matchesMonth && matchesSearch;
  });

  // Total count for current active tab
  const activeTabTotalItems =
    reportTab === "purchase"
      ? filteredPurchases.length
      : reportTab === "service"
        ? filteredServices.length
        : filteredVendors.length;

  const totalPages = Math.ceil(activeTabTotalItems / itemsPerPage) || 1;

  // Sliced Data Arrays for Screen Table Display
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPurchases.slice(start, start + itemsPerPage);
  }, [filteredPurchases, currentPage, itemsPerPage]);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, currentPage, itemsPerPage]);

  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVendors.slice(start, start + itemsPerPage);
  }, [filteredVendors, currentPage, itemsPerPage]);

  // Report Title string
  const activeReportTitle =
    reportTab === "purchase"
      ? "Vendor Purchase & Product Report"
      : reportTab === "service"
        ? "Service & Warranty Audit Report"
        : "Master Vendor Directory Audit";

  const handlePrint = () => {
    const { headers, rows } = getExportPayload();

    let stats = [];
    if (reportTab === "purchase") {
      stats = [
        { label: "Total Orders", value: filteredPurchases.length },
        { label: "Total Spend", value: `${currencySymbol}${totalPurchaseSpend.toLocaleString()}` },
        { label: "Paid Spend", value: `${currencySymbol}${paidPurchaseSpend.toLocaleString()}` },
        { label: "Pending Amount", value: `${currencySymbol}${pendingPurchaseSpend.toLocaleString()}` },
      ];
    } else if (reportTab === "service") {
      stats = [
        { label: "Service Records", value: filteredServices.length },
        { label: "Completed", value: completedServicesCount },
        { label: "Maintenance Cost", value: `${currencySymbol}${totalServiceCost.toLocaleString()}` },
      ];
    } else {
      stats = [
        { label: "Total Vendors", value: filteredVendors.length },
        { label: "Active Vendors", value: filteredVendors.filter((v) => v.status === "active").length },
        { label: "Inactive Vendors", value: filteredVendors.filter((v) => v.status === "inactive").length },
      ];
    }

    printHtmlReport({
      title: activeReportTitle,
      dateStr: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      preparedBy: `${user?.name || "System Administrator"} (${user?.role || "superadmin"})`,
      branchFilter: branchFilter === "all" ? "All Branches" : branchFilter,
      departmentFilter: departmentFilter === "all" ? "All Depts" : departmentFilter,
      headers,
      rows,
      stats,
    });
  };

  const getExportPayload = () => {
    const today = new Date().toISOString().split("T")[0];
    if (reportTab === "purchase") {
      const headers = [
        "SL",
        "Product/Item Name",
        "Category",
        "Invoice No.",
        "Vendor",
        "Quantity",
        "Unit Price",
        "Total Price",
        "Payment Status",
        "Branch",
        "Department",
        "Purchase Date",
      ];
      const objects = filteredPurchases.map((p, idx) => {
        const vName = (typeof p.vendor === "object" ? p.vendor?.name : vendorMap.get(p.vendor)?.name) || "N/A";
        return {
          SL: idx + 1,
          "Product Name": p.productName || "",
          Category: p.productCategory || "General",
          "Invoice No": p.invoiceNumber || "",
          Vendor: vName,
          Quantity: p.quantity || 1,
          "Unit Price": p.unitPrice || 0,
          "Total Price": p.totalPrice || 0,
          "Payment Status": p.paymentStatus || "pending",
          Branch: p.location || "All Branches",
          Department: p.department || "All Depts",
          "Purchase Date": p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : "",
        };
      });
      const rows = filteredPurchases.map((p, idx) => {
        const vName = (typeof p.vendor === "object" ? p.vendor?.name : vendorMap.get(p.vendor)?.name) || "N/A";
        return [
          idx + 1,
          p.productName || "",
          p.productCategory || "General",
          p.invoiceNumber || "",
          vName,
          p.quantity || 1,
          p.unitPrice || 0,
          p.totalPrice || 0,
          p.paymentStatus || "pending",
          p.location || "All Branches",
          p.department || "All Depts",
          p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : "",
        ];
      });
      return { headers, rows, objects, filename: `vendor_purchase_report_${today}` };
    } else if (reportTab === "service") {
      const headers = [
        "SL",
        "Vendor Name",
        "Service Type",
        "Technician",
        "Request Ref",
        "Service Date",
        "Next Service Date",
        "Cost",
        "Status",
        "Branch",
        "Department",
      ];
      const objects = filteredServices.map((s, idx) => {
        const vName = (typeof s.vendor === "object" ? s.vendor?.name : vendorMap.get(s.vendor)?.name) || "N/A";
        return {
          SL: idx + 1,
          Vendor: vName,
          "Service Type": s.serviceType || "",
          Technician: s.assignedTechnician || "N/A",
          "Request Ref": s.serviceRequestRef || "N/A",
          "Service Date": s.serviceDate ? new Date(s.serviceDate).toLocaleDateString() : "",
          "Next Service Date": s.nextServiceDate ? new Date(s.nextServiceDate).toLocaleDateString() : "",
          Cost: s.cost || s.serviceCost || 0,
          Status: s.completionStatus || "scheduled",
          Branch: s.branch || "All Branches",
          Department: s.department || "All Depts",
        };
      });
      const rows = filteredServices.map((s, idx) => {
        const vName = (typeof s.vendor === "object" ? s.vendor?.name : vendorMap.get(s.vendor)?.name) || "N/A";
        return [
          idx + 1,
          vName,
          s.serviceType || "",
          s.assignedTechnician || "N/A",
          s.serviceRequestRef || "N/A",
          s.serviceDate ? new Date(s.serviceDate).toLocaleDateString() : "",
          s.nextServiceDate ? new Date(s.nextServiceDate).toLocaleDateString() : "",
          s.cost || s.serviceCost || 0,
          s.completionStatus || "scheduled",
          s.branch || "All Branches",
          s.department || "All Depts",
        ];
      });
      return { headers, rows, objects, filename: `vendor_service_warranty_report_${today}` };
    } else {
      const headers = [
        "SL",
        "Vendor Name",
        "Category",
        "Status",
        "Tax/VAT BIN",
        "Contact Person",
        "Phone",
        "Email",
        "City",
      ];
      const objects = filteredVendors.map((v, idx) => ({
        SL: idx + 1,
        "Vendor Name": v.name || "",
        Category: v.category || "Uncategorized",
        Status: v.status || "active",
        "Tax/VAT BIN": v.taxVatNumber || "N/A",
        "Contact Person": v.contactPerson1?.name || "N/A",
        Phone: v.contactPerson1?.phone || "N/A",
        Email: v.contactPerson1?.email || "N/A",
        City: v.address?.city || "N/A",
      }));
      const rows = filteredVendors.map((v, idx) => [
        idx + 1,
        v.name || "",
        v.category || "Uncategorized",
        v.status || "active",
        v.taxVatNumber || "N/A",
        v.contactPerson1?.name || "N/A",
        v.contactPerson1?.phone || "N/A",
        v.contactPerson1?.email || "N/A",
        v.address?.city || "N/A",
      ]);
      return { headers, rows, objects, filename: `vendor_master_directory_${today}` };
    }
  };

  const handleCopyData = () => {
    const { headers, rows } = getExportPayload();
    copyTableToClipboard(headers, rows);
  };

  const handleExcelExport = () => {
    const { objects, filename } = getExportPayload();
    exportToExcel(objects, filename, "Vendor Report");
  };

  const handleCsvExport = () => {
    const { objects, filename } = getExportPayload();
    exportToCsv(objects, filename);
  };

  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        <Mtitle title="Vendor Report" subtitle="Executive audit & summary report of organization vendors." />
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl" />
          </div>
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">Access Restricted</h2>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            You do not have view permission for Vendor Reports. Please contact your system administrator.
          </p>
        </div>
      </div>
    );
  }

  // Summary Metrics for Active Tab. Computed at the order level (not per
  // line item) so an order with several products isn't double-counted — an
  // order counts if at least one of its items passed the row filters above.
  const matchedOrderIds = new Set(filteredPurchases.map((p) => p.orderId));
  const matchedOrders = purchases.filter((o) => matchedOrderIds.has(o._id));
  const totalPurchaseSpend = matchedOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const paidPurchaseSpend = matchedOrders.filter((o) => o.paymentStatus === "paid").reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const pendingPurchaseSpend = matchedOrders.reduce((acc, o) => acc + (o.amountDue || 0), 0);

  const totalServiceCost = filteredServices.reduce((acc, s) => acc + (s.cost || 0), 0);
  const completedServicesCount = filteredServices.filter((s) => s.completionStatus === "completed").length;
  // Dynamic Branch & Department lists merging DB master records + purchase/service records
  const allBranchNames = Array.from(
    new Set([
      ...branches.map((b) => b.name || b.branchName).filter(Boolean),
      ...purchases.map((p) => p.location).filter(Boolean),
      ...services.map((s) => s.branch).filter(Boolean),
    ])
  ).sort();

  const allDeptNames = Array.from(
    new Set([
      ...departments.map((d) => d.name || d.departmentName).filter(Boolean),
      ...purchases.map((p) => p.department).filter(Boolean),
      ...services.map((s) => s.department).filter(Boolean),
    ])
  ).sort();

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-16">
      {/* Universal A4 Print CSS Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 15mm 10mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 10pt !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .page-break-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Top Header Controls (Hidden on Print) */}
      <div className="print:hidden space-y-4">
        <Mtitle
          title="Vendor Management Executive Report"
          subtitle="Comprehensive procurement, product purchase, service, and warranty audit report."
          rightcontent={
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => router.push("/dashboard/vendors")}
                className="flex items-center gap-2 px-4 py-2 bg-brand-offwhite dark:bg-brand-midnight hover:bg-brand-beige/50 dark:hover:bg-brand-dark-grey text-brand-black dark:text-brand-white font-bold text-xs rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 transition-all cursor-pointer mr-1"
              >
                <FiChevronLeft className="text-base" />
                <span>Vendor Directory</span>
              </button>

              <ExportButtons
                onCopy={handleCopyData}
                onExportExcel={handleExcelExport}
                onExportCsv={handleCsvExport}
                onPrint={handlePrint}
                isLoading={loading}
              />
            </div>
          }
        />

        {/* Report Tab Selector Bar */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-2 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-wrap items-center gap-2">
          <button
            onClick={() => setReportTab("purchase")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${reportTab === "purchase"
              ? "bg-brand-gold text-brand-midnight shadow-md shadow-brand-gold/20"
              : "text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-gold/10"
              }`}
          >
            <FiShoppingBag className="text-base" />
            <span>Purchase & Product Report</span>
          </button>

          <button
            onClick={() => setReportTab("service")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${reportTab === "service"
              ? "bg-brand-gold text-brand-midnight shadow-md shadow-brand-gold/20"
              : "text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-gold/10"
              }`}
          >
            <FiTool className="text-base" />
            <span>Service & Warranty Report</span>
          </button>

          <button
            onClick={() => setReportTab("directory")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${reportTab === "directory"
              ? "bg-brand-gold text-brand-midnight shadow-md shadow-brand-gold/20"
              : "text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-gold/10"
              }`}
          >
            <FiTruck className="text-base" />
            <span>Master Vendor Directory</span>
          </button>
        </div>

        {/* Dynamic Branch & Department Multi-Filter Controls */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light flex items-center gap-1.5 shrink-0">
              <FiFilter className="text-brand-gold" /> Filter By:
            </span>

            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="all">All Gym Branches</option>
              {allBranchNames.map((bName) => (
                <option key={bName} value={bName}>
                  {bName}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="all">All Departments</option>
              {allDeptNames.map((dName) => (
                <option key={dName} value={dName}>
                  {dName}
                </option>
              ))}
            </select>

            {/* Month Filter (Auto Last 12 Months) */}
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="all">All Months</option>
              {last12Months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Vendor Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {vendorCategories.map((c) => (
                <option key={c._id} value={c.title}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {reportTab === "purchase" && (
                <>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="overdue">Overdue</option>
                </>
              )}
              {reportTab === "service" && (
                <>
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
              {reportTab === "directory" && (
                <>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </>
              )}
            </select>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search keyword..."
              className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none w-44"
            />
          </div>

          <button
            onClick={fetchAllReportData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer shrink-0"
          >
            <FiRefreshCw className="text-xs" />
            <span>Reload Data</span>
          </button>
        </div>
      </div>

      {/* Universal Printable Document Container (A4 Printable Layout) */}
      {loading ? (
        <SkeletonLoading variant="table" rows={10} />
      ) : (
        <div className="bg-brand-white dark:bg-brand-charcoal print:bg-white print:text-black rounded-3xl p-6 md:p-8 border border-brand-beige/50 dark:border-brand-dark-grey/50 print:border-none shadow-xl print:shadow-none space-y-8">
          {/* Report Document Header */}
          <div className="border-b-2 border-brand-gold pb-4 flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-brand-gold print:text-black">
                {activeReportTitle}
              </h2>
              <p className="text-xs font-bold text-brand-black dark:text-brand-white print:text-black mt-1">
                Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light print:text-gray-600 font-medium">
                Prepared By: {user?.name || "System Administrator"} ({user?.role || "superadmin"})
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-start md:justify-end gap-1.5 text-[10px] font-bold text-brand-dark-grey print:text-gray-700">
                <span className="bg-brand-beige/40 dark:bg-brand-midnight print:bg-gray-100 px-2 py-0.5 rounded">
                  Branch: {branchFilter === "all" ? "All Branches" : branchFilter}
                </span>
                <span className="bg-brand-beige/40 dark:bg-brand-midnight print:bg-gray-100 px-2 py-0.5 rounded">
                  Dept: {departmentFilter === "all" ? "All Depts" : departmentFilter}
                </span>
                <span className="bg-brand-beige/40 dark:bg-brand-midnight print:bg-gray-100 px-2 py-0.5 rounded">
                  Month: {monthFilter === "all" ? "All Months" : last12Months.find((m) => m.value === monthFilter)?.label}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          {reportTab === "purchase" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-50 border border-brand-beige/50 dark:border-brand-dark-grey/50 print:border-gray-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey print:text-gray-600 block">Total Orders</span>
                <span className="text-xl font-black text-brand-black dark:text-brand-white print:text-black mt-1 block">{filteredPurchases.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-brand-gold/10 print:bg-amber-50 border border-brand-gold/20 print:border-amber-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold print:text-amber-800 block">Total Spend</span>
                <span className="text-xl font-black text-brand-gold print:text-amber-900 mt-1 block">{currencySymbol}{totalPurchaseSpend.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 print:bg-emerald-50 border border-emerald-500/20 print:border-emerald-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 print:text-emerald-800 block">Paid Spend</span>
                <span className="text-xl font-black text-emerald-500 print:text-emerald-700 mt-1 block">{currencySymbol}{paidPurchaseSpend.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/10 print:bg-amber-50 border border-amber-500/20 print:border-amber-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 print:text-amber-800 block">Pending Amount</span>
                <span className="text-xl font-black text-amber-500 print:text-amber-700 mt-1 block">{currencySymbol}{pendingPurchaseSpend.toLocaleString()}</span>
              </div>
            </div>
          )}

          {reportTab === "service" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-50 border border-brand-beige/50 dark:border-brand-dark-grey/50 print:border-gray-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey print:text-gray-600 block">Service Records</span>
                <span className="text-xl font-black text-brand-black dark:text-brand-white print:text-black mt-1 block">{filteredServices.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 print:bg-emerald-50 border border-emerald-500/20 print:border-emerald-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 print:text-emerald-800 block">Completed</span>
                <span className="text-xl font-black text-emerald-500 print:text-emerald-700 mt-1 block">{completedServicesCount}</span>
              </div>
              <div className="p-4 rounded-2xl bg-brand-gold/10 print:bg-amber-50 border border-brand-gold/20 print:border-amber-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold print:text-amber-800 block">Total Maintenance Cost</span>
                <span className="text-xl font-black text-brand-gold print:text-amber-900 mt-1 block">{currencySymbol}{totalServiceCost.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-500/10 print:bg-rose-50 border border-rose-500/20 print:border-rose-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 print:text-rose-800 block">Expiring Warranties</span>
                <span className="text-xl font-black text-rose-500 print:text-rose-700 mt-1 block">{dashboardStats?.expiringWarrantiesCount || 0}</span>
              </div>
            </div>
          )}

          {reportTab === "directory" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-50 border border-brand-beige/50 dark:border-brand-dark-grey/50 print:border-gray-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey print:text-gray-600 block">Total Vendors</span>
                <span className="text-xl font-black text-brand-black dark:text-brand-white print:text-black mt-1 block">{filteredVendors.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 print:bg-emerald-50 border border-emerald-500/20 print:border-emerald-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 print:text-emerald-800 block">Active Vendors</span>
                <span className="text-xl font-black text-emerald-500 print:text-emerald-700 mt-1 block">{filteredVendors.filter((v) => v.status === "active").length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-500/10 print:bg-rose-50 border border-rose-500/20 print:border-rose-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 print:text-rose-800 block">Inactive Vendors</span>
                <span className="text-xl font-black text-rose-500 print:text-rose-700 mt-1 block">{filteredVendors.filter((v) => v.status === "inactive").length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-brand-gold/10 print:bg-amber-50 border border-brand-gold/20 print:border-amber-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold print:text-amber-800 block">Categories</span>
                <span className="text-xl font-black text-brand-gold print:text-amber-900 mt-1 block">{new Set(filteredVendors.map((v) => v.category).filter(Boolean)).size}</span>
              </div>
            </div>
          )}

          {/* Main Data Tables */}
          {/* TAB 1: PURCHASE & PRODUCT REPORT */}
          {reportTab === "purchase" && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-black dark:text-brand-white print:text-black flex items-center gap-2">
                <FiShoppingBag className="text-brand-gold" /> Vendor Product & Purchase Audit Records
              </h3>

              {filteredPurchases.length === 0 ? (
                <div className="p-8 text-center bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-50 rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <p className="text-xs font-bold text-brand-dark-grey">No purchase records match the selected branch/department filter.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 print:border-gray-300">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-100 uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light print:text-black border-b border-brand-beige/60 dark:border-brand-dark-grey/60 print:border-gray-300">
                        <tr>
                          <th className="py-3 px-4 w-10 text-center">SL</th>
                          <th className="py-3 px-4">Product / Item Name</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Invoice No</th>
                          <th className="py-3 px-4">Vendor</th>
                          <th className="py-3 px-4 text-center">Qty</th>
                          <th className="py-3 px-4 text-right">Unit Price</th>
                          <th className="py-3 px-4 text-right">Total Price</th>
                          <th className="py-3 px-4 text-center">Branch / Dept</th>
                          <th className="py-3 px-4 text-center w-24">Status</th>
                          <th className="py-3 px-4 text-center w-20 print:hidden">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 print:divide-gray-200 text-xs font-medium">
                        {paginatedPurchases.map((purchase, idx) => {
                          const vendorObj = typeof purchase.vendor === "object" ? purchase.vendor : vendorMap.get(purchase.vendor);
                          const slNo = (currentPage - 1) * itemsPerPage + idx + 1;
                          return (
                            <tr key={purchase._id || idx} className="hover:bg-brand-gold/5 print:hover:bg-transparent">
                              <td className="py-3 px-4 text-center font-bold text-brand-dark-grey print:text-gray-700">{slNo}</td>
                              <td className="py-3 px-4 font-black text-brand-black dark:text-brand-white print:text-black">
                                {purchase.productName}
                                {purchase.purchaseDate && (
                                  <span className="block text-[10px] text-brand-dark-grey print:text-gray-500 font-normal">
                                    Purchased: {new Date(purchase.purchaseDate).toLocaleDateString()}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-bold text-brand-gold print:text-black">{purchase.productCategory || "General"}</td>
                              <td className="py-3 px-4 font-mono text-[11px] text-brand-dark-grey print:text-gray-700">{purchase.invoiceNumber || "N/A"}</td>
                              <td className="py-3 px-4 font-bold text-brand-black dark:text-brand-white print:text-black">{vendorObj?.name || "N/A"}</td>
                              <td className="py-3 px-4 text-center font-black">{purchase.quantity || 1}</td>
                              <td className="py-3 px-4 text-right font-mono">{currencySymbol}{(purchase.unitPrice || 0).toLocaleString()}</td>
                              <td className="py-3 px-4 text-right font-black font-mono text-brand-gold print:text-black">{currencySymbol}{(purchase.totalPrice || 0).toLocaleString()}</td>
                              <td className="py-3 px-4 text-center text-[10px]">
                                <div>{purchase.location || "All Branches"}</div>
                                <div className="text-brand-dark-grey print:text-gray-500">{purchase.department || "All Depts"}</div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${purchase.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-500 print:text-emerald-800 print:bg-emerald-100" : "bg-amber-500/10 text-amber-500 print:text-amber-800 print:bg-amber-100"}`}>
                                  {purchase.paymentStatus || "pending"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center print:hidden">
                                <button
                                  onClick={() => setViewTargetPurchase(purchase)}
                                  className="p-1.5 rounded-lg bg-brand-gold/10 hover:bg-brand-gold text-brand-gold hover:text-brand-midnight transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="View Purchase Details & Ledger"
                                >
                                  <FiEye className="text-sm" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="print:hidden">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredPurchases.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={(page) => setCurrentPage(page)}
                      onItemsPerPageChange={(limit) => {
                        setItemsPerPage(limit);
                        setCurrentPage(1);
                      }}
                      itemsPerPageOptions={[5, 10, 25, 50, 100]}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: SERVICE & WARRANTY REPORT */}
          {reportTab === "service" && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-black dark:text-brand-white print:text-black flex items-center gap-2">
                <FiTool className="text-brand-gold" /> Vendor Maintenance Service & Warranty Records
              </h3>

              {filteredServices.length === 0 ? (
                <div className="p-8 text-center bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-50 rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <p className="text-xs font-bold text-brand-dark-grey">No service records match the selected branch/department filter.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 print:border-gray-300">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-100 uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light print:text-black border-b border-brand-beige/60 dark:border-brand-dark-grey/60 print:border-gray-300">
                        <tr>
                          <th className="py-3 px-4 w-10 text-center">SL</th>
                          <th className="py-3 px-4">Vendor</th>
                          <th className="py-3 px-4">Service Type / Description</th>
                          <th className="py-3 px-4">Assigned Tech / Ref</th>
                          <th className="py-3 px-4">Service Date</th>
                          <th className="py-3 px-4">Next Service Date</th>
                          <th className="py-3 px-4 text-right">Cost</th>
                          <th className="py-3 px-4 text-center">Branch / Dept</th>
                          <th className="py-3 px-4 text-center w-24">Status</th>
                          <th className="py-3 px-4 text-center w-20 print:hidden">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 print:divide-gray-200 text-xs font-medium">
                        {paginatedServices.map((service, idx) => {
                          const vendorObj = typeof service.vendor === "object" ? service.vendor : vendorMap.get(service.vendor);
                          const slNo = (currentPage - 1) * itemsPerPage + idx + 1;
                          return (
                            <tr key={service._id || idx} className="hover:bg-brand-gold/5 print:hover:bg-transparent">
                              <td className="py-3 px-4 text-center font-bold text-brand-dark-grey print:text-gray-700">{slNo}</td>
                              <td className="py-3 px-4 font-black text-brand-black dark:text-brand-white print:text-black">{vendorObj?.name || "N/A"}</td>
                              <td className="py-3 px-4">
                                <p className="font-extrabold text-brand-black dark:text-brand-white print:text-black">{service.serviceType}</p>
                                {service.description && <p className="text-[10px] text-brand-dark-grey print:text-gray-500 font-normal">{service.description}</p>}
                              </td>
                              <td className="py-3 px-4 text-[11px]">
                                <div>{service.assignedTechnician || "N/A"}</div>
                                {service.serviceRequestRef && <div className="text-[10px] text-brand-dark-grey font-mono">{service.serviceRequestRef}</div>}
                              </td>
                              <td className="py-3 px-4 text-[11px]">{service.serviceDate ? new Date(service.serviceDate).toLocaleDateString() : "N/A"}</td>
                              <td className="py-3 px-4 text-[11px] font-bold text-brand-gold print:text-black">{service.nextServiceDate ? new Date(service.nextServiceDate).toLocaleDateString() : "N/A"}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold">{currencySymbol}{(service.cost || 0).toLocaleString()}</td>
                              <td className="py-3 px-4 text-center text-[10px]">
                                <div>{service.branch || "All Branches"}</div>
                                <div className="text-brand-dark-grey print:text-gray-500">{service.department || "All Depts"}</div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${service.completionStatus === "completed" ? "bg-emerald-500/10 text-emerald-500 print:text-emerald-800 print:bg-emerald-100" : "bg-amber-500/10 text-amber-500 print:text-amber-800 print:bg-amber-100"}`}>
                                  {service.completionStatus || "scheduled"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center print:hidden">
                                <button
                                  onClick={() => setViewTargetService(service)}
                                  className="p-1.5 rounded-lg bg-brand-gold/10 hover:bg-brand-gold text-brand-gold hover:text-brand-midnight transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="View Service Record Details & Ledger"
                                >
                                  <FiEye className="text-sm" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="print:hidden">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredServices.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={(page) => setCurrentPage(page)}
                      onItemsPerPageChange={(limit) => {
                        setItemsPerPage(limit);
                        setCurrentPage(1);
                      }}
                      itemsPerPageOptions={[5, 10, 25, 50, 100]}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: MASTER VENDOR DIRECTORY */}
          {reportTab === "directory" && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-black dark:text-brand-white print:text-black flex items-center gap-2">
                <FiFileText className="text-brand-gold" /> Master Vendor Directory & Contact List
              </h3>

              {filteredVendors.length === 0 ? (
                <div className="p-8 text-center bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-50 rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <p className="text-xs font-bold text-brand-dark-grey">No vendor records match the filter criteria.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 print:border-gray-300">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-100 uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light print:text-black border-b border-brand-beige/60 dark:border-brand-dark-grey/60 print:border-gray-300">
                        <tr>
                          <th className="py-3 px-4 w-10 text-center">SL</th>
                          <th className="py-3 px-4">Vendor Name</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Tax / BIN No.</th>
                          <th className="py-3 px-4">Primary Contact</th>
                          <th className="py-3 px-4">Phone / Email</th>
                          <th className="py-3 px-4">City / Area</th>
                          <th className="py-3 px-4 text-center w-24">Status</th>
                          <th className="py-3 px-4 text-center w-20 print:hidden">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 print:divide-gray-200 text-xs font-medium">
                        {paginatedVendors.map((vendor, idx) => {
                          const slNo = (currentPage - 1) * itemsPerPage + idx + 1;
                          return (
                            <tr key={vendor._id || idx} className="hover:bg-brand-gold/5 print:hover:bg-transparent">
                              <td className="py-3 px-4 text-center font-bold text-brand-dark-grey print:text-gray-700">{slNo}</td>
                              <td className="py-3 px-4 font-black text-brand-black dark:text-brand-white print:text-black">{vendor.name}</td>
                              <td className="py-3 px-4 font-bold text-brand-gold print:text-black">{vendor.category || "Uncategorized"}</td>
                              <td className="py-3 px-4 text-brand-dark-grey print:text-gray-700 font-mono text-[11px]">{vendor.taxVatNumber || "N/A"}</td>
                              <td className="py-3 px-4 font-bold text-brand-black dark:text-brand-white print:text-black">{vendor.contactPerson1?.name || "N/A"}</td>
                              <td className="py-3 px-4 text-brand-dark-grey print:text-gray-700 text-[11px]">
                                {vendor.contactPerson1?.phone && <div>{vendor.contactPerson1.phone}</div>}
                                {vendor.contactPerson1?.email && <div>{vendor.contactPerson1.email}</div>}
                              </td>
                              <td className="py-3 px-4 text-brand-dark-grey print:text-gray-700">{[vendor.address?.area, vendor.address?.city].filter(Boolean).join(", ") || "N/A"}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${vendor.status === "active" ? "bg-emerald-500/10 text-emerald-500 print:text-emerald-800 print:bg-emerald-100" : "bg-rose-500/10 text-rose-500 print:text-rose-800 print:bg-rose-100"}`}>
                                  {vendor.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center print:hidden">
                                <button
                                  onClick={() => router.push(`/dashboard/vendors/${vendor._id}`)}
                                  className="p-1.5 rounded-lg bg-brand-gold/10 hover:bg-brand-gold text-brand-gold hover:text-brand-midnight transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="View Vendor Profile"
                                >
                                  <FiEye className="text-sm" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="print:hidden">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredVendors.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={(page) => setCurrentPage(page)}
                      onItemsPerPageChange={(limit) => {
                        setItemsPerPage(limit);
                        setCurrentPage(1);
                      }}
                      itemsPerPageOptions={[5, 10, 25, 50, 100]}
                    />
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      )}

      {/* Reusable Full View Purchase Details Modal */}
      <PurchaseDetailsModal
        isOpen={!!viewTargetPurchase}
        purchase={viewTargetPurchase}
        onClose={() => setViewTargetPurchase(null)}
        currencySymbol={currencySymbol}
        vendorMap={vendorMap}
        onNavigateToVendor={(vId) => router.push(`/dashboard/vendors/${vId}`)}
      />

      {/* Reusable Full View Service Details Modal */}
      <ServiceDetailsModal
        isOpen={!!viewTargetService}
        service={viewTargetService}
        onClose={() => setViewTargetService(null)}
        currencySymbol={currencySymbol}
        vendorMap={vendorMap}
        onNavigateToVendor={(vId) => router.push(`/dashboard/vendors/${vId}`)}
      />
    </div>
  );
}
