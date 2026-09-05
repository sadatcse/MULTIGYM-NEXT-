"use client";

import React from "react";
import { FiFileText, FiCheckSquare, FiAward, FiShield, FiBell, FiLayers } from "react-icons/fi";

const TYPE_CONFIG = {
  NOTICE: {
    label: "Notice",
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: FiFileText,
  },
  TASK: {
    label: "Task",
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: FiCheckSquare,
  },
  INSTRUCTION: {
    label: "Directive",
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: FiAward,
  },
  APPROVAL_REQUEST: {
    label: "Approval",
    bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    icon: FiShield,
  },
  POLICY: {
    label: "Policy",
    bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    icon: FiLayers,
  },
  ANNOUNCEMENT: {
    label: "Announcement",
    bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: FiBell,
  },
};

export default function CommunicationBadge({ type, size = "sm" }) {
  const config = TYPE_CONFIG[type?.toUpperCase()] || TYPE_CONFIG.TASK;
  const Icon = config.icon;

  const sizeClass = size === "xs" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1 font-black uppercase tracking-wider rounded-md border ${config.bg} ${sizeClass}`}
    >
      <Icon className="text-[10px]" />
      <span>{config.label}</span>
    </span>
  );
}
