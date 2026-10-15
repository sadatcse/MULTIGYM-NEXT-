"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/vendors/[id]/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function ServiceRecordFormModal({ Field, SelectField, TextAreaField, currencySymbol, editTarget, formData, handleSubmit, isModalOpen, isSubmitting, setFormData, setIsModalOpen, permissions = FULL_ACCESS }) {
  const allowed = permissions.canAdd || permissions.canEdit;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-6 border border-brand-beige/60 dark:border-brand-dark-grey/60 max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">{editTarget ? "Edit Service Record" : "Add Service Record"}</h3>
                  <p className="text-[11px] text-brand-dark-grey font-medium">Record maintenance, repairs, or servicing bills for this vendor.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
{!allowed && <ReadOnlyNotice />}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Service Type" value={formData.serviceType} onChange={(v) => setFormData((f) => ({ ...f, serviceType: v }))} placeholder="e.g. AC Servicing / Treadmill Repair" />
                  <Field type="date" label="Service Date" value={formData.serviceDate} onChange={(v) => setFormData((f) => ({ ...f, serviceDate: v }))} />
                  <Field label="Assigned Technician" value={formData.assignedTechnician} onChange={(v) => setFormData((f) => ({ ...f, assignedTechnician: v }))} placeholder="e.g. Eng. Rahat" />
                  <Field label="Service Request Ref" value={formData.serviceRequestRef} onChange={(v) => setFormData((f) => ({ ...f, serviceRequestRef: v }))} placeholder="e.g. SR-2026-99" />
                  <SelectField label="Completion Status" value={formData.completionStatus} onChange={(v) => setFormData((f) => ({ ...f, completionStatus: v }))} options={["scheduled", "in-progress", "completed", "cancelled"]} />
                  <Field type="number" label="Service Bill Cost" value={formData.serviceCost} onChange={(v) => setFormData((f) => ({ ...f, serviceCost: v }))} placeholder="0.00" />
                  <Field type="date" label="Payment Due Date" value={formData.dueDate} onChange={(v) => setFormData((f) => ({ ...f, dueDate: v }))} />
                  <Field type="date" label="Next Service Date" value={formData.nextServiceDate} onChange={(v) => setFormData((f) => ({ ...f, nextServiceDate: v }))} />
                </div>

                <TextAreaField label="Description" value={formData.description} onChange={(v) => setFormData((f) => ({ ...f, description: v }))} />

                {/* Upfront Payment & Status Section for Service */}
                {!editTarget && (
                  <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">
                        Service Payment Status & Upfront Payment
                      </h4>
                      <span className="text-[10px] text-brand-dark-grey">
                        Set payment status for this service bill
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                          Payment Status *
                        </label>
                        <select
                          value={formData.paymentOption}
                          onChange={(e) => {
                            const opt = e.target.value;
                            const costNum = Number(formData.serviceCost || 0);
                            setFormData((f) => ({
                              ...f,
                              paymentOption: opt,
                              initialPaymentAmount: opt === "paid" ? costNum : opt === "pending" ? "" : f.initialPaymentAmount,
                            }));
                          }}
                          className="w-full bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey rounded-xl px-3 py-2 text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                        >
                          <option value="pending">Due / Unpaid (0% Upfront)</option>
                          <option value="partial">Partial Paid (Installment)</option>
                          <option value="paid">Full Paid (100% Upfront)</option>
                        </select>
                      </div>

                      {formData.paymentOption === "partial" && (
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                            Upfront Paid Amount ({currencySymbol}) *
                          </label>
                          <input
                            type="number"
                            value={formData.initialPaymentAmount}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                initialPaymentAmount: e.target.value,
                              }))
                            }
                            placeholder={`Max ${Number(formData.serviceCost || 0)}`}
                            className="w-full bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey rounded-xl px-3 py-2 text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>
                      )}

                      {formData.paymentOption !== "pending" && (
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                            Payment Method
                          </label>
                          <select
                            value={formData.initialPaymentMethod}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                initialPaymentMethod: e.target.value,
                              }))
                            }
                            className="w-full bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey rounded-xl px-3 py-2 text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                          >
                            <option value="cash">Cash</option>
                            <option value="bank-transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="mobile-banking">Mobile Banking (bKash/Nagad)</option>
                            <option value="card">Credit / Debit Card</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Calculated Balance Preview */}
                    {Boolean(formData.serviceCost) && (
                      <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
                        <div>
                          Upfront Paid: <span className="text-emerald-500 font-black">{currencySymbol}{(formData.paymentOption === "paid" ? Number(formData.serviceCost || 0) : formData.paymentOption === "partial" ? Number(formData.initialPaymentAmount || 0) : 0).toLocaleString()}</span>
                        </div>
                        <div>
                          Remaining Due: <span className="text-brand-red font-black">{currencySymbol}{Math.max(Number(formData.serviceCost || 0) - (formData.paymentOption === "paid" ? Number(formData.serviceCost || 0) : formData.paymentOption === "partial" ? Number(formData.initialPaymentAmount || 0) : 0), 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <TextAreaField label="Remarks" value={formData.remarks} onChange={(v) => setFormData((f) => ({ ...f, remarks: v }))} />

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="submit" hidden={!allowed} disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : editTarget ? "Save Changes" : "Save Service Record"}
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
