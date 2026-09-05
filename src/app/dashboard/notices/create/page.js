"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Mtitle from "@/components/Comon/Mtitle";
import useNoticeApi from "@/hooks/useNoticeApi";
import useDepartmentApi from "@/hooks/useDepartmentApi";
import useBranchApi from "@/hooks/useBranchApi";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiSend,
  FiSave,
  FiFileText,
  FiPaperclip,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiUploadCloud,
  FiLoader,
  FiUsers,
  FiCalendar,
  FiShield,
  FiLayers,
  FiTag,
  FiAlertCircle,
} from "react-icons/fi";

export default function CreateNoticePage() {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const { createNotice } = useNoticeApi();
  const { departments } = useDepartmentApi();
  const { branches } = useBranchApi();
  const { employees } = useEmployeeApi(100);

  const [loading, setLoading] = useState(false);
  const [uploadingS3, setUploadingS3] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
    priority: "Normal",
    targetType: "all",
    targetDepartments: [],
    targetBranches: [],
    targetEmployees: [],
    requiresAcknowledgement: true,
    acknowledgementDeadline: "",
    allowDownload: true,
    sendNotification: true,
    autoPublish: true,
    attachments: [],
  });

  const [newAttachment, setNewAttachment] = useState({ name: "", url: "" });

  const handleFileUploadAWS = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingS3(true);
    try {
      const formDataUpload = new FormData();
      const isImage = file.type.startsWith("image/");
      const endpoint = isImage ? "/upload/image?folder=notices" : "/upload/document?folder=notice-documents";
      const fieldName = isImage ? "image" : "document";
      formDataUpload.append(fieldName, file);

      const res = await axiosSecure.post(endpoint, formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl = res?.data?.data?.url;
      if (uploadedUrl) {
        toast.success("File uploaded successfully!");
        setFormData((prev) => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            {
              name: file.name,
              url: uploadedUrl,
              fileType: file.type,
              size: file.size,
            },
          ],
        }));
      }
    } catch (err) {
      console.error("File upload failed:", err);
      toast.error(err?.response?.data?.message || "Failed to upload file");
    } finally {
      setUploadingS3(false);
      e.target.value = "";
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddAttachment = () => {
    if (!newAttachment.name || !newAttachment.url) {
      toast.error("Please enter both attachment name and valid URL");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, newAttachment],
    }));
    setNewAttachment({ name: "", url: "" });
  };

  const handleRemoveAttachment = (idx) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in notice title and content");
      return;
    }

    setLoading(true);
    try {
      await createNotice(formData);
      toast.success(formData.autoPublish ? "Notice created & published!" : "Notice saved as draft!");
      router.push("/dashboard/notices");
    } catch (err) {
      console.error("Failed to create notice:", err);
      toast.error(err?.response?.data?.message || "Failed to create notice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.push("/dashboard/notices")}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-brand-dark-grey hover:text-brand-gold transition-colors"
        >
          <FiArrowLeft className="text-sm" /> Back to Notice Center
        </button>
      </div>

      <Mtitle
        title="Compose Official Notice"
        subtitle="Publish announcements, company policies, and instructions with real-time employee compliance tracking."
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Main Content & Attachments (2 Cols Wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Notice Information Card */}
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 sm:p-7 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-5 shadow-lg shadow-black/5 relative overflow-hidden border-l-4 border-l-brand-gold">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-brand-black dark:text-brand-white uppercase tracking-wider flex items-center gap-2">
                <FiFileText className="text-brand-gold text-base" /> Notice Details & Description
              </h3>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                Official Document
              </span>
            </div>

            {/* Notice Title */}
            <div>
              <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-2">
                Notice Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Updated Attendance Policy & Office Guidelines 2026"
                className="w-full px-4 py-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-sm font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                required
              />
            </div>

            {/* Notice Content / Rich Text Block */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white">
                  Notice Content / Official Text <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-brand-dark-grey font-mono">
                  {formData.content.length} characters
                </span>
              </div>
              <textarea
                name="content"
                rows={10}
                value={formData.content}
                onChange={handleChange}
                placeholder="Write the complete official notice text here..."
                className="w-full px-4 py-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-medium leading-relaxed outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                required
              ></textarea>
            </div>
          </div>

          {/* Attachments & Cloud Upload Card */}
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 sm:p-7 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-5 shadow-lg shadow-black/5">
            <h3 className="text-sm font-black text-brand-black dark:text-brand-white uppercase tracking-wider flex items-center gap-2">
              <FiPaperclip className="text-brand-gold text-base" /> Attachments & Documents
            </h3>

            {/* Drag & Drop File Upload Box */}
            <div className="p-6 rounded-2xl bg-brand-gold/5 dark:bg-brand-midnight/60 border-2 border-dashed border-brand-gold/40 hover:border-brand-gold transition-all flex flex-col sm:flex-row items-center justify-between gap-4 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-105 transition-transform">
                  {uploadingS3 ? <FiLoader className="animate-spin" /> : <FiUploadCloud />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-brand-black dark:text-brand-white">
                    Direct Cloud Upload
                  </h4>
                  <p className="text-[11px] text-brand-dark-grey mt-0.5">
                    Upload documents (PDF, DOCX, XLSX, PNG, JPG) directly to cloud storage.
                  </p>
                </div>
              </div>

              <label className={`px-5 py-2.5 rounded-xl bg-brand-gold text-brand-black font-black text-xs shadow-md shadow-brand-gold/20 hover:bg-brand-gold-dark transition-all cursor-pointer flex items-center gap-2 shrink-0 ${uploadingS3 ? "opacity-50 pointer-events-none" : ""}`}>
                {uploadingS3 ? <FiLoader className="animate-spin text-sm" /> : <FiUploadCloud className="text-sm" />}
                <span>{uploadingS3 ? "Uploading..." : "Choose File"}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileUploadAWS}
                  className="hidden"
                  disabled={uploadingS3}
                />
              </label>
            </div>

            <div className="text-[10px] text-brand-dark-grey font-extrabold text-center uppercase tracking-widest">
              — Or add external URL manually —
            </div>

            {/* Manual URL Input */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                placeholder="Attachment Title (e.g. Employee Handbook PDF)"
                value={newAttachment.name}
                onChange={(e) => setNewAttachment((prev) => ({ ...prev, name: e.target.value }))}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
              />
              <input
                type="text"
                placeholder="File Document URL (e.g. https://...)"
                value={newAttachment.url}
                onChange={(e) => setNewAttachment((prev) => ({ ...prev, url: e.target.value }))}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-4 py-2.5 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-black font-black text-xs transition-colors flex items-center gap-1 shrink-0 border border-brand-gold/20"
              >
                <FiPlus /> Add
              </button>
            </div>

            {/* Attached Files Chips */}
            {formData.attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-black text-brand-black dark:text-brand-white uppercase">
                  Attached Files ({formData.attachments.length})
                </div>
                {formData.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FiPaperclip className="text-brand-gold shrink-0 text-sm" />
                      <div className="truncate">
                        <span className="font-extrabold text-brand-black dark:text-brand-white">
                          {att.name}
                        </span>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-500 hover:underline font-mono ml-2 block truncate"
                        >
                          {att.url}
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                      title="Remove attachment"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Settings, Target Audience & Actions Sidebar (1 Col Wide) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Category & Priority Settings Card */}
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-4 shadow-lg shadow-black/5">
            <h4 className="text-xs font-black text-brand-black dark:text-brand-white uppercase tracking-wider flex items-center gap-2">
              <FiTag className="text-brand-gold" /> Notice Classification
            </h4>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-1.5">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
              >
                <option value="General">General Announcement</option>
                <option value="HR">HR & Personnel</option>
                <option value="Policy">Company Policy</option>
                <option value="Attendance">Attendance & Leave</option>
                <option value="Payroll">Payroll & Benefits</option>
                <option value="Compliance">Regulatory Compliance</option>
                <option value="Training">Staff Training</option>
                <option value="Emergency">Emergency Alert</option>
                <option value="Management Instruction">Management Instruction</option>
              </select>
            </div>

            {/* Priority Select */}
            <div>
              <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-1.5">
                Priority Level
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-black outline-none cursor-pointer ${
                  formData.priority === "Critical"
                    ? "bg-red-500/10 text-red-600 border-red-500/30"
                    : formData.priority === "Urgent"
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                    : formData.priority === "Important"
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                    : "bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white border-brand-beige/60 dark:border-brand-dark-grey"
                }`}
              >
                <option value="Normal">Normal Priority</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent Priority</option>
                <option value="Critical">Critical Emergency</option>
              </select>
            </div>
          </div>

          {/* Target Audience Card */}
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-4 shadow-lg shadow-black/5">
            <h4 className="text-xs font-black text-brand-black dark:text-brand-white uppercase tracking-wider flex items-center gap-2">
              <FiUsers className="text-brand-gold" /> Target Audience
            </h4>

            <div>
              <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-1.5">
                Recipient Group
              </label>
              <select
                name="targetType"
                value={formData.targetType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50"
              >
                <option value="all">All Employees (Company-wide)</option>
                <option value="department">Specific Department</option>
                <option value="branch">Specific Branch</option>
                <option value="employees">Specific Selected Employees</option>
              </select>
            </div>

            {/* Dynamic Targeting Selectors */}
            {formData.targetType === "department" && (
              <div>
                <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-1.5">
                  Select Department ({formData.targetDepartments.length} selected)
                </label>
                <select
                  multiple
                  value={formData.targetDepartments}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                    setFormData((prev) => ({ ...prev, targetDepartments: selected }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none h-32"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.targetType === "branch" && (
              <div>
                <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-1.5">
                  Select Branch ({formData.targetBranches.length} selected)
                </label>
                <select
                  multiple
                  value={formData.targetBranches}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                    setFormData((prev) => ({ ...prev, targetBranches: selected }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none h-32"
                >
                  {branches.map((b) => (
                    <option key={b._id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.targetType === "employees" && (
              <div>
                <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-1.5">
                  Select Employees ({formData.targetEmployees.length} selected)
                </label>
                <select
                  multiple
                  value={formData.targetEmployees}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                    setFormData((prev) => ({ ...prev, targetEmployees: selected }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none h-36"
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId || "No ID"}) — {emp.department || "General"}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-brand-dark-grey mt-1 font-semibold">
                  Hold Ctrl/Cmd to select multiple staff.
                </p>
              </div>
            )}
          </div>

          {/* Compliance & Policy Settings Card */}
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-4 shadow-lg shadow-black/5">
            <h4 className="text-xs font-black text-brand-black dark:text-brand-white uppercase tracking-wider flex items-center gap-2">
              <FiShield className="text-brand-gold" /> Acknowledgement & Dispatch
            </h4>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-extrabold text-brand-black dark:text-brand-white">
              <input
                type="checkbox"
                name="requiresAcknowledgement"
                checked={formData.requiresAcknowledgement}
                onChange={handleChange}
                className="w-4 h-4 mt-0.5 text-brand-gold rounded border-brand-beige/60 focus:ring-brand-gold"
              />
              <span className="leading-snug">
                Require Mandatory Employee Acknowledgement
              </span>
            </label>

            {formData.requiresAcknowledgement && (
              <div className="pl-6 pt-1">
                <label className="block text-xs font-bold text-brand-dark-grey mb-1">
                  Acknowledgement Deadline
                </label>
                <input
                  type="date"
                  name="acknowledgementDeadline"
                  value={formData.acknowledgementDeadline}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none"
                />
              </div>
            )}

            <hr className="border-brand-beige/40 dark:border-brand-dark-grey/40" />

            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-extrabold text-brand-black dark:text-brand-white">
              <input
                type="checkbox"
                name="autoPublish"
                checked={formData.autoPublish}
                onChange={handleChange}
                className="w-4 h-4 mt-0.5 text-brand-gold rounded border-brand-beige/60 focus:ring-brand-gold"
              />
              <span className="leading-snug">
                Publish Immediately & Notify Audience
              </span>
            </label>
          </div>

          {/* Action Footer Card */}
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-3 shadow-lg shadow-black/5">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-brand-gold text-brand-black font-black text-xs shadow-xl shadow-brand-gold/20 hover:bg-brand-gold-dark transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FiSend className="text-base" />
              <span>{loading ? "Processing Notice..." : formData.autoPublish ? "Publish Notice Now" : "Save as Draft"}</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/notices")}
              className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-brand-dark-grey hover:bg-brand-beige/40 dark:hover:bg-brand-dark-grey/40 transition-colors text-center"
            >
              Cancel & Return
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
