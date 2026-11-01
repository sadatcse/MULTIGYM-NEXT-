"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiAlertCircle, FiCalendar, FiEye, FiFileText, FiRefreshCw, FiSlash } from "react-icons/fi";
import { useHrLetterActions } from "@/hooks/useHrLetterApi";
import { errMsg, fmtDate } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Loading, PageHeader, SearchBox, Select, StatCard, pageCls } from "@/components/hr/HrUi";
import LetterPreviewModal from "@/components/modals/letters/LetterPreviewModal";
import { LETTER_GROUPS, letterStatusMeta, letterTypeMeta } from "@/components/letters/letterConstants";

const TONE_TEXT = { green: "text-emerald-500", blue: "text-blue-500", amber: "text-amber-500", red: "text-rose-500", purple: "text-purple-500", cyan: "text-cyan-500", gold: "text-brand-gold", slate: "text-zinc-500" };

// Employee self-service: every official letter HR has issued to the
// signed-in employee, with preview, print and PDF download.
export default function MyLettersPage() {
  const { getMyLetters } = useHrLetterActions();
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [previewId, setPreviewId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getMyLetters()
      .then((d) => {
        if (!alive) return;
        setLetters(d);
        setError("");
      })
      .catch((e) => alive && setError(errMsg(e, "Could not load your letters")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [getMyLetters, reloadKey]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return letters.filter((l) => {
      const t = letterTypeMeta(l.letterType);
      if (group !== "all" && t.group !== group) return false;
      if (!q) return true;
      return `${t.titleEnglish} ${t.titleBangla} ${l.letterNumber} ${l.contentSnapshot?.letterMeta?.subject || ""}`.toLowerCase().includes(q);
    });
  }, [letters, search, group]);

  const issued = letters.filter((l) => l.status !== "cancelled");
  const latest = issued[0];
  const groupsPresent = LETTER_GROUPS.filter((g) => letters.some((l) => letterTypeMeta(l.letterType).group === g.key));

  return (
    <div className={pageCls}>
      <PageHeader title="My Letters" subtitle="Official letters HR has issued to you — appointment, confirmation, promotion, experience and more. View, print or download any time." />

      {!loading && !error && letters.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard index={0} icon={<FiFileText />} label="My letters" value={issued.length} tone="gold" />
          <StatCard index={1} icon={<FiCalendar />} label="Latest letter" value={latest ? fmtDate(latest.letterDate) : "—"} hint={latest ? letterTypeMeta(latest.letterType).titleEnglish : ""} tone="green" />
          {letters.length !== issued.length && <StatCard index={2} icon={<FiSlash />} label="Cancelled" value={letters.length - issued.length} tone="red" />}
        </div>
      )}

      <Card
        title={loading ? "Loading…" : `${visible.length} letter${visible.length === 1 ? "" : "s"}`}
        actions={
          letters.length > 4 ? (
            <>
              <SearchBox value={search} onChange={setSearch} placeholder="Search letters…" className="sm:w-56" />
              {groupsPresent.length > 1 && <Select value={group} onChange={setGroup} options={[{ value: "all", label: "All kinds" }, ...groupsPresent.map((g) => ({ value: g.key, label: g.label }))]} className="sm:w-48" />}
            </>
          ) : null
        }
      >
        {loading ? (
          <Loading rows={4} />
        ) : error ? (
          <div className="py-10 text-center space-y-3">
            <FiAlertCircle className="text-3xl text-brand-red mx-auto" />
            <p className="text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light">{error}</p>
            <Btn variant="ghost" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
              <FiRefreshCw /> Try again
            </Btn>
          </div>
        ) : letters.length === 0 ? (
          <EmptyState icon={<FiFileText />} title="No letters yet" text="When HR issues you an official letter — such as an appointment, confirmation or promotion letter — it will appear here." />
        ) : visible.length === 0 ? (
          <EmptyState title="No matching letters" text="Try another search or kind." />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((l, i) => {
              const t = letterTypeMeta(l.letterType);
              const s = letterStatusMeta(l.status);
              const Icon = t.icon;
              return (
                <motion.button
                  key={l._id}
                  type="button"
                  onClick={() => setPreviewId(l._id)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.04 }}
                  className="group text-left p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/60 dark:bg-brand-midnight/60 hover:border-brand-gold/60 hover:shadow-lg transition-all cursor-pointer flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`w-11 h-11 rounded-2xl bg-brand-white dark:bg-brand-charcoal flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform ${TONE_TEXT[t.tone] || ""}`}>
                      <Icon />
                    </span>
                    <Badge tone={s.tone}>
                      {s.label}
                      {l.version > 1 ? ` · v${l.version}` : ""}
                    </Badge>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-brand-black dark:text-brand-white">{l.contentSnapshot?.letterMeta?.titleBangla || t.titleBangla}</div>
                    <div className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">{t.titleEnglish}</div>
                    {l.contentSnapshot?.letterMeta?.subject && <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light/70 mt-2 line-clamp-2">{l.contentSnapshot.letterMeta.subject}</p>}
                  </div>
                  <div className="mt-auto pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between gap-2 text-[11px]">
                    <span className="min-w-0">
                      <span className="block font-mono font-bold text-brand-black dark:text-brand-white truncate">{l.letterNumber}</span>
                      <span className="block text-brand-dark-grey dark:text-brand-gold-light">{fmtDate(l.letterDate)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold/10 text-brand-gold font-bold group-hover:bg-brand-gold group-hover:text-brand-midnight transition-colors shrink-0">
                      <FiEye /> View
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </Card>

      <LetterPreviewModal isOpen={!!previewId} onClose={() => setPreviewId(null)} letterId={previewId} mine />
    </div>
  );
}
