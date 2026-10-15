"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import useBranchApi from "@/hooks/useBranchApi";
import useDepartmentApi from "@/hooks/useDepartmentApi";
import useJobPositionApi from "@/hooks/useJobPositionApi";
import useShiftApi from "@/hooks/useShiftApi";
import useRoleApi from "@/hooks/useRoleApi";
import useLocationData from "@/hooks/useLocationData";
import useAssetAssignmentApi from "@/hooks/useAssetAssignmentApi";
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
  FiPackage,
  FiExternalLink,
} from "react-icons/fi";
import EmployeeFormModal from "@/components/modals/employee/EmployeeFormModal";
import EmployeeViewModal from "@/components/modals/employee/EmployeeViewModal";
import ChangePasswordModal from "@/components/modals/employee/ChangePasswordModal";

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
  branches: [],
  shift: "",
  role: "user",
  resignationDate: "",
  lastWorkingDate: "",
  reportingAuthority: "",
  reportingAuthorityName: "",
  basicSalary: undefined,
  grossSalary: undefined,
  deviceUserId: "",
  documents: [],
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
  const router = useRouter();
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
  const { departments } = useDepartmentApi(200);
  const { jobPositions } = useJobPositionApi(200);
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

  // Filter job positions based on the department currently selected in the form
  const availablePositions = useMemo(() => {
    if (!formData.department || !formData.department.trim()) {
      return [];
    }

    const selectedDept = departments.find(
      (d) =>
        (d.name && d.name.trim().toLowerCase() === formData.department.trim().toLowerCase()) ||
        d._id === formData.department
    );

    const targetDeptName = (selectedDept?.name || formData.department).trim().toLowerCase();
    const targetDeptId = selectedDept?._id ? String(selectedDept._id) : null;

    return jobPositions.filter((jp) => {
      // Exclude inactive positions unless it is the currently assigned position of the employee
      const isCurrent = (jp.title || jp.name) === formData.jobPosition;
      if (jp.status === "inactive" && !isCurrent) {
        return false;
      }

      if (!jp.department) return false;
      const jpDept = String(jp.department).trim().toLowerCase();

      return jpDept === targetDeptName || (targetDeptId && String(jp.department) === targetDeptId);
    });
  }, [formData.department, formData.jobPosition, departments, jobPositions]);

  // Handle department change: resets jobPosition if it does not exist under the new department
  const handleDepartmentChange = (newDept) => {
    setFormData((prev) => {
      if (!newDept) {
        return {
          ...prev,
          department: "",
          jobPosition: "",
        };
      }

      const selectedDept = departments.find(
        (d) =>
          (d.name && d.name.trim().toLowerCase() === newDept.trim().toLowerCase()) ||
          d._id === newDept
      );
      const targetDeptName = (selectedDept?.name || newDept).trim().toLowerCase();
      const targetDeptId = selectedDept?._id ? String(selectedDept._id) : null;

      const matchingPositions = jobPositions.filter((jp) => {
        if (!jp.department) return false;
        const jpDept = String(jp.department).trim().toLowerCase();
        return jpDept === targetDeptName || (targetDeptId && String(jp.department) === targetDeptId);
      });

      const stillValid = matchingPositions.some(
        (jp) => (jp.title || jp.name) === prev.jobPosition
      );

      return {
        ...prev,
        department: newDept,
        jobPosition: stillValid ? prev.jobPosition : "",
      };
    });
  };

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
      branches: Array.isArray(emp.branches) ? emp.branches : (emp.branch ? [emp.branch] : []),
      shift: emp.shift || "",
      role: emp.role || "user",
      resignationDate: emp.resignationDate || "",
      lastWorkingDate: emp.lastWorkingDate || "",
      reportingAuthority: emp.reportingAuthority || "",
      reportingAuthorityName: emp.reportingAuthorityName || "",
      basicSalary: emp.basicSalary || undefined,
      grossSalary: emp.grossSalary || undefined,
      deviceUserId: emp.deviceUserId || "",
      documents: Array.isArray(emp.documents) ? emp.documents.map(({ _id, ...d }) => d) : [],
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
                          <option value="suspended">Suspended</option>
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
                                    {emp.branches?.length > 0 ? emp.branches.join(", ") : "Main Branch"}
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
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${viewMode === "cards" ? "md:grid" : "md:hidden"
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
      <EmployeeFormModal activeTab={activeTab} availablePositions={availablePositions} branches={branches} departments={departments} divisions={divisions} editingEmployee={editingEmployee} formData={formData} formError={formError} handleCloseModal={handleCloseModal} handleDepartmentChange={handleDepartmentChange} handleSubmit={handleSubmit} isModalOpen={isModalOpen} isResignedOrTerminated={isResignedOrTerminated} isSubmitting={isSubmitting} permanentAreas={permanentAreas} permanentDistricts={permanentDistricts} presentAreas={presentAreas} presentDistricts={presentDistricts} roleOptions={roleOptions} setActiveTab={setActiveTab} setFormData={setFormData} shifts={shifts} permissions={{ canAdd, canEdit, canDelete }} />

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
      <EmployeeViewModal EmployeeAssetsSection={EmployeeAssetsSection} formatAddressStr={formatAddressStr} formatDate={formatDate} isViewModalOpen={isViewModalOpen} router={router} setIsViewModalOpen={setIsViewModalOpen} viewingEmployee={viewingEmployee} permissions={{ canAdd, canEdit, canDelete }} />

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal handleChangePasswordSubmit={handleChangePasswordSubmit} isChangePasswordModalOpen={isChangePasswordModalOpen} isChangingPassword={isChangingPassword} passwordEmployee={passwordEmployee} passwordError={passwordError} passwordForm={passwordForm} setIsChangePasswordModalOpen={setIsChangePasswordModalOpen} setPasswordForm={setPasswordForm} permissions={{ canAdd, canEdit, canDelete }} />
    </div>
  );
}

/* Compact "currently assigned" summary for the employee view modal — the
 * full assignment history (including returns) lives on the Asset Management
 * module itself, this is just the integration point. */
function EmployeeAssetsSection({ employeeId, formatDate, onViewAll }) {
  const { getByEmployee } = useAssetAssignmentApi();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getByEmployee(employeeId)
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((err) => console.error("Failed to load employee assets:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const active = items.filter((i) => i.status === "active");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
          <FiPackage /> Assets & Uniforms
        </h4>
        <button onClick={onViewAll} className="text-[10px] font-bold text-brand-gold hover:underline cursor-pointer flex items-center gap-1">
          Asset Management <FiExternalLink className="text-[10px]" />
        </button>
      </div>
      {loading ? (
        <p className="text-xs text-brand-dark-grey">Loading...</p>
      ) : active.length === 0 ? (
        <p className="text-xs text-brand-dark-grey p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">No assets currently assigned.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 text-xs">
          {active.map((item) => (
            <div key={item._id} className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
              <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">{item.asset?.assetType?.name || "Asset"}</span>
              <span className="font-bold text-brand-black dark:text-brand-white">{item.asset?.assetCode}</span>
              <span className="block text-brand-dark-grey">Issued {formatDate(item.issueDate)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
