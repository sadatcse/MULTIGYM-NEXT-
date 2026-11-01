"use client";

import { motion } from "framer-motion";
import { Barlow_Condensed } from "next/font/google";

const wordmark = Barlow_Condensed({ subsets: ["latin"], weight: ["700"], display: "swap" });
const EASE = [0.22, 1, 0.36, 1];

// Logo + company name for the sign-in page. The logo springs in, then a gold
// light sweep crosses it every few seconds; the name is set in capitals.
// Motion is skipped for people who prefer reduced motion (MotionConfig).
export default function BrandMark({ logo, name, size = "md", tone = "light" }) {
  const big = size === "lg";
  return (
    <div className="flex min-w-0 items-center gap-3">
      <motion.span
        className={`relative inline-block shrink-0 overflow-hidden rounded-xl ${big ? "h-12" : "h-9"}`}
        initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" className="h-full w-auto object-contain" />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-[#F0D494]/70 to-transparent mix-blend-screen"
          initial={{ x: "-120%" }}
          animate={{ x: ["-120%", "320%"] }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.9, repeat: Infinity, repeatDelay: 4 }}
        />
      </motion.span>
      <motion.span
        className={`${wordmark.className} truncate uppercase leading-none tracking-[0.14em] ${big ? "text-2xl" : "text-lg"} ${tone === "light" ? "text-white" : "text-brand-charcoal dark:text-white"}`}
        initial={{ opacity: 0, x: -10, letterSpacing: "0.3em" }}
        animate={{ opacity: 1, x: 0, letterSpacing: "0.14em" }}
        transition={{ delay: 0.35, duration: 0.8, ease: EASE }}
      >
        {name}
      </motion.span>
    </div>
  );
}
