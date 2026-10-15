"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import useAxiosSecure from "./useAxiosSecure";

// Shared data helpers for the HR operations pages (attendance, roster,
// leave, payroll, requisitions, discipline). Each page owns its own state;
// these only remove the repeated fetch/abort/toast boilerplate.

export const errMsg = (err, fallback = "Something went wrong") => {
  const m = err?.response?.data?.message;
  return Array.isArray(m) ? m.join(", ") : m || err?.message || fallback;
};

// GET with abort-on-change. `params` is serialized into the dependency key
// so callers can pass an inline object.
export function useHrQuery(url, params = {}, { enabled = true } = {}) {
  const axiosSecure = useAxiosSecure();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!enabled);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const key = JSON.stringify(params);

  const refetch = useCallback(async () => {
    if (!enabled || !url) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await axiosSecure.get(url, { params: JSON.parse(key), signal: controller.signal });
      setData(res.data);
      setError(null);
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;
      setError(errMsg(err));
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [axiosSecure, url, key, enabled]);

  useEffect(() => {
    // Legitimate data fetch on mount / param change; setState inside is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}

// Mutation helper with toast feedback. Returns the response body or
// undefined on failure (the toast already explained why).
export function useHrMutation() {
  const axiosSecure = useAxiosSecure();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (method, url, body, { success, silent } = {}) => {
      setBusy(true);
      try {
        const res = await axiosSecure.request({ method, url, data: body });
        if (!silent) toast.success(success || res.data?.message || "Saved");
        return res.data;
      } catch (err) {
        toast.error(errMsg(err));
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [axiosSecure],
  );
  return { run, busy };
}

// Current actor's scope + HR workflow config (stage roles etc.).
export function useHrConfig() {
  const { data, loading, refetch } = useHrQuery("/hr-config");
  return { config: data?.data || null, me: data?.me || null, loading, refetch };
}

// Lookup data shared by many pages (branches, colleague directory, leave
// types). Cached at module level for 2 minutes and de-duplicated, so moving
// between HR pages doesn't re-download the same lists.
const LOOKUP_TTL = 2 * 60 * 1000;
const lookupCache = new Map(); // url -> { at, promise, data }

function cachedGet(axiosSecure, url, params, pick) {
  const key = url + JSON.stringify(params || {});
  const hit = lookupCache.get(key);
  if (hit && Date.now() - hit.at < LOOKUP_TTL) return hit.promise;
  const promise = axiosSecure
    .get(url, { params })
    .then((r) => pick(r.data))
    .catch((e) => {
      lookupCache.delete(key);
      throw e;
    });
  lookupCache.set(key, { at: Date.now(), promise });
  return promise;
}

export const invalidateHrLookups = () => lookupCache.clear();

export function useHrLookups({ employees = true } = {}) {
  const axiosSecure = useAxiosSecure();
  const [branches, setBranches] = useState([]);
  const [staff, setStaff] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  useEffect(() => {
    let alive = true;
    cachedGet(axiosSecure, "/branch", { limit: 200, page: 1 }, (d) => (d?.data || d?.branches || []).filter((b) => b.status !== "inactive").map((b) => b.name))
      .then((v) => alive && setBranches(v))
      .catch(() => {});
    cachedGet(axiosSecure, "/leave-type", { status: "active", limit: 100 }, (d) => d?.data || [])
      .then((v) => alive && setLeaveTypes(v))
      .catch(() => {});
    if (employees) {
      cachedGet(axiosSecure, "/employee/directory", {}, (d) => d?.data || [])
        .then((v) => alive && setStaff(v))
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [axiosSecure, employees]);
  return { branches, staff, leaveTypes };
}

// Upload a File via the existing S3 upload endpoints; picks image vs
// document endpoint from the MIME type.
export function useHrUpload() {
  const axiosSecure = useAxiosSecure();
  const [uploading, setUploading] = useState(false);
  const upload = useCallback(
    async (file, folder) => {
      if (!file) return null;
      const isImage = /^image\/(jpeg|jpg|png|webp)$/.test(file.type);
      const form = new FormData();
      form.append(isImage ? "image" : "document", file);
      setUploading(true);
      try {
        const res = await axiosSecure.post(`/upload/${isImage ? "image" : "document"}?folder=${folder}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return { name: file.name, url: res.data?.data?.url };
      } catch (err) {
        toast.error(errMsg(err, "Upload failed"));
        return null;
      } finally {
        setUploading(false);
      }
    },
    [axiosSecure],
  );
  return { upload, uploading };
}

export const todayISO = () => {
  const d = new Date(Date.now() + 6 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
};
export const monthISO = () => todayISO().slice(0, 7);
export const addDaysISO = (s, n) => {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const fmtMinutes = (m) => {
  const v = Math.round(Number(m) || 0);
  if (!v) return "—";
  const h = Math.floor(v / 60);
  return h ? `${h}h ${v % 60}m` : `${v}m`;
};
export const money = (n, symbol = "৳") =>
  `${symbol}${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const titleCase = (s = "") => String(s).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(String(s).length === 10 ? `${s}T00:00:00` : s);
  return isNaN(d) ? s : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
export const fmtDateTime = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
