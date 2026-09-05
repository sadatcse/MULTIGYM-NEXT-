"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUploadCloud,
  FiFileText,
  FiImage,
  FiPaperclip,
  FiTrash2,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiSend,
} from "react-icons/fi";
import { toast } from "react-toastify";
import useTaskApi from "@/hooks/useTaskApi";
import useAxiosSecure from "@/hooks/useAxiosSecure";

export default function ProofSubmissionModal({
  isOpen,
  onClose,
  task,
  subtaskId = null,
  onSuccess,
}) {
  const axiosSecure = useAxiosSecure();
  const { batchUploadProofs, submitForApproval } = useTaskApi();

  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [proofNote, setProofNote] = useState("");
  const [alsoSubmitForApproval, setAlsoSubmitForApproval] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen || !task) return null;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    e.target.value = "";
  };

  const addFiles = (files) => {
    const maxSizeBytes = 15 * 1024 * 1024; // 15 MB
    const valid = [];

    files.forEach((f) => {
      if (f.size > maxSizeBytes) {
        toast.warning(`File "${f.name}" is larger than 15MB and was skipped`);
        return;
      }
      valid.push(f);
    });

    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    addFiles(files);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) {
      return <FiImage className="text-blue-500 text-lg shrink-0" />;
    }
    if (file.type === "application/pdf") {
      return <FiFileText className="text-red-500 text-lg shrink-0" />;
    }
    return <FiPaperclip className="text-amber-500 text-lg shrink-0" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If no files are attached, allow submitting for review with notes
    if (selectedFiles.length === 0) {
      if (!alsoSubmitForApproval) {
        toast.warning("Please attach at least one proof file, or check 'Submit for Management Review'.");
        return;
      }

      setUploading(true);
      setUploadProgressText("Submitting task for management review...");
      try {
        await submitForApproval(task._id, {
          subtaskId: subtaskId || undefined,
          remark: proofNote?.trim() || undefined,
        });
        toast.success("Task submitted for management review!");
        setSelectedFiles([]);
        setProofNote("");
        if (onSuccess) onSuccess();
        onClose();
      } catch (err) {
        console.error("Submission error:", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to submit for approval");
      } finally {
        setUploading(false);
        setUploadProgressText("");
      }
      return;
    }

    setUploading(true);
    const uploadedProofs = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgressText(`Uploading file ${i + 1} of ${selectedFiles.length}: ${file.name}`);

        const formData = new FormData();
        const isImage = file.type.startsWith("image/");
        const endpoint = isImage
          ? "/upload/image?folder=task-proofs"
          : "/upload/document?folder=task-proofs";
        const field = isImage ? "image" : "document";
        formData.append(field, file);

        const res = await axiosSecure.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const url = res?.data?.data?.url;
        if (url) {
          uploadedProofs.push({
            name: file.name,
            url,
            fileType: file.type || (isImage ? "image/jpeg" : "application/pdf"),
            size: file.size,
            remark: proofNote,
          });
        }
      }

      if (uploadedProofs.length === 0) {
        throw new Error("No files were successfully uploaded");
      }

      // Record batch proofs on the task/assignee
      setUploadProgressText("Attaching proofs to task record...");
      await batchUploadProofs(task._id, {
        proofs: uploadedProofs,
        subtaskId: subtaskId || undefined,
        remark: proofNote,
      });

      // Optionally transition status to SUBMITTED
      if (alsoSubmitForApproval) {
        setUploadProgressText("Submitting task for management review...");
        await submitForApproval(task._id, {
          subtaskId: subtaskId || undefined,
          remark: proofNote,
        });
        toast.success("Proofs uploaded and task submitted for approval!");
      } else {
        toast.success(`${uploadedProofs.length} proof file(s) uploaded successfully!`);
      }

      // Reset and close
      setSelectedFiles([]);
      setProofNote("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Proof submission error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to upload proofs");
    } finally {
      setUploading(false);
      setUploadProgressText("");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-brand-beige/30 dark:border-brand-dark-grey/30 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center">
                <FiUploadCloud className="text-xl" />
              </div>
              <div>
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                  Submit Completion Proof
                </h3>
                <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light/70 truncate max-w-md">
                  Task: {task.title}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="p-2 rounded-xl text-brand-dark-grey hover:text-brand-red hover:bg-brand-beige/30 dark:hover:bg-brand-midnight transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragOver
                  ? "border-brand-gold bg-brand-gold/10"
                  : "border-brand-beige dark:border-brand-dark-grey/60 hover:border-brand-gold/60 bg-brand-offwhite/30 dark:bg-brand-midnight/30"
              } ${uploading ? "pointer-events-none opacity-60" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center">
                  <FiUploadCloud className="text-2xl" />
                </div>
                <div>
                  <span className="text-xs font-black text-brand-gold hover:underline">
                    Click to browse
                  </span>{" "}
                  <span className="text-xs text-brand-dark-grey dark:text-brand-gold-light/80">
                    or drag & drop files here
                  </span>
                </div>
                <p className="text-[11px] text-brand-dark-grey/70">
                  Photos (JPG, PNG, WebP), PDFs, Invoices & Documents (Optional — you may submit with notes only)
                </p>
              </div>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-brand-dark-grey">
                  <span>Selected Attachments ({selectedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    disabled={uploading}
                    className="text-brand-red hover:underline text-[11px] font-bold"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {getFileIcon(file)}
                        <span className="font-semibold text-brand-black dark:text-brand-white truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-brand-dark-grey shrink-0 font-mono">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      {!uploading && (
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-1 text-brand-dark-grey hover:text-brand-red rounded-lg transition-colors cursor-pointer"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proof Notes / Comments */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-brand-dark-grey mb-1.5">
                Proof Notes / Execution Details
              </label>
              <textarea
                rows={3}
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
                disabled={uploading}
                placeholder="Explain the work accomplished, relevant invoices, or reference numbers..."
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey/60 text-brand-black dark:text-brand-white text-xs focus:outline-none focus:border-brand-gold transition-colors resize-none"
              />
            </div>

            {/* Checkbox: Submit for Approval */}
            {task.approvalRequired && (
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoSubmitForApproval}
                  onChange={(e) => setAlsoSubmitForApproval(e.target.checked)}
                  disabled={uploading}
                  className="mt-0.5 rounded text-brand-gold focus:ring-brand-gold accent-brand-gold"
                />
                <div>
                  <span className="text-xs font-black text-brand-black dark:text-brand-white block">
                    Submit for Management Review immediately
                  </span>
                  <span className="text-[11px] text-brand-dark-grey leading-tight block mt-0.5">
                    Changes status from In Progress to Submitted / Under Review and alerts your manager/director.
                  </span>
                </div>
              </label>
            )}

            {/* Progress Display */}
            {uploading && (
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center gap-3">
                <FiLoader className="text-lg animate-spin shrink-0" />
                <span className="text-xs font-bold">{uploadProgressText || "Uploading files..."}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="px-5 py-2.5 rounded-2xl border border-brand-beige dark:border-brand-dark-grey text-brand-dark-grey text-xs font-bold hover:bg-brand-beige/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || (selectedFiles.length === 0 && !alsoSubmitForApproval)}
                className="px-6 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-black shadow-lg shadow-brand-red/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <FiLoader className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FiSend />
                    <span>
                      {selectedFiles.length > 0
                        ? alsoSubmitForApproval
                          ? "Upload & Submit for Approval"
                          : "Upload Proofs"
                        : "Submit for Approval"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
