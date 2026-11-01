"use client";

import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useHrMutation, useHrQuery } from "@/hooks/useHr";
import { Avatar, Badge, Btn, Card, EmployeePicker, inputCls, Loading } from "@/components/hr/HrUi";

// Management authorities (MD Sir, Director Sir…) used by tasks & notices
// ("instruction from MD Sir"). Pick which employee holds each one.
export default function ManagementPersonsCard({ staff = [], editable }) {
  const { data, loading, refetch } = useHrQuery("/management-person", { limit: 100, status: "all" });
  const { run, busy } = useHrMutation();
  const [title, setTitle] = useState("");
  const empId = (p) => (p.employee && typeof p.employee === "object" ? String(p.employee._id) : p.employee ? String(p.employee) : "");
  const people = [...(data?.data || [])].sort((a, b) => (a.priorityOrder || 99) - (b.priorityOrder || 99));

  const assign = async (p, employeeId) => {
    if (await run("patch", `/management-person/${p._id}`, { employee: employeeId || null, employeeName: "", employeeId: "", avatar: "" }, { success: employeeId ? `${p.title} assigned` : `${p.title} cleared` })) refetch();
  };
  const toggle = async (p) => {
    if (await run("patch", `/management-person/${p._id}`, { status: p.status === "active" ? "inactive" : "active" }, { silent: true })) refetch();
  };
  const add = async () => {
    const t = title.trim();
    if (!t) return;
    if (await run("post", "/management-person", { title: t, priorityOrder: people.length + 1, status: "active", canIssueInstructions: true }, { success: `${t} added` })) {
      setTitle("");
      refetch();
    }
  };
  const remove = async (p) => {
    if (!confirm(`Remove "${p.title}"? Tasks that mention it keep their history.`)) return;
    if (await run("delete", `/management-person/${p._id}`)) refetch();
  };

  return (
    <Card title="Management persons" subtitle="Who MD Sir, Director Sir and the other authorities are. Tasks and notices issued “from MD Sir” go to and show the person picked here.">
      {loading && !data ? (
        <Loading rows={3} />
      ) : (
        <div className="space-y-3">
          {people.map((p) => (
            <div key={p._id} className={`grid sm:grid-cols-[200px_minmax(0,1fr)_auto] gap-3 items-center p-3 rounded-2xl border ${p.status === "active" ? "border-brand-beige/60 dark:border-brand-dark-grey/60" : "border-dashed border-brand-beige dark:border-brand-dark-grey opacity-70"}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={p.employeeName || p.title} photo={p.avatar} size={36} />
                <div className="min-w-0">
                  <div className="text-sm font-black text-brand-black dark:text-brand-white truncate">{p.title}</div>
                  <div className="text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light truncate">{p.employeeName ? `${p.employeeName}${p.employeeId ? ` · ${p.employeeId}` : ""}` : "Nobody assigned"}</div>
                </div>
              </div>
              <EmployeePicker staff={staff} value={empId(p)} onChange={(id) => assign(p, id)} placeholder="Pick the employee" disabled={!editable || busy} />
              <div className="flex items-center gap-1.5 justify-end">
                {empId(p) && editable && <Btn size="sm" variant="ghost" onClick={() => assign(p, null)}>Clear</Btn>}
                {editable ? (
                  <button type="button" onClick={() => toggle(p)} className="cursor-pointer"><Badge tone={p.status === "active" ? "green" : "slate"}>{p.status === "active" ? "Active" : "Off"}</Badge></button>
                ) : (
                  <Badge tone={p.status === "active" ? "green" : "slate"}>{p.status === "active" ? "Active" : "Off"}</Badge>
                )}
                {editable && <Btn size="sm" variant="ghost" onClick={() => remove(p)} title="Remove"><FiTrash2 /></Btn>}
              </div>
            </div>
          ))}
          {!people.length && <p className="text-xs font-semibold text-brand-dark-grey dark:text-brand-gold-light">No authorities yet — add MD Sir, Director Sir and so on below.</p>}
          {editable && (
            <div className="flex gap-2 pt-1">
              <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add an authority, e.g. Chairman Sir" className={inputCls} />
              <Btn variant="ghost" onClick={add} disabled={!title.trim()} loading={busy}><FiPlus /> Add</Btn>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
