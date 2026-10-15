"use client";

import ModalShell from "@/components/modals/ModalShell";
import { Loading } from "@/components/hr/HrUi";
import { useHrQuery } from "@/hooks/useHr";
import { LeaveDecisionPanel } from "@/components/hr/LeaveParts";

// Recommendation / approval for one application. Loads the application
// fresh so the server's `canAct` / `actingStage` (derived from the workflow
// stage roles and the user's branch) decides what the user may do — the
// decision form is only rendered when the backend says the user can act.
export default function LeaveDecisionModal({ applicationId, onClose, onDone }) {
  const detail = useHrQuery(applicationId ? `/leave/${applicationId}` : null, {}, { enabled: !!applicationId });
  const app = detail.data?.data;
  return (
    <ModalShell isOpen={!!applicationId} onClose={onClose} size="md" title={app ? `${app.employeeName} — ${app.applicationNo}` : "Loading…"}>
      <div className="p-5 sm:p-6">
        {detail.loading || !app ? (
          <Loading rows={3} />
        ) : app.canAct ? (
          <LeaveDecisionPanel app={app} onDone={onDone} />
        ) : (
          <p className="text-xs font-bold">This application is no longer waiting for you.</p>
        )}
      </div>
    </ModalShell>
  );
}
