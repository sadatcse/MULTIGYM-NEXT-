"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { FiExternalLink, FiLoader } from "react-icons/fi";
import ModalShell from "../ModalShell";
import LetterViewer from "@/components/letters/LetterViewer";
import { Badge } from "@/components/hr/HrUi";
import { letterStatusMeta } from "@/components/letters/letterConstants";
import { useHrLetterActions } from "@/hooks/useHrLetterApi";

/**
 * Quick look at a letter with Print / PDF.
 *  - `letterId`: loads the full letter (lists only carry a light summary).
 *  - `snapshot`: renders a ready snapshot (template sample, live preview).
 *  - `mine`: the employee's own letter via the self-service endpoints.
 */
export default function LetterPreviewModal({ isOpen, onClose, letterId, snapshot: givenSnapshot, status: givenStatus, title, subtitle, mine = false }) {
  const actions = useHrLetterActions();
  const getLetterById = mine ? actions.getMyLetter : actions.getLetterById;
  const logClientAction = mine ? actions.logMyAction : actions.logClientAction;
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !letterId) return undefined;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    getLetterById(letterId)
      .then((d) => {
        if (!alive) return;
        setLetter((mine ? d : d?.letter) || null);
        logClientAction(letterId, "viewed");
      })
      .catch((e) => alive && setError(e?.response?.data?.message || "Could not load this letter."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [isOpen, letterId, getLetterById, logClientAction, mine]);

  // Rendered into <body> so it also works when opened from inside another
  // (animated, transformed) modal such as the employee profile.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const snapshot = letterId ? letter?.contentSnapshot : givenSnapshot;
  const status = letterId ? letter?.status : givenStatus;
  const meta = letterStatusMeta(status);

  if (!mounted) return null;
  return createPortal(
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zIndexClassName="z-[70]"
      size="2xl"
      panelClassName="sm:!max-w-5xl"
      title={
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-brand-black dark:text-brand-white truncate">
              {title || snapshot?.letterMeta?.titleBangla || "Letter preview"}
            </h3>
            {letterId && letter && <Badge tone={meta.tone}>{meta.label}{letter.version > 1 ? ` · v${letter.version}` : ""}</Badge>}
          </div>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5 truncate">
            {subtitle || [snapshot?.letterMeta?.letterNumber, snapshot?.recipient?.name].filter(Boolean).join(" · ")}
          </p>
        </div>
      }
    >
      <div className="p-3 sm:p-6">
        {loading ? (
          <div className="py-20 flex items-center justify-center text-xs text-brand-dark-grey dark:text-brand-gold-light">
            <FiLoader className="animate-spin mr-2" /> Loading letter…
          </div>
        ) : error ? (
          <p className="py-16 text-center text-xs font-bold text-brand-red">{error}</p>
        ) : (
          <LetterViewer
            snapshot={snapshot}
            status={status}
            version={letter?.version || 1}
            fileName={letter?.fileName}
            onAction={letterId ? (a) => logClientAction(letterId, a) : undefined}
            toolbarExtra={
              letterId && !mine ? (
                <Link
                  href={`/dashboard/hr-letters/${letterId}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white hover:border-brand-gold transition-all"
                >
                  <FiExternalLink /> Open details
                </Link>
              ) : null
            }
          />
        )}
      </div>
    </ModalShell>,
    document.body,
  );
}
