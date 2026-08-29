"use client";

import { useState, useCallback } from "react";
import useAxiosSecure from "@/hooks/useAxiosSecure";

const MAX_SIZE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export default function useVendorDocumentApi() {
  const axiosSecure = useAxiosSecure();
  const [uploading, setUploading] = useState(false);

  const getDocuments = useCallback(
    async (vendorId, params = {}) => {
      const res = await axiosSecure.get("/vendor-document", { params: { vendor: vendorId, limit: 100, ...params } });
      return res?.data?.data || [];
    },
    [axiosSecure]
  );

  // Uploads the raw file to S3, then records it against the vendor in one call.
  const uploadAndAttach = useCallback(
    async (file, meta) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error("Please choose a PDF, DOC, DOCX, XLS, or XLSX file");
      }
      if (file.size > MAX_SIZE_BYTES) {
        throw new Error("File must be smaller than 15MB");
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("document", file);
        const uploadRes = await axiosSecure.post("/upload/document?folder=vendor-documents", formData, {
          headers: { "Content-Type": undefined },
        });
        const { url, fileName } = uploadRes.data.data;

        const res = await axiosSecure.post("/vendor-document/post", {
          ...meta,
          fileUrl: url,
          fileName,
        });
        return res.data;
      } finally {
        setUploading(false);
      }
    },
    [axiosSecure]
  );

  const deleteDocument = useCallback(
    async (id) => {
      const res = await axiosSecure.delete(`/vendor-document/delete/${id}`);
      return res.data;
    },
    [axiosSecure]
  );

  return { uploading, getDocuments, uploadAndAttach, deleteDocument };
}
