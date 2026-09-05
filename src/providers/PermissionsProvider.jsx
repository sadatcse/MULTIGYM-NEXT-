"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "@/providers/AuthProvider";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import menuItems from "@/components/MenuItems";

export const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const axiosSecure = useAxiosSecure();
  const auth = useContext(AuthContext);
  const currentAuth = auth?.employee || auth?.user;
  const authLoading = auth?.loading ?? false;

  const [dbPermissions, setDbPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = currentAuth?.role ? currentAuth.role.toUpperCase() : "SUPER ADMIN";

  // Build exact route-path to module-key mapping from MenuItems definition
  const routeToKeyMap = useMemo(() => {
    const map = {};
    try {
      const items = menuItems();
      items.forEach((item) => {
        if (item.path && item.key) {
          map[item.path] = item.key;
        }
        if (item.children && Array.isArray(item.children)) {
          item.children.forEach((child) => {
            if (child.path && child.key) {
              map[child.path] = child.key;
            }
          });
        }
      });
    } catch {
      // Fallback if menuItems fails
    }
    return map;
  }, []);

  const fetchPermissions = useCallback(async () => {
    // Super admin always has full privileges without querying
    if (!currentAuth || role === "SUPER ADMIN" || role === "SUPERADMIN") {
      setDbPermissions(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axiosSecure.get(`/role-permission?role=${encodeURIComponent(role)}`);
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
  }, [currentAuth, role, axiosSecure]);

  useEffect(() => {
    if (authLoading) return;
    // Legitimate initial data fetch once auth resolves; setState inside is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPermissions();
  }, [authLoading, fetchPermissions]);

  const can = useCallback(
    (moduleKey, action = "view") => {
      if (!currentAuth || role === "SUPER ADMIN" || role === "SUPERADMIN") {
        return true;
      }

      // Every page checks permissions using the exact same `key` it registers
      // with in MenuItems.jsx (confirmed across every call site) — so a direct
      // lookup is all that's needed here. No hardcoded alias table: adding a
      // new module only ever requires a MenuItems.jsx entry, nothing in this file.
      if (dbPermissions && typeof dbPermissions === "object" && dbPermissions[moduleKey] != null) {
        return Boolean(dbPermissions[moduleKey][action]);
      }

      // Default to allowed for newly added modules or unconfigured roles
      return true;
    },
    [currentAuth, role, dbPermissions]
  );

  const hasPermission = useCallback(
    (pathOrKey, action = "view") => {
      if (!pathOrKey) return true;
      let key = routeToKeyMap[pathOrKey];
      if (!key && typeof pathOrKey === "string" && pathOrKey.startsWith("/dashboard/vendors/") && !pathOrKey.endsWith("/report") && !pathOrKey.endsWith("/categories") && !pathOrKey.endsWith("/product-categories")) {
        key = "vendor-details";
      }
      if (!key && typeof pathOrKey === "string" && pathOrKey.startsWith("/dashboard/assets/") && !pathOrKey.endsWith("/types") && !pathOrKey.endsWith("/clearance")) {
        key = "asset-details";
      }
      if (!key) {
        key = pathOrKey.includes("/") ? pathOrKey.split("/").pop() : pathOrKey;
      }
      return can(key, action);
    },
    [can, routeToKeyMap]
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
