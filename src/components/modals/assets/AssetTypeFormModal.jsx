"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiBox, FiX, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/assets/types/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function AssetTypeFormModal({ CATEGORIES, editingType, formData, formErrors, handleCloseModal, handleSubmit, isModalOpen, isSubmitting, setFormData, permissions = FULL_ACCESS }) {
  const allowed = editingType ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ duration: 0.2 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden my-8 max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                    <FiBox className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">{editingType ? "Edit Asset Type" : "Add New Asset Type"}</h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">Configure category, tracking method, and status</p>
                  </div>
                </div>
                <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40">
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
{!allowed && <ReadOnlyNotice />}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Asset Type Name <span className="text-brand-red">*</span>
                  </label>
                  <input type="text" value={formData.name} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. T-Shirt, Laptop, ID Card" className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${formErrors.name ? "border-brand-red focus:ring-brand-red/50" : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"} text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60`} />
                  {formErrors.name && <p className="text-brand-red text-[11px] mt-1 font-bold">{formErrors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Category</label>
                    <select value={formData.category} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer">
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Display Order *</label>
                    <input type="number" min={1} value={formData.order} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))} className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${formErrors.order ? "border-brand-red" : "border-brand-beige/60 dark:border-brand-dark-grey"} text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50`} />
                    {formErrors.order && <p className="text-brand-red text-[11px] mt-1 font-bold">{formErrors.order}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Tracking Type</label>
                    <select value={formData.trackingType} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, trackingType: e.target.value }))} className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer">
                      <option value="inventory">Inventory (quantity-tracked, e.g. T-Shirts)</option>
                      <option value="individual">Individual (serialized, e.g. Laptop)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Replacement Interval (months)</label>
                    <input type="number" min={1} value={formData.replacementIntervalMonths} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, replacementIntervalMonths: e.target.value }))} placeholder="Optional" className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-2">
                  <span className="block text-[10px] font-black uppercase text-brand-gold">Asset Requirements & Configuration</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-brand-black dark:text-brand-white">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.requiresSize} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, requiresSize: e.target.checked }))} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                      <span>Requires Size (e.g. S, M, L)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.requiresSerialNumber} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, requiresSerialNumber: e.target.checked }))} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                      <span>Requires Serial Number</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.requiresBranch} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, requiresBranch: e.target.checked }))} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                      <span>Requires Branch</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.requiresDepartment} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, requiresDepartment: e.target.checked }))} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                      <span>Requires Department</span>
                    </label>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.returnable} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, returnable: e.target.checked }))} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                  <span className="text-xs font-bold text-brand-black dark:text-brand-white">Returnable (uncheck for one-time issue items that are never given back)</span>
                </label>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Description</label>
                  <textarea rows={2} value={formData.description} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">Status</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" value="active" checked={formData.status === "active"} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                      <span className="text-xs font-bold text-emerald-500">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" value="inactive" checked={formData.status === "inactive"} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))} className="w-4 h-4 accent-rose-500 cursor-pointer" />
                      <span className="text-xs font-bold text-rose-500">Inactive</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2 rounded-2xl text-xs font-bold bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light hover:bg-brand-beige/60 dark:hover:bg-brand-dark-grey transition-colors cursor-pointer disabled:opacity-40">
                    Cancel
                  </button>
                  <button type="submit" hidden={!allowed} disabled={isSubmitting} className="px-6 py-2 rounded-2xl text-xs font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <FiLoader className="text-sm animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingType ? "Update Asset Type" : "Create Asset Type"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
