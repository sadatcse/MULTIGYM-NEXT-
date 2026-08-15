"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../providers/AuthProvider";
import { axiosPublic } from "./useAxiosPublic";

const useUserPermissions = () => {
  const { user } = useContext(AuthContext);
  const [dbPermissions, setDbPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = user?.role ? user.role.toUpperCase() : "SUPER ADMIN";

  useEffect(() => {
    let isMounted = true;

    const fetchPermissions = async () => {
      // Super admin always has full privileges without querying
      if (!user || role === "SUPER ADMIN" || role === "SUPERADMIN") {
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
        if (isMounted && user?.permissions) {
          setDbPermissions(user.permissions);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPermissions();

    return () => {
      isMounted = false;
    };
  }, [user, role]);

  /**
   * Check if current user has permission for a specific module and action.
   * @param {string} moduleKey - e.g. "job-positions", "departments", "roles", "branches", "user"
   * @param {"view" | "add" | "edit" | "delete"} action
   * @returns {boolean}
   */
  const can = useCallback(
    (moduleKey, action = "view") => {
      if (!user || role === "SUPER ADMIN" || role === "SUPERADMIN") {
        return true;
      }

      if (dbPermissions && dbPermissions[moduleKey] !== undefined) {
        return Boolean(dbPermissions[moduleKey][action]);
      }

      // Default to allowed if not yet configured for newly added modules
      return true;
    },
    [user, role, dbPermissions]
  );

  /**
   * Alias helper for route path or key permission checking
   * @param {string} pathOrKey - e.g. "/dashboard/settings/job-positions" or "job-positions"
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

export default useUserPermissions;
