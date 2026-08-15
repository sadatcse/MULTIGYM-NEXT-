"use client";

import { createContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { axiosPublic } from "@/hooks/useAxiosPublic";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);

  // Load user from localStorage after mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setUserProfile(parsed);
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = useCallback(async (email) => {
    if (!email) return;
    setUserProfile((prev) => prev || { email, role: "superadmin", name: "Administrator" });
  }, []);

  const fetchCompany = useCallback(async () => {
    setCompany({ companyName: "Multigym HR", logo: "" });
  }, []);

  const registerUser = async (email, password, name) => {
    setLoading(true);
    try {
      const res = await axiosPublic.post("/user/post", {
        email,
        password,
        name,
        role: "user",
      });
      return res.data;
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Registration failed";
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const res = await axiosPublic.post("/user/login", { email, password });
      const { user: userData, token } = res.data;

      setUser(userData);
      setUserProfile(userData);

      if (typeof window !== "undefined") {
        localStorage.setItem("authUser", JSON.stringify(userData));
        if (token) {
          localStorage.setItem("authToken", token);
          localStorage.setItem("token", token);
        }
      }
      return userData;
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Invalid email or password";
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      setUser(null);
      setUserProfile(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("authUser");
        localStorage.removeItem("authToken");
        localStorage.removeItem("token");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        userProfile,
        loading,
        company,
        registerUser,
        loginUser,
        logoutUser,
        fetchUserProfile,
        fetchCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
