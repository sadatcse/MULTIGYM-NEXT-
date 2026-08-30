"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
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
} from "react-icons/fi";

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

  // Filter Dropdowns
  const [branchFilter, setBranchFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Live Options
  const { vendorCategories } = useVendorCategoryApi(100);
  const { branches } = useBranchApi(100);
  const { departments } = useDepartmentApi(100);

  const fetchAllReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorsRes, purchasesRes, servicesRes, statsRes] = await Promise.all([
        axiosSecure.get("/vendor", { params: { limit: 1000 } }),
        axiosSecure.get("/vendor-purchase", { params: { limit: 1000 } }),
        axiosSecure.get("/vendor-service", { params: { limit: 1000 } }),
        axiosSecure.get("/vendor/dashboard-stats"),
      ]);

      if (vendorsRes?.data?.data) setVendors(vendorsRes.data.data);
      if (purchasesRes?.data?.data) setPurchases(purchasesRes.data.data);
      if (servicesRes?.data?.data) setServices(servicesRes.data.data);
      if (statsRes?.data?.data) setDashboardStats(statsRes.data.data);
    } catch (err) {
      console.error("Failed to load comprehensive vendor report data:", err);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchAllReportData();
  }, [fetchAllReportData]);

  // Helper map for vendor names
  const vendorMap = new Map(vendors.map((v) => [v._id, v]));

  // 1. Filtered Purchases Data
  const filteredPurchases = purchases.filter((p) => {
    const vendorObj = typeof p.vendor === "object" ? p.vendor : vendorMap.get(p.vendor);
    const matchesBranch = branchFilter === "all" || p.branch === branchFilter;
    const matchesDept = departmentFilter === "all" || p.department === departmentFilter;
    const matchesCategory = categoryFilter === "all" || p.productCategory === categoryFilter;
    const matchesStatus = statusFilter === "all" || p.paymentStatus === statusFilter;
    const matchesSearch =
      !searchTerm ||
      (p.productName && p.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vendorObj?.name && vendorObj.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesBranch && matchesDept && matchesCategory && matchesStatus && matchesSearch;
  });

  // 2. Filtered Service & Warranty Data
  const filteredServices = services.filter((s) => {
    const vendorObj = typeof s.vendor === "object" ? s.vendor : vendorMap.get(s.vendor);
    const matchesBranch = branchFilter === "all" || s.branch === branchFilter;
    const matchesDept = departmentFilter === "all" || s.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || s.completionStatus === statusFilter;
    const matchesSearch =
      !searchTerm ||
      (s.serviceType && s.serviceType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vendorObj?.name && vendorObj.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesBranch && matchesDept && matchesStatus && matchesSearch;
  });

  // 3. Filtered Master Vendor Directory
  const filteredVendors = vendors.filter((v) => {
    const matchesCategory = categoryFilter === "all" || v.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.category && v.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.contactPerson1?.name && v.contactPerson1.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.taxVatNumber && v.taxVatNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Report Title string
  const activeReportTitle =
    reportTab === "purchase"
      ? "Vendor Purchase & Product Report"
      : reportTab === "service"
      ? "Service & Warranty Audit Report"
      : "Master Vendor Directory Audit";

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = "";

    if (reportTab === "purchase") {
      headers = [
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
      rows = filteredPurchases.map((p, idx) => {
        const vName = (typeof p.vendor === "object" ? p.vendor?.name : vendorMap.get(p.vendor)?.name) || "N/A";
        return [
          idx + 1,
          `"${(p.productName || "").replace(/"/g, '""')}"`,
          `"${(p.productCategory || "General").replace(/"/g, '""')}"`,
          `"${(p.invoiceNumber || "").replace(/"/g, '""')}"`,
          `"${vName.replace(/"/g, '""')}"`,
          p.quantity || 1,
          p.unitPrice || 0,
          p.totalPrice || 0,
          `"${p.paymentStatus || "pending"}"`,
          `"${(p.branch || "All").replace(/"/g, '""')}"`,
          `"${(p.department || "All").replace(/"/g, '""')}"`,
          `"${p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : ""}"`,
        ];
      });
      filename = `vendor_purchase_report_${new Date().toISOString().split("T")[0]}.csv`;
    } else if (reportTab === "service") {
      headers = [
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
      rows = filteredServices.map((s, idx) => {
        const vName = (typeof s.vendor === "object" ? s.vendor?.name : vendorMap.get(s.vendor)?.name) || "N/A";
        return [
          idx + 1,
          `"${vName.replace(/"/g, '""')}"`,
          `"${(s.serviceType || "").replace(/"/g, '""')}"`,
          `"${(s.assignedTechnician || "").replace(/"/g, '""')}"`,
          `"${(s.serviceRequestRef || "").replace(/"/g, '""')}"`,
          `"${s.serviceDate ? new Date(s.serviceDate).toLocaleDateString() : ""}"`,
          `"${s.nextServiceDate ? new Date(s.nextServiceDate).toLocaleDateString() : ""}"`,
          s.cost || 0,
          `"${s.completionStatus || "scheduled"}"`,
          `"${(s.branch || "All").replace(/"/g, '""')}"`,
          `"${(s.department || "All").replace(/"/g, '""')}"`,
        ];
      });
      filename = `vendor_service_warranty_report_${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      headers = [
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
      rows = filteredVendors.map((v, idx) => [
        idx + 1,
        `"${v.name.replace(/"/g, '""')}"`,
        `"${(v.category || "Uncategorized").replace(/"/g, '""')}"`,
        `"${v.status}"`,
        `"${(v.taxVatNumber || "").replace(/"/g, '""')}"`,
        `"${(v.contactPerson1?.name || "").replace(/"/g, '""')}"`,
        `"${(v.contactPerson1?.phone || "").replace(/"/g, '""')}"`,
        `"${(v.contactPerson1?.email || "").replace(/"/g, '""')}"`,
        `"${(v.address?.city || "").replace(/"/g, '""')}"`,
      ]);
      filename = `vendor_master_directory_${new Date().toISOString().split("T")[0]}.csv`;
    }

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Summary Metrics for Active Tab
  const totalPurchaseSpend = filteredPurchases.reduce((acc, p) => acc + (p.totalPrice || 0), 0);
  const paidPurchaseSpend = filteredPurchases.filter((p) => p.paymentStatus === "paid").reduce((acc, p) => acc + (p.totalPrice || 0), 0);
  const pendingPurchaseSpend = filteredPurchases.filter((p) => p.paymentStatus === "pending" || p.paymentStatus === "partial" || p.paymentStatus === "overdue").reduce((acc, p) => acc + (p.totalPrice || 0), 0);

  const totalServiceCost = filteredServices.reduce((acc, s) => acc + (s.cost || 0), 0);
  const completedServicesCount = filteredServices.filter((s) => s.completionStatus === "completed").length;

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
                className="flex items-center gap-2 px-4 py-2 bg-brand-offwhite dark:bg-brand-midnight hover:bg-brand-beige/50 dark:hover:bg-brand-dark-grey text-brand-black dark:text-brand-white font-bold text-xs rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 transition-all cursor-pointer"
              >
                <FiChevronLeft className="text-base" />
                <span>Vendor Directory</span>
              </button>

              <button
                onClick={handleExportCSV}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white font-bold text-xs rounded-2xl border border-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <FiDownload className="text-base" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handlePrint}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <FiPrinter className="text-base" />
                <span>Print Report (A4)</span>
              </button>
            </div>
          }
        />

        {/* Report Tab Selector Bar */}
        <div className="bg-brand-white dark:bg-brand-charcoal p-2 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-wrap items-center gap-2">
          <button
            onClick={() => setReportTab("purchase")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              reportTab === "purchase"
                ? "bg-brand-gold text-brand-midnight shadow-md shadow-brand-gold/20"
                : "text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-gold/10"
            }`}
          >
            <FiShoppingBag className="text-base" />
            <span>Purchase & Product Report</span>
          </button>

          <button
            onClick={() => setReportTab("service")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              reportTab === "service"
                ? "bg-brand-gold text-brand-midnight shadow-md shadow-brand-gold/20"
                : "text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-gold/10"
            }`}
          >
            <FiTool className="text-base" />
            <span>Service & Warranty Report</span>
          </button>

          <button
            onClick={() => setReportTab("directory")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              reportTab === "directory"
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
              {branches.map((b) => (
                <option key={b._id} value={b.branchName}>
                  {b.branchName}
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
              {departments.map((d) => (
                <option key={d._id} value={d.departmentName || d.name}>
                  {d.departmentName || d.name}
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
          {/* Universal Header for A4 Print */}
          <div className="border-b-2 border-brand-gold pb-6 flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {company?.logo ? (
                  <img src={company.logo} alt="Company Logo" className="h-12 w-auto object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center font-black text-2xl">
                    MG
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-black text-brand-black dark:text-brand-white print:text-black uppercase tracking-tight">
                    {company?.companyName || "Multigym HR"}
                  </h1>
                  <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light print:text-gray-600 font-bold">
                    {company?.companyTagline || "Enterprise HR, Asset & Procurement Management"}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light/80 print:text-gray-600 font-medium max-w-lg">
                {company?.address} | Email: {company?.email} | Tel: {company?.phone}
              </p>
            </div>

            <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-brand-gold pl-3 md:pl-0 md:pr-3">
              <h2 className="text-base font-black uppercase tracking-wider text-brand-gold print:text-black">
                {activeReportTitle}
              </h2>
              <p className="text-xs font-bold text-brand-black dark:text-brand-white print:text-black mt-1">
                Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 print:divide-gray-200 text-xs font-medium">
                      {filteredPurchases.map((purchase, idx) => {
                        const vendorObj = typeof purchase.vendor === "object" ? purchase.vendor : vendorMap.get(purchase.vendor);
                        return (
                          <tr key={purchase._id || idx} className="hover:bg-brand-gold/5 print:hover:bg-transparent">
                            <td className="py-3 px-4 text-center font-bold text-brand-dark-grey print:text-gray-700">{idx + 1}</td>
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
                              <div>{purchase.branch || "All Branches"}</div>
                              <div className="text-brand-dark-grey print:text-gray-500">{purchase.department || "All Depts"}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${purchase.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-500 print:text-emerald-800 print:bg-emerald-100" : "bg-amber-500/10 text-amber-500 print:text-amber-800 print:bg-amber-100"}`}>
                                {purchase.paymentStatus || "pending"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 print:divide-gray-200 text-xs font-medium">
                      {filteredServices.map((service, idx) => {
                        const vendorObj = typeof service.vendor === "object" ? service.vendor : vendorMap.get(service.vendor);
                        return (
                          <tr key={service._id || idx} className="hover:bg-brand-gold/5 print:hover:bg-transparent">
                            <td className="py-3 px-4 text-center font-bold text-brand-dark-grey print:text-gray-700">{idx + 1}</td>
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 print:divide-gray-200 text-xs font-medium">
                      {filteredVendors.map((vendor, idx) => (
                        <tr key={vendor._id || idx} className="hover:bg-brand-gold/5 print:hover:bg-transparent">
                          <td className="py-3 px-4 text-center font-bold text-brand-dark-grey print:text-gray-700">{idx + 1}</td>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Universal Formal Audit Sign-Off Section (Always Visible on Print) */}
          <div className="pt-12 mt-12 border-t border-brand-beige/60 dark:border-brand-dark-grey/60 print:border-gray-400 grid grid-cols-3 gap-6 text-center text-xs page-break-avoid">
            <div>
              <div className="h-10 border-b border-dashed border-brand-dark-grey dark:border-brand-gold-light print:border-gray-400 mb-2 w-48 mx-auto" />
              <p className="font-extrabold text-brand-black dark:text-brand-white print:text-black">Prepared By</p>
              <p className="text-[10px] text-brand-dark-grey print:text-gray-600">Procurement & Asset Dept</p>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-brand-dark-grey dark:border-brand-gold-light print:border-gray-400 mb-2 w-48 mx-auto" />
              <p className="font-extrabold text-brand-black dark:text-brand-white print:text-black">Audited By</p>
              <p className="text-[10px] text-brand-dark-grey print:text-gray-600">Internal Accounts Audit</p>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-brand-dark-grey dark:border-brand-gold-light print:border-gray-400 mb-2 w-48 mx-auto" />
              <p className="font-extrabold text-brand-black dark:text-brand-white print:text-black">Approved By</p>
              <p className="text-[10px] text-brand-dark-grey print:text-gray-600">Managing Director / Director</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
