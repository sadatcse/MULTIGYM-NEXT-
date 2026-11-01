"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle, FiCheck, FiEye, FiEyeOff, FiX } from "react-icons/fi";

// Form pieces shared by the sign-in form and the password-reset steps on
// the login page, so both look and behave the same.

export const EASE = [0.22, 1, 0.36, 1];

// Load sequence: the form's parts arrive in reading order.
export const container = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } };
export const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brand-midnight";

// Quiet text link (forgot password, resend code…).
export const linkCls = `rounded text-[13px] font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-brand-charcoal hover:decoration-brand-gold disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline dark:text-zinc-300 dark:decoration-white/25 dark:hover:text-white dark:disabled:text-white/30 cursor-pointer ${focusRing}`;

const swap = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.18 } };

// Labelled input; the frame turns gold on focus. `icon` is optional.
export function Field({ id, label, icon: Icon, error, inputRef, trailing, below, inputClassName = "", ...input }) {
  return (
    <motion.div variants={item}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <div
        className={`group relative flex items-center rounded-xl border bg-white transition-[border-color,box-shadow] duration-200 dark:bg-brand-charcoal ${
          error
            ? "border-brand-red ring-4 ring-brand-red/10"
            : "border-zinc-300 hover:border-zinc-400 focus-within:!border-brand-gold focus-within:ring-4 focus-within:ring-brand-gold/20 dark:border-white/10 dark:hover:border-white/20"
        }`}
      >
        {Icon && (
          <span aria-hidden className={`pl-4 text-base transition-colors duration-200 ${error ? "text-brand-red" : "text-zinc-400 group-focus-within:text-brand-gold dark:text-white/40"}`}>
            <Icon />
          </span>
        )}
        <input
          id={id}
          ref={inputRef}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`login-input w-full min-w-0 bg-transparent ${Icon ? "px-3" : "px-4"} py-3 text-base text-brand-charcoal outline-none placeholder:text-zinc-400 disabled:opacity-60 sm:text-[15px] dark:text-white dark:placeholder:text-white/30 ${inputClassName}`}
          {...input}
        />
        {trailing}
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 overflow-hidden pt-1.5 text-[13px] font-medium text-brand-red"
          >
            <FiAlertCircle className="shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
      {below}
    </motion.div>
  );
}

export function PasswordToggle({ shown, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      className={`mr-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-brand-charcoal dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white cursor-pointer ${focusRing}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={shown ? "hide" : "show"} initial={{ opacity: 0, rotate: -45, scale: 0.6 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 45, scale: 0.6 }} transition={{ duration: 0.15 }}>
          {shown ? <FiEyeOff /> : <FiEye />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

// Server / form-level error shown above a form.
export function FormError({ message }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key="form-error"
          role="alert"
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 24 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="flex items-start gap-2.5 rounded-xl border border-brand-red/20 bg-brand-red/[0.06] px-3.5 py-3 text-[13px] font-medium text-brand-red-dark dark:bg-brand-red/10 dark:text-red-400">
            <FiAlertCircle className="mt-0.5 shrink-0 text-base" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Full-width primary action. Black on light, gold on dark.
 * status: "idle" → children · "loading" → spinner + busyLabel · "success" → green + tick + doneLabel
 */
export function PrimaryButton({ status = "idle", busyLabel = "Please wait…", doneLabel = "Done", failLabel = "Failed", type = "submit", children, disabled, ...props }) {
  const busy = status === "loading" || status === "success";
  return (
    <motion.button
      {...props}
      type={type}
      disabled={busy || disabled}
      whileTap={busy ? undefined : { scale: 0.985 }}
      aria-live="polite"
      className={`relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-brand-charcoal px-6 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-black disabled:cursor-not-allowed dark:bg-brand-gold dark:text-brand-midnight dark:hover:bg-brand-gold-light cursor-pointer ${focusRing}`}
    >
      <motion.span aria-hidden className="absolute inset-0 bg-[#f3c86e]" initial={false} animate={{ opacity: status === "success" ? 1 : 0 }} transition={{ duration: 0.3 }} />
      <motion.span aria-hidden className="absolute inset-0 bg-red-600" initial={false} animate={{ opacity: status === "error" ? 1 : 0 }} transition={{ duration: 0.25 }} />
      <span className="relative z-10 flex h-5 items-center">
        <AnimatePresence mode="wait" initial={false}>
          {status === "loading" ? (
            <motion.span key="loading" {...swap} className="flex items-center gap-2.5">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> {busyLabel}
            </motion.span>
          ) : status === "success" ? (
            <motion.span key="success" {...swap} className="flex items-center gap-2.5 text-brand-midnight">
              <motion.span
                initial={{ scale: 0, rotate: -120 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 14 }}
                className="grid h-5 w-5 place-items-center rounded-full bg-brand-midnight text-[#f3c86e]"
              >
                <FiCheck className="text-xs" strokeWidth={4} />
              </motion.span>
              {doneLabel}
            </motion.span>
          ) : status === "error" ? (
            <motion.span key="error" {...swap} className="flex items-center gap-2.5 text-white">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-red-600">
                <FiX className="text-xs" strokeWidth={4} />
              </span>
              {failLabel}
            </motion.span>
          ) : (
            <motion.span key="idle" {...swap} className="flex items-center gap-2">
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

export function Checkbox({ checked, onChange, disabled, children }) {
  return (
    <label className="group flex cursor-pointer select-none items-center gap-2.5">
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        className={`grid h-[18px] w-[18px] place-items-center rounded-[5px] border transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold peer-focus-visible:ring-offset-2 ${
          checked
            ? "border-brand-charcoal bg-brand-charcoal text-white dark:border-brand-gold dark:bg-brand-gold dark:text-brand-midnight"
            : "border-zinc-300 bg-white group-hover:border-zinc-400 dark:border-white/20 dark:bg-brand-charcoal"
        }`}
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
          <motion.path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ duration: 0.22 }}
          />
        </svg>
      </span>
      <span className="text-[13px] text-zinc-700 dark:text-zinc-300">{children}</span>
    </label>
  );
}
