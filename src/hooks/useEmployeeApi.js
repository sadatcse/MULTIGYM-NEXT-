"use client";

import { useState, useEffect, useCallback } from "react";
import useAxiosSecure from "./useAxiosSecure";

export default function useEmployeeApi() {
  const axiosSecure = useAxiosSecure();

  const [employees, setEmployees] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    probationEmployees: 0,
    resignedEmployees: 0,
    terminatedEmployees: 0,
    inactiveEmployees: 0,
    adminEmployees: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Filters & Pagination State
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch employees list from backend
  const fetchEmployees = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setIsFetching(true);

      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
        };

        if (debouncedSearch) params.search = debouncedSearch;
        if (roleFilter && roleFilter !== "all") params.role = roleFilter;
        if (statusFilter && statusFilter !== "all") params.status = statusFilter;
        if (departmentFilter && departmentFilter !== "all") params.department = departmentFilter;
        if (branchFilter && branchFilter !== "all") params.branch = branchFilter;
        if (employeeTypeFilter && employeeTypeFilter !== "all") params.employeeType = employeeTypeFilter;

        const res = await axiosSecure.get("/employee", { params });

        const rawData = res.data.data || res.data.employees || res.data.users || [];
        setEmployees(rawData);

        const pagination = res.data.pagination || {};
        setTotalItems(res.data.total || pagination.totalItems || rawData.length);
        setTotalPages(res.data.totalPages || pagination.totalPages || 1);

        if (res.data.stats) {
          setStats(res.data.stats);
        } else {
          setStats({
            totalEmployees: res.data.total || rawData.length,
            activeEmployees: rawData.filter((e) => e.status === "active").length,
            probationEmployees: rawData.filter((e) => e.status === "probation").length,
            resignedEmployees: rawData.filter((e) => e.status === "resigned").length,
            terminatedEmployees: rawData.filter((e) => e.status === "terminated").length,
            inactiveEmployees: rawData.filter((e) => e.status === "inactive").length,
            adminEmployees: rawData.filter((e) => e.role === "admin" || e.role === "superadmin").length,
          });
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [
      axiosSecure,
      currentPage,
      itemsPerPage,
      debouncedSearch,
      roleFilter,
      statusFilter,
      departmentFilter,
      branchFilter,
      employeeTypeFilter,
    ]
  );

  useEffect(() => {
    // Data fetching is an intentional effect (https://react.dev/learn/you-might-not-need-an-effect#fetching-data).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees(true);
  }, [fetchEmployees]);

  // Create Employee
  const createEmployee = async (formData) => {
    const res = await axiosSecure.post("/employee/post", formData);
    await fetchEmployees(false);
    return res.data;
  };

  // Update Employee
  const updateEmployee = async (id, formData) => {
    const res = await axiosSecure.put(`/employee/update/${id}`, formData);
    await fetchEmployees(false);
    return res.data;
  };

  // Delete Employee
  const deleteEmployee = async (id) => {
    const res = await axiosSecure.delete(`/employee/delete/${id}`);
    await fetchEmployees(false);
    return res.data;
  };

  return {
    employees,
    totalItems,
    totalPages,
    stats,
    loading,
    isFetching,
    searchInput,
    setSearchInput,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    branchFilter,
    setBranchFilter,
    employeeTypeFilter,
    setEmployeeTypeFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
}
