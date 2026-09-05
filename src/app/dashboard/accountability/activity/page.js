"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useAccountabilityApi from "@/hooks/useAccountabilityApi";
import CommunicationBadge from "@/components/accountability/CommunicationBadge";
import { toast } from "react-toastify";
import {
  FiActivity,
  FiArrowLeft,
  FiClock,
  FiFilter,
  FiRefreshCw,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

export default function ActivityStreamPage() {
  const { getActivityStream } = useAccountabilityApi();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [filterType, setFilterType] = useState("");
  const [filterSource, setFilterSource] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getActivityStream(pagination.page, pagination.limit, filterType, filterSource);
      setEvents(res?.events || []);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load activity stream:", err);
      toast.error("Failed to load activity events");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filterType, filterSource, getActivityStream]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/accountability"
            className="flex items-center gap-1.5 text-xs font-black text-brand-dark-grey hover:text-brand-gold transition-colors mb-2"
          >
            <FiArrowLeft /> Back to Command Center
          </Link>
          <Mtitle
            title="Management Activity Stream & Audit Log"
            desc="Live append-only chronological feed of all management instructions, employee acknowledgements, progress updates, proof uploads, approvals, and reminders."
          />
        </div>

        <button
          onClick={loadEvents}
          disabled={loading}
          className="p-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-dark-grey hover:text-brand-gold transition-colors self-start sm:self-auto"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-brand-gold" : ""}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap bg-brand-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
        <div className="flex items-center gap-2">
          <FiFilter className="text-brand-gold text-sm" />
          <span className="text-xs font-black text-brand-black dark:text-brand-white">Filters:</span>
        </div>

        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-1.5 text-xs rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white focus:outline-none focus:border-brand-gold"
        >
          <option value="">All Types</option>
          <option value="NOTICE">Notices</option>
          <option value="TASK">Tasks</option>
          <option value="INSTRUCTION">Directives</option>
        </select>

        <select
          value={filterSource}
          onChange={(e) => {
            setFilterSource(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-1.5 text-xs rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white focus:outline-none focus:border-brand-gold"
        >
          <option value="">All Sources</option>
          <option value="MD Sir">MD Sir</option>
          <option value="Director Sir">Director Sir</option>
          <option value="Management">Management</option>
          <option value="Admin & HR">Admin & HR</option>
        </select>
      </div>

      {/* Events List */}
      {loading ? (
        <SkeletonLoading count={8} />
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-2">
          <FiActivity className="text-4xl text-brand-gold mx-auto" />
          <h4 className="text-base font-black text-brand-black dark:text-brand-white">
            No Events Logged
          </h4>
          <p className="text-xs text-brand-dark-grey">
            No audit events matched the selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => {
            const actor = evt.actor || {};
            const target = evt.targetUser || {};

            return (
              <div
                key={evt._id}
                className="p-4 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-brand-gold/40"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CommunicationBadge type={evt.communicationType} size="xs" />

                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                      {evt.eventType?.replace("COMMUNICATION_", "")}
                    </span>

                    {evt.source && (
                      <span className="text-[10px] font-black uppercase text-brand-dark-grey">
                        Source: {evt.source}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-brand-black dark:text-brand-white">
                    {evt.title}
                  </h4>

                  {evt.comment && (
                    <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                      {evt.comment}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-brand-dark-grey flex-wrap pt-1">
                    <span className="flex items-center gap-1 font-bold text-brand-black dark:text-brand-white">
                      <FiUser className="text-[10px] text-brand-gold" />
                      Actor: {actor.name || "System"} ({actor.role || "Admin"})
                    </span>

                    {target.name && (
                      <span className="flex items-center gap-1">
                        Target Staff: <strong className="text-brand-gold">{target.name}</strong>
                      </span>
                    )}

                    <span>•</span>
                    <span>Branch: {evt.branch || "All Branches"}</span>
                  </div>
                </div>

                <div className="text-right sm:self-center shrink-0">
                  <span className="text-xs font-bold text-brand-dark-grey flex items-center gap-1 sm:justify-end">
                    <FiClock className="text-xs text-brand-gold" />
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : ""}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-extrabold text-brand-dark-grey">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey disabled:opacity-40"
                >
                  <FiChevronLeft />
                </button>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey disabled:opacity-40"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
