"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useSettingApi from "@/hooks/useSettingApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import Mtitle from "@/components/Comon/Mtitle";
import PhotoUpload from "@/components/Comon/PhotoUpload";
import Swal from "sweetalert2";
import {
  FiSettings,
  FiGlobe,
  FiPrinter,
  FiBriefcase,
  FiSave,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
  FiShield,
  FiFileText,
  FiCheck,
  FiImage,
} from "react-icons/fi";

import timezonesData from "@/data/Timezone.json";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";

export default function SiteSettingsPage() {
  const { hasPermission } = useUserPermissions();
  const canEditSettings = hasPermission("/dashboard/settings", "edit");

  const { settings, loading, isUpdating, updateSettings } = useSettingApi();
  const { formatDate, formatDateTime, currentTimeZoneObj } = useSystemTimeZone();

  const [activeTab, setActiveTab] = useState("company");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Synchronous lock (defense-in-depth against rapid double-click/double-Enter
  // firing two overlapping save requests before the isUpdating state re-render commits).
  const submitLockRef = useRef(false);

  const [formData, setFormData] = useState({
    companyName: "",
    companyTagline: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    logo: "",
    taxNumber: "",
    timeZone: "Asia/Dhaka",
    dateFormat: "YYYY-MM-DD",
    currencySymbol: "৳",
    language: "English",
    enablePrintHeader: "yes",
    enablePrintFooter: "yes",
    printHeaderInch: 1.0,
    printFooterInch: 0.75,
    printHeaderText: "",
    printFooterText: "",
    probationMonths: 3,
    workingDaysPerWeek: 5,
    dailyWorkHours: 8,
    overtimeRate: 1.5,
  });

  // Sync form data on fetch
  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local form state from freshly fetched settings, not a cascading render
      setFormData({
        companyName: settings.companyName || "Multigym HR",
        companyTagline: settings.companyTagline || "",
        email: settings.email || "",
        phone: settings.phone || "",
        address: settings.address || "",
        website: settings.website || "",
        logo: settings.logo || "",
        taxNumber: settings.taxNumber || "",
        timeZone: settings.timeZone || "Asia/Dhaka",
        dateFormat: settings.dateFormat || "YYYY-MM-DD",
        currencySymbol: settings.currencySymbol || "৳",
        language: settings.language || "English",
        enablePrintHeader: settings.enablePrintHeader || "yes",
        enablePrintFooter: settings.enablePrintFooter || "yes",
        printHeaderInch: settings.printHeaderInch !== undefined ? settings.printHeaderInch : 1.0,
        printFooterInch: settings.printFooterInch !== undefined ? settings.printFooterInch : 0.75,
        printHeaderText: settings.printHeaderText || "",
        printFooterText: settings.printFooterText || "",
        probationMonths: settings.probationMonths || 3,
        workingDaysPerWeek: settings.workingDaysPerWeek || 5,
        dailyWorkHours: settings.dailyWorkHours || 8,
        overtimeRate: settings.overtimeRate || 1.5,
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLockRef.current || isUpdating) return;

    submitLockRef.current = true;
    try {
      const payload = {
        ...formData,
        printHeaderInch: Number(formData.printHeaderInch),
        printFooterInch: Number(formData.printFooterInch),
        probationMonths: Number(formData.probationMonths),
        workingDaysPerWeek: Number(formData.workingDaysPerWeek),
        dailyWorkHours: Number(formData.dailyWorkHours),
        overtimeRate: Number(formData.overtimeRate),
      };

      await updateSettings(payload);
      setLastSavedAt(new Date());

      Swal.fire({
        title: "Settings Saved!",
        text: "Site configurations and print settings have been updated successfully.",
        icon: "success",
        confirmButtonColor: "#FF1818",
      });
    } catch (err) {
      console.error("Save settings error:", err);
      Swal.fire("Error", "Failed to save site settings.", "error");
    } finally {
      submitLockRef.current = false;
    }
  };

  if (loading) {
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
        title="Site & General HR Settings"
        subtitle="Manage company information, time zones, print header & footer margins, and global HR policies."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TOP HEADER TAB CARD */}
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold">
              <FiSettings />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-brand-black dark:text-brand-white">
                Global System Configuration
              </h2>
              <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                Configure organizational identity, print headers, and localization settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isUpdating && lastSavedAt && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <FiCheckCircle className="text-xs shrink-0" />
                <span>Last saved at {formatDateTime(lastSavedAt)}</span>
              </span>
            )}

            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>Save All Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS BAR */}
        <div className="flex items-center gap-2 p-1.5 bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 overflow-x-auto">
          {[
            { id: "company", label: "Company Information", icon: FiBriefcase },
            { id: "localization", label: "Time Zone & Localization", icon: FiGlobe },
            { id: "print", label: "Print Header & Footer ", icon: FiPrinter },
            { id: "hr", label: "HR Policies & Defaults", icon: FiShield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id
                    ? "bg-brand-red text-white shadow-md shadow-brand-red/20"
                    : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
                  }`}
              >
                <Icon className="text-sm" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT (animated on tab switch) */}
        <AnimatePresence mode="wait">
          {/* TAB 1: COMPANY INFORMATION */}
          {activeTab === "company" && (
            <motion.div
              key="company"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-6"
            >
              <div className="border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-4">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiBriefcase className="text-brand-gold" /> Company Identity & Contact Information
                </h3>
                <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
                  Official company details displayed on reports, payslips, and print headers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Company Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Multigym HR"
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Company Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.companyTagline}
                    onChange={(e) => setFormData({ ...formData, companyTagline: e.target.value })}
                    placeholder="e.g. Complete Enterprise HR System"
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@company.com"
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Phone / Support Contact
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+8801700000000"
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://company.com"
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Tax / VAT Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="e.g. BIN-123456789"
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Company Address
                  </label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full office address..."
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1 flex items-center gap-1">
                    <FiImage className="text-brand-gold" /> Company Logo
                  </label>
                  <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey">
                    <PhotoUpload
                      value={formData.logo}
                      onChange={(url) => setFormData({ ...formData, logo: url })}
                      name={formData.companyName}
                      shape="square"
                      folder="logos"
                      label="Company Logo"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: TIME ZONE & LOCALIZATION */}
          {activeTab === "localization" && (
            <motion.div
              key="localization"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-6"
            >
              <div className="border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-4">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiGlobe className="text-brand-gold" /> Time Zone & Regional Formatting
                </h3>
                <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
                  Set system time zone, default currency, and date formats.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* TIME ZONE */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    System Time Zone (53 Global Regions)
                  </label>
                  <select
                    value={formData.timeZone}
                    onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {timezonesData.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label} ({tz.offset})
                      </option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                      <FiClock className="text-xs shrink-0" />
                      <span>Zoned Time: {formatDateTime(new Date())}</span>
                    </span>
                  </div>
                </div>

                {/* DATE FORMAT */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    System Date Format
                  </label>
                  <select
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-16)</option>
                    <option value="YYYY/MM/DD">YYYY/MM/DD (2026/08/16)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (16/08/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (08/16/2026)</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY (16-08-2026)</option>
                    <option value="DD MMM YYYY">DD MMM YYYY (16 Aug 2026)</option>
                    <option value="DD MMMM YYYY">DD MMMM YYYY (16 August 2026)</option>
                    <option value="MMM DD, YYYY">MMM DD, YYYY (Aug 16, 2026)</option>
                    <option value="MMMM DD, YYYY">MMMM DD, YYYY (August 16, 2026)</option>
                  </select>
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                      <FiCalendar className="text-xs shrink-0" />
                      <span>Formatted Date: {formatDate(new Date(), formData.dateFormat)}</span>
                    </span>
                  </div>
                </div>

                {/* CURRENCY SYMBOL */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Currency Symbol
                  </label>
                  <select
                    value={formData.currencySymbol}
                    onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="৳">৳ (Bangladeshi Taka - BDT)</option>
                    <option value="$">$ (US Dollar - USD)</option>
                    <option value="€">€ (Euro - EUR)</option>
                    <option value="£">£ (British Pound - GBP)</option>
                    <option value="₹">₹ (Indian Rupee - INR)</option>
                    <option value="AED">AED (Emirati Dirham)</option>
                  </select>
                </div>

                {/* DEFAULT LANGUAGE */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    System Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="English">English</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: PRINT HEADER & FOOTER INCHES SETTINGS */}
          {activeTab === "print" && (
            <motion.div
              key="print"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-6"
            >
              <div className="border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-4">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiPrinter className="text-brand-gold" /> Print Header & Footer Page Margin Controls (Inches)
                </h3>
                <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
                  Configure PDF/Paper print margins in inches and toggle header/footer visibility.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* PRINT HEADER ENABLED (YES / NO) */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Print Header (Yes / No)
                  </label>
                  <select
                    value={formData.enablePrintHeader}
                    onChange={(e) => setFormData({ ...formData, enablePrintHeader: e.target.value })}
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer uppercase disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="yes">Yes (Enabled)</option>
                    <option value="no">No (Disabled)</option>
                  </select>
                </div>

                {/* PRINT HEADER INCH */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Print Header Margin (Inches)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.printHeaderInch}
                    onChange={(e) => setFormData({ ...formData, printHeaderInch: e.target.value })}
                    placeholder="1.0"
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* PRINT FOOTER ENABLED (YES / NO) */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Print Footer (Yes / No)
                  </label>
                  <select
                    value={formData.enablePrintFooter}
                    onChange={(e) => setFormData({ ...formData, enablePrintFooter: e.target.value })}
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer uppercase disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="yes">Yes (Enabled)</option>
                    <option value="no">No (Disabled)</option>
                  </select>
                </div>

                {/* PRINT FOOTER INCH */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Print Footer Margin (Inches)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.printFooterInch}
                    onChange={(e) => setFormData({ ...formData, printFooterInch: e.target.value })}
                    placeholder="0.75"
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Print Header Title Text
                  </label>
                  <input
                    type="text"
                    value={formData.printHeaderText}
                    onChange={(e) => setFormData({ ...formData, printHeaderText: e.target.value })}
                    placeholder="MULTIGYM HR MANAGEMENT SYSTEM"
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Print Footer Note / Disclaimer
                  </label>
                  <input
                    type="text"
                    value={formData.printFooterText}
                    onChange={(e) => setFormData({ ...formData, printFooterText: e.target.value })}
                    placeholder="This is a computer-generated document."
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* PREVIEW CONTAINER */}
              <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-brand-gold tracking-wider flex items-center gap-1.5">
                  <FiPrinter /> Print Document Live Preview Margin Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-brand-white dark:bg-brand-charcoal">
                    <span className="text-[10px] text-brand-dark-grey uppercase block font-extrabold">Header State</span>
                    <span className={`font-black uppercase ${formData.enablePrintHeader === "yes" ? "text-emerald-500" : "text-brand-red"}`}>
                      {formData.enablePrintHeader}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-brand-white dark:bg-brand-charcoal">
                    <span className="text-[10px] text-brand-dark-grey uppercase block font-extrabold">Header Margin</span>
                    <span className="font-black text-brand-black dark:text-brand-white">
                      {formData.printHeaderInch} Inch ({formData.printHeaderInch * 72}pt)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-brand-white dark:bg-brand-charcoal">
                    <span className="text-[10px] text-brand-dark-grey uppercase block font-extrabold">Footer State</span>
                    <span className={`font-black uppercase ${formData.enablePrintFooter === "yes" ? "text-emerald-500" : "text-brand-red"}`}>
                      {formData.enablePrintFooter}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-brand-white dark:bg-brand-charcoal">
                    <span className="text-[10px] text-brand-dark-grey uppercase block font-extrabold">Footer Margin</span>
                    <span className="font-black text-brand-black dark:text-brand-white">
                      {formData.printFooterInch} Inch ({formData.printFooterInch * 72}pt)
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: HR POLICIES & DEFAULTS */}
          {activeTab === "hr" && (
            <motion.div
              key="hr"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-6"
            >
              <div className="border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-4">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiShield className="text-brand-gold" /> Organizational HR Policy Defaults
                </h3>
                <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
                  Set default probation durations, weekly working days, and overtime rate multipliers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Probation Period (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.probationMonths}
                    onChange={(e) => setFormData({ ...formData, probationMonths: e.target.value })}
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Working Days Per Week
                  </label>
                  <select
                    value={formData.workingDaysPerWeek}
                    onChange={(e) => setFormData({ ...formData, workingDaysPerWeek: e.target.value })}
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value={5}>5 Days (Mon - Fri / Sun - Thu)</option>
                    <option value={6}>6 Days (Sat - Thu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Standard Daily Work Hours
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="14"
                    value={formData.dailyWorkHours}
                    onChange={(e) => setFormData({ ...formData, dailyWorkHours: e.target.value })}
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Overtime Multiplier Rate
                  </label>
                  <select
                    value={formData.overtimeRate}
                    onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
                    disabled={isUpdating}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value={1.0}>1.0x (Regular Hourly Rate)</option>
                    <option value={1.25}>1.25x (125% Rate)</option>
                    <option value={1.5}>1.5x (150% Standard OT Rate)</option>
                    <option value={2.0}>2.0x (Double Time)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-8 py-3 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-lg shadow-brand-red/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving All Settings...</span>
              </>
            ) : (
              <>
                <FiSave className="text-sm" />
                <span>Save All Site Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
