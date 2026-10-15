"use client";

import { FiLock } from "react-icons/fi";

// Shown inside a form modal when the user's role lets them open the record
// but not add/edit it (RBAC from the page's permission matrix).
export default function ReadOnlyNotice({ text = "View only — your role does not have permission to save changes here." }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-600 dark:text-amber-400">
      <FiLock className="shrink-0" />
      <span>{text}</span>
    </div>
  );
}
