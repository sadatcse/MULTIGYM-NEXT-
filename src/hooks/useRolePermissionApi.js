"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function useRolePermissionApi(initialRole = "") {
  const axiosSecure = useAxiosSecure();

  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [permissions, setPermissions] = useState({});
  const [allRolePermissions, setAllRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const saveLockRef = useRef(false);

  // Fetch all active system roles from backend MongoDB API
  const fetchAvailableRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const res = await axiosSecure.get("/role", { params: { limit: 100 } });
      if (res?.data?.data && Array.isArray(res.data.data)) {
        const roleNames = res.data.data.map((r) => r.name);
        setAvailableRoles(roleNames);
        setSelectedRole((prev) => (prev ? prev : roleNames[0] || "HR MANAGER"));
      }
    } catch (err) {
      console.error("Error fetching system user roles:", err);
      const fallback = [
        "Super Admin",
        "HR Manager",
        "Payroll Officer",
        "Department Head",
        "Trainer",
        "General Staff",
      ];
      setAvailableRoles(fallback);
      setSelectedRole((prev) => (prev ? prev : fallback[0]));
    } finally {
      setRolesLoading(false);
    }
  }, [axiosSecure]);

  // Fetch permissions for selected role
  const fetchRolePermissions = useCallback(async (roleName) => {
    if (!roleName) return;
    setLoading(true);
    try {
      const res = await axiosSecure.get(`/role-permission?role=${encodeURIComponent(roleName)}`);
      if (res?.data?.data?.permissions) {
        setPermissions(res.data.data.permissions);
      } else {
        setPermissions({});
      }
    } catch (err) {
      console.log(`No existing permissions for role "${roleName}", starting fresh.`);
      setPermissions({});
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
