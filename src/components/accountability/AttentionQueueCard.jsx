"use client";

import React from "react";
import Link from "next/link";
import { FiAlertTriangle, FiArrowRight, FiCheckCircle, FiClock } from "react-icons/fi";
import CommunicationBadge from "./CommunicationBadge";
import DeadlineBadge from "./DeadlineBadge";

const SEVERITY_CONFIG = {
  CRITICAL: {
    border: "border-l-4 border-l-rose-500 border-rose-500/20 bg-rose-500/5",
    badge: "bg-rose-500 text-white",
    icon: FiAlertTriangle,
  },
  HIGH: {
    border: "border-l-4 border-l-amber-500 border-amber-500/20 bg-amber-500/5",
    badge: "bg-amber-500 text-white",
    icon: FiClock,
  },
  MEDIUM: {
    border: "border-l-4 border-l-blue-500 border-blue-500/20 bg-blue-500/5",
    badge: "bg-blue-500 text-white",
    icon: FiCheckCircle,
  },
};

export default function AttentionQueueCard({ item }) {
  const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.MEDIUM;
  const SevIcon = sev.icon;

  return (
    <div
      className={`p-4 rounded-2xl bg-brand-white dark:bg-brand-charcoal border shadow-sm transition-all hover:shadow-md flex flex-col justify-between gap-3 ${sev.border}`}
    >
      <div className="space-y-2">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${sev.badge}`}
            >
              <SevIcon className="text-[10px]" />
              {item.severity}
            </span>

            <CommunicationBadge type={item.type} size="xs" />

            {item.source && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                {item.source}
              </span>
            )}
          </div>

          <DeadlineBadge deadline={item.deadline} />
        </div>

        {/* Title */}
        <h4 className="text-sm font-black text-brand-black dark:text-brand-white leading-snug">
          {item.title}
        </h4>

        {/* Action / Context message */}
        <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light line-clamp-2">
          {item.message}
        </p>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-brand-dark-grey">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
        </span>

        <Link
          href={item.actionUrl}
          className="inline-flex items-center gap-1.5 text-xs font-black text-brand-gold hover:text-brand-gold-dark hover:underline transition-all"
        >
          <span>{item.actionLabel || "Take Action"}</span>
          <FiArrowRight className="text-xs" />
        </Link>
      </div>
    </div>
  );
}
