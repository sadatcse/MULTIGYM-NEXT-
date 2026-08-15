"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { AuthContext } from "@/providers/AuthProvider";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUsers,
  FiAward,
  FiZap,
  FiArrowRight
} from "react-icons/fi";

// Import assets
import gymBg from "@/assets/Background/gym_bg.jpeg";
import Logo from "@/assets/Logo/logo.png";
import Logo_Dark from "@/assets/Logo/logo_dark.png";

const Login = () => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const router = useRouter();
  const { user, loginUser, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    setMounted(true);

    if (user) {
      router.push("/dashboard/home");
      return;
    }

    const savedEmail = localStorage.getItem("email");
    const savedPassword = localStorage.getItem("password");
    const savedTheme = localStorage.getItem("theme") || "dark";
    
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
    
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, [user, router]);

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Prevent double login or duplicate submit while request is pending
    if (isSubmitting || authLoading) return;

    let valid = true;
    if (!validateEmail(email)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    } else {
      setEmailError("");
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      valid = false;
    } else {
      setPasswordError("");
    }
    if (!valid) return;

    setIsSubmitting(true);
    try {
      await loginUser(email, password);
      if (rememberMe) {
        localStorage.setItem("email", email);
        localStorage.setItem("password", password);
      } else {
        localStorage.removeItem("email");
        localStorage.removeItem("password");
      }
      // Keep isSubmitting true while redirecting to prevent duplicate clicks
      router.push("/dashboard/home");
    } catch (error) {
      setIsSubmitting(false);
      Swal.fire({
        title: "Login Failed",
        text: error?.message || "Invalid email or password. Please try again.",
        icon: "error",
        confirmButtonColor: "#059669",
        background: theme === "dark" ? "#1f2937" : "#ffffff",
        color: theme === "dark" ? "#f3f4f6" : "#111827",
      });
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    if (isSubmitting) return;
    setEmail(demoEmail);
    setPassword(demoPass);
    setEmailError("");
    setPasswordError("");
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    setShowForgotModal(false);
    Swal.fire({
      title: "Reset Request Sent",
      text: "If an account exists, a password reset link has been dispatched.",
      icon: "success",
      confirmButtonColor: "#059669",
      background: theme === "dark" ? "#1f2937" : "#ffffff",
      color: theme === "dark" ? "#f3f4f6" : "#111827",
    });
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-400 font-semibold tracking-widest text-xs uppercase animate-pulse">
            Loading Multigym HR System...
          </p>
        </div>
      </div>
    );
  }

  const bgImageUrl = gymBg?.src || "/gym_bg.jpeg";

  return (
    <>
      {/* Full Page Container with Gym Background Image */}
      <div 
        className="min-h-screen relative flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-white"
        style={{ backgroundImage: `url(${bgImageUrl})` }}
      >
        {/* Dark High-Tech Gradient Backdrop Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-emerald-950/80 backdrop-blur-[4px] z-0" />

        {/* Floating Top Navigation Header */}
        <header className="absolute top-6 left-6 right-6 z-20 flex justify-end items-center max-w-7xl mx-auto">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={handleThemeToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold backdrop-blur-md shadow-lg transition-all duration-300 cursor-pointer ${
              theme === "dark"
                ? "bg-slate-900/80 border-slate-700/60 text-slate-200 hover:bg-slate-800"
                : "bg-white/90 border-slate-200 text-slate-800 hover:bg-white"
            }`}
          >
            {theme === "dark" ? (
              <>
                <span className="text-yellow-400">☀️</span>
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <span className="text-indigo-400">🌙</span>
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </header>

        {/* Main Login Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`relative z-10 flex flex-col md:flex-row rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full border backdrop-blur-xl transition-all duration-300 mt-16 md:mt-0 ${
            theme === "dark"
              ? "bg-slate-900/85 border-slate-800/80 text-white shadow-emerald-950/40"
              : "bg-white/90 border-white/60 text-slate-900 shadow-slate-900/20"
          }`}
        >
          {/* Left Panel: Hero Showcase with Gym Background & HR Metrics */}
          <div
            className="w-full md:w-1/2 relative bg-cover bg-center min-h-[320px] md:min-h-[560px] flex flex-col justify-between p-8 md:p-10 overflow-hidden"
            style={{ backgroundImage: `url(${bgImageUrl})` }}
          >
            {/* Gradient Overlay for Left Showcase Panel */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-emerald-950/50 backdrop-blur-[2px]" />

            {/* Brand Logo on Left Showcase Panel */}
            <div className="relative z-10 pt-2">
              <img
                src={Logo.src || "/Logo.png"}
                alt="Multigym HR Logo"
                className="h-14 w-auto object-contain filter drop-shadow-xl"
              />
            </div>

            {/* Left Content Highlights */}
            <div className="relative z-10 mt-auto space-y-4">
              <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                Powering Peak <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  Fitness Teams
                </span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed max-w-sm">
                Complete Human Resources & Staff Management solution designed specifically for gym facilities, personal trainers, and fitness operations.
              </p>

              {/* Gym HR Live Badges */}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <FiUsers className="text-lg" />
                  </div>
                  <div>
                    <span className="text-white font-bold text-xs block">Trainer Roster</span>
                    <span className="text-emerald-400 text-[10px] font-semibold">Attendance & Shifts</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                    <FiAward className="text-lg" />
                  </div>
                  <div>
                    <span className="text-white font-bold text-xs block">Payroll & KPI</span>
                    <span className="text-teal-400 text-[10px] font-semibold">Automated Insights</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Sleek Form Section */}
          <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative z-10">
            {/* Logo Header */}
            <div className="flex flex-col items-center mb-6 text-center">
              <img
                src={theme === "dark" ? Logo_Dark.src : Logo.src}
                alt="Multigym HR Logo"
                className="h-14 w-auto object-contain mb-3 hover:scale-105 transition-transform duration-300"
              />
              <h2 className="text-2xl font-extrabold tracking-tight">
                Sign In to Multigym HR
              </h2>
              <p className={`text-xs mt-1 font-medium ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}>
                Enter your credentials to access your staff dashboard
              </p>
            </div>

            {/* Quick Demo Fill Credentials Shortcut */}
            <div className={`p-3 rounded-2xl mb-6 border flex items-center justify-between text-xs ${
              theme === "dark"
                ? "bg-slate-800/60 border-slate-700/60 text-slate-300"
                : "bg-slate-100 border-slate-200 text-slate-700"
            }`}>
              <span className="font-semibold text-[11px] flex items-center gap-1.5">
                <FiZap className="text-emerald-500" /> Demo Account:
              </span>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDemoFill("admin@gmail.com", "password123")}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[11px] transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed"
              >
                Fill Admin Credentials
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              {/* Email Input */}
              <div>
                <label 
                  htmlFor="loginEmail"
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                    theme === "dark" ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiMail className="text-base" />
                  </div>
                  <input
                    id="loginEmail"
                    type="email"
                    placeholder="admin@gmail.com"
                    value={email}
                    disabled={isSubmitting}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${
                      theme === "dark"
                        ? "bg-slate-950/70 border-slate-700/80 text-white placeholder-slate-500"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-rose-500 text-xs mt-1 font-semibold">{emailError}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label 
                    htmlFor="loginPassword"
                    className={`block text-[11px] font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-emerald-400" : "text-emerald-700"
                    }`}
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiLock className="text-base" />
                  </div>
                  <input
                    id="loginPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    disabled={isSubmitting}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-11 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${
                      theme === "dark"
                        ? "bg-slate-950/70 border-slate-700/80 text-white placeholder-slate-500"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {showPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-rose-500 text-xs mt-1 font-semibold">{passwordError}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs py-1">
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    disabled={isSubmitting}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className={`ml-2 font-semibold ${
                    theme === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}>
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowForgotModal(true)}
                  className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-bold py-3.5 px-6 rounded-2xl text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  isSubmitting
                    ? "bg-emerald-700/80 cursor-not-allowed opacity-80 shadow-none pointer-events-none"
                    : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Access HR Dashboard</span>
                    <FiArrowRight className="text-base" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
              <p className="text-[11px] text-slate-500 font-medium">
                Multigym HR Operations & Management Platform &copy; 2026
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full relative border transition-all duration-300 ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-5 text-2xl font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                &times;
              </button>
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FiLock className="text-xl" />
              </div>
              <h3 className="text-xl font-bold mb-1 tracking-tight">Forgot Password?</h3>
              <p className="mb-6 text-xs text-slate-400 leading-relaxed">
                Enter your registered Multigym HR email address and we'll dispatch a reset link.
              </p>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="admin@gmail.com"
                    className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  Send Reset Link
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Login;
