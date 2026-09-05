"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useOvertimeApi from "@/hooks/useOvertimeApi";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import Swal from "sweetalert2";
import {
  FiClock,
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
  FiFileText,
  FiUsers,
} from "react-icons/fi";

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

export default function OvertimePage() {
  const { formatDate } = useSystemTimeZone();
  const { hasPermission } = useUserPermissions();
  const canView = hasPermission("/dashboard/settings/overtime", "view");
  const canAdd = hasPermission("/dashboard/settings/overtime", "add");
  const canEdit = hasPermission("/dashboard/settings/overtime", "edit");
  const canDelete = hasPermission("/dashboard/settings/overtime", "delete");

  const { employees } = useEmployeeApi(100);
  const {
    policies,
    records,
    policyStats,
    recordStats,
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
    createPolicy,
    updatePolicy,
    deletePolicy,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useOvertimeApi(50);

  const [activeTab, setActiveTab] = useState("policies");
  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode("grid");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Policy Modal state
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [policyForm, setPolicyForm] = useState({
    policyName: "",
    ratePerHour: 1.5,
    maxHoursPerMonth: 40,
    minOvertimeMinutes: 30,
    status: "active",
  });
  const [policyErrors, setPolicyErrors] = useState({});

  // Record Modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordForm, setRecordForm] = useState({
    employeeName: "",
    employeeId: "",
    recordDate: new Date().toISOString().split("T")[0],
    overtimeHours: 2,
    overtimeMinutes: 0,
    status: "approved",
    remarks: "",
  });
  const [recordErrors, setRecordErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deletingType, setDeletingType] = useState("policy");
  const [isDeleting, setIsDeleting] = useState(false);

  const submitLockRef = useRef(false);
  const deleteLockRef = useRef(false);

  useEffect(() => {
    if (!isPolicyModalOpen && !isRecordModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) {
        setIsPolicyModalOpen(false);
        setIsRecordModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPolicyModalOpen, isRecordModalOpen, isSubmitting]);

  // Policy handlers
  const handleOpenAddPolicy = () => {
    if (!canAdd) return;
    setEditingPolicy(null);
    setPolicyForm({
      policyName: "",
      ratePerHour: 1.5,
      maxHoursPerMonth: 40,
      minOvertimeMinutes: 30,
      status: "active",
    });
    setPolicyErrors({});
    setIsPolicyModalOpen(true);
  };

  const handleOpenEditPolicy = (p) => {
    if (!canEdit) return;
    setEditingPolicy(p);
    setPolicyForm({
      policyName: p.policyName || "",
      ratePerHour: p.ratePerHour !== undefined ? p.ratePerHour : 1.5,
      maxHoursPerMonth: p.maxHoursPerMonth !== undefined ? p.maxHoursPerMonth : 40,
      minOvertimeMinutes: p.minOvertimeMinutes !== undefined ? p.minOvertimeMinutes : 30,
      status: p.status || "active",
    });
    setPolicyErrors({});
    setIsPolicyModalOpen(true);
  };

  const validatePolicyForm = () => {
    const errors = {};
    if (!policyForm.policyName.trim()) {
      errors.policyName = "Policy name is required.";
    }
    const duplicate = policies.find(
      (p) =>
        p.policyName.trim().toLowerCase() === policyForm.policyName.trim().toLowerCase() &&
        p._id !== editingPolicy?._id
    );
    if (duplicate) {
      errors.policyName = `Policy "${policyForm.policyName}" already exists.`;
    }
    setPolicyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitPolicy = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    if (!validatePolicyForm()) return;

    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      if (editingPolicy) {
        await updatePolicy(editingPolicy._id, policyForm);
        Swal.fire({
          title: "Updated!",
          text: `Overtime policy "${policyForm.policyName}" updated successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      } else {
        await createPolicy(policyForm);
        Swal.fire({
          title: "Created!",
          text: `Overtime policy "${policyForm.policyName}" created successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      }
      setIsPolicyModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save overtime policy.";
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

  // Record handlers
  const handleOpenAddRecord = () => {
    if (!canAdd) return;
    setEditingRecord(null);
    setRecordForm({
      employeeName: "",
      employeeId: "",
      recordDate: new Date().toISOString().split("T")[0],
      overtimeHours: 2,
      overtimeMinutes: 0,
      status: "approved",
      remarks: "",
    });
    setRecordErrors({});
    setIsRecordModalOpen(true);
  };

  const handleOpenEditRecord = (r) => {
    if (!canEdit) return;
    setEditingRecord(r);
    setRecordForm({
      employeeName: r.employeeName || "",
      employeeId: r.employeeId || "",
      recordDate: r.recordDate ? new Date(r.recordDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      overtimeHours: r.overtimeHours !== undefined ? r.overtimeHours : 2,
      overtimeMinutes: r.overtimeMinutes !== undefined ? r.overtimeMinutes : 0,
      status: r.status || "approved",
      remarks: r.remarks || "",
    });
    setRecordErrors({});
    setIsRecordModalOpen(true);
  };

  const validateRecordForm = () => {
    const errors = {};
    if (!recordForm.employeeName.trim()) {
      errors.employeeName = "Employee name is required.";
    }
    if (!recordForm.recordDate) {
      errors.recordDate = "Record date is required.";
    }
    setRecordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    if (!validateRecordForm()) return;

    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await updateRecord(editingRecord._id, recordForm);
        Swal.fire({
          title: "Updated!",
          text: `Overtime record for "${recordForm.employeeName}" updated successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      } else {
        await createRecord(recordForm);
        Swal.fire({
          title: "Created!",
          text: `Overtime record for "${recordForm.employeeName}" logged successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      }
      setIsRecordModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save overtime record.";
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

  // Delete handlers
  const handleOpenDelete = (item, type) => {
    if (!canDelete) return;
    setDeletingItem(item);
    setDeletingType(type);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem || isDeleting || deleteLockRef.current) return;

    deleteLockRef.current = true;
    setIsDeleting(true);
    try {
      if (deletingType === "policy") {
        await deletePolicy(deletingItem._id);
        Swal.fire({
          title: "Deleted!",
          text: `Policy "${deletingItem.policyName}" has been deleted.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      } else {
        await deleteRecord(deletingItem._id);
        Swal.fire({
          title: "Deleted!",
          text: `Overtime record has been deleted.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
          timer: 2000,
        });
      }
      setIsDeleteModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete item.";
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

  const totalPolicies = policyStats?.totalPolicies || policies.length;
  const activePolicies = policyStats?.activeCount ?? policies.filter((p) => p.status === "active").length;
  const totalRecords = recordStats?.totalRecords || records.length;
  const approvedRecords = recordStats?.approvedCount ?? records.filter((r) => r.status === "approved").length;

  if (!canView && !loading) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
        <Mtitle
          title="Overtime Management"
          subtitle="Configure overtime hourly multiplier rates, monthly caps, minimum thresholds, and log employee overtime hours."
        />
        <div className="bg-brand-white dark:bg-brand-charcoal p-8 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl" />
          </div>
          <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2">Access Restricted</h2>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            You do not have view permission for Overtime Management. Please contact your system administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <Mtitle
        title="Overtime Management"
        subtitle="Configure overtime hourly multiplier rates, monthly caps, minimum thresholds, and log employee overtime hours."
        rightcontent={
          canAdd ? (
            <button
              onClick={activeTab === "policies" ? handleOpenAddPolicy : handleOpenAddRecord}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <FiPlus className="text-base" />
              <span>{activeTab === "policies" ? "Add Policy" : "Add Record"}</span>
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
                {totalPolicies}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiClock />
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
                Active Policies
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {activePolicies}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
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
                Total OT Records
              </span>
              <span className="text-2xl font-black text-sky-500 mt-1 block">
                {totalRecords}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiFileText />
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
                Approved Records
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {approvedRecords}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* CONTROL BAR */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Main Tab Switcher */}
          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab("policies");
                setStatusFilter("all");
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "policies"
                  ? "bg-brand-gold text-brand-midnight shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
              }`}
            >
              Overtime Policies
            </button>
            <button
              onClick={() => {
                setActiveTab("records");
                setStatusFilter("all");
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "records"
                  ? "bg-brand-gold text-brand-midnight shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
              }`}
            >
              Overtime Records
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === "policies" ? "Search policies..." : "Search employees..."}
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
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Tabs */}
          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            {(activeTab === "policies" ? ["all", "active", "inactive"] : ["all", "approved", "pending", "rejected"]).map((tab) => (
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
      ) : activeTab === "policies" ? (
        // POLICIES TAB VIEW
        policies.length === 0 ? (
          <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              <FiClock />
            </div>
            <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">
              No Overtime Policies Found
            </h3>
            <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
              {search || statusFilter !== "all"
                ? "No policies match your active filters."
                : "No overtime policies have been configured yet."}
            </p>
            {canAdd && (
              <button
                onClick={handleOpenAddPolicy}
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
                        <th className="py-4 px-6">Rate Multiplier</th>
                        <th className="py-4 px-6">Max Hours / Month</th>
                        <th className="py-4 px-6">Min Overtime Threshold</th>
                        <th className="py-4 px-6 text-center w-28">Status</th>
                        <th className="py-4 px-6 text-center w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                      <AnimatePresence initial={false}>
                        {policies.map((policy, idx) => {
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
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-extrabold text-brand-black dark:text-brand-white text-sm">
                                {policy.policyName}
                              </td>
                              <td className="py-4 px-6 font-bold text-amber-500">
                                {policy.ratePerHour}x Normal Hourly Rate
                              </td>
                              <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light/90 font-medium">
                                {policy.maxHoursPerMonth} Hours / Month
                              </td>
                              <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light/90 font-medium">
                                {policy.minOvertimeMinutes} Minutes
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
                                      onClick={() => handleOpenEditPolicy(policy)}
                                      disabled={rowBusy}
                                      className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Edit Policy"
                                    >
                                      <FiEdit3 className="text-sm" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      onClick={() => handleOpenDelete(policy, "policy")}
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
                  {policies.map((policy) => {
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
                                Overtime Policy
                              </span>
                              <h3 className="text-base font-black text-brand-black dark:text-brand-white mt-0.5">
                                {policy.policyName}
                              </h3>
                            </div>
                            <div className="w-9 h-9 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center font-black shrink-0">
                              <FiClock />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 my-4 text-[11px] font-bold">
                            <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                              <span className="text-[9px] text-brand-dark-grey block uppercase">Rate Multiplier</span>
                              <span className="text-amber-500">{policy.ratePerHour}x</span>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                              <span className="text-[9px] text-brand-dark-grey block uppercase">Max / Month</span>
                              <span>{policy.maxHoursPerMonth} hrs</span>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight col-span-2">
                              <span className="text-[9px] text-brand-dark-grey block uppercase">Min Threshold</span>
                              <span>{policy.minOvertimeMinutes} Minutes</span>
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
                                onClick={() => handleOpenEditPolicy(policy)}
                                disabled={rowBusy}
                                className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit Policy"
                              >
                                <FiEdit3 className="text-sm" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleOpenDelete(policy, "policy")}
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
          </>
        )
      ) : (
        // RECORDS TAB VIEW
        records.length === 0 ? (
          <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              <FiFileText />
            </div>
            <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">
              No Overtime Records Found
            </h3>
            <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
              {search || statusFilter !== "all"
                ? "No records match your active filters."
                : "No employee overtime hours have been logged yet."}
            </p>
            {canAdd && (
              <button
                onClick={handleOpenAddRecord}
                className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-2xl shadow-md hover:bg-brand-red-dark transition-all cursor-pointer"
              >
                + Log Overtime Record
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
                        <th className="py-4 px-6">Employee</th>
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6">Duration</th>
                        <th className="py-4 px-6">Remarks</th>
                        <th className="py-4 px-6 text-center w-28">Status</th>
                        <th className="py-4 px-6 text-center w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                      <AnimatePresence initial={false}>
                        {records.map((record, idx) => {
                          const rowBusy = isDeleting && deletingItem?._id === record._id;
                          return (
                            <motion.tr
                              key={record._id}
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
                              <td className="py-4 px-6">
                                <div className="font-extrabold text-brand-black dark:text-brand-white text-sm">
                                  {record.employeeName}
                                </div>
                                {record.employeeId && (
                                  <div className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold">
                                    ID: {record.employeeId}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light/90 font-medium">
                                {formatDate ? formatDate(record.recordDate) : new Date(record.recordDate).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-6 font-extrabold text-sky-500">
                                {record.overtimeHours}h {record.overtimeMinutes}m
                              </td>
                              <td className="py-4 px-6 text-brand-dark-grey dark:text-brand-gold-light/90 font-medium max-w-xs truncate">
                                {record.remarks || "—"}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                                    record.status === "approved"
                                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                      : record.status === "rejected"
                                      ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      record.status === "approved"
                                        ? "bg-emerald-500"
                                        : record.status === "rejected"
                                        ? "bg-rose-500"
                                        : "bg-amber-500"
                                    }`}
                                  />
                                  {record.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {canEdit && (
                                    <button
                                      onClick={() => handleOpenEditRecord(record)}
                                      disabled={rowBusy}
                                      className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Edit Record"
                                    >
                                      <FiEdit3 className="text-sm" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      onClick={() => handleOpenDelete(record, "record")}
                                      disabled={rowBusy}
                                      className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Delete Record"
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
                  {records.map((record) => {
                    const rowBusy = isDeleting && deletingItem?._id === record._id;
                    return (
                      <motion.div
                        key={record._id}
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
                                Employee
                              </span>
                              <h3 className="text-base font-black text-brand-black dark:text-brand-white mt-0.5">
                                {record.employeeName}
                              </h3>
                              {record.employeeId && (
                                <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold block mt-0.5">
                                  ID: {record.employeeId}
                                </span>
                              )}
                            </div>
                            <div className="w-9 h-9 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center font-black shrink-0">
                              <FiUsers />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 my-4 text-[11px] font-bold">
                            <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                              <span className="text-[9px] text-brand-dark-grey block uppercase">Date</span>
                              <span>{formatDate ? formatDate(record.recordDate) : new Date(record.recordDate).toLocaleDateString()}</span>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                              <span className="text-[9px] text-brand-dark-grey block uppercase">Duration</span>
                              <span className="text-sky-500">{record.overtimeHours}h {record.overtimeMinutes}m</span>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight col-span-2">
                              <span className="text-[9px] text-brand-dark-grey block uppercase">Remarks</span>
                              <span className="truncate block font-medium">{record.remarks || "None"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                              record.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : record.status === "rejected"
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                record.status === "approved"
                                  ? "bg-emerald-500"
                                  : record.status === "rejected"
                                  ? "bg-rose-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            {record.status}
                          </span>
                          <div className="flex items-center gap-2">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEditRecord(record)}
                                disabled={rowBusy}
                                className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit Record"
                              >
                                <FiEdit3 className="text-sm" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleOpenDelete(record, "record")}
                                disabled={rowBusy}
                                className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete Record"
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
        )
      )}

      {/* POLICY MODAL */}
      <AnimatePresence>
        {isPolicyModalOpen && (
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
                    <FiClock className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {editingPolicy ? "Edit Overtime Policy" : "Add Overtime Policy"}
                    </h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                      Configure multipliers, monthly limits, and minimum thresholds
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={handleSubmitPolicy} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Policy Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={policyForm.policyName}
                    disabled={isSubmitting}
                    onChange={(e) => setPolicyForm((prev) => ({ ...prev, policyName: e.target.value }))}
                    placeholder="e.g. Standard 1.5x Overtime"
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${
                      policyErrors.policyName
                        ? "border-brand-red focus:ring-brand-red/50"
                        : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"
                    } text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                  {policyErrors.policyName && (
                    <p className="text-brand-red text-[11px] mt-1 font-bold">{policyErrors.policyName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Rate Multiplier (x Normal)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={1}
                      value={policyForm.ratePerHour}
                      disabled={isSubmitting}
                      onChange={(e) => setPolicyForm((prev) => ({ ...prev, ratePerHour: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Max Hours / Month
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={policyForm.maxHoursPerMonth}
                      disabled={isSubmitting}
                      onChange={(e) => setPolicyForm((prev) => ({ ...prev, maxHoursPerMonth: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Min Threshold (Minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={policyForm.minOvertimeMinutes}
                    disabled={isSubmitting}
                    onChange={(e) => setPolicyForm((prev) => ({ ...prev, minOvertimeMinutes: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="policyStatus"
                        value="active"
                        checked={policyForm.status === "active"}
                        disabled={isSubmitting}
                        onChange={(e) => setPolicyForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-emerald-500">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="policyStatus"
                        value="inactive"
                        checked={policyForm.status === "inactive"}
                        disabled={isSubmitting}
                        onChange={(e) => setPolicyForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-4 h-4 accent-rose-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-rose-500">Inactive</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPolicyModalOpen(false)}
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
                      <span>{editingPolicy ? "Update Policy" : "Create Policy"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECORD MODAL */}
      <AnimatePresence>
        {isRecordModalOpen && (
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
                    <FiFileText className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {editingRecord ? "Edit Overtime Record" : "Log Overtime Record"}
                    </h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                      Record overtime hours and approval status for an employee
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={handleSubmitRecord} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Employee <span className="text-brand-red">*</span>
                  </label>
                  {employees && employees.length > 0 ? (
                    <select
                      value={recordForm.employeeName}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const selectedEmp = employees.find((emp) => emp.name === e.target.value);
                        setRecordForm((prev) => ({
                          ...prev,
                          employeeName: e.target.value,
                          employeeId: selectedEmp?.employeeId || prev.employeeId,
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                    >
                      <option value="">Select Employee...</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp.name}>
                          {emp.name} ({emp.employeeId || "No ID"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={recordForm.employeeName}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, employeeName: e.target.value }))}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  )}
                  {recordErrors.employeeName && (
                    <p className="text-brand-red text-[11px] mt-1 font-bold">{recordErrors.employeeName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Date <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="date"
                      value={recordForm.recordDate}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, recordDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={recordForm.overtimeHours}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, overtimeHours: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Minutes
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={recordForm.overtimeMinutes}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, overtimeMinutes: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <select
                      value={recordForm.status}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={recordForm.employeeId}
                      disabled={isSubmitting}
                      onChange={(e) => setRecordForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                      placeholder="e.g. EMP-001"
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={recordForm.remarks}
                    disabled={isSubmitting}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Optional notes or reason for overtime..."
                    className="w-full px-4 py-2 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
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
                      <span>{editingRecord ? "Update Record" : "Save Record"}</span>
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
        itemName={deletingItem?.policyName || deletingItem?.employeeName || "Item"}
        isDeleting={isDeleting}
      />
    </div>
  );
}
