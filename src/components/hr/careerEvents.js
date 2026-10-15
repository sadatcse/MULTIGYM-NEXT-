// Career event types: labels, colors and which ones HR may record by hand.
export const EVENT_META = {
  appointment: { label: "Appointment", tone: "green", dot: "bg-emerald-500" },
  confirmation: { label: "Confirmation", tone: "green", dot: "bg-emerald-500" },
  promotion: { label: "Promotion", tone: "gold", dot: "bg-brand-gold" },
  promotion_transfer: { label: "Promotion & Transfer", tone: "gold", dot: "bg-brand-gold" },
  designation_change: { label: "Designation Change", tone: "gold", dot: "bg-brand-gold" },
  demotion: { label: "Demotion", tone: "red", dot: "bg-red-500" },
  transfer: { label: "Transfer", tone: "blue", dot: "bg-blue-500" },
  department_change: { label: "Department Change", tone: "blue", dot: "bg-blue-500" },
  salary_revision: { label: "Salary Revision", tone: "cyan", dot: "bg-cyan-500" },
  increment: { label: "Increment", tone: "cyan", dot: "bg-cyan-500" },
  appreciation: { label: "Appreciation", tone: "green", dot: "bg-emerald-500" },
  warning: { label: "Warning", tone: "amber", dot: "bg-amber-500" },
  show_cause: { label: "Show Cause", tone: "purple", dot: "bg-purple-500" },
  suspension: { label: "Suspension", tone: "red", dot: "bg-red-500" },
  reinstatement: { label: "Reinstatement", tone: "green", dot: "bg-emerald-500" },
  resignation: { label: "Resignation", tone: "slate", dot: "bg-zinc-500" },
  separation: { label: "Separation", tone: "slate", dot: "bg-zinc-600" },
  status_change: { label: "Status Change", tone: "slate", dot: "bg-zinc-400" },
  other: { label: "Other", tone: "slate", dot: "bg-zinc-400" },
};
export const MANUAL_TYPES = ["appointment", "confirmation", "promotion", "demotion", "transfer", "promotion_transfer", "salary_revision", "increment", "appreciation", "warning", "show_cause", "suspension", "reinstatement", "resignation", "separation", "other"];
