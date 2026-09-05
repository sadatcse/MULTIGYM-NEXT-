"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Mtitle from "@/components/Comon/Mtitle";
import MultiPhotoUpload from "@/components/Comon/MultiPhotoUpload";
import useMaintenanceApi from "@/hooks/useMaintenanceApi";
import { toast } from "react-toastify";
import { FiTool, FiAlertTriangle } from "react-icons/fi";

const CATEGORIES = ["AC", "Electrical", "Plumbing", "Equipment", "CCTV", "Access Control", "Interior", "Internet", "General Maintenance"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const INITIAL_FORM = { category: "", issue: "", priority: "MEDIUM", description: "", photos: [] };

export default function CreateMaintenanceRequestPage() {
  const router = useRouter();
  const { createRequest } = useMaintenanceApi();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.category) errs.category = "Please select a category";
    if (!form.issue.trim()) errs.issue = "Please describe the issue";
    if (!form.priority) errs.priority = "Please select a priority";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createRequest({
        category: form.category,
        issue: form.issue.trim(),
        priority: form.priority,
        description: form.description.trim(),
        photos: form.photos,
      });
      toast.success("Maintenance request submitted successfully");
      router.push("/dashboard/maintenance/my-requests");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit maintenance request";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto pb-16">
      <Mtitle
        title="Request Maintenance"
        subtitle="Report an issue and management will review, assign, and track it through to completion."
      />

      <form
        onSubmit={handleSubmit}
        className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg p-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
              Category <span className="text-brand-red">*</span>
            </label>
            <select
              disabled={isSubmitting}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 cursor-pointer ${
                errors.category ? "border-brand-red" : "border-brand-beige/50 dark:border-brand-dark-grey/50"
              }`}
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="text-[10px] text-brand-red font-bold">{errors.category}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
              Priority <span className="text-brand-red">*</span>
            </label>
            <select
              disabled={isSubmitting}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 cursor-pointer"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
            Issue / Problem <span className="text-brand-red">*</span>
          </label>
          <input
            type="text"
            disabled={isSubmitting}
            value={form.issue}
            onChange={(e) => setForm({ ...form, issue: e.target.value })}
            placeholder="e.g. AC is not cooling properly"
            className={`w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 ${
              errors.issue ? "border-brand-red" : "border-brand-beige/50 dark:border-brand-dark-grey/50"
            }`}
          />
          {errors.issue && <p className="text-[10px] text-brand-red font-bold">{errors.issue}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
            Description
          </label>
          <textarea
            rows={4}
            disabled={isSubmitting}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add any extra detail that will help whoever is assigned..."
            className="w-full p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 resize-none"
          />
        </div>

        <MultiPhotoUpload
          photos={form.photos}
          onChange={(photos) => setForm({ ...form, photos })}
          folder="maintenance"
          label="Photo(s) of the Issue"
          disabled={isSubmitting}
        />

        <div className="p-3 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-start gap-2">
          <FiAlertTriangle className="text-brand-gold text-sm shrink-0 mt-0.5" />
          <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light leading-relaxed">
            Your branch and name are recorded automatically. Assignment, cost, and completion are handled by management once your request is reviewed.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-brand-red text-white text-xs font-black shadow-md hover:bg-brand-red-dark transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FiTool className="text-sm" /> Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
