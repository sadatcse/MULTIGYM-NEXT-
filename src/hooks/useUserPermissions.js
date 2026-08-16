"use client";

import { useContext } from "react";
import { PermissionsContext } from "@/providers/PermissionsProvider";

/**
 * Check if current employee/user has permission for a specific module and action.
 * moduleKey e.g. "employee", "user", "job-positions", "departments", "roles", "branches"
 * action: "view" | "add" | "edit" | "delete"
 *
 * Reads from the shared PermissionsProvider (fetched once per session) instead of
 * fetching independently per component.
 */
const useUserPermissions = () => {
  const ctx = useContext(PermissionsContext);

  if (!ctx) {
    // Used outside PermissionsProvider — permissive fallback matches the
    // super-admin default the provider itself uses before auth resolves.
    return {
      permissions: null,
      can: () => true,
      hasPermission: () => true,
      allowedRoutes: ["*"],
      loading: false,
      role: "SUPER ADMIN",
    };
  }

  return ctx;
};

export { useUserPermissions as useEmployeePermissions };
export default useUserPermissions;
