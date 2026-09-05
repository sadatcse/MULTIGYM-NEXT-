"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import MaintenanceAssignModal from "@/components/modals/MaintenanceAssignModal";
import MaintenanceWorkUpdateModal from "@/components/modals/MaintenanceWorkUpdateModal";
import MaintenanceCompleteModal from "@/components/modals/MaintenanceCompleteModal";
import MaintenanceReasonModal from "@/components/modals/MaintenanceReasonModal";
import useMaintenanceApi from "@/hooks/useMaintenanceApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import { toast } from "react-toastify";
import {
  FiArrowLeft, FiMapPin, FiTag, FiUser, FiCalendar, FiClock, FiDollarSign,
  FiUserCheck, FiEdit3, FiCheckCircle, FiXCircle, FiSlash, FiEye,
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
    <div className="flex flex-wrap gap-3">
      {photos.map((url, idx) => (
        <a key={url + idx} href={url} target="_blank" rel="noopener noreferrer" className="w-24 h-24 rounded-2xl overflow-hidden border border-brand-beige/60 dark:border-brand-dark-grey/60 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
        </a>
      ))}
    </div>
  );
}

export default function MaintenanceRequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { can } = useUserPermissions();
  const canEdit = can("maintenance", "edit");

  const { getRequestById, markUnderReview, assignRequest, addWorkUpdate, completeRequest, rejectRequest, cancelRequest } = useMaintenanceApi();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'assign' | 'update' | 'complete' | 'reject' | 'cancel'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequest = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRequestById(id);
      setRequest(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load maintenance request");
    } finally {
      setLoading(false);
    }
  }, [getRequestById, id]);

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRequest();
    }
  }, [id, fetchRequest]);

  const handleReview = async () => {
    setIsSubmitting(true);
    try {
      await markUnderReview(id);
      toast.success("Request moved to Under Review");
      fetchRequest();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const runAction = async (fn, successMsg) => {
    setIsSubmitting(true);
    try {
      await fn();
      toast.success(successMsg);
      setActiveModal(null);
      fetchRequest();
    } catch (err) {
      const msg = err?.response?.data?.message || "Action failed";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto pb-16">
        <SkeletonLoading variant="card" rows={3} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="w-full max-w-4xl mx-auto pb-16 text-center py-20 text-brand-dark-grey">
        Maintenance request not found.
      </div>
    );
  }

  const isTerminal = ["COMPLETED", "REJECTED", "CANCELLED"].includes(request.status);
  const flowIndex = STATUS_FLOW.indexOf(request.status);

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto pb-16">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white cursor-pointer"
      >
        <FiArrowLeft /> Back
      </button>

      <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${STATUS_STYLES[request.status]}`}>
                {request.status?.replace("_", " ")}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-brand-beige/20 text-brand-dark-grey dark:text-brand-gold-light">
                {request.priority} PRIORITY
              </span>
              {request.isOverdue && (
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-brand-red/10 text-brand-red">Overdue</span>
              )}
            </div>
            <h2 className="text-xl font-black text-brand-black dark:text-brand-white">{request.issue}</h2>
          </div>
        </div>

        {/* Status Timeline */}
        {!isTerminal && (
          <div className="flex items-center gap-1 mb-6 overflow-x-auto">
            {STATUS_FLOW.map((s, idx) => (
              <React.Fragment key={s}>
                <div className={`flex flex-col items-center gap-1 shrink-0 ${idx <= flowIndex ? "text-brand-gold" : "text-brand-dark-grey/40"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx <= flowIndex ? "bg-brand-gold text-brand-midnight" : "bg-brand-beige/30 dark:bg-brand-dark-grey/30"}`}>
                    {idx + 1}
                  </div>
                  <span className="text-[9px] font-bold uppercase whitespace-nowrap">{s.replace("_", " ")}</span>
                </div>
                {idx < STATUS_FLOW.length - 1 && <div className={`flex-1 h-0.5 min-w-[16px] ${idx < flowIndex ? "bg-brand-gold" : "bg-brand-beige/30 dark:bg-brand-dark-grey/30"}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-xs">
          <div className="flex items-start gap-2">
            <FiTag className="text-brand-gold shrink-0 mt-0.5" />
            <div><span className="block text-brand-dark-grey dark:text-brand-gold-light">Category</span><span className="font-bold text-brand-black dark:text-brand-white">{request.category}</span></div>
          </div>
          <div className="flex items-start gap-2">
            <FiMapPin className="text-brand-gold shrink-0 mt-0.5" />
            <div><span className="block text-brand-dark-grey dark:text-brand-gold-light">Branch</span><span className="font-bold text-brand-black dark:text-brand-white">{request.branch}</span></div>
          </div>
          <div className="flex items-start gap-2">
            <FiUser className="text-brand-gold shrink-0 mt-0.5" />
            <div><span className="block text-brand-dark-grey dark:text-brand-gold-light">Reported By</span><span className="font-bold text-brand-black dark:text-brand-white">{request.reportedBy?.name || "—"}</span></div>
          </div>
          <div className="flex items-start gap-2">
            <FiCalendar className="text-brand-gold shrink-0 mt-0.5" />
            <div><span className="block text-brand-dark-grey dark:text-brand-gold-light">Reported</span><span className="font-bold text-brand-black dark:text-brand-white">{new Date(request.reportedDate).toLocaleDateString()}</span></div>
          </div>
          <div className="flex items-start gap-2">
            <FiUserCheck className="text-brand-gold shrink-0 mt-0.5" />
            <div>
              <span className="block text-brand-dark-grey dark:text-brand-gold-light">Assigned To</span>
              <span className="font-bold text-brand-black dark:text-brand-white">
                {request.assignedToType === "employee" ? request.assignedToEmployee?.name : request.assignedToType === "vendor" ? request.assignedToVendor?.name : "Not yet assigned"}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FiClock className="text-brand-gold shrink-0 mt-0.5" />
            <div><span className="block text-brand-dark-grey dark:text-brand-gold-light">Deadline</span><span className="font-bold text-brand-black dark:text-brand-white">{request.deadline ? new Date(request.deadline).toLocaleDateString() : "—"}</span></div>
          </div>
          {(request.estimatedCost || request.actualCost) && (
            <div className="flex items-start gap-2">
              <FiDollarSign className="text-brand-gold shrink-0 mt-0.5" />
              <div>
                <span className="block text-brand-dark-grey dark:text-brand-gold-light">Cost (Est. / Actual)</span>
                <span className="font-bold text-brand-black dark:text-brand-white">৳{request.estimatedCost || 0} / ৳{request.actualCost || 0}</span>
              </div>
            </div>
          )}
          {request.completedDate && (
            <div className="flex items-start gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0 mt-0.5" />
              <div><span className="block text-brand-dark-grey dark:text-brand-gold-light">Completed</span><span className="font-bold text-brand-black dark:text-brand-white">{new Date(request.completedDate).toLocaleDateString()}</span></div>
            </div>
          )}
        </div>

        {request.description && (
          <div className="mb-6 p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-xs text-brand-black dark:text-brand-white leading-relaxed">
            {request.description}
          </div>
        )}

        {request.rejectionReason && (
          <div className="mb-6 p-4 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-xs text-brand-red">
            <strong>Rejection Reason:</strong> {request.rejectionReason}
          </div>
        )}
        {request.cancellationReason && (
          <div className="mb-6 p-4 rounded-2xl bg-brand-dark-grey/10 border border-brand-dark-grey/20 text-xs text-brand-dark-grey dark:text-brand-gold-light">
            <strong>Cancellation Reason:</strong> {request.cancellationReason}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-2">Before Photos</h4>
            <PhotoGrid photos={request.beforePhotos} empty="No before photos." />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-2">After Photos</h4>
            <PhotoGrid photos={request.afterPhotos} empty="Not available yet." />
          </div>
        </div>

        {/* Work Update History */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light mb-3">Work Update History</h4>
          {request.workUpdates && request.workUpdates.length > 0 ? (
            <div className="space-y-3">
              {request.workUpdates.map((u) => (
                <div key={u._id} className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-brand-black dark:text-brand-white">{u.updatedBy?.name || "Management"}</span>
                    <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light">{new Date(u.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light leading-relaxed">{u.update}</p>
                  {u.photos?.length > 0 && <div className="mt-2"><PhotoGrid photos={u.photos} empty="" /></div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light italic">No work updates yet.</p>
          )}
        </div>

        {/* Management Actions */}
        {canEdit && !isTerminal && (
          <div className="flex flex-wrap items-center gap-2 pt-6 mt-6 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
            {request.status === "OPEN" && (
              <button onClick={handleReview} disabled={isSubmitting} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-sky-500 bg-sky-500/10 hover:bg-sky-500 hover:text-white transition-all cursor-pointer disabled:opacity-50">
                <FiEye className="text-xs" /> Mark Under Review
              </button>
            )}
            <button onClick={() => setActiveModal("assign")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-purple-500 bg-purple-500/10 hover:bg-purple-500 hover:text-white transition-all cursor-pointer">
              <FiUserCheck className="text-xs" /> {request.assignedToType ? "Re-assign" : "Assign"}
            </button>
            <button onClick={() => setActiveModal("update")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer">
              <FiEdit3 className="text-xs" /> Work Update
            </button>
            <button onClick={() => setActiveModal("complete")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer">
              <FiCheckCircle className="text-xs" /> Complete
            </button>
            <button onClick={() => setActiveModal("reject")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer">
              <FiXCircle className="text-xs" /> Reject
            </button>
            <button onClick={() => setActiveModal("cancel")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-brand-dark-grey bg-brand-dark-grey/10 hover:bg-brand-dark-grey hover:text-white transition-all cursor-pointer">
              <FiSlash className="text-xs" /> Cancel
            </button>
          </div>
        )}
      </div>

      <MaintenanceAssignModal
        isOpen={activeModal === "assign"}
        onClose={() => !isSubmitting && setActiveModal(null)}
        isSubmitting={isSubmitting}
        onSubmit={(payload) => runAction(() => assignRequest(id, payload), "Maintenance request assigned successfully")}
      />
      <MaintenanceWorkUpdateModal
        isOpen={activeModal === "update"}
        onClose={() => !isSubmitting && setActiveModal(null)}
        isSubmitting={isSubmitting}
        onSubmit={(payload) => runAction(() => addWorkUpdate(id, payload), "Work update posted successfully")}
      />
      <MaintenanceCompleteModal
        isOpen={activeModal === "complete"}
        onClose={() => !isSubmitting && setActiveModal(null)}
        isSubmitting={isSubmitting}
        onSubmit={(payload) => runAction(() => completeRequest(id, payload), "Maintenance request completed successfully")}
      />
      <MaintenanceReasonModal
        isOpen={activeModal === "reject"}
        onClose={() => !isSubmitting && setActiveModal(null)}
        isSubmitting={isSubmitting}
        mode="reject"
        onSubmit={(payload) => runAction(() => rejectRequest(id, payload), "Maintenance request rejected")}
      />
      <MaintenanceReasonModal
        isOpen={activeModal === "cancel"}
        onClose={() => !isSubmitting && setActiveModal(null)}
        isSubmitting={isSubmitting}
        mode="cancel"
        onSubmit={(payload) => runAction(() => cancelRequest(id, payload), "Maintenance request cancelled")}
      />
    </div>
  );
}
