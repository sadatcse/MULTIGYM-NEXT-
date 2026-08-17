"use client";

import axios from "axios";

const axiosPublic = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "https://multigym-hr-backend.vercel.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const useAxiosPublic = () => {
  return axiosPublic;
};

export { axiosPublic };
export default useAxiosPublic;
