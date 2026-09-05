"use client";

import React from "react";
import {
  FiClock,
  FiEye,
  FiCheckCircle,
  FiPlay,
  FiSend,
  FiAlertTriangle,
  FiXCircle,
} from "react-icons/fi";

const STATUS_CONFIG = {
  DELIVERED: {
    label: "Delivered",
    bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    icon: FiClock,
  },
  SEEN: {
    label: "Seen",
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: FiEye,
  },
  ACKNOWLEDGED: {
    label: "Acknowledged",
    bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    icon: FiCheckCircle,
  },
  PENDING: {
    label: "Pending",
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: FiClock,
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    icon: FiPlay,
  },
  WAITING_FOR_APPROVAL: {
    label: "Awaiting Signoff",
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: FiSend,
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: FiCheckCircle,
  },
  OVERDUE: {
    label: "Overdue",
    bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: FiAlertTriangle,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    icon: FiXCircle,
  },
};

export default function AccountabilityStatusBadge({ status, size = "sm" }) {
  const normalized = status?.toUpperCase() || "PENDING";
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.PENDING;
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
