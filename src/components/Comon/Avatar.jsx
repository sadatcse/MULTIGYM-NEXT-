"use client";

import React from "react";

const SIZE_CLASSES = {
  8: "w-8 h-8 text-[10px]",
  9: "w-9 h-9 text-[11px]",
  10: "w-10 h-10 text-xs",
  11: "w-11 h-11 text-xs",
  12: "w-12 h-12 text-sm",
  14: "w-14 h-14 text-base",
  16: "w-16 h-16 text-lg",
  20: "w-20 h-20 text-xl",
  24: "w-24 h-24 text-2xl",
};

const COLORS = [
  "bg-brand-primary",
  "bg-brand-gold",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
];

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const getColorForName = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};

const Avatar = ({ src, name, size = 10, showStatus = false, online = false, className = "" }) => {
  const dimension = SIZE_CLASSES[size] || SIZE_CLASSES[10];

  return (
    <div className={`relative shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${dimension} rounded-full object-cover border border-brand-beige/60 dark:border-brand-dark-grey/60`}
        />
      ) : (
        <div
          className={`${dimension} rounded-full flex items-center justify-center text-white font-bold ${getColorForName(name)}`}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-brand-white dark:border-brand-charcoal ${
            online ? "bg-emerald-500" : "bg-gray-400 dark:bg-brand-dark-grey"
          }`}
        />
      )}
    </div>
  );
};

export default Avatar;
