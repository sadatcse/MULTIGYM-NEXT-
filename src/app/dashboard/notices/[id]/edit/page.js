"use client";

import React, { useState, useEffect, use } from "react";
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
  FiSave,
  FiFileText,
  FiAlertTriangle,
  FiPlus,
  FiTrash2,
  FiPaperclip,
  FiUploadCloud,
  FiLoader,
  FiTag,
  FiUsers,
  FiShield,
} from "react-icons/fi";

export default function EditNoticePage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const axiosSecure = useAxiosSecure();
  const { getNoticeMonitoring, updateNotice } = useNoticeApi();
  const { departments } = useDepartmentApi();
  const { branches } = useBranchApi();
  const { employees } = useEmployeeApi(100);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingS3, setUploadingS3] = useState(false);
  const [newAttachment, setNewAttachment] = useState({ name: "", url: "" });

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
    isMajorUpdate: false,
    attachments: [],
  });

  useEffect(() => {
    if (id) {
      setLoading(true);
      getNoticeMonitoring(id)
        .then((res) => {
          if (res?.notice) {
            const n = res.notice;
            setFormData({
              title: n.title || "",
              content: n.content || "",
              category: n.category || "General",
              priority: n.priority || "Normal",
              targetType: n.targetType || "all",
              targetDepartments: n.targetDepartments || [],
              targetBranches: n.targetBranches || [],
              targetEmployees: n.targetEmployees ? n.targetEmployees.map((e) => e._id || e) : [],
              requiresAcknowledgement: n.requiresAcknowledgement ?? true,
              acknowledgementDeadline: n.acknowledgementDeadline ? n.acknowledgementDeadline.split("T")[0] : "",
              isMajorUpdate: false,
              attachments: n.attachments || [],
            });
          }
        })
        .catch((err) => {
          console.error("Failed to load notice:", err);
          toast.error("Failed to load notice for editing");
        })
        .finally(() => setLoading(false));
    }
  }, [id, getNoticeMonitoring]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in notice title and content");
      return;
    }

    setSubmitting(true);
    try {
      await updateNotice(id, formData);
      toast.success("Notice updated successfully!");
      router.push("/dashboard/notices");
    } catch (err) {
      console.error("Failed to update notice:", err);
      toast.error(err?.response?.data?.message || "Failed to update notice");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center font-bold text-brand-dark-grey">Loading Notice Content...</div>;
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/notices")}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-brand-dark-grey hover:text-brand-gold transition-colors"
        >
          <FiArrowLeft className="text-sm" /> Back to Notice Center
        </button>
      </div>

      <Mtitle
        title="Edit Official Notice"
        subtitle="Modify notice details, update targeting options, or increment major content version."
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Main Content & Attachments (2 Cols Wide) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 sm:p-7 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-5 shadow-lg shadow-black/5 border-l-4 border-l-brand-gold">
            <h3 className="text-sm font-black text-brand-black dark:text-brand-white uppercase tracking-wider flex items-center gap-2">
              <FiFileText className="text-brand-gold text-base" /> Edit Notice Content
            </h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-2">
                Notice Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-sm font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-2">
                Notice Content *
              </label>
              <textarea
                name="content"
                rows={10}
                value={formData.content}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-medium leading-relaxed outline-none focus:ring-2 focus:ring-brand-gold/50"
                required
              ></textarea>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 sm:p-7 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-5 shadow-lg shadow-black/5">
            <h3 className="text-sm font-black text-brand-black dark:text-brand-white uppercase tracking-wider flex items-center gap-2">
              <FiPaperclip className="text-brand-gold text-base" /> Notice Attachments
            </h3>

            <div className="p-6 rounded-2xl bg-brand-gold/5 dark:bg-brand-midnight/60 border-2 border-dashed border-brand-gold/40 hover:border-brand-gold transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center font-black text-xl shrink-0">
                  {uploadingS3 ? <FiLoader className="animate-spin" /> : <FiUploadCloud />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-brand-black dark:text-brand-white">
                    Cloud File Upload
                  </h4>
                  <p className="text-[11px] text-brand-dark-grey mt-0.5">
                    Upload documents (PDF, DOCX, XLSX, PNG, JPG).
                  </p>
                </div>
              </div>

              <label className={`px-5 py-2.5 rounded-xl bg-brand-gold text-brand-black font-black text-xs shadow-md hover:bg-brand-gold-dark transition-all cursor-pointer flex items-center gap-2 shrink-0 ${uploadingS3 ? "opacity-50 pointer-events-none" : ""}`}>
                {uploadingS3 ? <FiLoader className="animate-spin text-sm" /> : <FiUploadCloud className="text-sm" />}
                <span>{uploadingS3 ? "Uploading..." : "Upload File"}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileUploadAWS}
                  className="hidden"
                  disabled={uploadingS3}
                />
              </label>
            </div>

            {formData.attachments && formData.attachments.length > 0 && (
              <div className="space-y-2 pt-2">
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
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          attachments: prev.attachments.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-red-500 hover:text-red-700 p-1.5 shrink-0"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Settings Sidebar (1 Col Wide) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-4 shadow-lg shadow-black/5">
            <h4 className="text-xs font-black text-brand-black dark:text-brand-white uppercase tracking-wider flex items-center gap-2">
              <FiTag className="text-brand-gold" /> Classification
            </h4>

            <div>
              <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-1.5">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none cursor-pointer"
              >
                <option value="General">General</option>
                <option value="HR">HR</option>
                <option value="Policy">Policy</option>
                <option value="Attendance">Attendance</option>
                <option value="Payroll">Payroll</option>
                <option value="Compliance">Compliance</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-1.5">
                Priority Level
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none cursor-pointer"
              >
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-4 shadow-lg shadow-black/5">
            <h4 className="text-xs font-black text-brand-black dark:text-brand-white uppercase tracking-wider flex items-center gap-2">
              <FiUsers className="text-brand-gold" /> Targeting
            </h4>

            <div>
              <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-1.5">
                Audience Group
              </label>
              <select
                name="targetType"
                value={formData.targetType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none cursor-pointer"
              >
                <option value="all">All Employees (Company-wide)</option>
                <option value="department">Specific Department</option>
                <option value="branch">Specific Branch</option>
                <option value="employees">Specific Selected Employees</option>
              </select>
            </div>

            {formData.targetType === "employees" && (
              <div>
                <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white mb-1.5">
                  Select Specific Employees ({(formData.targetEmployees || []).length} selected)
                </label>
                <select
                  multiple
                  value={formData.targetEmployees}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                    setFormData((prev) => ({ ...prev, targetEmployees: selected }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none h-32"
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId || "No ID"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Major Update Version Flag Card */}
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <FiAlertTriangle className="text-amber-500 text-lg shrink-0 mt-0.5" />
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-brand-black dark:text-brand-white">
                <input
                  type="checkbox"
                  name="isMajorUpdate"
                  checked={formData.isMajorUpdate}
                  onChange={handleChange}
                  className="w-4 h-4 text-brand-gold rounded border-brand-beige/60 focus:ring-brand-gold"
                />
                <span>Major Version Update (v2)</span>
              </label>
              <p className="text-[11px] text-brand-dark-grey leading-relaxed">
                If checked, employee acknowledgements will require re-verification.
              </p>
            </div>
          </div>

          <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 space-y-3 shadow-lg shadow-black/5">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-brand-gold text-brand-black font-black text-xs shadow-xl shadow-brand-gold/20 hover:bg-brand-gold-dark transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiSave className="text-base" />
              <span>{submitting ? "Saving Changes..." : "Save Changes"}</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/notices")}
              className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-brand-dark-grey hover:bg-brand-beige/40 dark:hover:bg-brand-dark-grey/40 transition-colors text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
