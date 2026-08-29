"use client";

import { createContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { axiosPublic } from "@/hooks/useAxiosPublic";

export const AuthContext = createContext();

const DEFAULT_COMPANY = {
  companyName: "Multigym HR",
  companyTagline: "Complete Enterprise HR & Payroll Management",
  email: "info@multigymhr.com",
  phone: "+880 1700-000000",
  address: "House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh",
  website: "https://multigymhr.com",
  logo: "",
};

const AuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(DEFAULT_COMPANY);

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

  // Public site branding (company name/logo/contact) — the /setting endpoint
  // has no auth guard, so this is safe to fetch immediately, before login,
  // to brand the login screen itself. Unlike the timezone/permission
  // providers, this is not gated on auth.
  const fetchCompany = useCallback(async () => {
    try {
      const res = await axiosPublic.get("/setting");
      if (res?.data?.data) {
        setCompany((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch {
      // Keep the default branding on failure — never block the login screen.
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount, not a cascading render
    fetchCompany();
  }, [fetchCompany]);

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
