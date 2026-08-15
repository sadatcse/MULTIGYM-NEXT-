"use client";

import React, { useState } from "react";
import {
  FiZap,
  FiLayers,
  FiList,
  FiCode,
  FiBarChart2,
  FiUser,
  FiSquare,
  FiImage,
  FiFileText,
  FiCheckCircle,
  FiRefreshCw
} from "react-icons/fi";

const PATTERNS = [
  { id: "shimmer", name: "Shimmer", desc: "Gradient sweep left → right", icon: FiZap },
  { id: "gradient", name: "Gradient", desc: "Multi-color gradient shift", icon: FiLayers },
  { id: "staggered", name: "Staggered", desc: "Sequential reveal top → down", icon: FiList },
  { id: "typewriter", name: "Typewriter", desc: "Character-by-character code fill", icon: FiCode },
  { id: "layered", name: "Layered", desc: "Depth layers & bar chart stat", icon: FiBarChart2 },
  { id: "elastic", name: "Elastic", desc: "Spring bounce profile card", icon: FiUser },
  { id: "pulse", name: "Pulse", desc: "Opacity fade list feed", icon: FiSquare },
  { id: "cascade", name: "Cascade", desc: "Per-element highlight wave", icon: FiImage },
  { id: "outline", name: "Outline", desc: "Wireframe article card", icon: FiFileText },
  { id: "table", name: "Table", desc: "Data grid table skeleton", icon: FiList },
];

const SkeletonLoading = ({
  variant = "shimmer", // shimmer | gradient | staggered | typewriter | layered | elastic | pulse | cascade | outline | table
  count = 1,
  rows = 5,
  showPicker = false,
  className = "",
}) => {
  const [activeVariant, setActiveVariant] = useState(variant);
  const [animatingId, setAnimatingId] = useState(null);

  const handleCardClick = (id) => {
    setActiveVariant(id);
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 800);
  };

  const renderSingleSkeleton = (typeKey) => {
    switch (typeKey) {
      /* ════ 1. SHIMMER ════ */
      case "shimmer":
        return (
          <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3 relative overflow-hidden shadow-sm">
            <style jsx>{`
              @keyframes shimmerSweep {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              .shimmer-bg {
                position: relative;
                overflow: hidden;
              }
              .shimmer-bg::after {
                content: '';
                position: absolute;
                inset: 0;
                transform: translateX(-100%);
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: shimmerSweep 1.8s infinite;
              }
            `}</style>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-beige/70 dark:bg-brand-dark-grey shimmer-bg shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-3/5 bg-brand-beige/70 dark:bg-brand-dark-grey rounded-md shimmer-bg" />
                <div className="h-2.5 w-2/5 bg-brand-beige/70 dark:bg-brand-dark-grey rounded-md shimmer-bg" />
              </div>
            </div>
            <div className="h-28 w-full bg-brand-beige/70 dark:bg-brand-dark-grey rounded-xl shimmer-bg" />
            <div className="h-3 w-full bg-brand-beige/70 dark:bg-brand-dark-grey rounded-md shimmer-bg" />
            <div className="h-3 w-4/5 bg-brand-beige/70 dark:bg-brand-dark-grey rounded-md shimmer-bg" />
            <div className="flex justify-between items-center pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
              <div className="flex gap-2">
                <div className="w-4 h-4 rounded-full bg-brand-beige/70 dark:bg-brand-dark-grey shimmer-bg" />
                <div className="w-4 h-4 rounded-full bg-brand-beige/70 dark:bg-brand-dark-grey shimmer-bg" />
                <div className="w-4 h-4 rounded-full bg-brand-beige/70 dark:bg-brand-dark-grey shimmer-bg" />
              </div>
              <div className="w-12 h-3 bg-brand-beige/70 dark:bg-brand-dark-grey rounded-full shimmer-bg" />
            </div>
          </div>
        );

      /* ════ 2. GRADIENT ════ */
      case "gradient":
        return (
          <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3 shadow-sm">
            <style jsx>{`
              @keyframes gradShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .grad-bg {
                background: linear-gradient(90deg, #7c6aff25, #ff6b9d25, #00d4aa25);
                background-size: 200% 200%;
                animation: gradShift 3s ease infinite;
              }
            `}</style>
            <div className="h-32 w-full rounded-xl grad-bg" />
            <div className="h-4 w-3/4 rounded-md grad-bg" />
            <div className="h-3 w-1/2 rounded-md grad-bg" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-16 rounded-full grad-bg" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-3 h-3 rounded grad-bg" />
                ))}
              </div>
            </div>
          </div>
        );

      /* ════ 3. STAGGERED ════ */
      case "staggered":
        return (
          <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3 shadow-sm">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 pb-2.5 border-b border-brand-beige/30 dark:border-brand-dark-grey/30 last:border-0 last:pb-0 animate-pulse"
                style={{ animationDelay: `${idx * 180}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-4/5 bg-brand-primary/20 rounded" />
                  <div className="h-2.5 w-1/2 bg-brand-primary/10 rounded" />
                </div>
                <div className="w-8 h-4 rounded-full bg-brand-primary/15" />
              </div>
            ))}
          </div>
        );

      /* ════ 4. TYPEWRITER ════ */
      case "typewriter":
        return (
          <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs space-y-2 border border-slate-800 shadow-sm">
            <div className="flex gap-1.5 pb-2 border-b border-slate-800">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3 bg-indigo-500/30 rounded w-2/5 animate-pulse" />
              <div className="h-3 bg-indigo-500/20 rounded w-4/5 pl-4 animate-pulse" style={{ animationDelay: "150ms" }} />
              <div className="h-3 bg-indigo-500/20 rounded w-3/5 pl-4 animate-pulse" style={{ animationDelay: "300ms" }} />
              <div className="h-3 bg-indigo-500/25 rounded w-full pl-4 animate-pulse" style={{ animationDelay: "450ms" }} />
              <div className="h-3 bg-indigo-500/30 rounded w-1/4 animate-pulse" style={{ animationDelay: "600ms" }} />
            </div>
          </div>
        );

      /* ════ 5. LAYERED ════ */
      case "layered":
        return (
          <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-1/3 bg-brand-beige dark:bg-brand-dark-grey rounded" />
              <div className="h-4 w-12 bg-brand-primary/20 rounded-full" />
            </div>
            <div className="h-6 w-1/2 bg-brand-primary/30 rounded" />
            <div className="h-3 w-1/4 bg-brand-beige dark:bg-brand-dark-grey rounded" />
            <div className="flex items-end gap-2 h-20 pt-2">
              {[35, 65, 45, 85, 60, 50, 95, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-brand-primary/40 to-brand-primary/10 rounded-t transition-all animate-pulse"
                  style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        );

      /* ════ 6. ELASTIC ════ */
      case "elastic":
        return (
          <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center space-y-3 shadow-sm">
            <div className="h-12 w-full bg-brand-beige/60 dark:bg-brand-dark-grey rounded-xl" />
            <div className="w-12 h-12 rounded-full bg-brand-primary/30 border-2 border-brand-white dark:border-brand-charcoal mx-auto -mt-8 shadow-sm animate-bounce" />
            <div className="h-3.5 w-1/2 bg-brand-beige dark:bg-brand-dark-grey rounded mx-auto" />
            <div className="h-2.5 w-1/3 bg-brand-beige dark:bg-brand-dark-grey rounded mx-auto" />
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-3/4 bg-brand-primary/20 rounded mx-auto" />
                  <div className="h-2 w-full bg-brand-beige dark:bg-brand-dark-grey rounded" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <div className="flex-1 h-7 bg-brand-primary/30 rounded-xl" />
              <div className="w-16 h-7 bg-brand-beige dark:bg-brand-dark-grey rounded-xl" />
            </div>
          </div>
        );

      /* ════ 7. PULSE ════ */
      case "pulse":
        return (
          <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3 shadow-sm">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-brand-beige dark:bg-brand-dark-grey shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 bg-brand-beige dark:bg-brand-dark-grey rounded" />
                  <div className="h-2.5 w-1/2 bg-brand-beige/60 dark:bg-brand-dark-grey/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        );

      /* ════ 8. CASCADE ════ */
      case "cascade":
        return (
          <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="aspect-square bg-brand-beige dark:bg-brand-dark-grey rounded-lg animate-pulse"
                  style={{ animationDelay: `${idx * 120}ms` }}
                />
              ))}
            </div>
            <div className="h-3 w-3/4 bg-brand-beige dark:bg-brand-dark-grey rounded" />
            <div className="h-2.5 w-1/2 bg-brand-beige/60 dark:bg-brand-dark-grey/60 rounded" />
          </div>
        );

      /* ════ 9. OUTLINE ════ */
      case "outline":
        return (
          <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-3 shadow-sm">
            <div className="h-24 w-full border-2 border-dashed border-brand-beige dark:border-brand-dark-grey rounded-xl flex items-center justify-center">
              <FiImage className="text-brand-dark-grey/40 text-xl" />
            </div>
            <div className="h-4 w-4/5 border border-brand-beige dark:border-brand-dark-grey rounded" />
            <div className="h-3 w-full border border-brand-beige dark:border-brand-dark-grey rounded" />
            <div className="h-3 w-2/3 border border-brand-beige dark:border-brand-dark-grey rounded" />
          </div>
        );

      /* ════ 10. TABLE SKELETON ════ */
      case "table":
        return (
          <div className="bg-brand-white dark:bg-brand-charcoal rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 overflow-hidden shadow-sm">
            <div className="p-4 bg-brand-offwhite/50 dark:bg-brand-dark-grey/30 border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex justify-between">
              <div className="h-4 w-32 bg-brand-beige dark:bg-brand-dark-grey rounded animate-pulse" />
              <div className="h-4 w-20 bg-brand-primary/20 rounded animate-pulse" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="h-3 w-1/4 bg-brand-beige dark:bg-brand-dark-grey rounded" />
                  <div className="h-3 w-1/3 bg-brand-beige dark:bg-brand-dark-grey rounded" />
                  <div className="h-3 w-1/6 bg-brand-beige dark:bg-brand-dark-grey rounded" />
                  <div className="h-6 w-16 bg-brand-primary/20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Interactive Pattern Grid Selector */}
      {showPicker && (
        <div className="space-y-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary">
              AI-First Components
            </span>
            <h2 className="text-2xl font-bold text-brand-black dark:text-brand-offwhite">
              Skeleton Loading Patterns
            </h2>
            <p className="text-xs text-brand-dark-grey dark:text-brand-sage">
              Click any pattern card to test interactive loading animations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {PATTERNS.map((p) => {
              const Icon = p.icon;
              const isActive = activeVariant === p.id;
              const isAnimating = animatingId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => handleCardClick(p.id)}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? "bg-brand-white dark:bg-brand-charcoal border-brand-primary shadow-lg shadow-brand-primary/10 ring-2 ring-brand-primary/20"
                      : "bg-brand-white/80 dark:bg-brand-charcoal/80 border-brand-beige/50 dark:border-brand-dark-grey/50 hover:border-brand-primary/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`text-base ${isActive ? "text-brand-primary" : "text-brand-dark-grey"}`} />
                        <span className="font-bold text-sm text-brand-black dark:text-brand-offwhite">{p.name}</span>
                      </div>
                      {isActive && <FiCheckCircle className="text-emerald-500 text-sm" />}
                    </div>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-sage mb-3">{p.desc}</p>
                  </div>

                  <div className="mt-2">{renderSingleSkeleton(p.id)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Render Single or Multiple Skeleton Instances */}
      {!showPicker && (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, idx) => (
            <React.Fragment key={idx}>{renderSingleSkeleton(activeVariant)}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkeletonLoading;
