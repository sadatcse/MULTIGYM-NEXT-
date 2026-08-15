"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const axiosSecure = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

let cachedUserIp = "";

const useAxiosSecure = () => {
  const router = useRouter();
  const [userIp, setUserIp] = useState(cachedUserIp);

  // Fetch client IP address once and cache it
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedIp = localStorage.getItem("userIp");
      if (storedIp) {
        cachedUserIp = storedIp;
        setUserIp(storedIp);
      } else if (!cachedUserIp) {
        fetch("https://api.ipify.org?format=json")
          .then((res) => res.json())
          .then((data) => {
            if (data?.ip) {
              cachedUserIp = data.ip;
              localStorage.setItem("userIp", data.ip);
              setUserIp(data.ip);
            }
          })
          .catch(() => {
            // fallback if offline or request fails
          });
      }
    }
  }, []);

  useEffect(() => {
    // Request Interceptor: Attach Authorization Bearer Token & User Metadata Headers
    const requestInterceptor = axiosSecure.interceptors.request.use(
      (config) => {
        if (typeof window !== "undefined") {
          // 1. Bearer Token
          const token =
            localStorage.getItem("authToken") ||
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          // 2. User Name & User Email
          const storedUser =
            localStorage.getItem("authUser") || localStorage.getItem("user");
          if (storedUser) {
            try {
              const userObj = JSON.parse(storedUser);
              if (userObj?.email) {
                config.headers["x-user-email"] = userObj.email;
              }
              if (userObj?.name || userObj?.userName) {
                config.headers["x-user-name"] = userObj.name || userObj.userName;
              }
              if (userObj?.branch) {
                config.headers["x-user-branch"] = userObj.branch;
              }
            } catch {
              // Ignore JSON parsing errors
            }
          }

          // 3. Client IP Address
          const currentIp = userIp || cachedUserIp || localStorage.getItem("userIp");
          if (currentIp) {
            config.headers["x-user-ip"] = currentIp;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor: Handle 401 & 403 authorization failures
    const responseInterceptor = axiosSecure.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response ? error.response.status : null;
        if (status === 401 || status === 403) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("authUser");
            localStorage.removeItem("token");
            router.push("/");
          }
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptors on unmount
    return () => {
      axiosSecure.interceptors.request.eject(requestInterceptor);
      axiosSecure.interceptors.response.eject(responseInterceptor);
    };
  }, [router, userIp]);

  return axiosSecure;
};

export { axiosSecure };
export default useAxiosSecure;
