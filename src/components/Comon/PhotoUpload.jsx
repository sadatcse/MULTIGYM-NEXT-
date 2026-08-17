"use client";

import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import { FiCamera, FiLoader } from "react-icons/fi";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import Avatar from "@/components/Comon/Avatar";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const PhotoUpload = ({ value, onChange, name, size = 20, label = "Profile Photo" }) => {
  const axiosSecure = useAxiosSecure();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file again later
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please choose a JPEG, PNG, or WEBP image");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      // Content-Type must be left for axios/the browser to set (with the
      // multipart boundary) — the axiosSecure instance otherwise forces
      // application/json on every request.
      const res = await axiosSecure.post("/upload/image", formData, {
        headers: { "Content-Type": undefined },
      });
      const url = res?.data?.data?.url;
      if (url) {
        onChange(url);
        toast.success("Photo updated");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to upload photo";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <Avatar src={value} name={name} size={size} />
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <FiLoader className="animate-spin text-white text-lg" />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center border-2 border-brand-white dark:border-brand-charcoal shadow-sm hover:bg-brand-secondary transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Change photo"
        >
          <FiCamera className="text-xs" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <div className="text-xs text-brand-dark-grey dark:text-brand-sage">
        <p className="font-bold text-brand-black dark:text-brand-white mb-0.5">{label}</p>
        <p>Click the camera icon to upload (JPEG, PNG, or WEBP, max 5MB)</p>
      </div>
    </div>
  );
};

export default PhotoUpload;
