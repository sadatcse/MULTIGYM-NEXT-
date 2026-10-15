"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiPlus, FiTrash2, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/vendors/[id]/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function PurchaseOrderFormModal({ DynamicSelectField, Field, TextAreaField, addItemRow, branchOptions, categoryOptions, currencySymbol, departmentOptions, editTarget, formData, grandTotal, handleSubmit, isModalOpen, isSubmitting, removeItemRow, setFormData, setIsModalOpen, updateItem, updateItemWarranty, permissions = FULL_ACCESS }) {
  const allowed = permissions.canAdd || permissions.canEdit;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden my-6 border border-brand-beige/60 dark:border-brand-dark-grey/60 max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">{editTarget ? "Edit Purchase Order" : "Add Purchase Order"}</h3>
                  <p className="text-[11px] text-brand-dark-grey font-medium">Buy one or multiple products in a single order — payment is recorded separately as a ledger.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
{!allowed && <ReadOnlyNotice />}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <Field type="date" label="Purchase Date" value={formData.purchaseDate} onChange={(v) => setFormData((f) => ({ ...f, purchaseDate: v }))} />
                  <Field label="Invoice Number" value={formData.invoiceNumber} onChange={(v) => setFormData((f) => ({ ...f, invoiceNumber: v }))} placeholder="e.g. INV-2026-001" />
                  <Field label="Purchase Order #" value={formData.purchaseOrderNumber} onChange={(v) => setFormData((f) => ({ ...f, purchaseOrderNumber: v }))} placeholder="e.g. PO-8821" />
                  <DynamicSelectField label="Department" value={formData.department} onChange={(v) => setFormData((f) => ({ ...f, department: v }))} options={departmentOptions} placeholder="Select Department" />
                  <DynamicSelectField label="Location / Branch" value={formData.location} onChange={(v) => setFormData((f) => ({ ...f, location: v }))} options={branchOptions} placeholder="Select Location / Branch" />
                  <Field type="date" label="Payment Due Date" value={formData.dueDate} onChange={(v) => setFormData((f) => ({ ...f, dueDate: v }))} />
                </div>

                <TextAreaField label="Order Notes" value={formData.description} onChange={(v) => setFormData((f) => ({ ...f, description: v }))} />

                <div className="pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Product Items</h4>
                    <button type="button" onClick={addItemRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white cursor-pointer">
                      <FiPlus className="text-xs" /> Add Product
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-4 rounded-2xl bg-brand-offwhite/60 dark:bg-brand-midnight/60 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey">Item {index + 1}</span>
                          {formData.items.length > 1 && (
                            <button type="button" onClick={() => removeItemRow(index)} className="p-1 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer">
                              <FiTrash2 className="text-xs" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <Field label="Product Name *" value={item.productName} onChange={(v) => updateItem(index, "productName", v)} placeholder="e.g. Commercial Treadmill T80" />
                          <DynamicSelectField label="Product Category" value={item.productCategory} onChange={(v) => updateItem(index, "productCategory", v)} options={categoryOptions} placeholder="Select Product Category" />
                          <Field type="number" label="Quantity" value={item.quantity} onChange={(v) => updateItem(index, "quantity", v)} />
                          <Field type="number" label="Unit Price *" value={item.unitPrice} onChange={(v) => updateItem(index, "unitPrice", v)} placeholder="0.00" />
                        </div>
                        {Boolean(item.unitPrice) && (
                          <p className="text-[11px] font-bold text-brand-gold">Line total: {currencySymbol}{(Number(item.quantity || 1) * Number(item.unitPrice || 0)).toLocaleString()}</p>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={item.warranty.available} onChange={(e) => updateItemWarranty(index, "available", e.target.checked)} className="w-4 h-4 accent-brand-red cursor-pointer" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold">Warranty Available</span>
                        </label>
                        {item.warranty.available && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <Field type="date" label="Warranty Start" value={item.warranty.startDate} onChange={(v) => updateItemWarranty(index, "startDate", v)} />
                            <Field type="date" label="Warranty End" value={item.warranty.endDate} onChange={(v) => updateItemWarranty(index, "endDate", v)} />
                            <Field label="Serial Number" value={item.warranty.serialNumber} onChange={(v) => updateItemWarranty(index, "serialNumber", v)} placeholder="e.g. SN-998822" />
                            <Field label="Asset ID" value={item.warranty.assetId} onChange={(v) => updateItemWarranty(index, "assetId", v)} placeholder="e.g. AST-0012" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Status & Initial Repayment Options */}
                {!editTarget && (
                  <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">
                        Payment Status & Upfront Payment
                      </h4>
                      <span className="text-[10px] text-brand-dark-grey">
                        Set upfront payment status for this purchase order
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">
                          Payment Status *
                        </label>
                        <select
                          value={formData.paymentOption}
                          onChange={(e) => {
                            const opt = e.target.value;
                            setFormData((f) => ({
                              ...f,
                              paymentOption: opt,
                              initialPaymentAmount: opt === "paid" ? grandTotal : opt === "pending" ? "" : f.initialPaymentAmount,
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
                            placeholder={`Max ${grandTotal}`}
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
                    <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
                      <div>
                        Upfront Paid: <span className="text-emerald-500 font-black">{currencySymbol}{(formData.paymentOption === "paid" ? grandTotal : formData.paymentOption === "partial" ? Number(formData.initialPaymentAmount || 0) : 0).toLocaleString()}</span>
                      </div>
                      <div>
                        Remaining Balance Due: <span className="text-brand-red font-black">{currencySymbol}{Math.max(grandTotal - (formData.paymentOption === "paid" ? grandTotal : formData.paymentOption === "partial" ? Number(formData.initialPaymentAmount || 0) : 0), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-black dark:text-brand-white">Grand Total ({formData.items.length} item{formData.items.length !== 1 ? "s" : ""})</span>
                  <span className="text-base font-black text-brand-gold">{currencySymbol}{grandTotal.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="submit" hidden={!allowed} disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white hover:bg-brand-red-dark shadow-md shadow-brand-red/20 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : editTarget ? "Save Changes" : "Save Purchase Order"}
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
