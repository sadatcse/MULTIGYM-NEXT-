"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "@/providers/AuthProvider";
import { axiosPublic } from "@/hooks/useAxiosPublic";

export const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const auth = useContext(AuthContext);
  const currentAuth = auth?.employee || auth?.user;
  const authLoading = auth?.loading ?? false;

  const [dbPermissions, setDbPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = currentAuth?.role ? currentAuth.role.toUpperCase() : "SUPER ADMIN";

  const fetchPermissions = useCallback(async () => {
    // Super admin always has full privileges without querying
    if (!currentAuth || role === "SUPER ADMIN" || role === "SUPERADMIN") {
      setDbPermissions(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axiosPublic.get(`/role-permission?role=${encodeURIComponent(role)}`);
      if (res?.data?.data?.permissions) {
        setDbPermissions(res.data.data.permissions);
      }
    } catch (err) {
      if (currentAuth?.permissions) {
        setDbPermissions(currentAuth.permissions);
      }
    } finally {
      setLoading(false);
    }
  }, [currentAuth, role]);

  // Fetch once, right after a successful login — never while idle on the public
  // login page, and never redundantly per-component. Every consumer (Sidebar,
  // DashboardLayout, individual dashboard pages) reads from this single fetch.
  useEffect(() => {
    if (authLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount, not a cascading render
    fetchPermissions();
  }, [authLoading, fetchPermissions]);

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

  const hasPermission = useCallback(
    (pathOrKey, action = "view") => {
      if (!pathOrKey) return true;
      const key = pathOrKey.includes("/") ? pathOrKey.split("/").pop() : pathOrKey;
      return can(key, action);
    },
    [can]
  );

  const value = useMemo(
    () => ({
      permissions: dbPermissions,
      can,
      hasPermission,
      allowedRoutes: ["*"],
      loading,
      role,
      refreshPermissions: fetchPermissions,
    }),
    [dbPermissions, can, hasPermission, loading, role, fetchPermissions]
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}
