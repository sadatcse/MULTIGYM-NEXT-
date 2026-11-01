"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Barlow } from "next/font/google";
import teamPhoto from "@/assets/Background/team-duotone.jpg";
import LoginDust from "./LoginDust";
import BrandMark from "./BrandMark";

// Left half of the sign-in page (laptop / desktop only): the team in a
// black-and-gold treatment, a quiet headline, the three brands the portal
// serves, and a fine gold seam against the form. Gold dust (three.js)
// drifts through the light. Everything settles once on load.

const display = Barlow({ subsets: ["latin"], weight: ["600"], display: "swap" });

const EASE = [0.22, 1, 0.36, 1];
const LINES = ["Every shift.", "Every branch.", "One team."];
const BRANDS = ["Multi Gym Premium", "Multi Gym", "Power FiT"];

export default function LoginShowcase({ companyName, logo }) {
  return (
    <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-brand-midnight px-12 py-10 xl:px-16 xl:py-14 text-white">
      {/* Photo settles in */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ opacity: { duration: 1.2, ease: "easeOut" }, scale: { duration: 6, ease: EASE } }}
      >
        <Image src={teamPhoto} alt="" fill sizes="(min-width: 1024px) 55vw, 1px" placeholder="blur" className="object-cover object-[50%_42%]" />
      </motion.div>

      {/* Light and legibility */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-brand-midnight/75 via-brand-midnight/10 to-brand-midnight/40" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-brand-midnight via-brand-midnight/85 to-transparent" />
      <div aria-hidden className="absolute -right-24 -top-48 h-[34rem] w-[34rem] rounded-full bg-brand-gold/10 blur-3xl" />

      <LoginDust className="absolute inset-0" />

      {/* Gold seam */}
      <motion.span
        aria-hidden
        className="absolute inset-y-0 right-0 w-[2px] origin-top bg-gradient-to-b from-brand-gold/0 via-brand-gold to-brand-gold/0"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.2, duration: 1.2, ease: EASE }}
      />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
        className="relative z-10 flex items-center gap-3"
      >
        <BrandMark logo={logo} name={companyName} size="lg" />
      </motion.div>

      <div className="relative z-10 max-w-xl">
        <h2 className={`${display.className} text-5xl xl:text-[3.75rem] leading-[1.02] tracking-[-0.02em]`}>
          {LINES.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-1">
              <motion.span
                className="block"
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.35 + i * 0.12, duration: 0.8, ease: EASE }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6, ease: EASE }}
          className="mt-6 max-w-md text-base leading-relaxed text-balance text-white/70"
        >
          Attendance, leave, payroll and HR letters for every branch, in one place.
        </motion.p>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05, duration: 0.6 }}
          aria-label="Brands"
          className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-6 text-sm font-medium text-white/55"
        >
          {BRANDS.map((b, i) => (
            <li key={b} className="flex items-center gap-4">
              {i > 0 && <span aria-hidden className="h-3.5 w-px bg-white/20" />}
              {b}
            </li>
          ))}
        </motion.ul>
      </div>
    </aside>
  );
}
