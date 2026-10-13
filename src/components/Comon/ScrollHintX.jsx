"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

// Drop-in replacement for a plain `<div className="overflow-x-auto">` around
// a wide table: adds fading edge hints (and a pulsing arrow on the trailing
// edge) whenever there's more content to scroll to, so a table that's wider
// than its container doesn't just look like it silently clips at laptop/
// tablet widths — same idea as the sidebar's scroll-fade hint.
export default function ScrollHintX({ children, className = "" }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, children]);

  return (
    <div className="relative">
      <div ref={ref} onScroll={update} className={`overflow-x-auto ${className}`}>
        {children}
      </div>
      {canLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-brand-white dark:from-brand-charcoal to-transparent flex items-center">
          <MdChevronLeft className="text-brand-gold text-lg" />
        </div>
      )}
      {canRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-brand-white dark:from-brand-charcoal to-transparent flex items-center justify-end">
          <MdChevronRight className="text-brand-gold text-lg animate-pulse" />
        </div>
      )}
    </div>
  );
}
