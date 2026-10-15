"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiTruck, FiX, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/vendors/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function VendorFormModal({ activeCategories, editingVendor, formData, formErrors, handleCloseModal, handleSubmit, isModalOpen, isSubmitting, setFormData, permissions = FULL_ACCESS }) {
  const allowed = editingVendor ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-white dark:bg-brand-charcoal w-full max-w-5xl rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl overflow-hidden my-6 max-h-[calc(100dvh-2rem)] overflow-y-auto"
            >
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                    <FiTruck className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">{editingVendor ? "Edit Vendor" : "Add New Vendor"}</h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">Company details, contacts, and business information</p>
                  </div>
                </div>
                <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="p-1.5 rounded-xl text-brand-dark-grey hover:text-brand-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
{!allowed && <ReadOnlyNotice />}
                {/* Basic Company Info - 4 Columns in Wide View */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
                      Vendor / Company Name <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Link3 Technologies"
                      className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${formErrors.name ? "border-brand-red focus:ring-brand-red/50" : "border-brand-beige/60 dark:border-brand-dark-grey focus:ring-brand-gold/50"} text-brand-black dark:text-brand-white outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                    {formErrors.name && <p className="text-brand-red text-[11px] mt-1 font-bold">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={formData.category}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Category</option>
                      {activeCategories.map((c) => (
                        <option key={c._id} value={c.title}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Website</label>
                    <input type="text" value={formData.website} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))} placeholder="https://..." className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Tax / VAT Number</label>
                    <input type="text" value={formData.taxVatNumber} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, taxVatNumber: e.target.value }))} placeholder="BIN-123456789" className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60" />
                  </div>
                </div>

                {/* Address Section */}
                <div className="p-4 rounded-2xl bg-brand-offwhite/60 dark:bg-brand-midnight/60 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Address</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input type="text" value={formData.address.addressLine1} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, address: { ...prev.address, addressLine1: e.target.value } }))} placeholder="Address line 1" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.address.addressLine2} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, address: { ...prev.address, addressLine2: e.target.value } }))} placeholder="Address line 2" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.address.area} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, address: { ...prev.address, area: e.target.value } }))} placeholder="Area" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.address.city} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, address: { ...prev.address, city: e.target.value } }))} placeholder="City" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.address.division} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, address: { ...prev.address, division: e.target.value } }))} placeholder="Division" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                </div>

                {/* Contact Person 1 - 4 Columns */}
                <div className="p-4 rounded-2xl bg-brand-offwhite/60 dark:bg-brand-midnight/60 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Contact Person 1</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input type="text" value={formData.contactPerson1.name} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson1: { ...prev.contactPerson1, name: e.target.value } }))} placeholder="Full name" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.contactPerson1.designation} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson1: { ...prev.contactPerson1, designation: e.target.value } }))} placeholder="Designation" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.contactPerson1.phone} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson1: { ...prev.contactPerson1, phone: e.target.value } }))} placeholder="Phone" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="email" value={formData.contactPerson1.email} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson1: { ...prev.contactPerson1, email: e.target.value } }))} placeholder="Email" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                </div>

                {/* Contact Person 2 - 4 Columns */}
                <div className="p-4 rounded-2xl bg-brand-offwhite/60 dark:bg-brand-midnight/60 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Contact Person 2 (Optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input type="text" value={formData.contactPerson2.name} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson2: { ...prev.contactPerson2, name: e.target.value } }))} placeholder="Full name" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.contactPerson2.designation} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson2: { ...prev.contactPerson2, designation: e.target.value } }))} placeholder="Designation" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="text" value={formData.contactPerson2.phone} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson2: { ...prev.contactPerson2, phone: e.target.value } }))} placeholder="Phone" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                    <input type="email" value={formData.contactPerson2.email} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson2: { ...prev.contactPerson2, email: e.target.value } }))} placeholder="Email" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                </div>

                {/* Additional Contacts & Status in 3 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Additional Phone Numbers</label>
                    <input type="text" value={formData.extraPhones} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, extraPhones: e.target.value }))} placeholder="Comma-separated" className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Additional Email Addresses</label>
                    <input type="text" value={formData.extraEmails} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, extraEmails: e.target.value }))} placeholder="Comma-separated" className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1.5">Status</label>
                    <div className="flex items-center gap-4 py-2">
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
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">Notes</label>
                  <textarea rows={2} value={formData.notes} disabled={isSubmitting} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Any additional notes about this vendor..." className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none disabled:opacity-60" />
                </div>

                <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-3">
                  <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2 rounded-2xl text-xs font-bold bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light hover:bg-brand-beige/60 dark:hover:bg-brand-dark-grey transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                    Cancel
                  </button>
                  <button type="submit" hidden={!allowed} disabled={isSubmitting} className="px-6 py-2 rounded-2xl text-xs font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <FiLoader className="text-sm animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingVendor ? "Update Vendor" : "Create Vendor"}</span>
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
