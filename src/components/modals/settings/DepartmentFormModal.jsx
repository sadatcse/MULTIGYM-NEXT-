"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiLayers, FiX, FiInfo, FiHash } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/settings/departments/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function DepartmentFormModal({ editingDept, formData, formError, handleCloseModal, handleSubmit, isModalOpen, isSubmitting, setFormData, permissions = FULL_ACCESS }) {
  const allowed = editingDept ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="dept-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleCloseModal}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl w-full max-w-md overflow-hidden relative max-h-[calc(100dvh-2rem)] overflow-y-auto"
            >
              <div className="h-1.5 bg-gradient-to-r from-brand-red via-brand-gold to-brand-gold-light" />

              {/* Modal Header */}
              <div className="p-5 bg-brand-offwhite dark:bg-brand-midnight border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center justify-between">
                <h3 className="text-base font-bold text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiLayers className="text-brand-gold" />
                  {editingDept ? "Edit Department" : "Add New Department"}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  title={isSubmitting ? "Please wait for the save to finish" : "Close"}
                  className="text-brand-dark-grey hover:text-brand-black dark:hover:text-white p-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-brand-dark-grey"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 space-y-4">
{!allowed && <ReadOnlyNotice />}
                <AnimatePresence>
                  {formError && (
                    <motion.div
                      key="form-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-3 bg-brand-red/10 border border-brand-red/30 rounded-2xl text-xs font-bold text-brand-red flex items-center gap-2 overflow-hidden"
                    >
                      <FiInfo className="text-base shrink-0" />
                      <span>{formError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Department Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5">
                    Department Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Fitness & Training"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5 flex items-center gap-1">
                    <FiHash className="text-brand-gold" /> Display Order <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={isSubmitting}
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Status Radio */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5">
                    Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-black dark:text-brand-white">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        disabled={isSubmitting}
                        checked={formData.status === "active"}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="accent-brand-red"
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-black dark:text-brand-white">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        disabled={isSubmitting}
                        checked={formData.status === "inactive"}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="accent-brand-red"
                      />
                      Inactive
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-beige/50 dark:border-brand-dark-grey/50">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-beige/40 dark:hover:bg-brand-dark-grey transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit" hidden={!allowed}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/25 scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingDept ? "Update Department" : "Create Department"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
