"use client";

import React, { useState, useEffect, useCallback } from "react";
import ModalShell from "./ModalShell";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useMaintenanceApi from "@/hooks/useMaintenanceApi";
import {
  FiTag,
  FiMapPin,
  FiUser,
  FiCalendar,
  FiClock,
  FiUserCheck,
  FiDollarSign,
  FiCheckCircle,
  FiTool,
} from "react-icons/fi";

const STATUS_FLOW = ["OPEN", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED"];

const STATUS_STYLES = {
  OPEN: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  UNDER_REVIEW: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ASSIGNED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  IN_PROGRESS: "bg-brand-gold/10 text-brand-gold border-brand-gold/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  REJECTED: "bg-brand-red/10 text-brand-red border-brand-red/20",
  CANCELLED: "bg-brand-dark-grey/10 text-brand-dark-grey border-brand-dark-grey/20",
};

function PhotoGrid({ photos, empty }) {
  if (!photos || photos.length === 0) {
    return <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light italic">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2.5">
      {photos.map((url, idx) => (
        <a
          key={url + idx}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-brand-beige/60 dark:border-brand-dark-grey/60 block hover:opacity-90 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
        </a>
      ))}
    </div>
  );
}

export default function MaintenanceDetailsModal({ isOpen, onClose, requestId, initialData }) {
  const { getRequestById } = useMaintenanceApi();
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState(initialData || null);

  const fetchDetail = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const data = await getRequestById(requestId);
      if (data) {
        setRequest(data);
      }
    } catch (err) {
      console.error("Failed to load maintenance detail:", err);
    } finally {
      setLoading(false);
    }
  }, [getRequestById, requestId]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRequest(initialData);
      }
      if (requestId) {
        fetchDetail();
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRequest(null);
    }
  }, [isOpen, requestId, initialData, fetchDetail]);

  const isTerminal = ["COMPLETED", "REJECTED", "CANCELLED"].includes(request?.status);
  const flowIndex = request ? STATUS_FLOW.indexOf(request.status) : -1;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title="Maintenance Request Details"
    >
      <div className="p-6 space-y-6">
        {loading && !request ? (
          <SkeletonLoading count={4} />
        ) : !request ? (
          <div className="py-12 text-center text-xs text-brand-dark-grey">
            Maintenance request details not found.
          </div>
        ) : (
          <>
            {/* Header: Status badges & Issue Title */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${STATUS_STYLES[request.status] || ""}`}>
                  {request.status?.replace("_", " ")}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-brand-beige/20 text-brand-dark-grey dark:text-brand-gold-light">
                  {request.priority} PRIORITY
                </span>
                {request.isOverdue && (
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-brand-red/10 text-brand-red">
                    Overdue
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-brand-black dark:text-brand-white">
                {request.issue}
              </h2>
            </div>

            {/* Status Timeline */}
            {!isTerminal && (
              <div className="flex items-center gap-1 overflow-x-auto py-2 px-1 bg-brand-offwhite/50 dark:bg-brand-midnight/50 rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
                {STATUS_FLOW.map((s, idx) => (
                  <React.Fragment key={s}>
                    <div className={`flex flex-col items-center gap-1 shrink-0 px-2 ${idx <= flowIndex ? "text-brand-gold" : "text-brand-dark-grey/40"}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx <= flowIndex ? "bg-brand-gold text-brand-midnight" : "bg-brand-beige/30 dark:bg-brand-dark-grey/30"}`}>
                        {idx + 1}
                      </div>
                      <span className="text-[9px] font-bold uppercase whitespace-nowrap">{s.replace("_", " ")}</span>
                    </div>
                    {idx < STATUS_FLOW.length - 1 && (
                      <div className={`flex-1 h-0.5 min-w-[16px] ${idx < flowIndex ? "bg-brand-gold" : "bg-brand-beige/30 dark:bg-brand-dark-grey/30"}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-brand-offwhite/40 dark:bg-brand-midnight/40 p-4 rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40">
              <div className="flex items-start gap-2">
                <FiTag className="text-brand-gold shrink-0 mt-0.5 text-sm" />
                <div>
                  <span className="block text-[11px] text-brand-dark-grey dark:text-brand-gold-light">Category</span>
                  <span className="font-extrabold text-brand-black dark:text-brand-white">{request.category || "—"}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FiMapPin className="text-brand-gold shrink-0 mt-0.5 text-sm" />
                <div>
                  <span className="block text-[11px] text-brand-dark-grey dark:text-brand-gold-light">Branch</span>
                  <span className="font-extrabold text-brand-black dark:text-brand-white">{request.branch || "—"}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FiUser className="text-brand-gold shrink-0 mt-0.5 text-sm" />
                <div>
                  <span className="block text-[11px] text-brand-dark-grey dark:text-brand-gold-light">Reported By</span>
                  <span className="font-extrabold text-brand-black dark:text-brand-white">{request.reportedBy?.name || "—"}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FiCalendar className="text-brand-gold shrink-0 mt-0.5 text-sm" />
                <div>
                  <span className="block text-[11px] text-brand-dark-grey dark:text-brand-gold-light">Reported Date</span>
                  <span className="font-extrabold text-brand-black dark:text-brand-white">
                    {request.reportedDate ? new Date(request.reportedDate).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FiUserCheck className="text-brand-gold shrink-0 mt-0.5 text-sm" />
                <div>
                  <span className="block text-[11px] text-brand-dark-grey dark:text-brand-gold-light">Assigned To</span>
                  <span className="font-extrabold text-brand-black dark:text-brand-white">
                    {request.assignedToType === "employee"
                      ? request.assignedToEmployee?.name || "Employee"
                      : request.assignedToType === "vendor"
                      ? request.assignedToVendor?.name || "Vendor"
                      : "Not yet assigned"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FiClock className="text-brand-gold shrink-0 mt-0.5 text-sm" />
                <div>
                  <span className="block text-[11px] text-brand-dark-grey dark:text-brand-gold-light">Deadline</span>
                  <span className="font-extrabold text-brand-black dark:text-brand-white">
                    {request.deadline ? new Date(request.deadline).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>

              {(request.estimatedCost || request.actualCost) && (
                <div className="flex items-start gap-2">
                  <FiDollarSign className="text-brand-gold shrink-0 mt-0.5 text-sm" />
                  <div>
                    <span className="block text-[11px] text-brand-dark-grey dark:text-brand-gold-light">Cost (Est. / Actual)</span>
                    <span className="font-extrabold text-brand-black dark:text-brand-white">
                      ৳{request.estimatedCost || 0} / ৳{request.actualCost || 0}
                    </span>
                  </div>
                </div>
              )}

              {request.completedDate && (
                <div className="flex items-start gap-2">
                  <FiCheckCircle className="text-emerald-500 shrink-0 mt-0.5 text-sm" />
                  <div>
                    <span className="block text-[11px] text-brand-dark-grey dark:text-brand-gold-light">Completed On</span>
                    <span className="font-extrabold text-brand-black dark:text-brand-white">
                      {new Date(request.completedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {request.description && (
              <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-xs text-brand-black dark:text-brand-white leading-relaxed border border-brand-beige/40 dark:border-brand-dark-grey/40">
                <span className="block text-[10px] font-black uppercase tracking-wider text-brand-dark-grey mb-1">Description</span>
                {request.description}
              </div>
            )}

            {/* Rejection / Cancellation notices */}
            {request.rejectionReason && (
              <div className="p-4 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-xs text-brand-red">
                <strong>Rejection Reason:</strong> {request.rejectionReason}
              </div>
            )}
            {request.cancellationReason && (
              <div className="p-4 rounded-2xl bg-brand-dark-grey/10 border border-brand-dark-grey/20 text-xs text-brand-dark-grey dark:text-brand-gold-light">
                <strong>Cancellation Reason:</strong> {request.cancellationReason}
              </div>
            )}

            {/* Photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40">
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-2">
                  Before Photos
                </h4>
                <PhotoGrid photos={request.beforePhotos} empty="No before photos attached." />
              </div>
              <div className="p-4 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40">
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-2">
                  After Photos
                </h4>
                <PhotoGrid photos={request.afterPhotos} empty="Not available yet." />
              </div>
            </div>

            {/* Work Update History */}
            {request.workUpdates && request.workUpdates.length > 0 && (
              <div className="p-4 rounded-2xl bg-brand-offwhite/40 dark:bg-brand-midnight/40 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light flex items-center gap-1.5">
                  <FiTool className="text-brand-gold" /> Work Update History ({request.workUpdates.length})
                </h4>
                <div className="space-y-2.5">
                  {request.workUpdates.map((u, i) => (
                    <div key={u._id || i} className="p-3 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/40 dark:border-brand-dark-grey/40 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-brand-dark-grey">
                        <span className="font-bold text-brand-black dark:text-brand-white">{u.updatedBy?.name || "Technician"}</span>
                        <span>{u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}</span>
                      </div>
                      <p className="text-brand-black dark:text-brand-white">{u.update}</p>
                      {u.photos && u.photos.length > 0 && (
                        <div className="pt-1">
                          <PhotoGrid photos={u.photos} empty="" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}
