"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FiArrowRight, FiPlus, FiTrash2 } from "react-icons/fi";
import { MdHistory } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, fmtDate, money, titleCase } from "@/hooks/useHr";
import { Attachments, Avatar, Badge, Btn, Card, EmployeePicker, EmptyState, Field, Loading, PageHeader, Select, Table, Td, Timeline } from "@/components/hr/HrUi";
import CareerEventModal from "@/components/hr/modals/CareerEventModal";
import { EVENT_META } from "@/components/hr/careerEvents";


function changeLine(e) {
  const f = e.from || {};
  const t = e.to || {};
  const parts = [];
  if (t.designation && f.designation !== t.designation) parts.push(`${f.designation || "—"} → ${t.designation}`);
  const fb = (f.branches || []).join(", ");
  const tb = (t.branches || []).join(", ");
  if (tb && fb !== tb) parts.push(`${fb || "—"} → ${tb}`);
  if (t.department && f.department && f.department !== t.department) parts.push(`${f.department} → ${t.department}`);
  if (t.grossSalary && f.grossSalary !== t.grossSalary) parts.push(`Gross ${money(f.grossSalary)} → ${money(t.grossSalary)}`);
  if (t.status && f.status && f.status !== t.status) parts.push(`Status ${f.status} → ${t.status}`);
  return parts;
}

export default function EmployeeHistoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <EmployeeHistoryInner />
    </Suspense>
  );
}

function EmployeeHistoryInner() {
  const params = useSearchParams();
  const permissions = usePagePermission();
  const { canAdd, canDelete } = permissions;
  const { me } = useHrConfig();
  const { staff, branches } = useHrLookups();
  const [empId, setEmpId] = useState(params.get("employee") || "");
  const [type, setType] = useState("all");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Syncing a default from data that arrives asynchronously is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me?.scope === "self" && !empId) setEmpId(me.id);
  }, [me, empId]);

  const timeline = useHrQuery(empId ? `/employee-history/employee/${empId}` : null, {}, { enabled: !!empId });
  const recent = useHrQuery("/employee-history", { eventType: type, limit: 30 }, { enabled: !empId });
  const { run, busy } = useHrMutation();
  const emp = timeline.data?.data?.employee;
  const events = useMemo(() => timeline.data?.data?.events || [], [timeline.data]);

  // Designation path, e.g. Spotter → Assistant Trainer → Trainer
  const path = useMemo(() => {
    const steps = [];
    for (const e of events) {
      const d = e.to?.designation;
      if (d && steps[steps.length - 1]?.title !== d) steps.push({ title: d, date: e.effectiveDate });
    }
    return steps;
  }, [events]);

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-10">
      <PageHeader
        icon={<MdHistory />}
        title="Employee History"
        subtitle="Complete career record: appointment, confirmation, promotion, transfer, salary revision, warning, show cause, suspension and separation."
        actions={empId && canAdd && me?.scope !== "self" && <Btn variant="gold" onClick={() => setOpen(true)}><FiPlus /> Record event</Btn>}
      />
      {me?.scope !== "self" && (
        <Card bodyClassName="p-4">
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <Field label="Employee" className="md:col-span-2"><EmployeePicker staff={staff} value={empId} onChange={setEmpId} placeholder="Choose an employee to see the full timeline" /></Field>
            {empId ? <Btn variant="ghost" onClick={() => setEmpId("")}>Show recent events (all employees)</Btn> : <Select value={type} onChange={setType} options={[{ value: "all", label: "All event types" }, ...Object.entries(EVENT_META).map(([v, m]) => ({ value: v, label: m.label }))]} />}
          </div>
        </Card>
      )}

      {empId ? (
        timeline.loading || !emp ? <Card><Loading /></Card> : (
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="space-y-5">
              <Card>
                <div className="flex items-center gap-3">
                  <Avatar name={emp.name} photo={emp.photo} size={56} />
                  <div>
                    <div className="text-lg font-black">{emp.name}</div>
                    <div className="text-[11px] text-brand-dark-grey">{emp.employeeId} · {emp.jobPosition || "—"}</div>
                    <div className="mt-1"><Badge status={emp.status === "active" ? "active" : emp.status}>{emp.status}</Badge></div>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <div><dt className="text-brand-dark-grey">Joined</dt><dd>{fmtDate(emp.joiningDate)}</dd></div>
                  <div><dt className="text-brand-dark-grey">Branch</dt><dd>{(emp.branches || []).join(", ") || "—"}</dd></div>
                  <div><dt className="text-brand-dark-grey">Department</dt><dd>{emp.department || "—"}</dd></div>
                  <div><dt className="text-brand-dark-grey">Reports to</dt><dd>{emp.reportingAuthorityName || "—"}</dd></div>
                </dl>
              </Card>
              {path.length > 0 && (
                <Card title="Career path">
                  <div className="flex flex-wrap items-center gap-2">
                    {path.map((p, i) => (
                      <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15 }} className="flex items-center gap-2">
                        {i > 0 && <FiArrowRight className="text-brand-gold" />}
                        <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black ${i === path.length - 1 ? "bg-brand-gold text-brand-black" : "bg-brand-offwhite dark:bg-brand-midnight"}`}>
                          {p.title}
                          <span className="block text-[9px] font-bold opacity-70">{fmtDate(p.date)}</span>
                        </span>
                      </motion.span>
                    ))}
                  </div>
                </Card>
              )}
            </div>
            <Card title={`Timeline (${events.length})`} className="lg:col-span-2">
              {!events.length ? <EmptyState title="No history yet" /> : (
                <Timeline
                  items={[...events].reverse().map((e) => ({
                    key: e._id,
                    title: e.title || EVENT_META[e.eventType]?.label,
                    badge: <Badge tone={EVENT_META[e.eventType]?.tone}>{EVENT_META[e.eventType]?.label}</Badge>,
                    meta: `${fmtDate(e.effectiveDate)}${e.referenceNo ? ` · Ref ${e.referenceNo}` : ""}${e.recordedBy ? ` · ${e.recordedBy.name}` : ""}`,
                    dot: EVENT_META[e.eventType]?.dot,
                    body: (
                      <div className="space-y-1">
                        {changeLine(e).map((l, i) => <div key={i} className="font-bold text-brand-black dark:text-brand-white">{l}</div>)}
                        {e.description && <div>{e.description}</div>}
                        {e.attachments?.length > 0 && <Attachments value={e.attachments} readOnly />}
                        {canDelete && !e.synthetic && me?.scope === "all" && (
                          <button onClick={async () => { if (confirm("Delete this history record?") && (await run("delete", `/employee-history/${e._id}`))) timeline.refetch(); }} className="text-[10px] text-brand-dark-grey hover:text-brand-red cursor-pointer inline-flex items-center gap-1"><FiTrash2 /> delete</button>
                        )}
                      </div>
                    ),
                  }))}
                />
              )}
            </Card>
          </div>
        )
      ) : (
        <Card title="Recent career events" bodyClassName="p-0">
          {recent.loading ? <Loading /> : !recent.data?.data?.length ? <EmptyState title="No events" /> : (
            <Table head={["Date", "Employee", "Event", "Change", "Ref", "Recorded by"]}>
              {recent.data.data.map((e) => (
                <tr key={e._id} className="cursor-pointer hover:bg-brand-offwhite/60 dark:hover:bg-brand-midnight/30" onClick={() => setEmpId(String(e.employee))}>
                  <Td className="whitespace-nowrap">{fmtDate(e.effectiveDate)}</Td>
                  <Td className="font-black">{e.employeeName}<div className="text-[10px] text-brand-dark-grey">{e.employeeCode}</div></Td>
                  <Td><Badge tone={EVENT_META[e.eventType]?.tone}>{EVENT_META[e.eventType]?.label}</Badge></Td>
                  <Td className="text-[11px]">{changeLine(e).join(" · ") || e.title}</Td>
                  <Td className="text-[11px]">{e.referenceNo || "—"}</Td>
                  <Td className="text-[11px]">{e.recordedBy?.name || titleCase(e.sourceModule)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      <CareerEventModal open={open} permissions={permissions} emp={emp} branches={branches} onClose={() => setOpen(false)} busy={busy} onSubmit={async (body) => { if (await run("post", "/employee-history", { ...body, employeeId: empId })) { setOpen(false); timeline.refetch(); } }} />
    </div>
  );
}
