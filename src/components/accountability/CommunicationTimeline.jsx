"use client";

import React from "react";
import { FiActivity, FiUser, FiClock, FiCheckCircle } from "react-icons/fi";

export default function CommunicationTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-8 text-center bg-brand-white dark:bg-brand-charcoal rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs text-brand-dark-grey">
        No lifecycle events recorded for this communication yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-gold/30">
      {events.map((evt, idx) => {
        const actor = evt.actor || {};
        const target = evt.targetUser || {};

        return (
          <div key={evt._id || idx} className="relative group">
            {/* Timeline Node Icon */}
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-brand-gold flex items-center justify-center text-brand-black shadow-sm ring-4 ring-brand-offwhite dark:ring-brand-midnight">
              <FiCheckCircle className="text-[10px]" />
            </div>

            <div className="p-3.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-1.5 shadow-sm transition-all hover:border-brand-gold/40">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                    {evt.eventType?.replace("COMMUNICATION_", "")}
                  </span>

                  <span className="text-xs font-black text-brand-black dark:text-brand-white">
                    {actor.name || "System"}
                  </span>

                  {actor.employeeId && (
                    <span className="text-[10px] font-extrabold text-brand-dark-grey">
                      ({actor.employeeId})
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-extrabold text-brand-dark-grey flex items-center gap-1">
                  <FiClock className="text-[10px]" />
                  {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : ""}
                </span>
              </div>

              {evt.comment && (
                <p className="text-xs text-brand-black dark:text-brand-white font-medium">
                  {evt.comment}
                </p>
              )}

              {target.name && (
                <div className="text-[10px] text-brand-dark-grey flex items-center gap-1">
                  <span>Target Staff:</span>
                  <span className="font-extrabold text-brand-gold">{target.name}</span>
                  {target.employeeId && <span>({target.employeeId})</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
