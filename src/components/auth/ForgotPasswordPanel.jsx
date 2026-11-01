"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { axiosPublic } from "@/hooks/useAxiosPublic";
import { EASE, Field, FormError, PasswordToggle, PrimaryButton, focusRing, linkCls } from "./AuthFields";

// Forgot password, shown in place of the sign-in form:
// email → 6-digit code from the email → new password → done.
// Uses /employee/forgot-password, /verify-reset-code and /reset-password.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEPS = [
  { key: "email", label: "Email" },
  { key: "code", label: "Code" },
  { key: "password", label: "New password" },
];

const apiError = (e) => {
  const m = e?.response?.data?.message;
  if (m) return Array.isArray(m) ? m.join(", ") : m;
  if (!e?.response) return "Can't reach the server. Check your internet connection and try again.";
  return "Something went wrong. Please try again.";
};

function Requirement({ ok, children }) {
  return (
    <li className={`flex items-center gap-2 transition-colors duration-200 ${ok ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}>
      <motion.span
        className={`grid h-4 w-4 place-items-center rounded-full border transition-colors duration-200 ${ok ? "border-emerald-500 bg-emerald-500 text-white" : "border-current"}`}
        animate={{ scale: ok ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        {ok && <FiCheck className="text-[10px]" strokeWidth={4} />}
      </motion.span>
      {children}
    </li>
  );
}

/** onBack(email?) — return to sign-in; gets the email once the password was changed. */
export default function ForgotPasswordPanel({ initialEmail = "", onBack }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [expires, setExpires] = useState(10);
  const [cooldown, setCooldown] = useState(0);
  const shake = useAnimationControls();

  const cleanEmail = email.trim().toLowerCase();
  const stepIndex = { email: 0, code: 1, password: 2, done: 3 }[step];

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Esc goes back to sign-in.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onBack();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onBack]);

  const shakeIt = () => {
    if (!reduce) shake.start({ x: [0, -10, 10, -6, 6, -3, 3, 0], transition: { duration: 0.4 } });
  };
  const invalid = (errs) => {
    setFieldErrors(errs);
    setError("");
    shakeIt();
  };
  const clearField = (key) => {
    if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: undefined }));
    if (error) setError("");
  };
  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(apiError(e));
      shakeIt();
    } finally {
      setBusy(false);
    }
  };
  const goTo = (next) => {
    setFieldErrors({});
    setError("");
    setStep(next);
  };

  const sendCode = async (e) => {
    e?.preventDefault();
    if (!EMAIL_RE.test(cleanEmail)) return invalid({ email: "Enter a valid email address." });
    await run(async () => {
      const res = await axiosPublic.post("/employee/forgot-password", { email: cleanEmail });
      setExpires(res.data?.expiresInMinutes || 10);
      setCode("");
      setCooldown(60);
      goTo("code");
    });
  };

  const verify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return invalid({ code: "Enter the 6-digit code from the email." });
    await run(async () => {
      await axiosPublic.post("/employee/verify-reset-code", { email: cleanEmail, code });
      goTo("password");
    });
  };

  const reset = async (e) => {
    e.preventDefault();
    const errs = {};
    if (password.length < 6) errs.password = "Use at least 6 characters.";
    if (password !== confirm) errs.confirm = "Passwords don't match.";
    if (Object.keys(errs).length) return invalid(errs);
    await run(async () => {
      await axiosPublic.post("/employee/reset-password", { email: cleanEmail, code, newPassword: password });
      goTo("done");
    });
  };

  const copy = {
    email: { title: "Reset your password", text: "Enter the email address you sign in with. We'll email you a 6-digit code." },
    code: { title: "Check your email", text: `If an account exists for ${cleanEmail}, we've sent it a 6-digit code. The code expires in ${expires} minutes.` },
    password: { title: "Choose a new password", text: "Use at least 6 characters. You'll sign in with it from now on." },
    done: { title: "Password updated", text: "Your password has been changed. Sign in with your new password." },
  }[step];

  return (
    <div>
      <button
        type="button"
        onClick={() => onBack(step === "done" ? cleanEmail : undefined)}
        disabled={busy}
        className={`mb-8 inline-flex items-center gap-2 rounded text-[13px] font-medium text-zinc-600 transition-colors hover:text-brand-charcoal disabled:opacity-50 dark:text-zinc-400 dark:hover:text-white cursor-pointer ${focusRing}`}
      >
        <FiArrowLeft /> Back to sign in
      </button>

      {step !== "done" && (
        <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Reset password steps">
          {STEPS.map((s, i) => (
            <li key={s.key} aria-current={i === stepIndex ? "step" : undefined} className="space-y-2">
              <span className="block h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                <motion.span className="block h-full rounded-full bg-brand-gold" initial={false} animate={{ width: i <= stepIndex ? "100%" : "0%" }} transition={{ duration: 0.45, ease: EASE }} />
              </span>
              <span className={`block text-[12px] font-medium transition-colors ${i <= stepIndex ? "text-brand-charcoal dark:text-white" : "text-zinc-400 dark:text-white/35"}`}>
                {i + 1}. {s.label}
              </span>
            </li>
          ))}
        </ol>
      )}

      <motion.div animate={shake}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25, ease: EASE }}>
            {step === "done" && (
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                className="mb-6 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-2xl text-emerald-700 dark:text-emerald-400"
              >
                <FiCheck strokeWidth={3} />
              </motion.div>
            )}

            <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-brand-charcoal dark:text-white">{copy.title}</h1>
            <p className="mt-2 text-[15px] text-zinc-600 dark:text-zinc-400">{copy.text}</p>

            <FormError message={error} />

            {step === "email" && (
              <form onSubmit={sendCode} noValidate className="mt-8 space-y-5">
                <Field
                  id="resetEmail"
                  label="Work email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="name@company.com"
                  value={email}
                  disabled={busy}
                  autoFocus
                  error={fieldErrors.email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearField("email");
                  }}
                />
                <PrimaryButton status={busy ? "loading" : "idle"} busyLabel="Sending code…">
                  Send code
                </PrimaryButton>
              </form>
            )}

            {step === "code" && (
              <form onSubmit={verify} noValidate className="mt-8 space-y-5">
                <Field
                  id="resetCode"
                  label="6-digit code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  disabled={busy}
                  autoFocus
                  error={fieldErrors.code}
                  inputClassName="text-lg sm:text-lg font-bold tabular-nums tracking-[0.45em]"
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    clearField("code");
                  }}
                />
                <PrimaryButton status={busy ? "loading" : "idle"} busyLabel="Checking code…">
                  Verify code
                </PrimaryButton>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button type="button" onClick={() => goTo("email")} disabled={busy} className={linkCls}>
                    Use a different email
                  </button>
                  <button type="button" onClick={() => sendCode()} disabled={busy || cooldown > 0} className={linkCls}>
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={reset} noValidate className="mt-8 space-y-5">
                <Field
                  id="newPassword"
                  label="New password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  disabled={busy}
                  autoFocus
                  error={fieldErrors.password}
                  trailing={<PasswordToggle shown={show} onToggle={() => setShow((v) => !v)} />}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearField("password");
                  }}
                />
                <Field
                  id="confirmPassword"
                  label="Confirm new password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Type it again"
                  value={confirm}
                  disabled={busy}
                  error={fieldErrors.confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    clearField("confirm");
                  }}
                />
                <ul className="space-y-2 text-[13px] font-medium">
                  <Requirement ok={password.length >= 6}>At least 6 characters</Requirement>
                  <Requirement ok={!!confirm && password === confirm}>Both passwords match</Requirement>
                </ul>
                <PrimaryButton status={busy ? "loading" : "idle"} busyLabel="Updating password…">
                  Update password
                </PrimaryButton>
              </form>
            )}

            {step === "done" && (
              <div className="mt-8">
                <PrimaryButton type="button" onClick={() => onBack(cleanEmail)}>
                  Back to sign in
                </PrimaryButton>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
