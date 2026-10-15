"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/vendors/[id]/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function PurchaseRepaymentModal({ Field, SelectField, TextAreaField, currencySymbol, handleSubmitPayment, isPaying, paymentForm, paymentTarget, setPaymentForm, setPaymentTarget, permissions = FULL_ACCESS }) {
  const allowed = permissions.canAdd || permissions.canEdit;
  return (
    <>
<AnimatePresence>
        {paymentTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-8 border border-brand-beige/60 dark:border-brand-dark-grey/60 max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-brand-black dark:text-brand-white">Record Repayment / Installment</h3>
                  <p className="text-[11px] text-brand-dark-grey font-medium">Record installment payment against remaining balance due.</p>
                </div>
                <button onClick={() => setPaymentTarget(null)} disabled={isPaying} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={allowed ? handleSubmitPayment : (e) => e.preventDefault()} className="p-6 space-y-3.5 text-xs">
{!allowed && <ReadOnlyNotice />}
                <div className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-dark-grey font-medium">Total Order Amount:</span>
                    <span className="font-bold text-brand-black dark:text-brand-white">{currencySymbol}{paymentTarget.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-dark-grey font-medium">Paid So Far:</span>
                    <span className="font-bold text-emerald-500">{currencySymbol}{paymentTarget.amountPaid?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
                    <span className="font-bold text-brand-black dark:text-brand-white">Current Balance Due:</span>
                    <span className="font-black text-brand-red">{currencySymbol}{paymentTarget.amountDue?.toLocaleString()}</span>
                  </div>
                </div>

                <Field type="number" label="Repayment Amount *" value={paymentForm.amount} onChange={(v) => setPaymentForm((f) => ({ ...f, amount: v }))} placeholder={`Max ${paymentTarget.amountDue}`} />
                <Field type="date" label="Payment Date" value={paymentForm.paymentDate} onChange={(v) => setPaymentForm((f) => ({ ...f, paymentDate: v }))} />
                <SelectField label="Payment Method" value={paymentForm.method} onChange={(v) => setPaymentForm((f) => ({ ...f, method: v }))} options={["cash", "bank-transfer", "cheque", "mobile-banking", "card", "other"]} />
                <Field label="Payment Reference / Txn ID" value={paymentForm.reference} onChange={(v) => setPaymentForm((f) => ({ ...f, reference: v }))} placeholder="e.g. Txn ID / cheque no." />
                <TextAreaField label="Payment Note" value={paymentForm.note} onChange={(v) => setPaymentForm((f) => ({ ...f, note: v }))} />

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setPaymentTarget(null)} disabled={isPaying} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="submit" hidden={!allowed} disabled={isPaying} className="px-6 py-2 rounded-2xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md shadow-emerald-500/20">
                    {isPaying ? <FiLoader className="animate-spin" /> : "Save Repayment"}
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
