"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import { getSystemModulesFromMenu } from "@/utils/systemModules";

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
  const rolesAbortRef = useRef(null);
  const permissionsAbortRef = useRef(null);
  const allPermsAbortRef = useRef(null);

  // Fetch all active system roles dynamically from backend MongoDB API (100% real data)
  const fetchAvailableRoles = useCallback(async () => {
    // Cancel any previous in-flight roles request before starting a new one
    rolesAbortRef.current?.abort();
    const controller = new AbortController();
    rolesAbortRef.current = controller;

    setRolesLoading(true);
    try {
      const res = await axiosSecure.get("/role", {
        params: { limit: 100 },
        signal: controller.signal,
      });
      if (res?.data?.data && Array.isArray(res.data.data)) {
        const fullRoles = res.data.data;
        const roleNames = fullRoles.map((r) => r.name);
        setRolesList(fullRoles);
        setAvailableRoles(roleNames);

        // Dynamically set selected role to first fetched role from real database records
        setSelectedRole((prev) => {
          if (prev && roleNames.includes(prev)) return prev;
          return roleNames[0] || initialRole || "";
        });
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return; // superseded by a newer request, ignore silently
      console.error("Error fetching dynamic system user roles:", err);
      setRolesList([]);
      setAvailableRoles([]);
      setSelectedRole("");
    } finally {
      if (rolesAbortRef.current === controller) {
        setRolesLoading(false);
      }
    }
  }, [axiosSecure, initialRole]);

  // Fetch permissions for selected role, merging newly registered modules
  const fetchRolePermissions = useCallback(async (roleName) => {
    if (!roleName) return;
    // Abort any previous in-flight permissions request so an out-of-order response
    // for a previously selected role can never overwrite the currently selected one
    permissionsAbortRef.current?.abort();
    const controller = new AbortController();
    permissionsAbortRef.current = controller;

    setLoading(true);
    try {
      const res = await axiosSecure.get(`/role-permission?role=${encodeURIComponent(roleName)}`, {
        signal: controller.signal,
      });
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
      if (err?.code === "ERR_CANCELED") return; // superseded by a newer role selection, ignore silently
      // No existing permissions doc for this role yet — initialize full defaults.
      const categories = getSystemModulesFromMenu();
      const defaultPerms = {};
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
          defaultPerms[item.key] = { view: true, add: true, edit: true, delete: true };
        });
      });
      setPermissions(defaultPerms);
    } finally {
      if (permissionsAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [axiosSecure]);

  // Fetch all role permission records
  const fetchAllRolePermissions = useCallback(async () => {
    allPermsAbortRef.current?.abort();
    const controller = new AbortController();
    allPermsAbortRef.current = controller;

    try {
      const res = await axiosSecure.get("/role-permission/all", { signal: controller.signal });
      if (res?.data?.data) {
        setAllRolePermissions(res.data.data);
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return; // superseded by a newer request, ignore silently
      console.error("Error fetching all role permissions:", err);
    }
  }, [axiosSecure]);

  useEffect(() => {
    // Legitimate initial data fetch on mount; setState inside is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAvailableRoles();
    fetchAllRolePermissions();
    // Abort any still-pending requests on unmount so late responses never touch state
    return () => {
      rolesAbortRef.current?.abort();
      permissionsAbortRef.current?.abort();
      allPermsAbortRef.current?.abort();
    };
  }, [fetchAvailableRoles, fetchAllRolePermissions]);

  useEffect(() => {
    if (selectedRole) {
      // Legitimate data fetch whenever the selected role changes; setState inside is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
