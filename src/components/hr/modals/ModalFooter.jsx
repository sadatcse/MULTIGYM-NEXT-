"use client";

import { FiLock } from "react-icons/fi";
import { Btn } from "@/components/hr/HrUi";

// Standard modal footer. `allowed` comes from the RBAC permission passed into
// the modal: without it the primary action is replaced by a read-only notice,
// so a user who can open a record but not edit it never sees a save button.
export default function ModalFooter({ onClose, onSubmit, submitLabel = "Save", busy, disabled, allowed = true, danger, left }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex flex-wrap gap-2">{left}</div>
      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <Btn variant="ghost" onClick={onClose} className="w-full sm:w-auto">
          {allowed ? "Cancel" : "Close"}
        </Btn>
        {allowed ? (
          <Btn variant={danger ? "danger" : "primary"} onClick={onSubmit} loading={busy} disabled={disabled} className="w-full sm:w-auto">
            {submitLabel}
          </Btn>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-[11px] font-black text-brand-dark-grey">
            <FiLock /> View only — you don&apos;t have permission to change this
          </span>
        )}
      </div>
    </div>
  );
}

// Shape every HR modal expects for its `permissions` prop.
export const NO_PERMISSIONS = { canView: true, canAdd: false, canEdit: false, canDelete: false };
