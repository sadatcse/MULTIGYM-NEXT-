"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/assets/[id]/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function ReturnAssetModal({ handleReturnSubmit, isReturning, returnForm, returnTarget, setReturnForm, setReturnTarget, permissions = FULL_ACCESS }) {
  const allowed = permissions.canAdd || permissions.canEdit;
  return (
    <>
<AnimatePresence>
        {returnTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">Return Asset</h3>
                <button onClick={() => setReturnTarget(null)} disabled={isReturning} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={allowed ? handleReturnSubmit : (e) => e.preventDefault()} className="p-6 space-y-4 text-xs">
{!allowed && <ReadOnlyNotice />}
                <p className="text-brand-dark-grey">Returning from <span className="font-bold text-brand-black dark:text-brand-white">{returnTarget.employeeName || returnTarget.employee?.name}</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Return Quantity</label>
                    <input type="number" min={1} max={returnTarget.quantityPending || returnTarget.quantity} value={returnForm.returnQuantity} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, returnQuantity: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Return Date</label>
                    <input type="date" value={returnForm.returnDate} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, returnDate: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Damage / Loss Assessment</label>
                  <select value={returnForm.damageOrLoss} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, damageOrLoss: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer">
                    <option value="none">None (Returned in Good Condition)</option>
                    <option value="damaged">Damaged (Requires Repair / Write-off)</option>
                    <option value="lost">Lost Item</option>
                    <option value="repair">Send for Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Returned To</label>
                  <input type="text" value={returnForm.returnedTo} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, returnedTo: e.target.value }))} placeholder="Admin name" className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey mb-1">Remarks</label>
                  <textarea rows={2} value={returnForm.returnNotes} disabled={isReturning} onChange={(e) => setReturnForm((f) => ({ ...f, returnNotes: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none" />
                </div>
                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setReturnTarget(null)} disabled={isReturning} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <button type="submit" hidden={!allowed} disabled={isReturning} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isReturning ? <FiLoader className="animate-spin" /> : "Confirm Return"}
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
