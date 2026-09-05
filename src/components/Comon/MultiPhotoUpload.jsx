"use client";

import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import { FiCamera, FiLoader, FiX, FiImage } from "react-icons/fi";
import useAxiosSecure from "@/hooks/useAxiosSecure";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// A small multi-image gallery uploader (add/remove several photos, e.g.
// before/after maintenance photos) — a sibling to the single-avatar
// PhotoUpload.jsx, which isn't shaped for more than one image at a time.
export default function MultiPhotoUpload({ photos = [], onChange, folder, label = "Photos", disabled = false }) {
  const axiosSecure = useAxiosSecure();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
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
      const res = await axiosSecure.post(`/upload/image?folder=${encodeURIComponent(folder)}`, formData, {
        headers: { "Content-Type": undefined },
      });
      const url = res?.data?.data?.url;
      if (url) {
        onChange([...photos, url]);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (idx) => {
    onChange(photos.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-3">
        {photos.map((url, idx) => (
          <div key={url + idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-brand-beige/60 dark:border-brand-dark-grey/60 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${label} ${idx + 1}`} className="w-full h-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Remove photo"
              >
                <FiX className="text-[10px]" />
              </button>
            )}
          </div>
        ))}

        {!disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-2xl border-2 border-dashed border-brand-beige dark:border-brand-dark-grey flex flex-col items-center justify-center gap-1 text-brand-dark-grey dark:text-brand-gold-light hover:border-brand-gold hover:text-brand-gold transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading ? <FiLoader className="animate-spin text-lg" /> : <FiCamera className="text-lg" />}
            <span className="text-[9px] font-bold">{uploading ? "Uploading" : "Add Photo"}</span>
          </button>
        )}

        {photos.length === 0 && disabled && (
          <div className="w-20 h-20 rounded-2xl border border-dashed border-brand-beige dark:border-brand-dark-grey flex flex-col items-center justify-center gap-1 text-brand-dark-grey/50">
            <FiImage className="text-lg" />
            <span className="text-[9px] font-bold">None</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
