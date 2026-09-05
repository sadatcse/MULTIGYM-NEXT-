"use client";

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import MultiPhotoUpload from "@/components/Comon/MultiPhotoUpload";
import { FiEdit3 } from "react-icons/fi";

export default function MaintenanceWorkUpdateModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [update, setUpdate] = useState("");
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUpdate("");
    setPhotos([]);
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!update.trim()) return;
    onSubmit({ update: update.trim(), photos });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={!isSubmitting}
      closeOnEsc={!isSubmitting}
      title={
        <div className="flex items-center gap-2">
          <FiEdit3 className="text-brand-gold" />
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white">Post Work Update</h3>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
            Update <span className="text-brand-red">*</span>
          </label>
          <textarea
            rows={3}
            required
            disabled={isSubmitting}
            value={update}
            onChange={(e) => setUpdate(e.target.value)}
            placeholder="e.g. Technician inspected the AC and identified a compressor issue."
            className="w-full p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 resize-none"
          />
        </div>

        <MultiPhotoUpload photos={photos} onChange={setPhotos} folder="maintenance" label="Photos (optional)" disabled={isSubmitting} />

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !update.trim()}
            className="px-5 py-2 rounded-xl bg-brand-red text-white text-xs font-black shadow-md hover:bg-brand-red-dark transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Posting..." : "Post Update"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
