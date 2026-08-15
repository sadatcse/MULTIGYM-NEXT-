"use client";

import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useRolePermissionApi from "@/hooks/useRolePermissionApi";
import useRoleApi from "@/hooks/useRoleApi";
import Swal from "sweetalert2";
import {
  FiShield,
  FiSave,
  FiCheckCircle,
  FiLock,
  FiCheckSquare,
  FiSquare,
  FiRefreshCw,
  FiEye,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiLayers,
} from "react-icons/fi";

const SYSTEM_MODULES = [
  {
    category: "Configuration & System Settings",
    items: [
      { key: "departments", name: "Department Configuration", description: "Manage organizational departments, display order, and status" },
      { key: "roles", name: "User Role Configuration", description: "Create and manage system user roles and hierarchy order" },
      { key: "role-permissions", name: "Role Access Control", description: "Configure module-level view/add/edit/delete access matrix" },
    ],
  },
  {
    category: "Staff & User Directory",
    items: [
      { key: "user", name: "Employee Directory", description: "View, create, update, and manage employee profiles and credentials" },
    ],
  },
  {
    category: "Procurement & Operations",
    items: [
      { key: "vendor", name: "Vendor Management", description: "Track suppliers, gym equipment vendors, and contact records" },
    ],
  },
  {
    category: "Financial & System Audit",
    items: [
      { key: "transaction-logs", name: "Transaction Logs", description: "Audit trail, action logs, system event history, and security logs" },
    ],
  },
];

// Framer Motion variants
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function RolePermissionsPage() {
  const { roles: apiRoles } = useRoleApi();
  const {
    selectedRole,
    setSelectedRole,
    permissions,
    setPermissions,
    allRolePermissions,
    loading,
    isSaving,
    savePermissions,
  } = useRolePermissionApi("HR MANAGER");

  // Fallback default roles if API is loading
  const availableRoles = useMemo(() => {
    if (apiRoles && apiRoles.length > 0) {
      return apiRoles.map((r) => r.name);
    }
    return [
      "Super Admin",
      "HR Manager",
      "Payroll Officer",
      "Department Head",
      "Trainer",
      "General Staff",
    ];
  }, [apiRoles]);

  // Calculate statistics for selected role
  const activeModuleCount = useMemo(() => {
    let count = 0;
    Object.values(permissions || {}).forEach((perm) => {
      if (perm?.view) count++;
    });
    return count;
  }, [permissions]);

  const totalGrantedPermissions = useMemo(() => {
    let total = 0;
    Object.values(permissions || {}).forEach((perm) => {
      if (perm?.view) total++;
      if (perm?.add) total++;
      if (perm?.edit) total++;
      if (perm?.delete) total++;
    });
    return total;
  }, [permissions]);

  // Toggle single action flag for a module
  const handleToggleAction = (moduleKey, action) => {
    setPermissions((prev) => {
      const modulePerms = prev[moduleKey] || {
        view: false,
        add: false,
        edit: false,
        delete: false,
      };

      const updatedModule = {
        ...modulePerms,
        [action]: !modulePerms[action],
      };

      // If add/edit/delete is turned on, automatically turn on view
      if ((action === "add" || action === "edit" || action === "delete") && updatedModule[action]) {
        updatedModule.view = true;
      }

      // If view is turned off, automatically turn off add/edit/delete
      if (action === "view" && !updatedModule.view) {
        updatedModule.add = false;
        updatedModule.edit = false;
        updatedModule.delete = false;
      }

      return {
        ...prev,
        [moduleKey]: updatedModule,
      };
    });
  };

  // Toggle all actions for a specific module
  const handleToggleRow = (moduleKey) => {
    setPermissions((prev) => {
      const modulePerms = prev[moduleKey] || {};
      const allEnabled =
        modulePerms.view && modulePerms.add && modulePerms.edit && modulePerms.delete;

      return {
        ...prev,
        [moduleKey]: {
          view: !allEnabled,
          add: !allEnabled,
          edit: !allEnabled,
          delete: !allEnabled,
        },
      };
    });
  };

  // Enable all permissions across all modules
  const handleSelectAll = () => {
    const fullPermissions = {};
    SYSTEM_MODULES.forEach((cat) => {
      cat.items.forEach((item) => {
        fullPermissions[item.key] = { view: true, add: true, edit: true, delete: true };
      });
    });
    setPermissions(fullPermissions);
  };

  // Clear all permissions
  const handleClearAll = () => {
    const emptyPermissions = {};
    SYSTEM_MODULES.forEach((cat) => {
      cat.items.forEach((item) => {
        emptyPermissions[item.key] = { view: false, add: false, edit: false, delete: false };
      });
    });
    setPermissions(emptyPermissions);
  };

  // Save permissions handler
  const handleSave = async () => {
    try {
      await savePermissions();
      Swal.fire({
        title: "Permissions Saved!",
        text: `Granular access matrix for role "${selectedRole}" has been updated successfully.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
      });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save permissions.";
      Swal.fire({
        title: "Error!",
        text: msg,
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10">
      {/* Header Component */}
      <Mtitle
        title="Role Based Access Control"
        subtitle="Configure granular view, add, edit, and delete access permissions for all system modules by user role."
        rightcontent={
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Matrix...</span>
              </>
            ) : (
              <>
                <FiSave className="text-lg" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        }
      />

      {/* 4 KPI Stat Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Configured Roles */}
        <motion.div
          variants={cardVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Configured Roles
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {allRolePermissions.length || availableRoles.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiShield />
            </div>
          </div>
        </motion.div>

        {/* Selected Target Role */}
        <motion.div
          variants={cardVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Target Role
              </span>
              <span className="text-base font-extrabold text-brand-gold mt-1 block truncate max-w-[150px]">
                {selectedRole}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiLock />
            </div>
          </div>
        </motion.div>

        {/* Active Module Access */}
        <motion.div
          variants={cardVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Module Access
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {activeModuleCount} / 6
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
        </motion.div>

        {/* Total Granted Permissions */}
        <motion.div
          variants={cardVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-red/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Granted Privileges
              </span>
              <span className="text-2xl font-black text-brand-red mt-1 block">
                {totalGrantedPermissions}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiLayers />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Role Selection & Quick Action Bar */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Role Selector Tabs / Select */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light shrink-0 flex items-center gap-1.5">
            <FiShield className="text-brand-gold" /> Target User Role:
          </span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 rounded-2xl px-4 py-2 text-xs font-extrabold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer shadow-xs"
          >
            {availableRoles.map((roleName) => (
              <option key={roleName} value={roleName}>
                {roleName}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer shadow-xs"
          >
            <FiCheckSquare className="text-xs" />
            <span>Select All</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer shadow-xs"
          >
            <FiSquare className="text-xs" />
            <span>Clear All</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole(selectedRole)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer shadow-xs"
          >
            <FiRefreshCw className="text-xs" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Permissions Matrix */}
      {loading ? (
        <SkeletonLoading variant="table" rows={6} />
      ) : (
        <div className="space-y-6">
          {SYSTEM_MODULES.map((categoryGroup) => (
            <div
              key={categoryGroup.category}
              className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-brand-dark-grey dark:text-brand-gold-light flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-gold" />
                  {categoryGroup.category}
                </h4>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-white dark:bg-brand-charcoal uppercase text-[10px] font-extrabold tracking-wider text-brand-dark-grey border-b border-brand-beige/40 dark:border-brand-dark-grey/40">
                    <tr>
                      <th className="py-3 px-6 w-12 text-center">Row</th>
                      <th className="py-3 px-6">Module Name</th>
                      <th className="py-3 px-6 text-center w-28">
                        <span className="inline-flex items-center gap-1">
                          <FiEye className="text-brand-gold" /> View
                        </span>
                      </th>
                      <th className="py-3 px-6 text-center w-28">
                        <span className="inline-flex items-center gap-1">
                          <FiPlus className="text-brand-gold" /> Add
                        </span>
                      </th>
                      <th className="py-3 px-6 text-center w-28">
                        <span className="inline-flex items-center gap-1">
                          <FiEdit3 className="text-brand-gold" /> Edit
                        </span>
                      </th>
                      <th className="py-3 px-6 text-center w-28">
                        <span className="inline-flex items-center gap-1">
                          <FiTrash2 className="text-brand-red" /> Delete
                        </span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    {categoryGroup.items.map((moduleItem) => {
                      const modulePerms = permissions[moduleItem.key] || {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false,
                      };
                      const isAllChecked =
                        modulePerms.view && modulePerms.add && modulePerms.edit && modulePerms.delete;

                      return (
                        <tr
                          key={moduleItem.key}
                          className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-colors duration-150"
                        >
                          {/* Full Row Toggle Checkbox */}
                          <td className="py-4 px-6 text-center">
                            <input
                              type="checkbox"
                              checked={isAllChecked}
                              onChange={() => handleToggleRow(moduleItem.key)}
                              className="w-4 h-4 accent-brand-red rounded cursor-pointer"
                              title="Toggle all permissions for this row"
                            />
                          </td>

                          {/* Module Description */}
                          <td className="py-4 px-6">
                            <div>
                              <span className="font-extrabold text-sm text-brand-black dark:text-brand-white block">
                                {moduleItem.name}
                              </span>
                              <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light font-medium block">
                                {moduleItem.description}
                              </span>
                            </div>
                          </td>

                          {/* View Toggle */}
                          <td className="py-4 px-6 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-2 rounded-xl hover:bg-brand-beige/30 dark:hover:bg-brand-midnight transition-colors">
                              <input
                                type="checkbox"
                                checked={Boolean(modulePerms.view)}
                                onChange={() => handleToggleAction(moduleItem.key, "view")}
                                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                              />
                            </label>
                          </td>

                          {/* Add Toggle */}
                          <td className="py-4 px-6 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-2 rounded-xl hover:bg-brand-beige/30 dark:hover:bg-brand-midnight transition-colors">
                              <input
                                type="checkbox"
                                checked={Boolean(modulePerms.add)}
                                onChange={() => handleToggleAction(moduleItem.key, "add")}
                                className="w-4 h-4 accent-brand-gold rounded cursor-pointer"
                              />
                            </label>
                          </td>

                          {/* Edit Toggle */}
                          <td className="py-4 px-6 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-2 rounded-xl hover:bg-brand-beige/30 dark:hover:bg-brand-midnight transition-colors">
                              <input
                                type="checkbox"
                                checked={Boolean(modulePerms.edit)}
                                onChange={() => handleToggleAction(moduleItem.key, "edit")}
                                className="w-4 h-4 accent-brand-gold rounded cursor-pointer"
                              />
                            </label>
                          </td>

                          {/* Delete Toggle */}
                          <td className="py-4 px-6 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-2 rounded-xl hover:bg-brand-beige/30 dark:hover:bg-brand-midnight transition-colors">
                              <input
                                type="checkbox"
                                checked={Boolean(modulePerms.delete)}
                                onChange={() => handleToggleAction(moduleItem.key, "delete")}
                                className="w-4 h-4 accent-brand-red rounded cursor-pointer"
                              />
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
