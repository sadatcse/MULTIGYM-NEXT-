"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useAccountabilityApi from "@/hooks/useAccountabilityApi";
import AttentionQueueCard from "@/components/accountability/AttentionQueueCard";
import { toast } from "react-toastify";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiRefreshCw,
  FiSend,
} from "react-icons/fi";

const TABS = [
  { id: "all", label: "All Items" },
  { id: "critical", label: "Critical & Overdue", icon: FiAlertTriangle, badgeColor: "text-rose-500" },
  { id: "due_soon", label: "Due Soon / Today", icon: FiClock, badgeColor: "text-amber-500" },
  { id: "waiting_approval", label: "Awaiting Signoff", icon: FiCheckCircle, badgeColor: "text-purple-500" },
  { id: "pending_ack", label: "Pending Ack", icon: FiSend, badgeColor: "text-blue-500" },
];

export default function AttentionQueuePage() {
  const { getAttentionQueue } = useAccountabilityApi();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAttentionQueue(activeTab);
      setItems(res?.items || []);
    } catch (err) {
      console.error("Failed to load attention queue:", err);
      toast.error("Failed to load attention queue items");
    } finally {
      setLoading(false);
    }
  }, [activeTab, getAttentionQueue]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

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
            title="Unified Attention Queue"
            desc="Prioritized items requiring immediate management action, review, acknowledgement follow-up, or deadline intervention."
          />
        </div>

        <button
          onClick={loadQueue}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors text-xs font-black flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FiRefreshCw className={loading ? "animate-spin text-brand-gold" : ""} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-brand-white dark:bg-brand-charcoal p-1.5 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 overflow-x-auto shadow-sm">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? "bg-brand-gold text-brand-black shadow-sm"
                  : "text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white"
              }`}
            >
              {tab.icon && <tab.icon className={`text-xs ${isActive ? "text-brand-black" : tab.badgeColor}`} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Attention Items */}
      {loading ? (
        <SkeletonLoading count={6} />
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-2">
          <FiCheckCircle className="text-4xl text-emerald-500 mx-auto" />
          <h4 className="text-base font-black text-brand-black dark:text-brand-white">
            Queue Clear
          </h4>
          <p className="text-xs text-brand-dark-grey">
            No items matching the selected criteria require intervention.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <AttentionQueueCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
