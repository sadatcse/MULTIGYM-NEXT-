"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/Comon/ConfirmDeleteModal";
import PhotoUpload from "@/components/Comon/PhotoUpload";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import useBranchApi from "@/hooks/useBranchApi";
import useDepartmentApi from "@/hooks/useDepartmentApi";
import useJobPositionApi from "@/hooks/useJobPositionApi";
import useShiftApi from "@/hooks/useShiftApi";
import useRoleApi from "@/hooks/useRoleApi";
import useLocationData from "@/hooks/useLocationData";
import Swal from "sweetalert2";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiX,
  FiGrid,
  FiList,
  FiLoader,
  FiMail,
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiAward,
  FiPhone,
  FiCalendar,
  FiFileText,
  FiAlertTriangle,
  FiUser,
  FiEye,
  FiKey,
} from "react-icons/fi";

const EMPTY_ADDRESS = {
  addressLine1: "",
  addressLine2: "",
  area: "",
  division: "",
  city: "",
};

const EMPTY_EMERGENCY = {
  name: "",
  relation: "",
  mobileNumber: "",
};

const INITIAL_FORM = {
  employeeId: "",
  name: "",
  email: "",
  password: "",
  photo: "",
  dateOfBirth: "",
  gender: "Male",
  bloodGroup: "A+",
  nationality: "Bangladeshi",
  nidPassport: "",
  mobileNumber: "",
  presentAddress: { ...EMPTY_ADDRESS },
  permanentAddress: { ...EMPTY_ADDRESS },
  emergencyContact: { ...EMPTY_EMERGENCY },
  department: "",
  jobPosition: "",
  employeeType: "Full-time",
  joiningDate: "",
  status: "active",
  branch: "",
  shift: "",
  role: "user",
  resignationDate: "",
  lastWorkingDate: "",
};

const formatAddressStr = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const parts = [addr.addressLine1, addr.addressLine2, addr.area, addr.city, addr.division].filter(Boolean);
  return parts.join(", ");
};

const statGridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const statItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
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

export default function EmployeePage() {
  const { formatDate } = useSystemTimeZone();
  const { can } = useUserPermissions();
  const canView = can("employee", "view");
  const canAdd = can("employee", "add");
  const canEdit = can("employee", "edit");
  const canDelete = can("employee", "delete");

  const {
    employees,
    totalItems,
    totalPages,
    stats,
    loading,
    isFetching,
    searchInput,
    setSearchInput,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    branchFilter,
    setBranchFilter,
    employeeTypeFilter,
    setEmployeeTypeFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployeeApi();

  // Helper APIs & Location Data
  const { branches } = useBranchApi(100);
  const { departments } = useDepartmentApi(100);
  const { jobPositions } = useJobPositionApi(100);
  const { shifts } = useShiftApi(100);
  const { roles: roleOptions } = useRoleApi(100);
  const { divisions, getDistrictsByDivision, getAreasByDistrict } = useLocationData();

  const [viewMode, setViewMode] = useState("table");
  const [activeTab, setActiveTab] = useState("personal");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View Modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);

  // Change Password Modal state
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [passwordEmployee, setPasswordEmployee] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleOpenView = (emp) => {
    setViewingEmployee(emp);
    setIsViewModalOpen(true);
  };

  const handleOpenChangePassword = (emp) => {
    setPasswordEmployee(emp);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setPasswordError("");
    setIsChangePasswordModalOpen(true);
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError("");
    setIsChangingPassword(true);
    try {
      await updateEmployee(passwordEmployee._id, { password: passwordForm.newPassword });
      setIsChangePasswordModalOpen(false);
      Swal.fire({
        title: "Password Changed!",
        text: `Password for "${passwordEmployee.name}" has been updated successfully.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
      });
    } catch (err) {
      setPasswordError(err?.response?.data?.message || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Auto-switch view for mobile screens
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setViewMode("cards");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcut (Escape to close modal)
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isSubmitting]);

  // Permission Check
  if (!canView) {
    return (
      <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        <Mtitle
          title="Employee Directory & Profiles"
          subtitle="View, create, update, and manage full employee HR profiles, status, and work details."
        />
        <div className="bg-brand-white dark:bg-brand-charcoal p-12 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-brand-red/10 text-brand-red flex items-center justify-center text-3xl mx-auto font-bold">
            <FiShield />
          </div>
          <h3 className="text-lg font-extrabold text-brand-black dark:text-brand-white">
            Access Restricted
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light max-w-md mx-auto leading-relaxed">
            You do not have view permission for Employee Management. Contact your System Administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  // Open Add Modal
  const handleOpenAdd = () => {
    if (!canAdd) return;
    setEditingEmployee(null);
    setFormData({
      ...INITIAL_FORM,
      employeeId: `EMP-${(totalItems + 1).toString().padStart(4, "0")}`,
      joiningDate: new Date().toISOString().split("T")[0],
    });
    setActiveTab("personal");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (emp) => {
    if (!canEdit) return;
    setEditingEmployee(emp);
    setFormData({
      employeeId: emp.employeeId || "",
      name: emp.name || "",
      email: emp.email || "",
      password: "",
      photo: emp.photo || "",
      dateOfBirth: emp.dateOfBirth || "",
      gender: emp.gender || "Male",
      bloodGroup: emp.bloodGroup || "A+",
      nationality: emp.nationality || "Bangladeshi",
      nidPassport: emp.nidPassport || "",
      mobileNumber: emp.mobileNumber || "",
      presentAddress: typeof emp.presentAddress === "object" && emp.presentAddress ? { ...EMPTY_ADDRESS, ...emp.presentAddress } : { ...EMPTY_ADDRESS, addressLine1: emp.presentAddress || "" },
      permanentAddress: typeof emp.permanentAddress === "object" && emp.permanentAddress ? { ...EMPTY_ADDRESS, ...emp.permanentAddress } : { ...EMPTY_ADDRESS, addressLine1: emp.permanentAddress || "" },
      emergencyContact: typeof emp.emergencyContact === "object" && emp.emergencyContact ? { ...EMPTY_EMERGENCY, ...emp.emergencyContact } : { ...EMPTY_EMERGENCY, name: emp.emergencyContact || "" },
      department: emp.department || "",
      jobPosition: emp.jobPosition || "",
      employeeType: emp.employeeType || "Full-time",
      joiningDate: emp.joiningDate || "",
      status: emp.status || "active",
      branch: emp.branch || "",
      shift: emp.shift || "",
      role: emp.role || "user",
      resignationDate: emp.resignationDate || "",
      lastWorkingDate: emp.lastWorkingDate || "",
    });
    setActiveTab("personal");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError("Full Name is required.");
      setActiveTab("personal");
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError("A valid Email address is required.");
      setActiveTab("contact");
      return false;
    }
    if (!editingEmployee && (!formData.password || formData.password.length < 6)) {
      setFormError("Password must be at least 6 characters long.");
      setActiveTab("personal");
      return false;
    }

    setFormError("");
    return true;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingEmployee) {
        const updatePayload = { ...formData };
        if (!updatePayload.password || !updatePayload.password.trim()) {
          delete updatePayload.password;
        }
        await updateEmployee(editingEmployee._id, updatePayload);
        Swal.fire({
          title: "Employee Profile Updated!",
          text: `Profile for "${formData.name}" has been updated.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      } else {
        await createEmployee(formData);
        Swal.fire({
          title: "Employee Registered!",
          text: `Employee profile for "${formData.name}" (${formData.employeeId}) added successfully.`,
          icon: "success",
          confirmButtonColor: "#FF1818",
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save employee profile.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleOpenDelete = (emp) => {
    if (!canDelete) return;
    setDeletingEmployee(emp);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(deletingEmployee._id);
      setIsDeleteModalOpen(false);
      Swal.fire({
        title: "Deleted!",
        text: `Employee profile for "${deletingEmployee.name}" has been removed.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to delete employee.";
      Swal.fire({
        title: "Error!",
        text: msg,
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsDeleting(false);
      setDeletingEmployee(null);
    }
  };

  const isResignedOrTerminated =
    formData.status === "resigned" || formData.status === "terminated";

  // Dynamic Cities & Areas for Present Address
  const presentDistricts = getDistrictsByDivision(formData.presentAddress.division);
  const presentAreas = getAreasByDistrict(formData.presentAddress.division, formData.presentAddress.city);

  // Dynamic Cities & Areas for Permanent Address
  const permanentDistricts = getDistrictsByDivision(formData.permanentAddress.division);
  const permanentAreas = getAreasByDistrict(formData.permanentAddress.division, formData.permanentAddress.city);

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      {/* Title Bar */}
      <Mtitle
        title="Employee Directory & Profiles"
        subtitle="Manage complete HR employee records, personal information, work schedules, dynamic departments, and offboarding details."
        rightcontent={
          canAdd ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <FiPlus className="text-lg" />
              <span>Add Employee</span>
            </button>
          ) : null
        }
      />

      {/* KPI Metric Stat Cards */}
      <motion.div
        variants={statGridVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          variants={statItemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Total Employees
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {stats.totalEmployees || totalItems}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiUsers />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={statItemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Active Staff
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {stats.activeEmployees || 0}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiUserCheck />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={statItemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-amber-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Probation Period
              </span>
              <span className="text-2xl font-black text-amber-500 mt-1 block">
                {stats.probationEmployees || 0}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiClock />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={statItemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-red/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Resigned / Terminated
              </span>
              <span className="text-2xl font-black text-brand-red mt-1 block">
                {(stats.resignedEmployees || 0) + (stats.terminatedEmployees || 0)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiUserX />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Control Bar: Search, Filters & View Mode */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search ID, name, email..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white font-medium"
            />
            <AnimatePresence>
              {isFetching && (
                <motion.span
                  key="search-spinner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-3.5 top-2.5"
                >
                  <FiLoader className="text-brand-gold text-sm animate-spin" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Filter Dropdowns Set */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer capitalize"
            >
              <option value="all">All Roles</option>
              {roleOptions && roleOptions.length > 0 ? (
                roleOptions.map((r) => {
                  const val = (r.slug || r.roleName || r.name || "").toLowerCase();
                  const label = r.displayName || r.roleName || r.name || val;
                  return (
                    <option key={r._id || val} value={val}>
                      {label}
                    </option>
                  );
                })
              ) : (
                <>
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </>
              )}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Employee Type Filter */}
            <select
              value={employeeTypeFilter}
              onChange={(e) => {
                setEmployeeTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-brand-red text-white shadow-sm"
                  : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
              }`}
              title="Table View"
            >
              <FiList className="text-base" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-brand-red text-white shadow-sm"
                  : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
              }`}
              title="Card Grid View"
            >
              <FiGrid className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <SkeletonLoading variant="table" rows={6} />
      ) : (
        <>
          <div
            className={`space-y-6 transition-opacity duration-300 ${isFetching ? "opacity-60 pointer-events-none" : "opacity-100"
              }`}
          >
            {/* LIVE DATA TABLE VIEW */}
            <div
              className={`bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden ${viewMode === "table" ? "hidden md:block" : "hidden"
                }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-extrabold tracking-widest text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                    <tr>
                      <th className="py-4 px-6">ID & Profile</th>
                      <th className="py-4 px-6">Contact & Emergency</th>

                      <th className="py-4 px-6">Department & Position</th>
                      <th className="py-4 px-6">Branch & Shift</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      {(canView || canEdit || canDelete) && (
                        <th className="py-4 px-6 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs">
                    {employees.length > 0 ? (
                      <AnimatePresence initial={false}>
                        {employees.map((emp, idx) => {
                          const rowBusy = isDeleting && deletingEmployee?._id === emp._id;
                          const presentAddrText = formatAddressStr(emp.presentAddress);

                          return (
                            <motion.tr
                              key={emp._id}
                              custom={idx}
                              variants={rowVariants}
                              initial="hidden"
                              animate="show"
                              exit="exit"
                              layout
                              className={`hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-200 group ${rowBusy ? "opacity-50 pointer-events-none" : ""
                                }`}
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={
                                      emp.photo ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        emp.name
                                      )}&background=FF1818&color=fff`
                                    }
                                    alt={emp.name}
                                    className="w-11 h-11 rounded-2xl object-cover border border-brand-gold/30 shadow-xs shrink-0 group-hover:scale-105 transition-transform"
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded-md bg-brand-gold/10 text-brand-gold">
                                        {emp.employeeId || `EMP-${(idx + 1).toString().padStart(4, "0")}`}
                                      </span>
                                      {emp.bloodGroup && (
                                        <span className="text-[10px] font-extrabold text-brand-red bg-brand-red/10 px-1.5 py-0.5 rounded">
                                          {emp.bloodGroup}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-extrabold text-sm text-brand-black dark:text-brand-white block mt-0.5 group-hover:text-brand-red transition-colors">
                                      {emp.name}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                                      {emp.role}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                <div className="space-y-1">
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-brand-black dark:text-brand-white">
                                    <FiMail className="text-brand-gold text-xs shrink-0" />
                                    <span>{emp.email}</span>
                                  </span>
                                  {emp.mobileNumber && (
                                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-bold">
                                      <FiPhone className="text-xs shrink-0" />
                                      <span>{emp.mobileNumber}</span>
                                    </span>
                                  )}
                                  {emp.emergencyContact?.name && (
                                    <span className="flex items-center gap-1 text-[10px] text-brand-red font-bold">
                                      <span>ICE: {emp.emergencyContact.name} ({emp.emergencyContact.relation}) - {emp.emergencyContact.mobileNumber}</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                <div className="space-y-1">
                                  <span className="flex items-center gap-1.5 font-bold text-brand-black dark:text-brand-white text-xs">
                                    <FiBriefcase className="text-brand-gold text-xs shrink-0" />
                                    {emp.department || "General"}
                                  </span>
                                  <span className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium block">
                                    {emp.jobPosition || "Staff"}
                                  </span>
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                <div className="space-y-1">
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-brand-black dark:text-brand-white">
                                    <FiMapPin className="text-brand-red text-xs shrink-0" />
                                    {emp.branch || "Main Branch"}
                                  </span>
                                  <span className="flex items-center gap-1 text-[11px] text-brand-dark-grey dark:text-brand-gold-light">
                                    <FiClock className="text-brand-gold text-xs shrink-0" />
                                    {emp.shift || "Day Shift"}
                                  </span>
                                </div>
                              </td>

                              <td className="py-4 px-6 text-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${emp.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                    : emp.status === "probation"
                                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                      : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                                    }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${emp.status === "active"
                                      ? "bg-emerald-500 animate-pulse"
                                      : "bg-brand-red"
                                      }`}
                                  />
                                  {emp.status}
                                </span>
                              </td>

                              {(canView || canEdit || canDelete) && (
                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleOpenView(emp)}
                                      disabled={rowBusy}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-500 bg-blue-500/10 hover:bg-blue-500 hover:text-white scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                                      title="View Details"
                                    >
                                      <FiEye className="text-xs" />
                                      <span>View</span>
                                    </button>

                                    {canEdit && (
                                      <button
                                        onClick={() => handleOpenChangePassword(emp)}
                                        disabled={rowBusy}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500 hover:text-white scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                                        title="Change Password"
                                      >
                                        <FiKey className="text-xs" />
                                        <span>Password</span>
                                      </button>
                                    )}

                                    {canEdit && (
                                      <button
                                        onClick={() => handleOpenEdit(emp)}
                                        disabled={rowBusy}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                                        title="Edit Profile"
                                      >
                                        <FiEdit3 className="text-xs" />
                                        <span>Edit</span>
                                      </button>
                                    )}

                                    {canDelete && (
                                      <button
                                        onClick={() => handleOpenDelete(emp)}
                                        disabled={rowBusy}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                                        title="Delete Employee"
                                      >
                                        {rowBusy ? (
                                          <span className="w-3 h-3 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <FiTrash2 className="text-xs" />
                                        )}
                                        <span>{rowBusy ? "Deleting..." : "Delete"}</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="py-12 text-center text-brand-dark-grey dark:text-brand-gold-light font-medium"
                        >
                          No employee records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CARD GRID VIEW */}
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${viewMode === "cards" ? "grid" : "hidden"
                }`}
            >
              {employees.length > 0 ? (
                <AnimatePresence initial={false}>
                  {employees.map((emp, idx) => {
                    const rowBusy = isDeleting && deletingEmployee?._id === emp._id;
                    const presentAddrText = formatAddressStr(emp.presentAddress);

                    return (
                      <motion.div
                        key={emp._id}
                        custom={idx}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        layout
                        className={`bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:shadow-md hover:border-brand-gold/50 transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group ${rowBusy ? "opacity-50 pointer-events-none" : ""
                          }`}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-red via-brand-gold to-brand-gold-light opacity-90" />

                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono font-black text-xs px-2.5 py-1 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                            {emp.employeeId || `EMP-${(idx + 1).toString().padStart(4, "0")}`}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${emp.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${emp.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-brand-red"
                                }`}
                            />
                            {emp.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <img
                            src={
                              emp.photo ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                emp.name
                              )}&background=FF1818&color=fff`
                            }
                            alt={emp.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-gold/40 shadow-sm shrink-0"
                          />
                          <div>
                            <h4 className="font-extrabold text-base text-brand-black dark:text-brand-white">
                              {emp.name}
                            </h4>
                            <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light flex items-center gap-1 mt-0.5 font-medium">
                              <FiMail className="text-brand-gold" />
                              {emp.email}
                            </p>
                            {emp.mobileNumber && (
                              <p className="text-[11px] text-emerald-500 flex items-center gap-1 font-bold">
                                <FiPhone />
                                {emp.mobileNumber}
                              </p>
                            )}
                          </div>
                        </div>

                        {presentAddrText && (
                          <div className="text-xs text-brand-dark-grey dark:text-brand-gold-light flex items-start gap-1.5 pt-1">
                            <FiMapPin className="text-brand-red text-sm shrink-0 mt-0.5" />
                            <span>{presentAddrText}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-brand-beige/30 dark:border-brand-dark-grey/30 pt-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-brand-dark-grey dark:text-brand-gold-light/70 block">
                              Department
                            </span>
                            <span className="font-bold text-brand-black dark:text-brand-white block mt-0.5">
                              {emp.department || "General"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-brand-dark-grey dark:text-brand-gold-light/70 block">
                              Position
                            </span>
                            <span className="font-bold text-brand-black dark:text-brand-white block mt-0.5">
                              {emp.jobPosition || "Staff"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                          <button
                            onClick={() => handleOpenView(emp)}
                            disabled={rowBusy}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-500 bg-blue-500/10 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                          >
                            <FiEye /> View
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenChangePassword(emp)}
                              disabled={rowBusy}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                            >
                              <FiKey /> Password
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              disabled={rowBusy}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer"
                            >
                              <FiEdit3 /> Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleOpenDelete(emp)}
                              disabled={rowBusy}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer"
                            >
                              {rowBusy ? (
                                <span className="w-3 h-3 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FiTrash2 />
                              )}
                              {rowBusy ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="col-span-full bg-brand-white dark:bg-brand-charcoal p-12 rounded-3xl border text-center text-xs text-brand-dark-grey">
                  No employee records found.
                </div>
              )}
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}

      {/* Structured Add / Edit Employee Modal Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl relative my-8"
            >
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="absolute top-5 right-5 p-2 text-brand-dark-grey hover:text-brand-red rounded-full transition-colors cursor-pointer"
              >
                <FiX className="text-xl" />
              </button>

              <h3 className="text-xl font-extrabold text-brand-black dark:text-brand-white mb-1">
                {editingEmployee ? "Edit Employee HR Document" : "Add New HR Employee Record"}
              </h3>
              <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-4">
                Fill in structured personal info, sub-branch addresses, emergency contacts, and work assignments.
              </p>

              {/* Form Tabs */}
              <div className="flex items-center gap-2 border-b border-brand-beige/50 dark:border-brand-dark-grey/50 pb-3 mb-5 overflow-x-auto">
                {[
                  { id: "personal", label: "Personal Info", icon: FiUser },
                  { id: "contact", label: "Contact & Location", icon: FiPhone },
                  { id: "work", label: "Work & Role", icon: FiBriefcase },
                  ...(isResignedOrTerminated
                    ? [{ id: "offboarding", label: "Resignation / Exit", icon: FiAlertTriangle }]
                    : []),
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${activeTab === tab.id
                        ? "bg-brand-red text-white shadow-md shadow-brand-red/20"
                        : "bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
                        }`}
                    >
                      <Icon className="text-sm" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-2xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* TAB 1: PERSONAL INFO */}
                {activeTab === "personal" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Employee ID *
                        </label>
                        <input
                          type="text"
                          value={formData.employeeId}
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          placeholder="EMP-0001"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. John Doe"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Gender
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Blood Group
                        </label>
                        <select
                          value={formData.bloodGroup}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Nationality
                        </label>
                        <input
                          type="text"
                          value={formData.nationality}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                          placeholder="Bangladeshi"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          NID / Passport Number
                        </label>
                        <input
                          type="text"
                          value={formData.nidPassport}
                          onChange={(e) => setFormData({ ...formData, nidPassport: e.target.value })}
                          placeholder="1234567890"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                        />
                      </div>

                    </div>

                    <PhotoUpload
                      value={formData.photo}
                      onChange={(url) => setFormData({ ...formData, photo: url })}
                      name={formData.name}
                    />
                  </div>
                )}

                {/* TAB 2: CONTACT & DYNAMIC LOCATION SELECTS */}
                {activeTab === "contact" && (
                  <div className="space-y-5">
                    {/* Basic Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="employee@company.com"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Mobile Number
                        </label>
                        <input
                          type="text"
                          value={formData.mobileNumber}
                          onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                          placeholder="+8801700000000"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey space-y-3">
                      <h4 className="text-xs font-extrabold uppercase text-brand-gold tracking-wider flex items-center gap-1.5">
                        <FiPhone className="text-brand-red" /> Emergency Contact
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Contact Name
                          </label>
                          <input
                            type="text"
                            value={formData.emergencyContact.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                              })
                            }
                            placeholder="Relative Name"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Relation
                          </label>
                          <input
                            type="text"
                            value={formData.emergencyContact.relation}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                emergencyContact: { ...formData.emergencyContact, relation: e.target.value },
                              })
                            }
                            placeholder="Father / Spouse / Brother"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Mobile Number
                          </label>
                          <input
                            type="text"
                            value={formData.emergencyContact.mobileNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                emergencyContact: { ...formData.emergencyContact, mobileNumber: e.target.value },
                              })
                            }
                            placeholder="+8801..."
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Present Address Cascading Dropdowns */}
                    <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey space-y-3">
                      <h4 className="text-xs font-extrabold uppercase text-brand-gold tracking-wider flex items-center gap-1.5">
                        <FiMapPin className="text-brand-gold" /> Present Address (Division / City / Area Selects)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Division Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Division
                          </label>
                          <select
                            value={formData.presentAddress.division}
                            onChange={(e) => {
                              const newDiv = e.target.value;
                              setFormData({
                                ...formData,
                                presentAddress: {
                                  ...formData.presentAddress,
                                  division: newDiv,
                                  city: "",
                                  area: "",
                                },
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                          >
                            <option value="">Select Division</option>
                            {divisions.map((div) => (
                              <option key={div} value={div}>
                                {div}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* City / District Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            City / District
                          </label>
                          <select
                            value={formData.presentAddress.city}
                            disabled={!formData.presentAddress.division}
                            onChange={(e) => {
                              const newCity = e.target.value;
                              setFormData({
                                ...formData,
                                presentAddress: {
                                  ...formData.presentAddress,
                                  city: newCity,
                                  area: "",
                                },
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">Select City / District</option>
                            {presentDistricts.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Area Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Area / Upazila
                          </label>
                          <select
                            value={formData.presentAddress.area}
                            disabled={!formData.presentAddress.city}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                presentAddress: {
                                  ...formData.presentAddress,
                                  area: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">Select Area / Upazila</option>
                            {presentAreas.map((area) => (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Address Line 1
                          </label>
                          <input
                            type="text"
                            value={formData.presentAddress.addressLine1}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                presentAddress: { ...formData.presentAddress, addressLine1: e.target.value },
                              })
                            }
                            placeholder="House / Flat / Holding No."
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            value={formData.presentAddress.addressLine2}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                presentAddress: { ...formData.presentAddress, addressLine2: e.target.value },
                              })
                            }
                            placeholder="Road / Block / Sector"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Permanent Address Cascading Dropdowns */}
                    <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey space-y-3">
                      <h4 className="text-xs font-extrabold uppercase text-brand-gold tracking-wider flex items-center gap-1.5">
                        <FiMapPin className="text-emerald-500" /> Permanent Address (Division / City / Area Selects)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Division Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Division
                          </label>
                          <select
                            value={formData.permanentAddress.division}
                            onChange={(e) => {
                              const newDiv = e.target.value;
                              setFormData({
                                ...formData,
                                permanentAddress: {
                                  ...formData.permanentAddress,
                                  division: newDiv,
                                  city: "",
                                  area: "",
                                },
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                          >
                            <option value="">Select Division</option>
                            {divisions.map((div) => (
                              <option key={div} value={div}>
                                {div}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* City / District Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            City / District
                          </label>
                          <select
                            value={formData.permanentAddress.city}
                            disabled={!formData.permanentAddress.division}
                            onChange={(e) => {
                              const newCity = e.target.value;
                              setFormData({
                                ...formData,
                                permanentAddress: {
                                  ...formData.permanentAddress,
                                  city: newCity,
                                  area: "",
                                },
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">Select City / District</option>
                            {permanentDistricts.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Area Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Area / Upazila
                          </label>
                          <select
                            value={formData.permanentAddress.area}
                            disabled={!formData.permanentAddress.city}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permanentAddress: {
                                  ...formData.permanentAddress,
                                  area: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">Select Area / Upazila</option>
                            {permanentAreas.map((area) => (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Address Line 1
                          </label>
                          <input
                            type="text"
                            value={formData.permanentAddress.addressLine1}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permanentAddress: { ...formData.permanentAddress, addressLine1: e.target.value },
                              })
                            }
                            placeholder="Village / House No."
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            value={formData.permanentAddress.addressLine2}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permanentAddress: { ...formData.permanentAddress, addressLine2: e.target.value },
                              })
                            }
                            placeholder="Post Office / Thana"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: WORK & ROLE */}
                {activeTab === "work" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Employment Status *
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="active">Active</option>
                          <option value="probation">Probation</option>
                          <option value="resigned">Resigned</option>
                          <option value="terminated">Terminated</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Employee Type
                        </label>
                        <select
                          value={formData.employeeType}
                          onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          System Access Role
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer capitalize"
                        >
                          <option value="">Select System Access Role</option>
                          {roleOptions && roleOptions.length > 0 ? (
                            roleOptions.map((r) => {
                              const val = (r.slug || r.roleName || r.name || "").toLowerCase();
                              const label = r.displayName || r.roleName || r.name || val;
                              return (
                                <option key={r._id || val} value={val}>
                                  {label}
                                </option>
                              );
                            })
                          ) : (
                            <>
                              <option value="user">User / Staff</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Super Admin</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Department
                        </label>
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="">Select Department</option>
                          {departments.map((d) => (
                            <option key={d._id} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Position
                        </label>
                        <select
                          value={formData.jobPosition}
                          onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="">Select Position</option>
                          {jobPositions.map((jp) => (
                            <option key={jp._id} value={jp.title || jp.name}>
                              {jp.title || jp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Branch
                        </label>
                        <select
                          value={formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="">Select Branch</option>
                          {branches.map((b) => (
                            <option key={b._id} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Work Shift
                        </label>
                        <select
                          value={formData.shift}
                          onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="">Select Shift</option>
                          {shifts.map((s) => (
                            <option key={s._id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Joining Date
                        </label>
                        <input
                          type="date"
                          value={formData.joiningDate}
                          onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {!editingEmployee && (
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: CONDITIONAL OFFBOARDING INFO */}
                {activeTab === "offboarding" && isResignedOrTerminated && (
                  <div className="space-y-4 p-4 rounded-2xl bg-brand-red/10 border border-brand-red/30">
                    <div className="flex items-center gap-2 text-brand-red font-bold text-xs">
                      <FiAlertTriangle className="text-base" />
                      <span>Employee Resignation / Termination Tracking</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-red mb-1">
                          Resignation Date
                        </label>
                        <input
                          type="date"
                          value={formData.resignationDate}
                          onChange={(e) =>
                            setFormData({ ...formData, resignationDate: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-white dark:bg-brand-midnight border border-brand-red/40 text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-red outline-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-red mb-1">
                          Last Working Date
                        </label>
                        <input
                          type="date"
                          value={formData.lastWorkingDate}
                          onChange={(e) =>
                            setFormData({ ...formData, lastWorkingDate: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-white dark:bg-brand-midnight border border-brand-red/40 text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-red outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-brand-beige/50 dark:border-brand-dark-grey/50">
                  <div className="flex items-center gap-2">
                    {activeTab !== "personal" && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            activeTab === "offboarding"
                              ? "work"
                              : activeTab === "work"
                                ? "contact"
                                : "personal"
                          )
                        }
                        className="px-4 py-2 rounded-2xl border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white hover:bg-brand-offwhite dark:hover:bg-brand-midnight transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                    )}
                    {activeTab !== "work" && activeTab !== "offboarding" && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(activeTab === "personal" ? "contact" : "work")
                        }
                        className="px-4 py-2 rounded-2xl bg-brand-gold text-brand-midnight text-xs font-black hover:bg-brand-gold-light transition-colors cursor-pointer"
                      >
                        Next
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-2xl border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white hover:bg-brand-offwhite dark:hover:bg-brand-midnight transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold shadow-lg shadow-brand-red/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>{editingEmployee ? "Update Record" : "Save Record"}</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Employee Record"
        message={`Are you sure you want to permanently remove employee "${deletingEmployee?.name}" (${deletingEmployee?.employeeId})?`}
        isDeleting={isDeleting}
      />

      {/* VIEW EMPLOYEE DETAILS MODAL */}
      <AnimatePresence>
        {isViewModalOpen && viewingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-brand-offwhite dark:bg-brand-midnight border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={viewingEmployee.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
                    alt={viewingEmployee.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-gold shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-brand-black dark:text-brand-white">
                        {viewingEmployee.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-gold/10 text-brand-gold border border-brand-gold/30">
                        {viewingEmployee.employeeId || "EMP"}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
                      {viewingEmployee.jobPosition || "Staff"} • {viewingEmployee.department || "General"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-brand-white dark:bg-brand-charcoal hover:bg-brand-red hover:text-white flex items-center justify-center text-brand-dark-grey transition-all cursor-pointer"
                >
                  <FiX className="text-base" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                    <FiBriefcase /> Employment Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Branch</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.branch || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Shift</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.shift || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Employee Type</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.employeeType || "Full-time"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Joining Date</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.joiningDate ? formatDate(viewingEmployee.joiningDate) : "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Role</span>
                      <span className="font-bold uppercase text-brand-black dark:text-brand-white">{viewingEmployee.role || "user"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Status</span>
                      <span className={`font-bold capitalize ${viewingEmployee.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>{viewingEmployee.status || 'active'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                    <FiUser /> Personal Information
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Date of Birth</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.dateOfBirth ? formatDate(viewingEmployee.dateOfBirth) : "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Gender</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.gender || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Blood Group</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.bloodGroup || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Nationality</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.nationality || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight col-span-2">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">NID / Passport</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.nidPassport || "—"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                    <FiMail /> Contact & Location
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Email Address</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.email}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Mobile Number</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.mobileNumber || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Present Address</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{formatAddressStr(viewingEmployee.presentAddress) || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Permanent Address</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{formatAddressStr(viewingEmployee.permanentAddress) || "—"}</span>
                    </div>
                  </div>
                </div>

                {viewingEmployee.emergencyContact && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                      <FiPhone /> Emergency Contact
                    </h4>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Contact Person</span>
                        <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.emergencyContact.name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Relation</span>
                        <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.emergencyContact.relation || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Mobile Number</span>
                        <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.emergencyContact.mobileNumber || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-brand-offwhite dark:bg-brand-midnight border-t border-brand-beige/50 dark:border-brand-dark-grey/50 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-6 py-2.5 rounded-2xl bg-brand-charcoal text-white dark:bg-brand-white dark:text-brand-midnight font-black text-xs hover:opacity-90 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHANGE PASSWORD MODAL */}
      <AnimatePresence>
        {isChangePasswordModalOpen && passwordEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-brand-offwhite dark:bg-brand-midnight border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg font-bold">
                    <FiKey />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      Change Password
                    </h3>
                    <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                      {passwordEmployee.name} ({passwordEmployee.email})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-brand-white dark:bg-brand-charcoal hover:bg-brand-red hover:text-white flex items-center justify-center text-brand-dark-grey transition-all cursor-pointer"
                >
                  <FiX className="text-base" />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4">
                {passwordError && (
                  <div className="p-3 rounded-xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold flex items-center gap-2">
                    <FiAlertTriangle />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-offwhite dark:hover:bg-brand-midnight transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-6 py-2.5 rounded-2xl bg-brand-gold hover:bg-brand-gold-light text-brand-midnight font-black text-xs transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {isChangingPassword ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
