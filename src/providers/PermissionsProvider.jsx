"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "@/providers/AuthProvider";
import { axiosPublic } from "@/hooks/useAxiosPublic";
import menuItems from "@/components/MenuItems";

export const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
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

  useEffect(() => {
    if (authLoading) return;
    fetchPermissions();
  }, [authLoading, fetchPermissions]);

  const can = useCallback(
    (moduleKey, action = "view") => {
      if (!currentAuth || role === "SUPER ADMIN" || role === "SUPERADMIN") {
        return true;
      }

      if (dbPermissions && typeof dbPermissions === "object") {
        // Direct key check
        if (dbPermissions[moduleKey] !== undefined && dbPermissions[moduleKey] !== null) {
          return Boolean(dbPermissions[moduleKey][action]);
        }

        // Comprehensive alias resolution (singular vs plural, parent vs child module keys)
        const keyAliases = {
          employee: ["user", "employee-management"],
          user: ["employee", "employee-management"],
          "employee-duty-time": ["employee", "user", "employee-management"],

          vendors: ["vendor", "vendor-management"],
          vendor: ["vendors", "vendor-management"],
          "vendor-categories": ["vendors", "vendor", "vendor-management"],
          "product-categories": ["vendors", "vendor", "vendor-management"],
          "vendor-management": ["vendors", "vendor"],

          assets: ["asset", "asset-management"],
          asset: ["assets", "asset-management"],
          "asset-types": ["assets", "asset", "asset-management"],
          "asset-clearance": ["assets", "asset", "asset-management"],
          "asset-management": ["assets", "asset"],
        };

        const aliases = keyAliases[moduleKey];
        if (aliases) {
          for (const alias of aliases) {
            if (dbPermissions[alias] !== undefined && dbPermissions[alias] !== null) {
              return Boolean(dbPermissions[alias][action]);
            }
          }
        }
      }

      // Default to allowed for newly added modules or unconfigured roles
      return true;
    },
    [currentAuth, role, dbPermissions]
  );

  const hasPermission = useCallback(
    (pathOrKey, action = "view") => {
      if (!pathOrKey) return true;
      const key = routeToKeyMap[pathOrKey] || (pathOrKey.includes("/") ? pathOrKey.split("/").pop() : pathOrKey);
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
