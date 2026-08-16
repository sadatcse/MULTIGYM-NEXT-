"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../providers/AuthProvider";
import { axiosPublic } from "./useAxiosPublic";

const useUserPermissions = () => {
  const { employee, user } = useContext(AuthContext);
  const currentAuth = employee || user;
  const [dbPermissions, setDbPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = currentAuth?.role ? currentAuth.role.toUpperCase() : "SUPER ADMIN";

  useEffect(() => {
    let isMounted = true;

    const fetchPermissions = async () => {
      // Super admin always has full privileges without querying
      if (!currentAuth || role === "SUPER ADMIN" || role === "SUPERADMIN") {
        if (isMounted) setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await axiosPublic.get(`/role-permission?role=${encodeURIComponent(role)}`);
        if (isMounted && res?.data?.data?.permissions) {
          setDbPermissions(res.data.data.permissions);
        }
      } catch (err) {
        if (isMounted && currentAuth?.permissions) {
          setDbPermissions(currentAuth.permissions);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPermissions();

    return () => {
      isMounted = false;
    };
  }, [currentAuth, role]);

  /**
   * Check if current employee/user has permission for a specific module and action.
   * @param {string} moduleKey - e.g. "employee", "user", "job-positions", "departments", "roles", "branches"
   * @param {"view" | "add" | "edit" | "delete"} action
   * @returns {boolean}
   */
  const can = useCallback(
    (moduleKey, action = "view") => {
      if (!currentAuth || role === "SUPER ADMIN" || role === "SUPERADMIN") {
        return true;
      }

      if (dbPermissions) {
        if (dbPermissions[moduleKey] !== undefined) {
          return Boolean(dbPermissions[moduleKey][action]);
        }
        // Fallback for key mapping: "employee" vs "user"
        if (moduleKey === "employee" && dbPermissions["user"] !== undefined) {
          return Boolean(dbPermissions["user"][action]);
        }
        if (moduleKey === "user" && dbPermissions["employee"] !== undefined) {
          return Boolean(dbPermissions["employee"][action]);
        }
      }

      return true;
    },
    [currentAuth, role, dbPermissions]
  );

  /**
   * Alias helper for route path or key permission checking
   * @param {string} pathOrKey - e.g. "/dashboard/employee" or "employee"
   * @param {"view" | "add" | "edit" | "delete"} action
   * @returns {boolean}
   */
  const hasPermission = useCallback(
    (pathOrKey, action = "view") => {
      if (!pathOrKey) return true;
      const key = pathOrKey.includes("/") ? pathOrKey.split("/").pop() : pathOrKey;
      return can(key, action);
    },
    [can]
  );

  return {
    permissions: dbPermissions,
    can,
    hasPermission,
    allowedRoutes: ["*"],
    loading,
    role,
  };
};

export { useUserPermissions as useEmployeePermissions };
export default useUserPermissions;
