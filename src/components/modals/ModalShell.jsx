"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiX } from "react-icons/fi";

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-4xl",
};

// Shared modal chrome (backdrop, panel, header, ESC/backdrop-close, sizing)
// extracted from the ~30 places across the app that previously reimplemented
// this same `fixed inset-0` + AnimatePresence markup independently. Content
// stays fully custom via `children`/`title`/`footer` — this only owns the
// structural shell, not any form/business logic.
export default function ModalShell({
  isOpen,
  onClose,
  size = "md",
  closeOnBackdrop = true,
  closeOnEsc = true,
  disableClose = false,
  title,
  footer,
  children,
  className = "",
  panelClassName = "",
  zIndexClassName = "z-50",
}) {
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : 0.18;

  useEffect(() => {
    if (!isOpen || !closeOnEsc || disableClose) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, closeOnEsc, disableClose, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
          className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-md ${className}`}
          onMouseDown={(e) => {
            if (closeOnBackdrop && !disableClose && e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration }}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            className={`bg-brand-white dark:bg-brand-charcoal w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md} rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${panelClassName}`}
          >
            {title !== undefined && (
              <div className="p-6 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-start justify-between bg-brand-offwhite/50 dark:bg-brand-midnight/50 shrink-0">
                <div className="pr-4 min-w-0">
                  {typeof title === "string" ? (
                    <h3 className="text-lg font-black text-brand-black dark:text-brand-white">{title}</h3>
                  ) : (
                    title
                  )}
                </div>
                {!disableClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    title="Close"
                    className="p-1.5 rounded-xl text-brand-dark-grey hover:bg-brand-beige/40 dark:hover:bg-brand-dark-grey/40 transition-colors cursor-pointer shrink-0"
                  >
                    <FiX className="text-lg" />
                  </button>
                )}
              </div>
            )}

            <div className="overflow-y-auto flex-1">{children}</div>

            {footer && (
              <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
