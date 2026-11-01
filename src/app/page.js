"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { FiAlertTriangle, FiMoon, FiSun } from "react-icons/fi";
import { AuthContext } from "@/providers/AuthProvider";
import useThemeMode from "@/hooks/useThemeMode";
import BrandMark from "@/components/auth/BrandMark";
import LoginShowcase from "@/components/auth/LoginShowcase";
import ForgotPasswordPanel from "@/components/auth/ForgotPasswordPanel";
import { Checkbox, EASE, Field, FormError, PasswordToggle, PrimaryButton, container, focusRing, item, linkCls } from "@/components/auth/AuthFields";
import Logo from "@/assets/Logo/logo.png";
import Logo_Dark from "@/assets/Logo/logo_dark.png";

const DASHBOARD = "/dashboard/home";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "Remember me" keeps only the email address, never the password.
const savedEmail = () => {
  try {
    return localStorage.getItem("email") || "";
  } catch {
    return "";
  }
};

const friendlyError = (msg) =>
  !msg || /network error|failed to fetch|timeout/i.test(msg) ? "Can't reach the server. Check your internet connection and try again." : msg;

const isDesktop = () => typeof window !== "undefined" && window.matchMedia?.("(min-width: 1024px)").matches;

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Splash({ logo }) {
  return (
    <div className="min-h-dvh grid place-items-center bg-brand-midnight">
      <div className="flex flex-col items-center gap-6">
        <motion.img src={logo} alt="" className="h-20 w-auto object-contain" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE }} />
        <div className="h-[3px] w-40 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Loading">
          <motion.span className="block h-full w-1/3 rounded-full bg-brand-gold" animate={{ x: ["-110%", "320%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      </div>
    </div>
  );
}

function ThemeToggle({ mode, onToggle }) {
  const dark = mode === "dark";
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.9 }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`grid h-9 w-9 place-items-center rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-brand-charcoal dark:border-white/10 dark:text-brand-gold dark:hover:bg-white/5 cursor-pointer ${focusRing}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={mode} initial={{ rotate: -90, scale: 0.4, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: 90, scale: 0.4, opacity: 0 }} transition={{ duration: 0.22 }}>
          {dark ? <FiSun /> : <FiMoon />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

// The sign-in form and the reset steps swap in the same column.
const viewMotion = (dir) => ({
  initial: { opacity: 0, x: 28 * dir },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 28 * dir },
  transition: { duration: 0.3, ease: EASE },
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { user, loginUser, loading: authLoading, company } = useContext(AuthContext);
  const { mode, toggleMode, loading: themeLoading } = useThemeMode();

  // The form only renders on the client (the splash covers the first
  // paint), so reading localStorage in the initialisers is safe.
  const [email, setEmail] = useState(() => (typeof window === "undefined" ? "" : savedEmail()));
  const [rememberMe, setRememberMe] = useState(() => (typeof window === "undefined" ? false : !!savedEmail()));
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [capsLock, setCapsLock] = useState(false);
  const [view, setView] = useState("signin"); // signin | reset
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const shake = useAnimationControls();

  const companyName = company?.companyName || "Multigym HR";
  const logoOnDark = company?.logo || Logo.src;
  const logo = company?.logo || (mode === "dark" ? Logo.src : Logo_Dark.src);
  // Splash only on first load (or while an existing session redirects);
  // during a sign-in the form stays put and the button shows progress.
  const booting = themeLoading || (status === "idle" && (authLoading || !!user));

  // Already signed in → straight to the dashboard.
  useEffect(() => {
    if (user && status === "idle") router.replace(DASHBOARD);
  }, [user, status, router]);

  useEffect(() => {
    try {
      localStorage.removeItem("password"); // left behind by an older version
    } catch {
      // storage unavailable
    }
    router.prefetch?.(DASHBOARD);
  }, [router]);

  // Cursor where it's needed (desktop only — on phones it would pop the
  // keyboard over the page).
  useEffect(() => {
    if (booting || !isDesktop()) return;
    (savedEmail() ? passwordRef : emailRef).current?.focus();
  }, [booting]);

  const openReset = () => {
    setFormError("");
    setErrors({});
    setView("reset");
  };

  // From the reset steps; gets the email once the password was changed.
  const backToSignIn = useCallback((resetEmail) => {
    if (resetEmail) {
      setEmail(resetEmail);
      setPassword("");
    }
    setView("signin");
    if (isDesktop()) setTimeout(() => (resetEmail ? passwordRef : emailRef).current?.focus(), 350);
  }, []);

  const shakeForm = () => {
    if (!reduce) shake.start({ x: [0, -10, 10, -6, 6, -3, 3, 0], transition: { duration: 0.42 } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status !== "idle") return;
    const cleanEmail = email.trim().toLowerCase();
    const next = {};
    if (!EMAIL_RE.test(cleanEmail)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) {
      shakeForm();
      (next.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setStatus("loading");
    try {
      await loginUser(cleanEmail, password);
      try {
        if (rememberMe) localStorage.setItem("email", cleanEmail);
        else localStorage.removeItem("email");
      } catch {
        // storage unavailable — sign-in still works
      }
      setStatus("success");
      setTimeout(() => router.replace(DASHBOARD), reduce ? 0 : 650);
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus((s) => (s === "error" ? "idle" : s)), 1600);
      setFormError(friendlyError(err?.message));
      shakeForm();
      passwordRef.current?.select();
    }
  };

  const busy = status !== "idle";

  if (booting) {
    return (
      <MotionConfig reducedMotion="user">
        <Splash logo={logoOnDark} />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-dvh bg-white font-sans selection:bg-brand-gold selection:text-brand-midnight dark:bg-brand-midnight lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <LoginShowcase companyName={companyName} logo={logoOnDark} />

        <section className="flex min-h-dvh flex-col px-6 py-6 sm:px-12">
          <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5 lg:invisible">
              <BrandMark logo={logo} name={companyName} tone="auto" />
            </div>
            <ThemeToggle mode={mode} onToggle={toggleMode} />
          </motion.header>

          <div className="flex flex-1 items-center py-10">
            <div className="mx-auto w-full max-w-[380px]">
              <AnimatePresence mode="wait">
                {view === "signin" ? (
                  <motion.div key="signin" {...viewMotion(-1)}>
                    <motion.div animate={shake}>
                      <motion.div variants={container} initial="hidden" animate="show">
                        <motion.h1 variants={item} className="text-[1.75rem] font-bold leading-tight tracking-tight text-brand-charcoal dark:text-white">
                          Welcome back
                        </motion.h1>
                        <motion.p variants={item} className="mt-2 text-[15px] text-zinc-600 dark:text-zinc-400">
                          Sign in to the {companyName} staff portal.
                        </motion.p>

                        <FormError message={formError} />

                        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                          <Field
                            id="loginEmail"
                            label="Work email"
                            type="email"
                            inputMode="email"
                            autoComplete="username"
                            placeholder="name@company.com"
                            value={email}
                            disabled={busy}
                            inputRef={emailRef}
                            error={errors.email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                              if (formError) setFormError("");
                            }}
                          />

                          <Field
                            id="loginPassword"
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Your password"
                            value={password}
                            disabled={busy}
                            inputRef={passwordRef}
                            error={errors.password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                              if (formError) setFormError("");
                            }}
                            onKeyDown={(e) => setCapsLock(!!e.getModifierState?.("CapsLock"))}
                            onKeyUp={(e) => setCapsLock(!!e.getModifierState?.("CapsLock"))}
                            onBlur={() => setCapsLock(false)}
                            trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
                            below={
                              <AnimatePresence initial={false}>
                                {capsLock && (
                                  <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-1.5 overflow-hidden pt-1.5 text-[13px] font-medium text-amber-700 dark:text-amber-400"
                                  >
                                    <FiAlertTriangle className="shrink-0" /> Caps Lock is on
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            }
                          />

                          <motion.div variants={item} className="flex items-center justify-between gap-3">
                            <Checkbox checked={rememberMe} onChange={setRememberMe} disabled={busy}>
                              Remember me
                            </Checkbox>
                            <button type="button" disabled={busy} onClick={openReset} className={linkCls}>
                              Forgot password?
                            </button>
                          </motion.div>

                          <motion.div variants={item} className="pt-2">
                            <PrimaryButton status={status} busyLabel="Signing in…" doneLabel="Signed in" failLabel="Sign in failed">
                              Sign in
                            </PrimaryButton>
                          </motion.div>
                        </form>

                        <motion.p variants={item} className="mt-8 border-t border-zinc-200 pt-6 text-[13px] text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                          Can&apos;t sign in? Ask your HR administrator to check your account.
                        </motion.p>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div key="reset" {...viewMotion(1)}>
                    <ForgotPasswordPanel initialEmail={email.trim()} onBack={backToSignIn} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <footer className="mx-auto w-full max-w-[380px] text-xs text-zinc-400 dark:text-white/35">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </footer>
        </section>
      </main>
    </MotionConfig>
  );
}
