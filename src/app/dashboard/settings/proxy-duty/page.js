"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useProxyDutyApi from "@/hooks/useProxyDutyApi";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import Swal from "sweetalert2";
import {
  FiUsers,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiDollarSign,
  FiX,
  FiGrid,
  FiList,
  FiLoader,
  FiArrowRight,
  FiCheck,
  FiFileText,
} from "react-icons/fi";

const INITIAL_FORM = {
  originalEmployeeName: "",
  originalEmployeeId: "",
  proxyEmployeeName: "",
  proxyEmployeeId: "",
  dutyDate: new Date().toISOString().split("T")[0],
  proxyPayAmount: 1000,
  status: "active",
  remarks: "",
};

export default function ProxyDutyPage() {
  const { settings, formatDate } = useSystemTimeZone();
  const currencySymbol = settings?.currencySymbol || "৳";

  const { hasPermission } = useUserPermissions();
  const canView = hasPermission("/dashboard/settings/proxy-duty", "view");
  const canAdd = hasPermission("/dashboard/settings/proxy-duty", "add");
  const canEdit = hasPermission("/dashboard/settings/proxy-duty", "edit");
  const canDelete = hasPermission("/dashboard/settings/proxy-duty", "delete");

  const { employees } = useEmployeeApi(100);
  const {
    proxyDuties,
    stats,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    monthFilter,
    setMonthFilter,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages,
    createProxyDuty,
    updateProxyDuty,
    deleteProxyDuty,
  } = useProxyDutyApi(10);

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

  // Metrics computation
  const totalCount = stats?.totalRecords || totalItems || proxyDuties.length;
  const activeCount =
    stats?.activeCount || proxyDuties.filter((d) => d.status === "active").length;
  const completedCount = proxyDuties.filter((d) => d.status === "completed").length;
  const totalProxyPay = proxyDuties.reduce(
    (acc, curr) => acc + (Number(curr.proxyPayAmount) || 0),
    0
  );

  const handleOpenAdd = () => {
    if (!canAdd) return;
    setEditingItem(null);
    setFormData({
      ...INITIAL_FORM,
      dutyDate: new Date().toISOString().split("T")[0],
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) return;
    setEditingItem(item);
    setFormData({
      originalEmployeeName: item.originalEmployeeName || "",
      originalEmployeeId: item.originalEmployeeId || "",
      proxyEmployeeName: item.proxyEmployeeName || "",
      proxyEmployeeId: item.proxyEmployeeId || "",
      dutyDate: item.dutyDate
        ? item.dutyDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
      proxyPayAmount: item.proxyPayAmount !== undefined ? item.proxyPayAmount : 1000,
      status: item.status || "active",
      remarks: item.remarks || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSelectOriginal = (empName) => {
    const found = employees?.find((e) => e.name === empName);
    setFormData((prev) => ({
      ...prev,
      originalEmployeeName: empName,
      originalEmployeeId: found ? found.employeeId : "",
    }));
  };

  const handleSelectProxy = (empName) => {
    const found = employees?.find((e) => e.name === empName);
    setFormData((prev) => ({
      ...prev,
      proxyEmployeeName: empName,
      proxyEmployeeId: found ? found.employeeId : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.originalEmployeeName.trim() || !formData.proxyEmployeeName.trim()) {
      setFormError("Both Original Employee and Proxy Substitute must be selected.");
      return;
    }
    if (formData.originalEmployeeName === formData.proxyEmployeeName) {
      setFormError("The substitute proxy employee cannot be the same as the original employee.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      if (editingItem) {
        await updateProxyDuty(editingItem._id, formData);
        Swal.fire({
          title: "Proxy Duty Updated!",
          text: `Duty swap for ${formData.originalEmployeeName} updated successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      } else {
        await createProxyDuty(formData);
        Swal.fire({
          title: "Proxy Duty Created!",
          text: `Substitute shift duty for ${formData.proxyEmployeeName} recorded successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save proxy duty record.");
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
      await deleteProxyDuty(itemToDelete._id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      Swal.fire({
        title: "Deleted!",
        text: "Proxy duty record has been removed.",
        icon: "success",
        confirmButtonColor: "#FF1818",
      });
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: err?.response?.data?.message || "Failed to delete proxy duty.",
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
          title="Proxy Duty & Shift Swap Management"
          subtitle="Track employee duty swaps, assign substitute proxy staff, record duty dates, and manage proxy pay allowances."
        />
        {canAdd && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-lg shadow-brand-red/25 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <FiPlus className="text-base" />
            <span>Record Proxy Duty Swap</span>
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
            <FiUsers />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Total Duty Swaps
            </span>
            <p className="text-2xl font-black text-brand-black dark:text-brand-white mt-0.5">
              {totalCount}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              All logged substitute records
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
              Active Swaps
            </span>
            <p className="text-2xl font-black text-emerald-500 mt-0.5">
              {activeCount}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Currently pending or active
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl font-bold shrink-0">
            <FiCheck />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Completed Duties
            </span>
            <p className="text-2xl font-black text-blue-500 mt-0.5">
              {completedCount}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Finished proxy assignments
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold shrink-0">
            <FiDollarSign />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider block truncate">
              Total Proxy Pay
            </span>
            <p className="text-2xl font-black text-brand-black dark:text-brand-white mt-0.5">
              {currencySymbol}
              {totalProxyPay.toLocaleString()}
            </p>
            <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold truncate mt-0.5">
              Substitute remuneration
            </p>
          </div>
        </motion.div>
      </div>

      {/* CONTROL BAR: SEARCH, MONTH FILTER, STATUS TABS, LIMIT, VIEW TOGGLE */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Search Bar, Month Filter, & Status Tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
            <input
              type="text"
              placeholder="Search by employee..."
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

          {/* Month Filter */}
          <div className="relative flex items-center gap-1.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-44">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gold text-xs pointer-events-none" />
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                title="Filter by Duty Month"
              />
            </div>
            {monthFilter && (
              <button
                onClick={() => {
                  setMonthFilter("");
                  setPage(1);
                }}
                className="px-2.5 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-brand-red border border-brand-beige dark:border-brand-dark-grey text-xs font-bold hover:bg-brand-red/10 transition-colors shrink-0 cursor-pointer"
                title="Clear month filter"
              >
                <FiX className="text-xs" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige dark:border-brand-dark-grey w-full sm:w-auto overflow-x-auto">
            {[
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Completed", value: "completed" },
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

        {/* Right: Limit Selector & View Toggle */}
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
      ) : proxyDuties.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal p-12 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-2xl font-bold">
            <FiUsers />
          </div>
          <h3 className="text-base font-black text-brand-black dark:text-brand-white">
            No Proxy Duty Swaps Found
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light max-w-sm mx-auto font-medium">
            {search || monthFilter || statusFilter !== "all"
              ? "No proxy swap records matched your filters. Try adjusting your query or date range."
              : "No duty swaps logged yet. Click \"Record Proxy Duty Swap\" to assign a substitute colleague."}
          </p>
          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer"
            >
              <FiPlus />
              <span>Record Proxy Duty Swap</span>
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
                  <th className="py-3.5 px-4">Original Employee</th>
                  <th className="py-3.5 px-4">Proxy Substitute</th>
                  <th className="py-3.5 px-4">Duty Date</th>
                  <th className="py-3.5 px-4">Proxy Pay</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Remarks</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs font-bold">
                {proxyDuties.map((item, idx) => (
                  <tr
                    key={item._id}
                    className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center text-brand-dark-grey">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-brand-black dark:text-brand-white block">
                        {item.originalEmployeeName}
                      </span>
                      {item.originalEmployeeId && (
                        <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold block">
                          ID: {item.originalEmployeeId}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-brand-gold block">
                        {item.proxyEmployeeName}
                      </span>
                      {item.proxyEmployeeId && (
                        <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold block">
                          ID: {item.proxyEmployeeId}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-brand-black dark:text-brand-white font-bold whitespace-nowrap">
                      {item.dutyDate ? formatDate(item.dutyDate) : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-500 whitespace-nowrap">
                      {currencySymbol}
                      {Number(item.proxyPayAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
                          item.status === "completed"
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            : item.status === "active"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        {item.status === "completed" ? (
                          <FiCheck className="text-xs" />
                        ) : item.status === "active" ? (
                          <FiCheckCircle className="text-xs" />
                        ) : (
                          <FiXCircle className="text-xs" />
                        )}
                        <span>{item.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-brand-dark-grey dark:text-brand-gold-light max-w-xs truncate font-medium">
                      {item.remarks || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Edit Proxy Duty"
                        >
                          <FiEdit3 className="text-xs" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="p-2 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red/20 transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Delete Record"
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
          {proxyDuties.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header: Date and Status */}
                <div className="flex items-center justify-between gap-3 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-brand-gold text-sm shrink-0" />
                    <span className="text-xs font-black text-brand-black dark:text-brand-white">
                      {item.dutyDate ? formatDate(item.dutyDate) : "—"}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
                      item.status === "completed"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        : item.status === "active"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}
                  >
                    {item.status === "completed" ? (
                      <FiCheck className="text-xs" />
                    ) : item.status === "active" ? (
                      <FiCheckCircle className="text-xs" />
                    ) : (
                      <FiXCircle className="text-xs" />
                    )}
                    <span>{item.status}</span>
                  </span>
                </div>

                {/* Transfer representation */}
                <div className="py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 bg-brand-offwhite/70 dark:bg-brand-midnight/60 p-3 rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40 min-w-0">
                      <span className="text-[9px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light block tracking-wider">
                        Original (On Leave)
                      </span>
                      <span className="font-black text-xs text-brand-black dark:text-brand-white block truncate mt-0.5">
                        {item.originalEmployeeName}
                      </span>
                      {item.originalEmployeeId && (
                        <span className="text-[10px] text-brand-dark-grey font-medium block truncate">
                          ID: {item.originalEmployeeId}
                        </span>
                      )}
                    </div>

                    <div className="w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                      <FiArrowRight className="text-sm font-black" />
                    </div>

                    <div className="flex-1 bg-brand-gold/10 dark:bg-brand-gold/5 p-3 rounded-2xl border border-brand-gold/20 min-w-0">
                      <span className="text-[9px] font-extrabold uppercase text-brand-gold block tracking-wider">
                        Proxy Substitute
                      </span>
                      <span className="font-black text-xs text-brand-gold block truncate mt-0.5">
                        {item.proxyEmployeeName}
                      </span>
                      {item.proxyEmployeeId && (
                        <span className="text-[10px] text-brand-dark-grey font-medium block truncate">
                          ID: {item.proxyEmployeeId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detail Box: Pay & Remarks */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <div className="bg-brand-offwhite/50 dark:bg-brand-midnight/40 p-2.5 rounded-2xl">
                    <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 uppercase font-extrabold block">
                      Proxy Pay Allowance
                    </span>
                    <span className="font-black text-emerald-500 text-sm">
                      {currencySymbol}
                      {Number(item.proxyPayAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-brand-offwhite/50 dark:bg-brand-midnight/40 p-2.5 rounded-2xl">
                    <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 uppercase font-extrabold block">
                      Duty Status
                    </span>
                    <span className="capitalize font-black text-brand-black dark:text-brand-white">
                      {item.status}
                    </span>
                  </div>
                </div>

                {item.remarks && (
                  <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light/80 mt-2 italic line-clamp-1">
                    "{item.remarks}"
                  </p>
                )}
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                {canEdit && (
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-all cursor-pointer inline-flex items-center justify-center"
                    title="Edit Record"
                  >
                    <FiEdit3 className="text-xs" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteClick(item)}
                    className="p-2 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red/20 transition-all cursor-pointer inline-flex items-center justify-center"
                    title="Delete Record"
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
      {!loading && proxyDuties.length > 0 && totalPages > 1 && (
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
                    <FiUsers />
                  </div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                    {editingItem ? "Edit Proxy Duty Swap Record" : "Record Proxy Duty Swap"}
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
                    Original Employee (On Leave) <span className="text-brand-red">*</span>
                  </label>
                  <select
                    value={formData.originalEmployeeName}
                    onChange={(e) => handleSelectOriginal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    required
                  >
                    <option value="">-- Select Original Employee --</option>
                    {employees?.map((emp) => (
                      <option key={emp._id} value={emp.name}>
                        {emp.name} ({emp.employeeId || emp.designation || "Staff"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Proxy Employee (Substitute) <span className="text-brand-red">*</span>
                  </label>
                  <select
                    value={formData.proxyEmployeeName}
                    onChange={(e) => handleSelectProxy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                    required
                  >
                    <option value="">-- Select Proxy Substitute Employee --</option>
                    {employees?.map((emp) => (
                      <option key={emp._id} value={emp.name}>
                        {emp.name} ({emp.employeeId || emp.designation || "Staff"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Duty Date <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dutyDate}
                      onChange={(e) => setFormData({ ...formData, dutyDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all cursor-pointer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                      Proxy Pay Amount ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.proxyPayAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, proxyPayAmount: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Duty Swap Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
                  >
                    <option value="active">Active (Pending / In-Progress)</option>
                    <option value="completed">Completed (Duty Served)</option>
                    <option value="inactive">Inactive (Cancelled)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Remarks / Duty Shift Details
                  </label>
                  <textarea
                    rows={2}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Duty swap justification, specific shift hours, supervisor approval note..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none transition-all"
                  />
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
                        ? "Update Record"
                        : "Create Record"}
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
        title="Delete Proxy Duty Record"
        message="Are you sure you want to delete this proxy duty swap record? This action cannot be undone."
        itemName={
          itemToDelete
            ? `${itemToDelete.originalEmployeeName} ➔ ${itemToDelete.proxyEmployeeName}`
            : undefined
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
