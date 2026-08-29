"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/providers/AuthProvider";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import Mtitle from "@/components/Comon/Mtitle";
import PhotoUpload from "@/components/Comon/PhotoUpload";
import Swal from "sweetalert2";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiBriefcase,
  FiShield,
  FiMapPin,
  FiKey,
  FiSave,
  FiCheckCircle,
  FiAlertTriangle,
  FiLock,
  FiAward,
  FiClock,
  FiCheck,
} from "react-icons/fi";

export default function ProfilePage() {
  const { user, setUser, setUserProfile } = useContext(AuthContext);
  const axiosSecure = useAxiosSecure();
  const { formatDate } = useSystemTimeZone();

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editable Personal Info State
  const [personalForm, setPersonalForm] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    dateOfBirth: "",
    gender: "Male",
    bloodGroup: "A+",
    nationality: "Bangladeshi",
    nidPassport: "",
    photo: "",
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Active Tab: "personal" | "security" | "work"
  const [activeTab, setActiveTab] = useState("personal");

  // Populate form with current user data on load
  useEffect(() => {
    if (user) {
      setPersonalForm({
        name: user.name || "",
        email: user.email || "",
        mobileNumber: user.mobileNumber || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "Male",
        bloodGroup: user.bloodGroup || "A+",
        nationality: user.nationality || "Bangladeshi",
        nidPassport: user.nidPassport || "",
        photo: user.photo || "",
      });
    }
  }, [user]);

  // Handle Personal Info Update
  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) {
      Swal.fire("Error", "User session not found. Please log in again.", "error");
      return;
    }

    if (!personalForm.name.trim()) {
      Swal.fire("Validation Error", "Full Name cannot be empty.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: personalForm.name.trim(),
        mobileNumber: personalForm.mobileNumber.trim(),
        dateOfBirth: personalForm.dateOfBirth,
        gender: personalForm.gender,
        bloodGroup: personalForm.bloodGroup,
        nationality: personalForm.nationality.trim(),
        nidPassport: personalForm.nidPassport.trim(),
        photo: personalForm.photo.trim(),
      };

      const res = await axiosSecure.put(`/employee/update/${user._id}`, payload);

      const updatedUser = {
        ...user,
        ...payload,
      };

      // Sync Auth Context & LocalStorage
      if (setUser) setUser(updatedUser);
      if (setUserProfile) setUserProfile(updatedUser);

      if (typeof window !== "undefined") {
        localStorage.setItem("authEmployee", JSON.stringify(updatedUser));
        localStorage.setItem("authUser", JSON.stringify(updatedUser));
      }

      Swal.fire({
        title: "Profile Updated!",
        text: "Your personal information has been updated successfully.",
        icon: "success",
        confirmButtonColor: "#FF1818",
      });
    } catch (err) {
      console.error("Profile update error:", err);
      const msg = err?.response?.data?.message || "Failed to update profile information.";
      Swal.fire("Update Failed", msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Change Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Confirm password does not match new password.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await axiosSecure.put(`/employee/update/${user._id}`, {
        password: passwordForm.newPassword,
      });

      setPasswordForm({ newPassword: "", confirmPassword: "" });
      Swal.fire({
        title: "Password Updated!",
        text: "Your account password has been changed successfully.",
        icon: "success",
        confirmButtonColor: "#FF1818",
      });
    } catch (err) {
      console.error("Password update error:", err);
      setPasswordError(err?.response?.data?.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 font-sans">
      {/* Title Bar */}
      <Mtitle
        title="My Profile & Settings"
        subtitle="Manage your personal profile details, account security, and review your official employment records."
      />

      {/* HEADER BANNER CARD */}
      <div className="relative bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md overflow-hidden">
        {/* Decorative Top Accent Line */}
        <div className="h-28 bg-gradient-to-r from-brand-midnight via-brand-charcoal to-brand-midnight relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-brand-gold/10 blur-2xl" />
          <div className="absolute left-10 -top-10 w-48 h-48 rounded-full bg-brand-red/10 blur-2xl" />
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-4 -mt-12">
          {/* Avatar & User Core Details */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
            <div className="relative group">
              <img
                src={
                  personalForm.photo ||
                  user.photo ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name || "User"
                  )}&background=FF1818&color=fff`
                }
                alt={user.name}
                className="w-24 h-24 md:w-28 md:h-28 rounded-3xl object-cover border-4 border-brand-white dark:border-brand-charcoal shadow-xl"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-brand-white dark:border-brand-charcoal rounded-full" />
            </div>

            <div className="space-y-1 mb-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-xl md:text-2xl font-black text-brand-black dark:text-brand-white">
                  {user.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-gold/10 text-brand-gold border border-brand-gold/30">
                  {user.employeeId || "EMP-0000"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  {user.status || "active"}
                </span>
              </div>

              <p className="text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light flex items-center justify-center md:justify-start gap-2">
                <span>{user.jobPosition || "Staff Member"}</span>
                <span>•</span>
                <span>{user.department || "General Department"}</span>
                <span>•</span>
                <span className="uppercase text-brand-red">{user.role || "user"}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center">
              <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Branch</span>
              <span className="text-xs font-black text-brand-black dark:text-brand-white">{user.branch || "Main Branch"}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center">
              <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Work Shift</span>
              <span className="text-xs font-black text-brand-black dark:text-brand-white">{user.shift || "Day Shift"}</span>
            </div>
          </div>
        </div>

        {/* PROFILE NAVIGATION TABS */}
        <div className="px-6 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center gap-2 overflow-x-auto">
          {[
            { id: "personal", label: "Edit Personal Details", icon: FiUser },
            { id: "security", label: "Security & Password", icon: FiLock },
            { id: "work", label: "Work & Employment Info", icon: FiBriefcase },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-brand-red text-brand-red"
                    : "border-transparent text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-brand-white"
                }`}
              >
                <Icon className="text-sm" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: EDIT PERSONAL DETAILS */}
      {activeTab === "personal" && (
        <form onSubmit={handlePersonalSubmit} className="space-y-6">
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-4">
              <div>
                <h3 className="text-base font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiUser className="text-brand-gold" /> Personal Information
                </h3>
                <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
                  Update your contact details, photo, and identity numbers.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

            {/* Profile Photo Upload */}
            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey">
              <PhotoUpload
                value={personalForm.photo}
                onChange={(url) => setPersonalForm({ ...personalForm, photo: url })}
                name={personalForm.name || user?.name}
              />
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Full Name <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={personalForm.name}
                  onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                  placeholder="e.g. Md Sadat Khan"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  required
                />
              </div>

              {/* Email (Read only) */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Email Address <span className="text-[10px] font-normal text-brand-dark-grey">(Read-Only)</span>
                </label>
                <input
                  type="email"
                  value={personalForm.email}
                  readOnly
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light cursor-not-allowed"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={personalForm.mobileNumber}
                  onChange={(e) => setPersonalForm({ ...personalForm, mobileNumber: e.target.value })}
                  placeholder="+8801700000000"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
              </div>

              {/* Date of Birth (Read only) */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Date of Birth <span className="text-[10px] font-normal text-brand-dark-grey">(Read-Only)</span>
                </label>
                <input
                  type="date"
                  value={personalForm.dateOfBirth}
                  readOnly
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light cursor-not-allowed"
                />
              </div>

              {/* Gender (Read only) */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Gender <span className="text-[10px] font-normal text-brand-dark-grey">(Read-Only)</span>
                </label>
                <input
                  type="text"
                  value={personalForm.gender}
                  readOnly
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light cursor-not-allowed"
                />
              </div>

              {/* Blood Group (Read only) */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Blood Group <span className="text-[10px] font-normal text-brand-dark-grey">(Read-Only)</span>
                </label>
                <input
                  type="text"
                  value={personalForm.bloodGroup}
                  readOnly
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light cursor-not-allowed"
                />
              </div>

              {/* Nationality (Read only) */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Nationality <span className="text-[10px] font-normal text-brand-dark-grey">(Read-Only)</span>
                </label>
                <input
                  type="text"
                  value={personalForm.nationality}
                  readOnly
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light cursor-not-allowed"
                />
              </div>

              {/* NID / Passport (Read only) */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  NID / Passport Number <span className="text-[10px] font-normal text-brand-dark-grey">(Read-Only)</span>
                </label>
                <input
                  type="text"
                  value={personalForm.nidPassport}
                  readOnly
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light cursor-not-allowed"
                />
              </div>
            </div>

            {/* RESTRICTED FIELD NOTICE: EMERGENCY CONTACT */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <FiShield className="text-amber-500 text-lg shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Emergency Contact Details (HR Managed)
                </h4>
                <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5 leading-relaxed">
                  Emergency contact information is maintained centrally by Human Resources. To update your emergency contact numbers or relation details, please submit an HR request.
                </p>
                {user.emergencyContact?.name && (
                  <div className="mt-2 text-xs font-bold text-brand-black dark:text-brand-white flex items-center gap-4">
                    <span>Contact: {user.emergencyContact.name} ({user.emergencyContact.relation || "Emergency"})</span>
                    <span>Phone: {user.emergencyContact.mobileNumber || "—"}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-lg shadow-brand-red/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave className="text-sm" />
                    <span>Update Personal Info</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: SECURITY & PASSWORD CHANGE */}
      {activeTab === "security" && (
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-6 max-w-2xl">
            <div className="border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-4">
              <h3 className="text-base font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                <FiKey className="text-brand-gold" /> Security & Password
              </h3>
              <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
                Update your account password to ensure your profile remains secure.
              </p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-2xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold flex items-center gap-2">
                <FiAlertTriangle className="text-base shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  New Password <span className="text-brand-red">*</span>
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                  Confirm New Password <span className="text-brand-red">*</span>
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Re-type new password"
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-8 py-3 rounded-2xl bg-brand-gold hover:bg-brand-gold-light text-brand-midnight font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdatingPassword ? (
                  <>
                    <span className="w-4 h-4 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <FiCheck className="text-sm font-bold" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: WORK & EMPLOYMENT INFO (READ ONLY) */}
      {activeTab === "work" && (
        <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-6">
          <div className="border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-4">
            <h3 className="text-base font-black text-brand-black dark:text-brand-white flex items-center gap-2">
              <FiBriefcase className="text-brand-gold" /> Official Work & Employment Details
            </h3>
            <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
              These records are managed by System Administrators and HR.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50">
              <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Employee ID</span>
              <span className="text-sm font-black text-brand-gold mt-1 block">{user.employeeId || "EMP-0000"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50">
              <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Department</span>
              <span className="text-sm font-black text-brand-black dark:text-brand-white mt-1 block">{user.department || "General"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50">
              <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Job Position</span>
              <span className="text-sm font-black text-brand-black dark:text-brand-white mt-1 block">{user.jobPosition || "Staff"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50">
              <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Branch</span>
              <span className="text-sm font-black text-brand-black dark:text-brand-white mt-1 block">{user.branch || "Main Branch"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50">
              <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Shift</span>
              <span className="text-sm font-black text-brand-black dark:text-brand-white mt-1 block">{user.shift || "Day Shift"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50">
              <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Joining Date</span>
              <span className="text-sm font-black text-brand-black dark:text-brand-white mt-1 block">{user.joiningDate ? formatDate(user.joiningDate) : "—"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50">
              <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Role Level</span>
              <span className="text-sm font-black text-brand-red uppercase mt-1 block">{user.role || "user"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50">
              <span className="text-[10px] font-extrabold uppercase text-brand-dark-grey block">Account Status</span>
              <span className="text-sm font-black text-emerald-500 capitalize mt-1 block">{user.status || "active"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
