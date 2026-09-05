"use client";

import React from "react";
import { FiClock, FiAlertCircle } from "react-icons/fi";

export default function DeadlineBadge({ deadline }) {
  if (!deadline) {
    return (
      <span className="text-xs text-brand-dark-grey">No Deadline</span>
    );
  }

  const target = new Date(deadline);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isPast = diffMs < 0;

  if (isPast) {
    const overdueDays = Math.abs(diffDays);
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
        <FiAlertCircle className="text-xs" />
        <span>Overdue by {overdueDays === 0 ? "hours" : `${overdueDays}d`}</span>
      </span>
    );
  }

  if (diffDays === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md animate-pulse">
        <FiClock className="text-xs" />
        <span>Due Today</span>
      </span>
    );
  }

  if (diffDays === 1) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
        <FiClock className="text-xs" />
        <span>Due Tomorrow</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-brand-dark-grey dark:text-brand-gold-light bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 px-2 py-0.5 rounded-md">
      <FiClock className="text-[10px] text-brand-gold" />
      <span>{diffDays}d left ({target.toLocaleDateString()})</span>
    </span>
  );
}
