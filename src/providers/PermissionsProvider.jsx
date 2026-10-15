"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "@/providers/AuthProvider";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import menuItems from "@/components/MenuItems";

export const PermissionsContext = createContext(null);

// Self-service pages every employee may open even when their role has no
// explicit entry. Must match SELF_SERVICE_KEYS in the backend PermissionsGuard.
export const SELF_SERVICE_KEYS = new Set([
  "home", "chat", "my-attendance", "my-roster", "my-leave", "my-payslips", "my-notices", "my-tasks",
  "my-assets", "my-obligations", "my-maintenance-requests", "my-requisitions", "maintenance-create",
  "requisition-create", "requisition-details", "leave-details",
]);

export function PermissionsProvider({ children }) {
  const axiosSecure = useAxiosSecure();
  const auth = useContext(AuthContext);
  const currentAuth = auth?.employee || auth?.user;
  const authLoading = auth?.loading ?? false;

  const [dbPermissions, setDbPermissions] = useState(null);
  // Data scope from HR Workflow Settings: "all" | "branch" | "self".
  const [scope, setScope] = useState("all");
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
      const [permRes, cfgRes] = await Promise.allSettled([
        axiosSecure.get(`/role-permission?role=${encodeURIComponent(role)}`),
        axiosSecure.get("/hr-config"),
      ]);
      if (cfgRes.status === "fulfilled" && cfgRes.value?.data?.me?.scope) setScope(cfgRes.value.data.me.scope);
      if (permRes.status === "fulfilled" && permRes.value?.data?.data?.permissions) {
        setDbPermissions(permRes.value.data.data.permissions);
      } else if (currentAuth?.permissions) {
        setDbPermissions(currentAuth.permissions);
      } else {
        setDbPermissions(null);
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

      // Not configured: management roles keep default-allow, employee-level
      // ("own records") roles only get self-service pages — same rule the
      // backend PermissionsGuard enforces.
      if (scope === "self") return SELF_SERVICE_KEYS.has(moduleKey);
      return true;
    },
    [currentAuth, role, dbPermissions, scope]
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
      if (!key && typeof pathOrKey === "string") {
        // Generic dynamic-route match: "/dashboard/leave/[id]" in MenuItems
        // covers "/dashboard/leave/<anything>" when no exact path exists.
        const dyn = Object.keys(routeToKeyMap).find((p) => {
          if (!p.includes("[")) return false;
          const re = new RegExp("^" + p.replace(/\[[^\]]+\]/g, "[^/]+") + "$");
          return re.test(pathOrKey);
        });
        if (dyn) key = routeToKeyMap[dyn];
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
      scope,
      refreshPermissions: fetchPermissions,
    }),
    [dbPermissions, can, hasPermission, loading, role, scope, fetchPermissions]
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}
