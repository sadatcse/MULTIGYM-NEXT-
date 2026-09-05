"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useAccountabilityApi from "@/hooks/useAccountabilityApi";
import CommunicationBadge from "@/components/accountability/CommunicationBadge";
import DeadlineBadge from "@/components/accountability/DeadlineBadge";
import { toast } from "react-toastify";
import {
  FiSearch,
  FiArrowLeft,
  FiArrowRight,
  FiFileText,
  FiCheckSquare,
  FiUser,
} from "react-icons/fi";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const { searchAll } = useAccountabilityApi();

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(
    async (searchTerm) => {
      if (!searchTerm || !searchTerm.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      setHasSearched(true);
      try {
        const res = await searchAll(searchTerm);
        setResults(res?.results || []);
      } catch (err) {
        console.error("Search error:", err);
        toast.error("Search failed");
      } finally {
        setLoading(false);
      }
    },
    [searchAll]
  );

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.push(`/dashboard/accountability/search?q=${encodeURIComponent(query.trim())}`);
    performSearch(query.trim());
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/accountability"
          className="flex items-center gap-1.5 text-xs font-black text-brand-dark-grey hover:text-brand-gold transition-colors mb-2"
        >
          <FiArrowLeft /> Back to Command Center
        </Link>
        <Mtitle
          title="Global Directive & Accountability Search"
          desc="Search seamlessly across all notices, tasks, spoken instructions, and employee assignments."
        />
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold text-base" />
        <input
          type="text"
          placeholder="Search by title, description, instruction source, category, or employee..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-24 py-3.5 text-sm rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white shadow-sm focus:outline-none focus:border-brand-gold"
        />
        <button
          type="submit"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-brand-gold text-brand-black font-black text-xs shadow hover:bg-brand-gold-dark transition-all"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <SkeletonLoading count={5} />
      ) : hasSearched && results.length === 0 ? (
        <div className="p-12 text-center bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-2 max-w-2xl">
          <FiSearch className="text-4xl text-brand-gold mx-auto" />
          <h4 className="text-base font-black text-brand-black dark:text-brand-white">
            No Records Found
          </h4>
          <p className="text-xs text-brand-dark-grey">
            No directives, notices, or staff matched &quot;{query}&quot;. Try adjusting your keywords.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {results.map((item, idx) => (
            <Link
              key={idx}
              href={item.url}
              className="p-4 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex items-center justify-between gap-4 transition-all hover:border-brand-gold/50 hover:shadow-md block"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.type === "EMPLOYEE" ? (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Staff
                    </span>
                  ) : (
                    <CommunicationBadge type={item.type} size="xs" />
                  )}

                  {item.deadline && <DeadlineBadge deadline={item.deadline} />}
                </div>

                <h4 className="text-sm font-black text-brand-black dark:text-brand-white">
                  {item.title}
                </h4>

                <p className="text-xs text-brand-dark-grey">{item.subtitle}</p>
              </div>

              <div className="shrink-0 text-brand-gold flex items-center gap-1 text-xs font-black">
                <span>Open</span>
                <FiArrowRight />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GlobalSearchPage() {
  return (
    <Suspense fallback={<SkeletonLoading count={4} />}>
      <SearchContent />
    </Suspense>
  );
}
