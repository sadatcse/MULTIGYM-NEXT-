"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiBriefcase, FiX, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/settings/job-positions/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function JobPositionFormModal({ departments, editingPosition, formData, formErrors, handleCloseModal, handleSubmit, isModalOpen, isSubmitting, setFormData, permissions = FULL_ACCESS }) {
  const allowed = editingPosition ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden max-h-[calc(100dvh-2rem)] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                    <FiBriefcase className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {editingPosition ? "Edit Job Position" : "Add New Job Position"}
                    </h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">
                      Configure title, department, display order, and status
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  title={isSubmitting ? "Please wait for the save to finish" : "Close"}
                  className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-brand-dark-grey"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 space-y-4">
{!allowed && <ReadOnlyNotice />}
                {/* Title */}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Job Position Title <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    disabled={isSubmitting}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g. Senior Personal Trainer"
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${
                      formErrors.title
                        ? "border-brand-red focus:ring-brand-red/50"
                        : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"
                    } text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                  {formErrors.title && (
                    <p className="text-brand-red text-[11px] mt-1 font-bold">
                      {formErrors.title}
                    </p>
                  )}
                </div>

                {/* Grid: Order & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Display Order */}
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Display Order <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.order}
                      disabled={isSubmitting}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, order: e.target.value }))
                      }
                      placeholder="e.g. 1"
                      className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${
                        formErrors.order
                          ? "border-brand-red focus:ring-brand-red/50"
                          : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"
                      } text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                    {formErrors.order && (
                      <p className="text-brand-red text-[11px] mt-1 font-bold">
                        {formErrors.order}
                      </p>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      disabled={isSubmitting}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, department: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    disabled={isSubmitting}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief summary of duties and responsibilities..."
                    className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === "active"}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="w-4 h-4 accent-emerald-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-emerald-500">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={formData.status === "inactive"}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="w-4 h-4 accent-rose-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-rose-500">Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-2xl text-xs font-bold bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light hover:bg-brand-beige/60 dark:hover:bg-brand-dark-grey transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" hidden={!allowed}
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-2xl text-xs font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader className="text-sm animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingPosition ? "Update Position" : "Create Position"}</span>
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
