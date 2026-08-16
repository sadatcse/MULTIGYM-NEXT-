"use client";

import { createContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { axiosPublic } from "@/hooks/useAxiosPublic";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);

  // Alias state for backward compatibility
  const user = employee;
  const setUser = setEmployee;
  const userProfile = employeeProfile;
  const setUserProfile = setEmployeeProfile;

  // Load authenticated employee from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmployee =
        localStorage.getItem("authEmployee") || localStorage.getItem("authUser");
      if (storedEmployee) {
        try {
          const parsed = JSON.parse(storedEmployee);
          setEmployee(parsed);
          setEmployeeProfile(parsed);
        } catch {
          setEmployee(null);
        }
      }
      setLoading(false);
    }
  }, []);

  const fetchEmployeeProfile = useCallback(async (email) => {
    if (!email) return;
    setEmployeeProfile((prev) => prev || { email, role: "superadmin", name: "Administrator" });
  }, []);

  const fetchUserProfile = fetchEmployeeProfile;

  const fetchCompany = useCallback(async () => {
    setCompany({ companyName: "Multigym HR", logo: "" });
  }, []);

  const registerEmployee = async (email, password, name, department, branch, role = "user") => {
    setLoading(true);
    try {
      const res = await axiosPublic.post("/employee/post", {
        email,
        password,
        name,
        department,
        branch,
        role,
      });
      return res.data;
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Employee registration failed";
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = registerEmployee;

  const loginEmployee = async (email, password) => {
    setLoading(true);
    try {
      const res = await axiosPublic.post("/employee/login", { email, password });
      const employeeData = res.data.employee || res.data.user;
      const token = res.data.token;

      setEmployee(employeeData);
      setEmployeeProfile(employeeData);

      if (typeof window !== "undefined") {
        localStorage.setItem("authEmployee", JSON.stringify(employeeData));
        localStorage.setItem("authUser", JSON.stringify(employeeData));
        if (token) {
          localStorage.setItem("authToken", token);
          localStorage.setItem("token", token);
        }
      }
      return employeeData;
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Invalid email or password";
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = loginEmployee;

  const logoutEmployee = async () => {
    setLoading(true);
    try {
      setEmployee(null);
      setEmployeeProfile(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("authEmployee");
        localStorage.removeItem("authUser");
        localStorage.removeItem("authToken");
        localStorage.removeItem("token");
      }
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = logoutEmployee;

  return (
    <AuthContext.Provider
      value={{
        employee,
        setEmployee,
        employeeProfile,
        user,
        setUser,
        userProfile,
        loading,
        company,
        registerEmployee,
        registerUser,
        loginEmployee,
        loginUser,
        logoutEmployee,
        logoutUser,
        fetchEmployeeProfile,
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
