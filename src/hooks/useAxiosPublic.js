"use client";

import axios from "axios";

// Matches useAxiosSecure's normalization exactly — NEXT_PUBLIC_BACKEND_URL
// is set inconsistently across environments (sometimes with a trailing
// slash, sometimes without the /api suffix the backend's global prefix
// actually requires), so this must tolerate either shape rather than using
// the env value raw.
const getBaseUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://multigym-hr-backend.vercel.app/api";
  const trimmed = url.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const axiosPublic = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

const useAxiosPublic = () => {
  return axiosPublic;
};

export { axiosPublic };
export default useAxiosPublic;
