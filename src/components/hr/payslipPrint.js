"use client";

import { printDocument, tableHtml, escapeHtml as esc } from "@/lib/hrPrint";
import { money } from "@/hooks/useHr";

const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export const SHEET_HEAD = ["#", "ID", "Name", "Designation", "Branch", "Present", "Absent", "Late", "Leave", "OT h", "Basic", "Gross", "OT Pay", "Bonus", "Other +", "Late Ded.", "Absent Ded.", "Advance", "Loan", "Fixed Ded.", "Other −", "Net Salary"];

export const sheetCells = (p, i) => [
  i + 1, p.employeeCode, p.employeeName, p.designation, p.branch,
  p.attendance?.present ?? 0, (p.attendance?.absent ?? 0) + (p.attendance?.unpaidLeave ?? 0), p.attendance?.late ?? 0, p.attendance?.leave ?? 0, p.attendance?.overtimeHours ?? 0,
  p.basic, p.gross, p.overtimePay, p.bonus, p.otherEarnings, p.lateDeduction, p.absentDeduction, p.advanceDeduction, p.loanDeduction, p.fixedDeductions, p.otherDeductions, p.netSalary,
];

export function printSalarySheet(run, payslips, company) {
  const t = run.totals || {};
  const totals = ["", "", "TOTAL", "", "", "", "", "", "", "", "", t.gross, t.overtimePay, t.bonus, t.otherEarnings, t.lateDeduction, t.absentDeduction, t.advanceDeduction, t.loanDeduction, t.fixedDeductions, t.otherDeductions, t.netSalary];
  printDocument({
    title: `Salary Sheet — ${monthLabel(run.month)}`,
    subtitle: `${run.branch === "all" ? "All branches (combined)" : run.branch} · ${payslips.length} employees · Status: ${run.status}`,
    company,
    landscape: true,
    bodyHtml: tableHtml(SHEET_HEAD, payslips.map(sheetCells), { totals }) + `<div class="sign"><div>Prepared by (HR)</div><div>Checked by (Accounts)</div><div>Manager (Admin & HR)</div><div>Approved by (Director)</div></div>`,
  });
}

export function printPayslip(p, company, symbol = "৳") {
  const earnings = [
    ["Basic", p.basic], ["House Rent", p.houseRent], ["Medical", p.medical], ["Conveyance", p.conveyance], ["Other Allowances", p.otherAllowances],
    ["Overtime", p.overtimePay], ["Bonus", p.bonus], ["Other Earnings", p.otherEarnings],
  ].filter(([, v]) => v);
  const deductions = [
    ["Late", p.lateDeduction], ["Absent / Unpaid", p.absentDeduction], ["Advance", p.advanceDeduction], ["Loan", p.loanDeduction], ["Fixed (PF etc.)", p.fixedDeductions], ["Other", p.otherDeductions],
  ].filter(([, v]) => v);
  const rows = Math.max(earnings.length, deductions.length);
  const lines = Array.from({ length: rows }, (_, i) => [earnings[i]?.[0] || "", earnings[i] ? money(earnings[i][1], symbol) : "", deductions[i]?.[0] || "", deductions[i] ? money(deductions[i][1], symbol) : ""]);
  const a = p.attendance || {};
  const body = `
    <div class="grid">
      <div><b>Employee:</b> ${esc(p.employeeName)} (${esc(p.employeeCode)})</div><div><b>Month:</b> ${esc(monthLabel(p.month))}</div>
      <div><b>Designation:</b> ${esc(p.designation)}</div><div><b>Branch:</b> ${esc(p.branch)}</div>
      <div><b>Department:</b> ${esc(p.department)}</div><div><b>Payment:</b> ${esc(p.paymentMode)} ${esc(p.accountNumber || "")}</div>
    </div>
    ${tableHtml(["Days", "Present", "Absent", "Late", "Half Day", "Leave", "Unpaid Leave", "Off/Holiday", "OT Hours"], [[a.daysInMonth, a.present, a.absent, a.late, a.halfDay, a.leave, a.unpaidLeave, (a.weekend || 0) + (a.holiday || 0), a.overtimeHours]])}
    ${tableHtml(["Earnings", "Amount", "Deductions", "Amount"], lines, { totals: ["Total Earnings", money(p.totalEarnings, symbol), "Total Deductions", money(p.totalDeductions, symbol)] })}
    <h2 style="text-align:right">Net Salary: ${esc(money(p.netSalary, symbol))}</h2>
    ${p.remarks ? `<p class="sub">Note: ${esc(p.remarks)}</p>` : ""}
    <div class="sign"><div>Employee</div><div>Accounts</div><div>Authorized Signature</div></div>`;
  printDocument({ title: "Payslip", subtitle: `${p.employeeName} — ${monthLabel(p.month)}`, company, bodyHtml: body });
}
