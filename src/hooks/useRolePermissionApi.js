"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import menuItems from "@/components/MenuItems";

// Helper to extract system modules from central menuItems definition
const getSystemModulesFromMenu = () => {
  const rawMenu = menuItems();
  const categories = [];

  rawMenu.forEach((cat) => {
    if (cat.children && cat.children.length > 0) {
      const items = cat.children.map((child) => ({
        key: child.key || child.path.split("/").pop(),
        name: child.title,
        description: child.description || `Manage ${child.title} access and features`,
      }));

      categories.push({
        category: cat.title,
        items,
      });
    } else if (cat.key !== "home" && cat.path !== "/dashboard/home") {
      categories.push({
        category: cat.title,
        items: [
          {
            key: cat.key || cat.path.split("/").pop(),
            name: cat.title,
            description: cat.description || `Manage ${cat.title} access and features`,
          },
        ],
      });
    }
  });

  return categories;
};

export default function useRolePermissionApi(initialRole = "") {
  const axiosSecure = useAxiosSecure();

  const [rolesList, setRolesList] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [permissions, setPermissions] = useState({});
  const [allRolePermissions, setAllRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const saveLockRef = useRef(false);

  // Fetch all active system roles dynamically from backend MongoDB API
  const fetchAvailableRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const res = await axiosSecure.get("/role", { params: { limit: 100 } });
      if (res?.data?.data && Array.isArray(res.data.data)) {
        const fullRoles = res.data.data;
        const roleNames = fullRoles.map((r) => r.name);
        setRolesList(fullRoles);
        setAvailableRoles(roleNames);

        // Dynamically set selected role to first fetched role if not already specified
        setSelectedRole((prev) => {
          if (prev && roleNames.includes(prev)) return prev;
          return roleNames[0] || initialRole || "HR MANAGER";
        });
      }
    } catch (err) {
      console.error("Error fetching dynamic system user roles:", err);
      const fallbackNames = [
        "Super Admin",
        "HR Manager",
        "Payroll Officer",
        "Department Head",
        "Trainer",
        "General Staff",
      ];
      setAvailableRoles(fallbackNames);
      setSelectedRole((prev) => (prev ? prev : fallbackNames[0]));
    } finally {
      setRolesLoading(false);
    }
  }, [axiosSecure, initialRole]);

  // Fetch permissions for selected role, merging newly registered modules
  const fetchRolePermissions = useCallback(async (roleName) => {
    if (!roleName) return;
    setLoading(true);
    try {
      const res = await axiosSecure.get(`/role-permission?role=${encodeURIComponent(roleName)}`);
      const fetchedPerms = res?.data?.data?.permissions || {};

      // Ensure all system modules defined in MenuItems exist in permissions
      const categories = getSystemModulesFromMenu();
      const mergedPerms = { ...fetchedPerms };

      categories.forEach((cat) => {
        cat.items.forEach((item) => {
          if (!mergedPerms[item.key]) {
            mergedPerms[item.key] = { view: true, add: true, edit: true, delete: true };
          }
        });
      });

      setPermissions(mergedPerms);
    } catch (err) {
      console.log(`No existing permissions for role "${roleName}", initializing full defaults.`);
      const categories = getSystemModulesFromMenu();
      const defaultPerms = {};
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
          defaultPerms[item.key] = { view: true, add: true, edit: true, delete: true };
        });
      });
      setPermissions(defaultPerms);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure]);

  // Fetch all role permission records
  const fetchAllRolePermissions = useCallback(async () => {
    try {
      const res = await axiosSecure.get("/role-permission/all");
      if (res?.data?.data) {
        setAllRolePermissions(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching all role permissions:", err);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchAvailableRoles();
    fetchAllRolePermissions();
  }, [fetchAvailableRoles, fetchAllRolePermissions]);

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole);
    }
  }, [selectedRole, fetchRolePermissions]);

  // Save permissions for selected role
  const savePermissions = async (updatedPermissions) => {
    if (saveLockRef.current || !selectedRole) return;
    saveLockRef.current = true;
    setIsSaving(true);
    try {
      const payload = {
        role: selectedRole.toUpperCase(),
        permissions: updatedPermissions || permissions,
      };
      const res = await axiosSecure.post("/role-permission", payload);
      await fetchAllRolePermissions();
      return res.data;
    } finally {
      saveLockRef.current = false;
      setIsSaving(false);
    }
  };

  return {
    rolesList,
    availableRoles,
    selectedRole,
    setSelectedRole,
    permissions,
    setPermissions,
    allRolePermissions,
    loading: loading || rolesLoading,
    isSaving,
    fetchAvailableRoles,
    fetchRolePermissions,
    fetchAllRolePermissions,
    savePermissions,
  };
}
