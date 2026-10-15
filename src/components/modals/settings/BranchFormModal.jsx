"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiMapPin, FiX, FiInfo, FiHash, FiPhone, FiGlobe, FiClock } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/settings/branches/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function BranchFormModal({ WEEKDAYS, editingBranch, formData, formError, handleCloseModal, handleSubmit, isModalOpen, isSubmitting, setFormData, permissions = FULL_ACCESS }) {
  const allowed = editingBranch ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="branch-modal-backdrop"
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
              className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative"
            >
              <div className="h-1.5 bg-gradient-to-r from-brand-red via-brand-gold to-brand-gold-light shrink-0" />

              {/* Modal Header */}
              <div className="p-5 bg-brand-offwhite dark:bg-brand-midnight border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center justify-between shrink-0">
                <h3 className="text-base font-bold text-brand-black dark:text-brand-white flex items-center gap-2">
                  <FiMapPin className="text-brand-gold" />
                  {editingBranch ? "Edit Branch Location" : "Add New Branch Location"}
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
              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
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

                {/* Branch Name & Order Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5">
                      Branch Name <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Power Fit — Adabor"
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5 flex items-center gap-1">
                      <FiHash className="text-brand-gold" /> Order <span className="text-brand-red">*</span>
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
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5 flex items-center gap-1">
                    <FiMapPin className="text-brand-gold" /> Full Address <span className="text-brand-red">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    disabled={isSubmitting}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 5th & 6th Floors, 48/49 Jonota Cooperative Housing Society..."
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                  />
                </div>

                {/* Phone & Website Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5 flex items-center gap-1">
                      <FiPhone className="text-brand-gold" /> Phone Number <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. (+880) 1313-197426"
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-1.5 flex items-center gap-1">
                      <FiGlobe className="text-brand-gold" /> Website URL
                    </label>
                    <input
                      type="text"
                      disabled={isSubmitting}
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="e.g. https://powerfitbd.com"
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* OPERATING HOURS & DYNAMIC DAY-BY-DAY SCHEDULE */}
                <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase text-brand-gold tracking-wider flex items-center gap-1.5">
                      <FiClock className="text-emerald-500" /> Branch Operating Hours & Schedule
                    </h4>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        const open = formData.openingTime || "";
                        const close = formData.closingTime || "";
                        const updated = {};
                        WEEKDAYS.forEach((d) => {
                          updated[d.key] = { open, close, isClosed: false };
                        });
                        setFormData({
                          ...formData,
                          operatingHours: updated,
                        });
                      }}
                      className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white px-2.5 py-1 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500/10 disabled:hover:text-emerald-500"
                    >
                      Apply Open/Close Time to All Days
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                        Opening Time
                      </label>
                      <input
                        type="time"
                        disabled={isSubmitting}
                        value={formData.openingTime}
                        onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                        Closing Time
                      </label>
                      <input
                        type="time"
                        disabled={isSubmitting}
                        value={formData.closingTime}
                        onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Day-by-Day Dynamic Schedule */}
                  <div className="space-y-2 pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                      Custom Day-By-Day Schedule:
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {WEEKDAYS.map((day) => {
                        const dayConfig = formData.operatingHours?.[day.key] || {
                          open: "",
                          close: "",
                          isClosed: false,
                        };

                        return (
                          <div
                            key={day.key}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs"
                          >
                            <span className="font-extrabold w-24 text-brand-black dark:text-brand-white shrink-0">
                              {day.label}
                            </span>

                            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                disabled={isSubmitting}
                                checked={dayConfig.isClosed}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    operatingHours: {
                                      ...formData.operatingHours,
                                      [day.key]: {
                                        ...dayConfig,
                                        isClosed: e.target.checked,
                                      },
                                    },
                                  });
                                }}
                                className="w-3.5 h-3.5 accent-brand-red rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                              />
                              <span className={`text-[10px] font-bold uppercase ${dayConfig.isClosed ? "text-brand-red font-black" : "text-emerald-500"}`}>
                                {dayConfig.isClosed ? "Closed" : "Open"}
                              </span>
                            </label>

                            {!dayConfig.isClosed && (
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="time"
                                  disabled={isSubmitting}
                                  value={dayConfig.open}
                                  onChange={(e) => {
                                    setFormData({
                                      ...formData,
                                      operatingHours: {
                                        ...formData.operatingHours,
                                        [day.key]: {
                                          ...dayConfig,
                                          open: e.target.value,
                                        },
                                      },
                                    });
                                  }}
                                  className="px-2 py-1 rounded-lg bg-brand-offwhite dark:bg-brand-midnight text-[11px] font-bold border border-brand-beige dark:border-brand-dark-grey text-brand-black dark:text-brand-white disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                                <span className="text-brand-dark-grey">-</span>
                                <input
                                  type="time"
                                  disabled={isSubmitting}
                                  value={dayConfig.close}
                                  onChange={(e) => {
                                    setFormData({
                                      ...formData,
                                      operatingHours: {
                                        ...formData.operatingHours,
                                        [day.key]: {
                                          ...dayConfig,
                                          close: e.target.value,
                                        },
                                      },
                                    });
                                  }}
                                  className="px-2 py-1 rounded-lg bg-brand-offwhite dark:bg-brand-midnight text-[11px] font-bold border border-brand-beige dark:border-brand-dark-grey text-brand-black dark:text-brand-white disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
                      <span>{editingBranch ? "Update Branch" : "Create Branch"}</span>
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
