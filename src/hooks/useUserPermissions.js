"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { AuthContext } from "../providers/AuthProvider";
import { axiosPublic } from "./useAxiosPublic";

const useUserPermissions = () => {
  const { user } = useContext(AuthContext);
  const [dbPermissions, setDbPermissions] = useState(null);
  const [loading, setLoading] = useState(false);

  const role = user?.role ? user.role.toUpperCase() : "USER";

  useEffect(() => {
    let isMounted = true;

    const fetchPermissions = async () => {
      if (!user || user?.role === "superadmin") {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await axiosPublic.get(`/role-permission?role=${role}`);
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

  // Compute allowed routes based on role and database permissions
  const allowedRoutes = useMemo(() => {
    if (!user) return [];
    if (user?.role === "superadmin") return ["*"];

    // Default routes accessible to all logged in users
    const routes = ["/dashboard/home", "/dashboard/profile", "/dashboard"];

    if (user?.allowedRoutes && Array.isArray(user.allowedRoutes)) {
      user.allowedRoutes.forEach((r) => routes.push(r));
    }

    if (dbPermissions) {
      Object.entries(dbPermissions).forEach(([moduleKey, perm]) => {
        if (perm?.view) {
          routes.push(`/dashboard/${moduleKey}`);
          routes.push(`/dashboard/${moduleKey}/*`);
        }
      });
    }

    return Array.from(new Set(routes));
  }, [user, dbPermissions]);

  const hasPermission = (path, action = "view") => {
    if (!user) return false;
    if (user?.role === "superadmin") return true;
    if (path === "/dashboard/home" || path === "/dashboard/profile" || path === "/dashboard") return true;

    if (allowedRoutes.includes("*") || allowedRoutes.includes(path)) return true;

    const segments = path.split("/").filter(Boolean);
    if (segments.length >= 2) {
      const moduleKey = segments[1];
      if (dbPermissions && dbPermissions[moduleKey]) {
        return Boolean(dbPermissions[moduleKey][action]);
      }
    }

    return allowedRoutes.some((route) => {
      if (route === path) return true;
      if (route.endsWith("/*") && path.startsWith(route.replace("/*", ""))) return true;
      return false;
    });
  };

  return {
    allowedRoutes,
    permissions: dbPermissions,
    hasPermission,
    loading,
    error: null,
  };
};

export default useUserPermissions;
