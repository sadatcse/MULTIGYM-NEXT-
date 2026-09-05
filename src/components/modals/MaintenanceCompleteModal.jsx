"use client";

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import MultiPhotoUpload from "@/components/Comon/MultiPhotoUpload";
import { FiCheckCircle } from "react-icons/fi";

export default function MaintenanceCompleteModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({ update: "", actualCost: "", afterPhotos: [] });

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({ update: "", actualCost: "", afterPhotos: [] });
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      update: form.update.trim() || undefined,
      actualCost: form.actualCost !== "" ? Number(form.actualCost) : undefined,
      afterPhotos: form.afterPhotos,
    });
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
          <FiCheckCircle className="text-emerald-500" />
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white">Complete Maintenance</h3>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
            Final Work Update
          </label>
          <textarea
            rows={3}
            disabled={isSubmitting}
            value={form.update}
            onChange={(e) => setForm({ ...form, update: e.target.value })}
            placeholder="e.g. Compressor replaced and AC tested successfully."
            className="w-full p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
            Actual Cost
          </label>
          <input
            type="number"
            min="0"
            disabled={isSubmitting}
            value={form.actualCost}
            onChange={(e) => setForm({ ...form, actualCost: e.target.value })}
            placeholder="৳0"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60"
          />
        </div>

        <MultiPhotoUpload photos={form.afterPhotos} onChange={(afterPhotos) => setForm({ ...form, afterPhotos })} folder="maintenance" label="After Photos" disabled={isSubmitting} />

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
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black shadow-md hover:bg-emerald-600 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Completing..." : "Mark Completed"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
