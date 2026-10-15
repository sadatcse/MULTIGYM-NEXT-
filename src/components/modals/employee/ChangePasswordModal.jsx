"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiKey, FiX, FiAlertTriangle } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/employee/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function ChangePasswordModal({ handleChangePasswordSubmit, isChangePasswordModalOpen, isChangingPassword, passwordEmployee, passwordError, passwordForm, setIsChangePasswordModalOpen, setPasswordForm, permissions = FULL_ACCESS }) {
  const allowed = permissions.canAdd || permissions.canEdit;
  return (
    <>
<AnimatePresence>
        {isChangePasswordModalOpen && passwordEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey overflow-hidden shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto"
            >
              <div className="p-6 bg-brand-offwhite dark:bg-brand-midnight border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg font-bold">
                    <FiKey />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      Change Password
                    </h3>
                    <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                      {passwordEmployee.name} ({passwordEmployee.email})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-brand-white dark:bg-brand-charcoal hover:bg-brand-red hover:text-white flex items-center justify-center text-brand-dark-grey transition-all cursor-pointer"
                >
                  <FiX className="text-base" />
                </button>
              </div>

              <form onSubmit={allowed ? handleChangePasswordSubmit : (e) => e.preventDefault()} className="p-6 space-y-4">
{!allowed && <ReadOnlyNotice />}
                {passwordError && (
                  <div className="p-3 rounded-xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold flex items-center gap-2">
                    <FiAlertTriangle />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-offwhite dark:hover:bg-brand-midnight transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" hidden={!allowed}
                    disabled={isChangingPassword}
                    className="px-6 py-2.5 rounded-2xl bg-brand-gold hover:bg-brand-gold-light text-brand-midnight font-black text-xs transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {isChangingPassword ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
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
