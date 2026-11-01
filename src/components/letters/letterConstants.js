import {
  FiAlertTriangle,
  FiAward,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiDollarSign,
  FiHelpCircle,
  FiLogOut,
  FiRefreshCw,
  FiStar,
  FiTrendingUp,
} from "react-icons/fi";

// The 13 official letter types, grouped by employee lifecycle. Shared by the
// list filters, the create wizard and the employee profile section.
export const LETTER_TYPES = [
  { key: "appointment", group: "Joining", titleBangla: "অফিসিয়াল নিয়োগপত্র", titleEnglish: "Appointment Letter", icon: FiBriefcase, tone: "green", desc: "New joiner's terms, probation, salary and duties" },
  { key: "confirmation", group: "Joining", titleBangla: "চাকরি স্থায়ীকরণ পত্র", titleEnglish: "Confirmation Letter", icon: FiCheckCircle, tone: "blue", desc: "Probation completed — job made permanent" },
  { key: "promotion", group: "Career", titleBangla: "পদোন্নতি পত্র", titleEnglish: "Promotion Letter", icon: FiTrendingUp, tone: "amber", desc: "New designation, responsibilities and pay" },
  { key: "transfer", group: "Career", titleBangla: "বদলি আদেশ পত্র", titleEnglish: "Transfer Letter", icon: FiRefreshCw, tone: "cyan", desc: "Move to another branch with handover dates" },
  { key: "promotion_transfer", group: "Career", titleBangla: "পদোন্নতি ও বদলি পত্র", titleEnglish: "Promotion & Transfer", icon: FiAward, tone: "purple", desc: "Promotion together with a branch change" },
  { key: "salary_revision", group: "Salary", titleBangla: "বেতন পুনর্নির্ধারণ পত্র", titleEnglish: "Salary Revision", icon: FiDollarSign, tone: "green", desc: "Restructured or revised monthly salary" },
  { key: "increment", group: "Salary", titleBangla: "বার্ষিক বেতন বৃদ্ধি পত্র", titleEnglish: "Increment Letter", icon: FiTrendingUp, tone: "green", desc: "Annual increment amount and effective date" },
  { key: "warning", group: "Conduct", titleBangla: "সতর্কীকরণ পত্র", titleEnglish: "Warning Letter", icon: FiAlertTriangle, tone: "red", desc: "Formal written warning for a policy breach" },
  { key: "show_cause", group: "Conduct", titleBangla: "কারণ দর্শানো নোটিশ", titleEnglish: "Show Cause Notice", icon: FiHelpCircle, tone: "amber", desc: "Written explanation required by a deadline" },
  { key: "appreciation", group: "Conduct", titleBangla: "প্রশংসা ও অভিনন্দন পত্র", titleEnglish: "Appreciation Letter", icon: FiStar, tone: "gold", desc: "Recognition for outstanding work" },
  { key: "resignation_acceptance", group: "Exit", titleBangla: "পদত্যাগপত্র গ্রহণ পত্র", titleEnglish: "Resignation Acceptance", icon: FiLogOut, tone: "slate", desc: "Accepts a resignation and sets the last day" },
  { key: "experience_certificate", group: "Exit", titleBangla: "অভিজ্ঞতা সনদ", titleEnglish: "Experience Certificate", icon: FiAward, tone: "blue", desc: "Certifies service period, role and conduct" },
  { key: "relieving", group: "Exit", titleBangla: "অবমুক্তি পত্র", titleEnglish: "Relieving Letter", icon: FiCheck, tone: "cyan", desc: "Releases the employee after clearance" },
];

export const LETTER_GROUPS = [
  { key: "Joining", label: "Joining & onboarding" },
  { key: "Career", label: "Career growth" },
  { key: "Salary", label: "Salary & compensation" },
  { key: "Conduct", label: "Conduct & recognition" },
  { key: "Exit", label: "Exit & offboarding" },
];

export const letterTypeMeta = (key) =>
  LETTER_TYPES.find((t) => t.key === key) || { key, titleBangla: key, titleEnglish: String(key || "").replace(/_/g, " "), icon: FiBriefcase, tone: "slate", desc: "" };

// Stored status -> label + badge tone. "generated" and "issued" are both an
// official, current letter; "reissued" means superseded by a newer version.
export const LETTER_STATUS = {
  draft: { label: "Draft", tone: "amber" },
  generated: { label: "Issued", tone: "green" },
  issued: { label: "Issued", tone: "green" },
  reissued: { label: "Superseded", tone: "blue" },
  cancelled: { label: "Cancelled", tone: "red" },
};
export const letterStatusMeta = (s) => LETTER_STATUS[s] || { label: s || "—", tone: "slate" };

export const isIssued = (s) => s === "generated" || s === "issued";

// Watermark printed across non-official copies.
export const watermarkFor = (status) =>
  ({ draft: "DRAFT", reissued: "SUPERSEDED", cancelled: "CANCELLED", preview: "PREVIEW" })[status] || "";

export const AUDIT_ACTIONS = {
  created: { label: "Draft created", tone: "purple" },
  updated: { label: "Draft edited", tone: "purple" },
  generated: { label: "Issued", tone: "green" },
  issued: { label: "Draft issued", tone: "green" },
  reissued: { label: "Reissued", tone: "amber" },
  cancelled: { label: "Cancelled", tone: "red" },
  deleted: { label: "Deleted", tone: "red" },
  printed: { label: "Printed", tone: "cyan" },
  downloaded: { label: "PDF downloaded", tone: "blue" },
  viewed: { label: "Viewed", tone: "slate" },
  edited: { label: "Edited", tone: "purple" },
  regenerated: { label: "Regenerated", tone: "amber" },
  template_updated: { label: "Template edited", tone: "gold" },
  template_reset: { label: "Template reset", tone: "gold" },
};
export const auditActionMeta = (a) => AUDIT_ACTIONS[a] || { label: a, tone: "slate" };
