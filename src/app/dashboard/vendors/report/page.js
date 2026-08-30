"use client";

import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useVendorCategoryApi from "@/hooks/useVendorCategoryApi";
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
  const [vendors, setVendors] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { vendorCategories } = useVendorCategoryApi(100);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorsRes, statsRes] = await Promise.all([
        axiosSecure.get("/vendor", { params: { limit: 1000 } }),
        axiosSecure.get("/vendor/dashboard-stats"),
      ]);

      if (vendorsRes?.data?.data) {
        setVendors(vendorsRes.data.data);
      }
      if (statsRes?.data?.data) {
        setDashboardStats(statsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load vendor report data:", err);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Filtered vendors list for report
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

  // Calculate statistics for filtered list
  const activeCount = filteredVendors.filter((v) => v.status === "active").length;
  const inactiveCount = filteredVendors.filter((v) => v.status === "inactive").length;
  const categoriesCount = new Set(filteredVendors.map((v) => v.category).filter(Boolean)).size;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredVendors.length === 0) return;

    const headers = [
      "SL",
      "Vendor Name",
      "Category",
      "Status",
      "Tax/VAT BIN",
      "Contact Person",
      "Designation",
      "Phone",
      "Email",
      "City",
      "Address",
    ];

    const rows = filteredVendors.map((v, idx) => [
      idx + 1,
      `"${v.name.replace(/"/g, '""')}"`,
      `"${(v.category || "Uncategorized").replace(/"/g, '""')}"`,
      `"${v.status}"`,
      `"${(v.taxVatNumber || "").replace(/"/g, '""')}"`,
      `"${(v.contactPerson1?.name || "").replace(/"/g, '""')}"`,
      `"${(v.contactPerson1?.designation || "").replace(/"/g, '""')}"`,
      `"${(v.contactPerson1?.phone || "").replace(/"/g, '""')}"`,
      `"${(v.contactPerson1?.email || "").replace(/"/g, '""')}"`,
      `"${(v.address?.city || "").replace(/"/g, '""')}"`,
      `"${([v.address?.addressLine1, v.address?.area].filter(Boolean).join(", ") || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vendor_management_report_${new Date().toISOString().split("T")[0]}.csv`);
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

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-16">
      {/* Top Header Controls (Hidden on Print) */}
      <div className="print:hidden">
        <Mtitle
          title="Vendor Management Executive Report"
          subtitle="Comprehensive audit summary, contact directory, and procurement stats."
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
                disabled={loading || filteredVendors.length === 0}
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
                <span>Print Report</span>
              </button>
            </div>
          }
        />

        {/* Report Filter Controls */}
        <div className="mt-4 bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light flex items-center gap-1.5">
              <FiFilter className="text-brand-gold" /> Filter Report:
            </span>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="all">All Categories ({vendors.length})</option>
              {vendorCategories.map((c) => (
                <option key={c._id} value={c.title}>
                  {c.title}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Vendors</option>
              <option value="inactive">Inactive Vendors</option>
            </select>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendor name, BIN, contact..."
              className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none w-56"
            />
          </div>

          <button
            onClick={fetchReportData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer"
          >
            <FiRefreshCw className="text-xs" />
            <span>Reload Data</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Container */}
      {loading ? (
        <SkeletonLoading variant="table" rows={8} />
      ) : (
        <div className="bg-brand-white dark:bg-brand-charcoal print:bg-white print:text-black rounded-3xl p-6 md:p-8 border border-brand-beige/50 dark:border-brand-dark-grey/50 print:border-none shadow-xl print:shadow-none space-y-8">
          {/* Formal Company & Report Header */}
          <div className="border-b border-brand-beige/80 dark:border-brand-dark-grey/80 print:border-gray-300 pb-6 flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {company?.logo ? (
                  <img src={company.logo} alt="Company Logo" className="h-10 w-auto object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center font-black text-xl">
                    MG
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-black text-brand-black dark:text-brand-white print:text-black uppercase tracking-tight">
                    {company?.companyName || "Multigym HR"}
                  </h1>
                  <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light print:text-gray-600 font-bold">
                    {company?.companyTagline || "Complete Enterprise HR & Asset Management"}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/80 print:text-gray-600 font-medium max-w-md">
                {company?.address} | {company?.email} | {company?.phone}
              </p>
            </div>

            <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-brand-gold pl-3 md:pl-0 md:pr-3">
              <h2 className="text-lg font-black uppercase tracking-wider text-brand-gold print:text-black">
                Vendor Management Audit Report
              </h2>
              <p className="text-xs font-bold text-brand-black dark:text-brand-white print:text-black mt-1">
                Generated Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light print:text-gray-600 font-medium">
                Prepared By: {user?.name || "System Administrator"} ({user?.role || "superadmin"})
              </p>
              <p className="text-[10px] text-brand-dark-grey print:text-gray-500">
                Scope: {categoryFilter === "all" ? "All Categories" : categoryFilter} | Status: {statusFilter.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Executive KPI Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-50 border border-brand-beige/50 dark:border-brand-dark-grey/50 print:border-gray-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light print:text-gray-600 block">
                Total Records
              </span>
              <span className="text-xl font-black text-brand-black dark:text-brand-white print:text-black mt-1 block">
                {filteredVendors.length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 print:bg-emerald-50 border border-emerald-500/20 print:border-emerald-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 print:text-emerald-800 block">
                Active Vendors
              </span>
              <span className="text-xl font-black text-emerald-500 print:text-emerald-700 mt-1 block">
                {activeCount}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 print:bg-rose-50 border border-rose-500/20 print:border-rose-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 print:text-rose-800 block">
                Inactive Vendors
              </span>
              <span className="text-xl font-black text-rose-500 print:text-rose-700 mt-1 block">
                {inactiveCount}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-gold/10 print:bg-amber-50 border border-brand-gold/20 print:border-amber-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold print:text-amber-800 block">
                Categories
              </span>
              <span className="text-xl font-black text-brand-gold print:text-amber-900 mt-1 block">
                {categoriesCount}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-50 border border-brand-beige/50 dark:border-brand-dark-grey/50 print:border-gray-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light print:text-gray-600 block">
                Total Spend
              </span>
              <span className="text-xl font-black text-brand-black dark:text-brand-white print:text-black mt-1 block truncate">
                {currencySymbol}{(dashboardStats?.totalSpending || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 print:bg-amber-50 border border-amber-500/20 print:border-amber-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 print:text-amber-800 block">
                Pending Due
              </span>
              <span className="text-xl font-black text-amber-500 print:text-amber-700 mt-1 block truncate">
                {currencySymbol}{(dashboardStats?.pendingPaymentAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Master Vendor Records Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-black dark:text-brand-white print:text-black flex items-center gap-2">
                <FiFileText className="text-brand-gold" /> Master Vendor Directory
              </h3>
              <span className="text-[11px] font-bold text-brand-dark-grey print:text-gray-600">
                Showing {filteredVendors.length} of {vendors.length} vendors
              </span>
            </div>

            {filteredVendors.length === 0 ? (
              <div className="p-8 text-center bg-brand-offwhite dark:bg-brand-midnight print:bg-gray-50 rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
                <p className="text-xs font-bold text-brand-dark-grey">No vendor records match the selected filter criteria.</p>
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
                      <tr
                        key={vendor._id || idx}
                        className="hover:bg-brand-gold/5 print:hover:bg-transparent transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-bold text-brand-dark-grey print:text-gray-700">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-black text-brand-black dark:text-brand-white print:text-black">
                          {vendor.name}
                          {vendor.website && (
                            <span className="block text-[10px] text-brand-dark-grey print:text-gray-500 font-normal">
                              {vendor.website}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-brand-gold print:text-black">
                          {vendor.category || "Uncategorized"}
                        </td>
                        <td className="py-3 px-4 text-brand-dark-grey dark:text-brand-gold-light/90 print:text-gray-700 font-mono text-[11px]">
                          {vendor.taxVatNumber || "N/A"}
                        </td>
                        <td className="py-3 px-4 font-bold text-brand-black dark:text-brand-white print:text-black">
                          {vendor.contactPerson1?.name || "N/A"}
                          {vendor.contactPerson1?.designation && (
                            <span className="block text-[10px] text-brand-dark-grey print:text-gray-500 font-normal">
                              {vendor.contactPerson1.designation}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-brand-dark-grey dark:text-brand-gold-light/90 print:text-gray-700 text-[11px]">
                          {vendor.contactPerson1?.phone && <div>{vendor.contactPerson1.phone}</div>}
                          {vendor.contactPerson1?.email && <div>{vendor.contactPerson1.email}</div>}
                          {!vendor.contactPerson1?.phone && !vendor.contactPerson1?.email && "N/A"}
                        </td>
                        <td className="py-3 px-4 text-brand-dark-grey dark:text-brand-gold-light/90 print:text-gray-700">
                          {[vendor.address?.area, vendor.address?.city].filter(Boolean).join(", ") || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              vendor.status === "active"
                                ? "bg-emerald-500/10 text-emerald-500 print:text-emerald-800 print:bg-emerald-100"
                                : "bg-rose-500/10 text-rose-500 print:text-rose-800 print:bg-rose-100"
                            }`}
                          >
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

          {/* Formal Audit Sign-Off Section (Visible on Print) */}
          <div className="pt-12 mt-12 border-t border-brand-beige/60 dark:border-brand-dark-grey/60 print:border-gray-300 grid grid-cols-3 gap-6 text-center text-xs">
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
