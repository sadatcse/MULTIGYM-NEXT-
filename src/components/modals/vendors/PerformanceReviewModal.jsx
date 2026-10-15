"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/vendors/[id]/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function PerformanceReviewModal({ RatingInput, TextAreaField, formData, handleSubmit, isModalOpen, isSubmitting, setFormData, setIsModalOpen, permissions = FULL_ACCESS }) {
  const allowed = permissions.canAdd || permissions.canEdit;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">Add Performance Review</h3>
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 space-y-4 text-xs">
{!allowed && <ReadOnlyNotice />}
                <div className="grid grid-cols-2 gap-4">
                  <RatingInput label="Service Quality" value={formData.serviceQuality} onChange={(v) => setFormData((f) => ({ ...f, serviceQuality: v }))} />
                  <RatingInput label="Response Time" value={formData.responseTime} onChange={(v) => setFormData((f) => ({ ...f, responseTime: v }))} />
                  <RatingInput label="Product Quality" value={formData.productQuality} onChange={(v) => setFormData((f) => ({ ...f, productQuality: v }))} />
                  <RatingInput label="Pricing" value={formData.pricing} onChange={(v) => setFormData((f) => ({ ...f, pricing: v }))} />
                  <RatingInput label="Reliability" value={formData.reliability} onChange={(v) => setFormData((f) => ({ ...f, reliability: v }))} />
                </div>
                <TextAreaField label="Remarks" value={formData.remarks} onChange={(v) => setFormData((f) => ({ ...f, remarks: v }))} />

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="submit" hidden={!allowed} disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : "Save Review"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
