"use client";

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import MultiPhotoUpload from "@/components/Comon/MultiPhotoUpload";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-toastify";

export default function MaintenanceCompleteModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({ update: "", actualCost: "", afterPhotos: [] });

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({ update: "", actualCost: "", afterPhotos: [] });
  }, [isOpen]);

  const hasPhotos = form.afterPhotos && form.afterPhotos.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasPhotos) {
      toast.warning("After picture is required. Please upload at least one photo of the completed work.");
      return;
    }
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
        {/* Required After Photos Upload Section */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-brand-offwhite/80 dark:bg-brand-midnight/60 border border-brand-beige/60 dark:border-brand-dark-grey/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light flex items-center gap-1.5">
              <span>After Photos</span>
              <span className="text-brand-red font-black text-sm">*</span>
              <span className="text-[10px] font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-md">
                Required
              </span>
            </label>
            <span className={`text-[11px] font-mono font-bold ${hasPhotos ? "text-emerald-500" : "text-amber-500"}`}>
              {form.afterPhotos?.length || 0} photo(s) selected
            </span>
          </div>

          <MultiPhotoUpload
            photos={form.afterPhotos}
            onChange={(afterPhotos) => setForm({ ...form, afterPhotos })}
            folder="maintenance"
            label="Upload After Picture(s) *"
            disabled={isSubmitting}
          />

          {!hasPhotos ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 pt-1">
              <FiAlertCircle className="text-xs shrink-0" />
              <span>You must upload at least one after photo showing the finished work before completing.</span>
            </p>
          ) : (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 pt-1">
              <FiCheckCircle className="text-xs shrink-0" />
              <span>{form.afterPhotos.length} after photo(s) ready to verify work completion.</span>
            </p>
          )}
        </div>

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
            disabled={isSubmitting || !hasPhotos}
            className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black shadow-md hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title={!hasPhotos ? "Upload at least one after photo to complete" : "Mark Completed"}
          >
            {isSubmitting ? "Completing..." : "Mark Completed"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
